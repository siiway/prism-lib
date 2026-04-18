import type { PrismClient } from "../client.js";
import type {
  TeamScopeMember,
  TeamScopeMemberProfile,
  TeamScopeTeam,
} from "../types.js";

/**
 * Team-scoped API — requires a token issued with `team:<teamId>:<permission>` scopes.
 * These tokens are obtained through the standard OAuth flow when an app requests
 * `team:read`, `team:member:read`, etc. and the user selects a team on the consent screen.
 */
export class TeamScopeAPI {
  constructor(private readonly client: PrismClient) {}

  /** Read team info. Requires `team:<teamId>:read`. */
  async getInfo(token: string, teamId: string): Promise<TeamScopeTeam> {
    const res = await this.client.request<{ team: TeamScopeTeam }>(
      "GET",
      `/api/oauth/me/team/${teamId}/info`,
      { token },
    );
    return res.team;
  }

  /** Update team name/description/avatar. Requires `team:<teamId>:write`. */
  async updateInfo(
    token: string,
    teamId: string,
    data: { name?: string; description?: string; avatar_url?: string | null },
  ): Promise<TeamScopeTeam> {
    const res = await this.client.request<{ team: TeamScopeTeam }>(
      "PATCH",
      `/api/oauth/me/team/${teamId}/info`,
      { token, body: data },
    );
    return res.team;
  }

  /** List team members (IDs and roles). Requires `team:<teamId>:member:read`. */
  async listMembers(token: string, teamId: string): Promise<TeamScopeMember[]> {
    const res = await this.client.request<{ members: TeamScopeMember[] }>(
      "GET",
      `/api/oauth/me/team/${teamId}/members`,
      { token },
    );
    return res.members;
  }

  /** Get a member's display name and avatar. Requires `team:<teamId>:member:profile:read`. */
  async getMemberProfile(
    token: string,
    teamId: string,
    userId: string,
  ): Promise<TeamScopeMemberProfile> {
    const res = await this.client.request<{ member: TeamScopeMemberProfile }>(
      "GET",
      `/api/oauth/me/team/${teamId}/members/${userId}/profile`,
      { token },
    );
    return res.member;
  }

  /** Add a user to the team. Requires `team:<teamId>:member:write`. */
  async addMember(
    token: string,
    teamId: string,
    userId: string,
    role?: "member" | "admin",
  ): Promise<void> {
    await this.client.request("POST", `/api/oauth/me/team/${teamId}/members`, {
      token,
      body: { user_id: userId, role },
    });
  }

  /** Update a member's role. Requires `team:<teamId>:member:write`. */
  async updateMemberRole(
    token: string,
    teamId: string,
    userId: string,
    role: "member" | "admin",
  ): Promise<void> {
    await this.client.request(
      "PATCH",
      `/api/oauth/me/team/${teamId}/members/${userId}/role`,
      { token, body: { role } },
    );
  }

  /** Remove a member from the team. Requires `team:<teamId>:member:write`. */
  async removeMember(
    token: string,
    teamId: string,
    userId: string,
  ): Promise<void> {
    await this.client.request(
      "DELETE",
      `/api/oauth/me/team/${teamId}/members/${userId}`,
      { token },
    );
  }
}
