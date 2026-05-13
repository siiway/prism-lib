import type { PrismClient } from "../client.js";
import type {
  Webhook,
  WebhookDelivery,
  CreateWebhookParams,
  UpdateWebhookParams,
} from "../types.js";

/** Server stores `events` as a JSON-encoded string and ships it raw on list
 *  responses; create returns the array. Normalise so callers always see
 *  `string[]`. */
function normaliseEvents(w: Webhook): Webhook {
  const e = (w as Webhook & { events: unknown }).events;
  if (typeof e === "string") {
    try {
      return { ...w, events: JSON.parse(e) as string[] };
    } catch {
      return { ...w, events: [] };
    }
  }
  return w;
}

/**
 * User-scoped webhook management via the OAuth resource API
 * (`/api/oauth/me/webhooks`). The available event set is restricted to
 * the user's own activity (token grants/revokes, profile/domain events).
 */
export class WebhooksAPI {
  constructor(private readonly client: PrismClient) {}

  /** List the authenticated user's webhooks. Requires `webhooks:read`. */
  async list(token: string): Promise<Webhook[]> {
    const res = await this.client.request<{ webhooks: Webhook[] }>(
      "GET",
      "/api/oauth/me/webhooks",
      { token },
    );
    return res.webhooks.map(normaliseEvents);
  }

  /**
   * Create a new webhook. Requires `webhooks:write`. The response wraps
   * the freshly-issued secret — the only time it is returned.
   */
  async create(token: string, params: CreateWebhookParams): Promise<Webhook> {
    const res = await this.client.request<{ webhook: Webhook }>(
      "POST",
      "/api/oauth/me/webhooks",
      { token, body: params },
    );
    return normaliseEvents(res.webhook);
  }

  /** Update a webhook. Requires `webhooks:write`. */
  async update(
    token: string,
    webhookId: string,
    params: UpdateWebhookParams,
  ): Promise<void> {
    await this.client.request("PATCH", `/api/oauth/me/webhooks/${webhookId}`, {
      token,
      body: params,
    });
  }

  /** Delete a webhook. Requires `webhooks:write`. */
  async delete(token: string, webhookId: string): Promise<void> {
    await this.client.request("DELETE", `/api/oauth/me/webhooks/${webhookId}`, {
      token,
    });
  }

  /** List the last 50 delivery attempts for a webhook. Requires
   *  `webhooks:read`. */
  async listDeliveries(
    token: string,
    webhookId: string,
  ): Promise<WebhookDelivery[]> {
    const res = await this.client.request<{ deliveries: WebhookDelivery[] }>(
      "GET",
      `/api/oauth/me/webhooks/${webhookId}/deliveries`,
      { token },
    );
    return res.deliveries;
  }
}
