import type { PrismClient } from "../client.js";
import type {
  Team,
  TeamWithMembers,
  CreateTeamParams,
  UpdateTeamParams,
  TeamInvite,
  CreateTeamInviteParams,
  TeamInviteInfo,
  TeamDomain,
  TeamApp,
  CreateAppParams,
} from "../types.js";

/**
 * Team management API.
 *
 * Methods prefixed with `oauth*` use the OAuth resource API (`/api/oauth/me/teams`)
 * and require a Bearer access token with the appropriate `teams:*` scopes.
 *
 * All other methods use the session API (`/api/teams`) and require either
 * a session token or a Personal Access Token passed as Bearer.
 */
export class TeamsAPI {
  constructor(private readonly client: PrismClient) {}

  // ────────────────────────────────────────────────────────────────────────────
  // OAuth Resource API (Bearer token + teams:* scopes)
  // ────────────────────────────────────────────────────────────────────────────

  /** List user's teams with role info (OAuth, scope: teams:read) */
  async oauthList(token: string): Promise<Team[]> {
    const res = await this.client.request<{ teams: Team[] }>(
      "GET",
      "/api/oauth/me/teams",
      { token },
    );
    return res.teams;
  }

  /** Create a team (OAuth, scope: teams:create) */
  async oauthCreate(token: string, params: CreateTeamParams): Promise<Team> {
    const res = await this.client.request<{ team: Team }>(
      "POST",
      "/api/oauth/me/teams",
      { token, body: params },
    );
    return res.team;
  }

  /** Update a team (OAuth, scope: teams:write) */
  async oauthUpdate(
    token: string,
    teamId: string,
    params: UpdateTeamParams,
  ): Promise<Team> {
    const res = await this.client.request<{ team: Team }>(
      "PATCH",
      `/api/oauth/me/teams/${teamId}`,
      { token, body: params },
    );
    return res.team;
  }

  /** Delete a team (OAuth, scope: teams:delete) */
  async oauthDelete(token: string, teamId: string): Promise<void> {
    await this.client.request("DELETE", `/api/oauth/me/teams/${teamId}`, {
      token,
    });
  }

  /** Add a member by username (OAuth, scope: teams:write) */
  async oauthAddMember(
    token: string,
    teamId: string,
    username: string,
    role?: "admin" | "member",
  ): Promise<{ user_id: string; role: string; joined_at: number }> {
    return this.client.request(
      "POST",
      `/api/oauth/me/teams/${teamId}/members`,
      { token, body: { username, role: role ?? "member" } },
    );
  }

