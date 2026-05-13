import type { PrismClient } from "../client.js";
import type { OAuthProfile } from "../types.js";

/** User profile operations via the OAuth resource API. */
export class ProfileAPI {
  constructor(private readonly client: PrismClient) {}

  /**
   * Read the authenticated user's profile. Requires the `profile` scope;
   * `email` / `email_verified` only populate when the token additionally
   * has the `email` scope.
   */
  async get(token: string): Promise<OAuthProfile> {
    return this.client.request<OAuthProfile>("GET", "/api/oauth/me/profile", {
      token,
    });
  }

  /**
   * Update the authenticated user's display name and/or avatar. Requires
   * the `profile:write` scope. Pass `avatar_url: null` to clear it.
   */
  async update(
    token: string,
    data: { display_name?: string; avatar_url?: string | null },
  ): Promise<OAuthProfile> {
    const res = await this.client.request<{ user: OAuthProfile }>(
      "PATCH",
      "/api/oauth/me/profile",
      { token, body: data },
    );
    return res.user;
  }
}
