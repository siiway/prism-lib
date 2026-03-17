import type { PrismClient } from "../client.js";
import type {
  Webhook,
  WebhookDelivery,
  CreateWebhookParams,
  UpdateWebhookParams,
} from "../types.js";

/** Webhook management via resource API */
export class WebhooksAPI {
  constructor(private readonly client: PrismClient) {}

  /** List the authenticated user's webhooks */
  async list(token: string): Promise<Webhook[]> {
    return this.client.request<Webhook[]>("GET", "/api/oauth/me/webhooks", {
      token,
    });
  }

  /** Create a new webhook */
  async create(token: string, params: CreateWebhookParams): Promise<Webhook> {
    return this.client.request<Webhook>("POST", "/api/oauth/me/webhooks", {
      token,
      body: params,
    });
  }

  /** Update a webhook */
  async update(
    token: string,
    webhookId: string,
    params: UpdateWebhookParams,
  ): Promise<Webhook> {
    return this.client.request<Webhook>(
      "PATCH",
      `/api/oauth/me/webhooks/${webhookId}`,
      { token, body: params },
    );
  }

  /** Delete a webhook */
  async delete(token: string, webhookId: string): Promise<void> {
    await this.client.request("DELETE", `/api/oauth/me/webhooks/${webhookId}`, {
      token,
    });
  }

  /** List webhook deliveries */
  async listDeliveries(
    token: string,
    webhookId: string,
  ): Promise<WebhookDelivery[]> {
    return this.client.request<WebhookDelivery[]>(
      "GET",
      `/api/oauth/me/webhooks/${webhookId}/deliveries`,
      { token },
    );
  }
}
