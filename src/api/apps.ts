import type { PrismClient } from "../client.js";
import type {
  OAuthApp,
  CreateAppParams,
  UpdateAppParams,
  TeamOwnedApp,
} from "../types.js";

/** OAuth app management via resource API */
export class AppsAPI {
  constructor(private readonly client: PrismClient) {}

  /** List the authenticated user's personal OAuth apps. Team-owned apps
   *  are not returned here — call {@link listTeamApps} for those. */
  async list(token: string): Promise<OAuthApp[]> {
    return this.client.request<OAuthApp[]>("GET", "/api/oauth/me/apps", {
      token,
    });
  }

  /**
   * List OAuth apps owned by teams the bearer belongs to. Read-only listing
   * — every team member sees the entries, but {@link update} and
   * {@link delete} only succeed when the caller is the team's owner or
   * co-owner. Inspect `can_grant` per row before offering write affordances
   * in a UI.
   */
  async listTeamApps(token: string): Promise<{ apps: TeamOwnedApp[] }> {
    return this.client.request<{ apps: TeamOwnedApp[] }>(
      "GET",
      "/api/oauth/me/team-apps",
      { token },
    );
  }

  /** Create a new OAuth app */
  async create(token: string, params: CreateAppParams): Promise<OAuthApp> {
    return this.client.request<OAuthApp>("POST", "/api/oauth/me/apps", {
      token,
      body: params,
    });
  }

  /**
   * Update an existing OAuth app. For personal apps the caller must own the
   * app; for team-owned apps the caller must be the team's owner or
   * co-owner. Other team members get a 403 even though they can read the
   * app via {@link listTeamApps}.
   */
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

  /**
   * Delete an OAuth app. Same caller rules as {@link update}: personal
   * apps require the owner; team apps require team owner / co-owner.
   */
  async delete(token: string, appId: string): Promise<void> {
    await this.client.request("DELETE", `/api/oauth/me/apps/${appId}`, {
      token,
    });
  }
}
