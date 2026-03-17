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

/** Admin operations (requires admin-scoped token) */
export class AdminAPI {
  constructor(private readonly client: PrismClient) {}

  // ── Users ──

  /** List all users (paginated) */
  async listUsers(
    token: string,
    options?: { page?: number; per_page?: number; search?: string },
  ): Promise<PaginatedResponse<AdminUser>> {
    const params: Record<string, string> = {};
    if (options?.page) params.page = String(options.page);
    if (options?.per_page) params.per_page = String(options.per_page);
    if (options?.search) params.search = options.search;

    return this.client.request<PaginatedResponse<AdminUser>>(
      "GET",
      "/api/oauth/me/admin/users",
      { token, params },
    );
  }

  /** Get a user by ID */
  async getUser(token: string, userId: string): Promise<AdminUser> {
    return this.client.request<AdminUser>(
      "GET",
      `/api/oauth/me/admin/users/${userId}`,
      { token },
    );
  }

  /** Update a user */
  async updateUser(
    token: string,
    userId: string,
    data: Partial<{ display_name: string; role: string; email_verified: boolean }>,
  ): Promise<AdminUser> {
    return this.client.request<AdminUser>(
      "PATCH",
      `/api/oauth/me/admin/users/${userId}`,
      { token, body: data },
    );
  }

  /** Delete a user */
  async deleteUser(token: string, userId: string): Promise<void> {
    await this.client.request(
      "DELETE",
      `/api/oauth/me/admin/users/${userId}`,
      { token },
    );
  }

  // ── Site Config ──

  /** Read site configuration */
  async getConfig(token: string): Promise<SiteConfig> {
    return this.client.request<SiteConfig>(
      "GET",
      "/api/oauth/me/admin/config",
      { token },
    );
  }

  /** Update site configuration */
  async updateConfig(
    token: string,
    config: Partial<SiteConfig>,
  ): Promise<SiteConfig> {
    return this.client.request<SiteConfig>(
      "PATCH",
      "/api/oauth/me/admin/config",
      { token, body: config },
    );
  }

  // ── Admin Webhooks ──

  /** List all admin webhooks */
  async listWebhooks(token: string): Promise<Webhook[]> {
    return this.client.request<Webhook[]>(
      "GET",
      "/api/oauth/me/admin/webhooks",
      { token },
    );
  }

  /** Create an admin webhook */
  async createWebhook(
    token: string,
    params: CreateWebhookParams,
  ): Promise<Webhook> {
    return this.client.request<Webhook>(
      "POST",
      "/api/oauth/me/admin/webhooks",
      { token, body: params },
    );
  }

  /** Update an admin webhook */
  async updateWebhook(
    token: string,
    webhookId: string,
    params: UpdateWebhookParams,
  ): Promise<Webhook> {
    return this.client.request<Webhook>(
      "PATCH",
      `/api/oauth/me/admin/webhooks/${webhookId}`,
      { token, body: params },
    );
  }

  /** Delete an admin webhook */
  async deleteWebhook(token: string, webhookId: string): Promise<void> {
    await this.client.request(
      "DELETE",
      `/api/oauth/me/admin/webhooks/${webhookId}`,
      { token },
    );
  }

  /** Send a test webhook delivery */
  async testWebhook(token: string, webhookId: string): Promise<void> {
    await this.client.request(
      "POST",
      `/api/oauth/me/admin/webhooks/${webhookId}/test`,
      { token },
    );
  }

  /** List admin webhook deliveries */
  async listWebhookDeliveries(
    token: string,
    webhookId: string,
  ): Promise<WebhookDelivery[]> {
    return this.client.request<WebhookDelivery[]>(
      "GET",
      `/api/oauth/me/admin/webhooks/${webhookId}/deliveries`,
      { token },
    );
  }

  // ── Invites ──

  /** Create a site invite */
  async createInvite(
    token: string,
    options?: { max_uses?: number; expires_at?: string },
  ) {
    return this.client.request<{ id: string; token: string; max_uses: number; expires_at?: string }>(
      "POST",
      "/api/oauth/me/invites",
      { token, body: options },
    );
  }

  /** List site invites */
  async listInvites(token: string) {
    return this.client.request<
      Array<{ id: string; token: string; uses: number; max_uses: number; expires_at?: string; created_at: string }>
    >("GET", "/api/oauth/me/invites", { token });
  }

  /** Revoke a site invite */
  async deleteInvite(token: string, inviteId: string): Promise<void> {
    await this.client.request("DELETE", `/api/oauth/me/invites/${inviteId}`, {
      token,
    });
  }
}
