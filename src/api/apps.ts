import type { PrismClient } from "../client.js";
import type {
  OAuthApp,
  CreateAppParams,
  UpdateAppParams,
  TeamOwnedApp,
} from "../types.js";

/** OAuth app management via the resource API (`/api/oauth/me/apps`). */
export class AppsAPI {
  constructor(private readonly client: PrismClient) {}

  /** List the authenticated user's personal OAuth apps. Team-owned apps
   *  are not returned here — call {@link listTeamApps} for those. */
  async list(token: string): Promise<OAuthApp[]> {
    const res = await this.client.request<{ apps: OAuthApp[] }>(
      "GET",
      "/api/oauth/me/apps",
      { token },
    );
    return res.apps;
  }

  /**
   * List OAuth apps owned by teams the bearer belongs to. Read-only listing
   * — every team member sees the entries, but {@link update} and
   * {@link delete} only succeed when the caller is the team's owner or
   * co-owner. Inspect `can_grant` per row before offering write affordances
   * in a UI.
   */
  async listTeamApps(token: string): Promise<TeamOwnedApp[]> {
    const res = await this.client.request<{ apps: TeamOwnedApp[] }>(
      "GET",
      "/api/oauth/me/team-apps",
      { token },
    );
    return res.apps;
  }

  /**
   * Create a new OAuth app owned by the authenticated user. The response
   * carries the freshly-issued `client_secret` — this is the only time
   * the server returns it, so persist it before letting the response go.
   */
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
    const res = await this.client.request<{ app: OAuthApp }>(
      "PATCH",
      `/api/oauth/me/apps/${appId}`,
      { token, body: params },
    );
    return res.app;
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
