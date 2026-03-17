import type { PrismClient } from "../client.js";
import type { OAuthApp, CreateAppParams, UpdateAppParams } from "../types.js";

/** OAuth app management via resource API */
export class AppsAPI {
  constructor(private readonly client: PrismClient) {}

  /** List the authenticated user's OAuth apps */
  async list(token: string): Promise<OAuthApp[]> {
    return this.client.request<OAuthApp[]>("GET", "/api/oauth/me/apps", {
      token,
    });
  }

  /** Create a new OAuth app */
  async create(token: string, params: CreateAppParams): Promise<OAuthApp> {
    return this.client.request<OAuthApp>("POST", "/api/oauth/me/apps", {
      token,
      body: params,
    });
  }

  /** Update an existing OAuth app */
  async update(
    token: string,
    appId: string,
    params: UpdateAppParams,
  ): Promise<OAuthApp> {
    return this.client.request<OAuthApp>(
      "PATCH",
      `/api/oauth/me/apps/${appId}`,
      { token, body: params },
    );
  }

  /** Delete an OAuth app */
  async delete(token: string, appId: string): Promise<void> {
    await this.client.request("DELETE", `/api/oauth/me/apps/${appId}`, {
      token,
    });
  }
}
