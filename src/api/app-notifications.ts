import type { PrismClient } from "../client.js";
import type {
  AppWebhook,
  AppWebhookDelivery,
  AppEvent,
  CreateAppWebhookParams,
  UpdateAppWebhookParams,
} from "../types.js";

/**
 * Manages app-level notification channels: webhooks, SSE, and WebSocket.
 *
 * All write operations require a user access token that has write access
 * to the app.  SSE and WebSocket connections authenticate directly with
 * the app's `client_id` and `client_secret` (HTTP Basic).
 */
export class AppNotificationsAPI {
  constructor(private readonly client: PrismClient) {}

  // ── Webhooks ───────────────────────────────────────────────────────────────

  /** List all webhooks registered on an app. */
  async listWebhooks(token: string, appId: string): Promise<AppWebhook[]> {
    const res = await this.client.request<{ webhooks: AppWebhook[] }>(
      "GET",
      `/api/apps/${appId}/webhooks`,
      { token },
    );
    return res.webhooks;
  }

  /** Register a new webhook on an app. */
  async createWebhook(
    token: string,
    appId: string,
    params: CreateAppWebhookParams,
  ): Promise<AppWebhook> {
    return this.client.request<AppWebhook>(
      "POST",
      `/api/apps/${appId}/webhooks`,
      { token, body: params },
    );
  }

  /** Update a webhook. */
  async updateWebhook(
    token: string,
    appId: string,
    webhookId: string,
    params: UpdateAppWebhookParams,
  ): Promise<AppWebhook> {
    return this.client.request<AppWebhook>(
      "PATCH",
      `/api/apps/${appId}/webhooks/${webhookId}`,
      { token, body: params },
    );
  }

  /** Delete a webhook. */
  async deleteWebhook(
    token: string,
    appId: string,
    webhookId: string,
  ): Promise<void> {
    await this.client.request(
      "DELETE",
      `/api/apps/${appId}/webhooks/${webhookId}`,
      { token },
    );
  }

  /** Send a test `ping` delivery to a webhook. */
  async testWebhook(
    token: string,
    appId: string,
    webhookId: string,
  ): Promise<{ success: boolean; status: number | null }> {
    return this.client.request(
      "POST",
      `/api/apps/${appId}/webhooks/${webhookId}/test`,
      { token },
    );
  }

  /** Retrieve the last 50 deliveries for a webhook. */
  async listDeliveries(
    token: string,
    appId: string,
    webhookId: string,
  ): Promise<AppWebhookDelivery[]> {
    const res = await this.client.request<{ deliveries: AppWebhookDelivery[] }>(
      "GET",
      `/api/apps/${appId}/webhooks/${webhookId}/deliveries`,
      { token },
    );
    return res.deliveries;
  }

  // ── Server-Sent Events ─────────────────────────────────────────────────────

  /**
   * Opens a Server-Sent Events connection to the app's event stream.
   *
   * Authentication is performed via HTTP Basic (client_id:client_secret).
   * Supply `lastEventId` to resume from a known cursor position.
   *
   * Returns an `EventSource`-compatible object.  The caller is responsible
   * for calling `.close()` when done.
   *
   * @example
   * ```ts
   * const es = prism.appNotifications.openSSE(appId, clientId, clientSecret);
   * es.addEventListener("user.token_granted", (e) => {
   *   const event = JSON.parse(e.data);
   *   console.log("new grant:", event.data.user_id);
   * });
   * es.onerror = (err) => console.error(err);
   * // later:
   * es.close();
   * ```
   */
  openSSE(
    appId: string,
    clientId: string,
    clientSecret: string,
    lastEventId?: string,
  ): EventSource {
    const url = new URL(`${this.client.baseUrl}/api/apps/${appId}/events/sse`);
    // EventSource does not support custom headers in browsers;
    // encode credentials in the URL so the server can read them as Basic auth.
    // For server-side use (Node.js / Bun / Deno), prefer the fetch-based helper below.
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("client_secret", clientSecret);
    if (lastEventId) url.searchParams.set("lastEventId", lastEventId);

    const es = new EventSource(url.toString());
    return es;
  }

  /**
   * Opens a Server-Sent Events stream using the custom `fetch` implementation
   * of this client (works in Node.js, Bun, Deno, and Cloudflare Workers).
   *
   * Yields parsed `AppEvent` objects.  Async-iterate or use in a for-await loop.
   *
   * @example
   * ```ts
   * for await (const event of prism.appNotifications.fetchSSE(appId, clientId, clientSecret)) {
   *   console.log(event.event, event.data);
   * }
   * ```
   */
  async *fetchSSE(
    appId: string,
    clientId: string,
    clientSecret: string,
    lastEventId?: string,
  ): AsyncIterable<AppEvent> {
    const headers: Record<string, string> = {
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      Accept: "text/event-stream",
      "Cache-Control": "no-cache",
    };
    if (lastEventId) headers["Last-Event-ID"] = lastEventId;

    const res = await (
      this.client as unknown as { _fetch: typeof fetch }
    )._fetch(`${this.client.baseUrl}/api/apps/${appId}/events/sse`, {
      headers,
    });

    if (!res.ok || !res.body) {
      throw new Error(`SSE connection failed: ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });

      // Parse SSE frames (separated by double newline)
      const frames = buf.split("\n\n");
      buf = frames.pop() ?? "";

      for (const frame of frames) {
        if (!frame.trim() || frame.startsWith(":")) continue;
        const lines = frame.split("\n");
        let eventType = "message";
        let data = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) eventType = line.slice(7);
          else if (line.startsWith("data: ")) data = line.slice(6);
        }
        if (data) {
          try {
            yield { ...JSON.parse(data), event: eventType } as AppEvent;
          } catch {
            /* skip malformed */
          }
        }
      }
    }
  }

  // ── WebSocket ──────────────────────────────────────────────────────────────

  /**
   * Opens a WebSocket connection to the app's event stream.
   *
   * For browser environments supply `client_id` and `client_secret` as
   * query parameters (Basic auth headers cannot be set on browser WebSocket).
   * For server-side environments, pass them as query parameters too — the
   * server accepts both Basic header and query params.
   *
   * @example
   * ```ts
   * const ws = prism.appNotifications.openWebSocket(appId, clientId, clientSecret);
   * ws.addEventListener("message", (e) => {
   *   const msg = JSON.parse(e.data);
   *   if (msg.type === "event") console.log(msg.event, msg.data);
   * });
   * ```
   */
  openWebSocket(
    appId: string,
    clientId: string,
    clientSecret: string,
  ): WebSocket {
    const url = new URL(
      `${this.client.baseUrl.replace(/^http/, "ws")}/api/apps/${appId}/events/ws`,
    );
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("client_secret", clientSecret);
    return new WebSocket(url.toString());
  }
}
