import type { PrismClient } from "../client.js";
import type {
  AdminUser,
  PaginatedResponse,
  SiteConfig,
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
 * Operations under `/api/oauth/me/admin/*` — every method requires a
 * token whose owner is a site admin and that carries the documented
 * admin scope. Non-admin tokens get 403 regardless of scope.
 */
export class AdminAPI {
  constructor(private readonly client: PrismClient) {}

  // ── Users ──────────────────────────────────────────────────────────────────

  /**
   * List all users on the site. Requires `admin:users:read`. The server
   * caps `limit` at 100 and uses `q` for substring search across username,
   * email, and display name.
   */
  async listUsers(
    token: string,
    options?: { page?: number; limit?: number; q?: string },
  ): Promise<PaginatedResponse<AdminUser>> {
    const params: Record<string, string> = {};
    if (options?.page) params.page = String(options.page);
    if (options?.limit) params.limit = String(options.limit);
    if (options?.q) params.q = options.q;

    const res = await this.client.request<{
      users: AdminUser[];
      total: number;
      page: number;
      limit: number;
    }>("GET", "/api/oauth/me/admin/users", { token, params });
    return {
      items: res.users,
      total: res.total,
      page: res.page,
      limit: res.limit,
    };
  }

  /** Get a user by ID. Requires `admin:users:read`. */
  async getUser(token: string, userId: string): Promise<AdminUser> {
    const res = await this.client.request<{ user: AdminUser }>(
      "GET",
      `/api/oauth/me/admin/users/${userId}`,
      { token },
    );
    return res.user;
  }

  /**
   * Update a user. Requires `admin:users:write`. The server only honours
   * a fixed allowlist of fields — anything else is silently ignored.
   */
  async updateUser(
    token: string,
    userId: string,
    data: Partial<{
      role: "admin" | "user";
      is_active: boolean;
      display_name: string;
      avatar_url: string | null;
    }>,
  ): Promise<AdminUser> {
    const res = await this.client.request<{ user: AdminUser }>(
      "PATCH",
      `/api/oauth/me/admin/users/${userId}`,
      { token, body: data },
    );
    return res.user;
  }

  /** Delete a user. Requires `admin:users:delete`. The server refuses to
   *  delete the token owner via this endpoint. */
  async deleteUser(token: string, userId: string): Promise<void> {
    await this.client.request("DELETE", `/api/oauth/me/admin/users/${userId}`, {
      token,
    });
  }

  // ── Site Config ────────────────────────────────────────────────────────────

  /** Read the site configuration. Requires `admin:config:read`. */
  async getConfig(token: string): Promise<SiteConfig> {
    const res = await this.client.request<{ config: SiteConfig }>(
      "GET",
      "/api/oauth/me/admin/config",
      { token },
    );
    return res.config;
  }

  /** Update site configuration. Requires `admin:config:write`. */
  async updateConfig(
    token: string,
    updates: Partial<SiteConfig>,
  ): Promise<void> {
    await this.client.request("PATCH", "/api/oauth/me/admin/config", {
      token,
      body: updates,
    });
  }

  // ── Admin Webhooks ────────────────────────────────────────────────────────

  /** List all admin-scope webhooks. Requires `admin:webhooks:read`. */
  async listWebhooks(token: string): Promise<Webhook[]> {
    const res = await this.client.request<{ webhooks: Webhook[] }>(
      "GET",
      "/api/oauth/me/admin/webhooks",
      { token },
    );
    return res.webhooks.map(normaliseEvents);
  }

  /** Read a single admin webhook. Requires `admin:webhooks:read`. */
  async getWebhook(token: string, webhookId: string): Promise<Webhook> {
    const res = await this.client.request<{ webhook: Webhook }>(
      "GET",
      `/api/oauth/me/admin/webhooks/${webhookId}`,
      { token },
    );
    return normaliseEvents(res.webhook);
  }

  /** Create an admin webhook. Requires `admin:webhooks:write`. */
  async createWebhook(
    token: string,
    params: CreateWebhookParams,
  ): Promise<Webhook> {
    const res = await this.client.request<{ webhook: Webhook }>(
      "POST",
      "/api/oauth/me/admin/webhooks",
      { token, body: params },
    );
    return normaliseEvents(res.webhook);
  }

  /** Update an admin webhook. Requires `admin:webhooks:write`. */
  async updateWebhook(
    token: string,
    webhookId: string,
    params: UpdateWebhookParams,
  ): Promise<void> {
    await this.client.request(
      "PATCH",
      `/api/oauth/me/admin/webhooks/${webhookId}`,
      { token, body: params },
    );
  }

  /** Delete an admin webhook. Requires `admin:webhooks:write`. */
  async deleteWebhook(token: string, webhookId: string): Promise<void> {
    await this.client.request(
      "DELETE",
      `/api/oauth/me/admin/webhooks/${webhookId}`,
      { token },
    );
  }

  /** Send a test delivery to an admin webhook. Requires
   *  `admin:webhooks:write`. */
  async testWebhook(
    token: string,
    webhookId: string,
  ): Promise<{ success: boolean; status: number | null }> {
    return this.client.request(
      "POST",
      `/api/oauth/me/admin/webhooks/${webhookId}/test`,
      { token },
    );
  }

  /** List recent admin webhook deliveries. Requires
   *  `admin:webhooks:read`. */
  async listWebhookDeliveries(
    token: string,
    webhookId: string,
  ): Promise<WebhookDelivery[]> {
    const res = await this.client.request<{ deliveries: WebhookDelivery[] }>(
      "GET",
      `/api/oauth/me/admin/webhooks/${webhookId}/deliveries`,
      { token },
    );
    return res.deliveries;
  }

  // ── Site Invites ───────────────────────────────────────────────────────────

  /**
   * Create a site invite. Requires `admin:invites:create` AND the token
   * owner must be a site admin.
   */
  async createInvite(
    token: string,
    options?: {
      email?: string;
      note?: string;
      max_uses?: number;
      expires_in_days?: number;
    },
  ): Promise<{
    id: string;
    token: string;
    invite_url: string;
    expires_at: number | null;
  }> {
    return this.client.request("POST", "/api/oauth/me/invites", {
      token,
      body: options ?? {},
    });
  }

  /** List site invites. Requires `admin:invites:read`. */
  async listInvites(token: string): Promise<
    Array<{
      id: string;
      token: string;
      email: string | null;
      note: string | null;
      max_uses: number | null;
      use_count: number;
      created_by: string;
      created_by_username: string | null;
      expires_at: number | null;
      created_at: number;
    }>
  > {
    const res = await this.client.request<{
      invites: Array<{
        id: string;
        token: string;
        email: string | null;
        note: string | null;
        max_uses: number | null;
        use_count: number;
        created_by: string;
        created_by_username: string | null;
        expires_at: number | null;
        created_at: number;
      }>;
    }>("GET", "/api/oauth/me/invites", { token });
    return res.invites;
  }

  /** Revoke a site invite. Requires `admin:invites:revoke`. */
  async deleteInvite(token: string, inviteId: string): Promise<void> {
    await this.client.request("DELETE", `/api/oauth/me/invites/${inviteId}`, {
      token,
    });
  }
}
