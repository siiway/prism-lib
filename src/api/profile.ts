import type { PrismClient } from "../client.js";
import type { User, UserInfo } from "../types.js";

/** User profile operations via OAuth resource API */
export class ProfileAPI {
  constructor(private readonly client: PrismClient) {}

  /** Get the authenticated user's profile */
  async get(token: string): Promise<UserInfo> {
    return this.client.request<UserInfo>("GET", "/api/oauth/me/profile", {
      token,
    });
  }

  /** Update the authenticated user's profile */
  async update(
    token: string,
    data: { display_name?: string; avatar_url?: string },
  ): Promise<User> {
    return this.client.request<User>("PATCH", "/api/oauth/me/profile", {
      token,
      body: data,
    });
  }
}