  /** Remove a member (OAuth, scope: teams:write) */
  async oauthRemoveMember(
    token: string,
    teamId: string,
    userId: string,
  ): Promise<void> {
    await this.client.request(
      "DELETE",
      `/api/oauth/me/teams/${teamId}/members/${userId}`,
      {
        token,
      },
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Session API — Team CRUD
  // ────────────────────────────────────────────────────────────────────────────

  /** List teams the user belongs to */
  async list(token: string): Promise<Team[]> {
    const res = await this.client.request<{ teams: Team[] }>(
      "GET",
      "/api/teams",
      { token },
    );
    return res.teams;
  }

  /** Create a new team */
  async create(token: string, params: CreateTeamParams): Promise<Team> {
    const res = await this.client.request<{ team: Team }>(
      "POST",
      "/api/teams",
      {
        token,
        body: params,
      },
    );
    return res.team;
  }

  /** Get team details + members */
  async get(token: string, teamId: string): Promise<TeamWithMembers> {
    return this.client.request<TeamWithMembers>("GET", `/api/teams/${teamId}`, {
      token,
    });
  }

  /** Update a team (requires admin+ role) */
  async update(
    token: string,
    teamId: string,
    params: UpdateTeamParams,
  ): Promise<Team> {
    const res = await this.client.request<{ team: Team }>(
      "PATCH",
      `/api/teams/${teamId}`,
      {
        token,
        body: params,
      },
    );
    return res.team;
  }

  /** Delete a team (owner only) */
  async delete(token: string, teamId: string): Promise<void> {
    await this.client.request("DELETE", `/api/teams/${teamId}`, { token });
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Members
  // ────────────────────────────────────────────────────────────────────────────

  /** Add a member by username (requires admin+) */
  async addMember(
    token: string,
    teamId: string,
    username: string,
    role?: "admin" | "member",
  ): Promise<void> {
    await this.client.request("POST", `/api/teams/${teamId}/members`, {
      token,
      body: { username, role: role ?? "member" },
    });
  }

  /** Change a member's role (owner only) */
  async updateMemberRole(
    token: string,
    teamId: string,
    userId: string,
    role: "admin" | "member",
  ): Promise<void> {
    await this.client.request(
      "PATCH",
      `/api/teams/${teamId}/members/${userId}`,
      {
        token,
        body: { role },
      },
    );
  }

  /** Remove a member (admin+, or self-remove) */
  async removeMember(
    token: string,
    teamId: string,
    userId: string,
  ): Promise<void> {
    await this.client.request(
      "DELETE",
      `/api/teams/${teamId}/members/${userId}`,
      { token },
    );
  }

  /** Transfer ownership to another member (owner only) */
  async transferOwnership(
    token: string,
    teamId: string,
    newOwnerUserId: string,
  ): Promise<void> {
    await this.client.request(
      "POST",
      `/api/teams/${teamId}/transfer-ownership`,
      {
        token,
        body: { user_id: newOwnerUserId },
      },
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Invites
  // ────────────────────────────────────────────────────────────────────────────

  /** List active invites for a team (admin+) */
  async listInvites(token: string, teamId: string): Promise<TeamInvite[]> {
    const res = await this.client.request<{ invites: TeamInvite[] }>(
      "GET",
      `/api/teams/${teamId}/invites`,
      { token },
    );
    return res.invites;
  }

  /** Create an invite link (admin+). Can optionally target a specific email. */
  async createInvite(
    token: string,
    teamId: string,
    params?: CreateTeamInviteParams,
  ): Promise<{
    token: string;
    link: string;
    role: string;
    expires_at: number;
  }> {
    return this.client.request("POST", `/api/teams/${teamId}/invites`, {
      token,
      body: params ?? {},
    });
  }

  /** Revoke an invite (admin+) */
  async deleteInvite(
    token: string,
    teamId: string,
    inviteToken: string,
  ): Promise<void> {
    await this.client.request(
      "DELETE",
      `/api/teams/${teamId}/invites/${inviteToken}`,
      { token },
    );
  }

  /** View public invite info (no auth required, but token can enrich response) */
  async getInviteInfo(
    inviteToken: string,
    token?: string,
  ): Promise<TeamInviteInfo> {
    return this.client.request<TeamInviteInfo>(
      "GET",
      `/api/teams/join/${inviteToken}`,
      {
        token,
      },
    );
  }

  /** Accept an invite (requires auth) */
  async acceptInvite(
    token: string,
    inviteToken: string,
  ): Promise<{ team_id: string }> {
    return this.client.request<{ team_id: string }>(
      "POST",
      `/api/teams/join/${inviteToken}`,
      {
        token,
      },
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Team Domains
  // ────────────────────────────────────────────────────────────────────────────

  /** List domains owned by a team */
  async listDomains(token: string, teamId: string): Promise<TeamDomain[]> {
    const res = await this.client.request<{ domains: TeamDomain[] }>(
      "GET",
      `/api/teams/${teamId}/domains`,
      { token },
    );
    return res.domains;
  }

  /** Add a domain to a team (admin+) */
  async addDomain(
    token: string,
    teamId: string,
    domain: string,
  ): Promise<TeamDomain> {
    return this.client.request<TeamDomain>(
      "POST",
      `/api/teams/${teamId}/domains`,
      {
        token,
        body: { domain },
      },
    );
  }

  /** Verify a team domain via DNS TXT check (admin+) */
  async verifyDomain(
    token: string,
    teamId: string,
    domainId: string,
  ): Promise<{
    verified: boolean;
    next_reverify_at?: number;
    message?: string;
  }> {
    return this.client.request(
      "POST",
      `/api/teams/${teamId}/domains/${domainId}/verify`,
      {
        token,
      },
    );
  }

  /** Delete a team domain (admin+) */
  async deleteDomain(
    token: string,
    teamId: string,
    domainId: string,
  ): Promise<void> {
    await this.client.request(
      "DELETE",
      `/api/teams/${teamId}/domains/${domainId}`,
      { token },
    );
  }

  /** Return a team domain to its creator's personal domains (admin+) */
  async domainToPersonal(
    token: string,
    teamId: string,
    domainId: string,
  ): Promise<void> {
    await this.client.request(
      "POST",
      `/api/teams/${teamId}/domains/${domainId}/to-personal`,
      {
        token,
      },
    );
  }

  /** Share (copy) a team domain to another team (admin+ in both teams) */
  async shareDomainToTeam(
    token: string,
    teamId: string,
    domainId: string,
    targetTeamId: string,
  ): Promise<{ id: string; domain: string; verified: boolean }> {
    return this.client.request(
      "POST",
      `/api/teams/${teamId}/domains/${domainId}/share-to-team`,
      {
        token,
        body: { team_id: targetTeamId },
      },
    );
  }

  /** Share (copy) a team domain to the requester's personal domains (admin+) */
  async shareDomainToPersonal(
    token: string,
    teamId: string,
    domainId: string,
  ): Promise<{ id: string; domain: string; verified: boolean }> {
    return this.client.request(
      "POST",
      `/api/teams/${teamId}/domains/${domainId}/share-to-personal`,
      { token },
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Team Apps
  // ────────────────────────────────────────────────────────────────────────────

  /** List OAuth apps owned by a team */
  async listApps(token: string, teamId: string): Promise<TeamApp[]> {
    const res = await this.client.request<{ apps: TeamApp[] }>(
      "GET",
      `/api/teams/${teamId}/apps`,
      { token },
    );
    return res.apps;
  }

  /** Create an OAuth app for a team (admin+) */
  async createApp(
    token: string,
    teamId: string,
    params: CreateAppParams,
  ): Promise<TeamApp> {
    const res = await this.client.request<{ app: TeamApp }>(
      "POST",
      `/api/teams/${teamId}/apps`,
      { token, body: params },
    );
    return res.app;
  }

  /** Transfer a personal app into this team (admin+, must own the app) */
  async transferAppToTeam(
    token: string,
    teamId: string,
    appId: string,
  ): Promise<void> {
    await this.client.request("POST", `/api/teams/${teamId}/apps/transfer`, {
      token,
      body: { app_id: appId },
    });
  }

  /** Move a team app back to the creator's personal apps (admin+) */
  async transferAppToPersonal(
    token: string,
    teamId: string,
    appId: string,
  ): Promise<void> {
    await this.client.request(
      "DELETE",
      `/api/teams/${teamId}/apps/${appId}/transfer`,
      { token },
    );
  }
}
