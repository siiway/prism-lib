import type { PrismClient } from "../client.js";
import type {
  Team,
  CreateTeamParams,
  UpdateTeamParams,
} from "../types.js";

/** Team management via resource API */
export class TeamsAPI {
  constructor(private readonly client: PrismClient) {}

  /** List the authenticated user's teams */
  async list(token: string): Promise<Team[]> {
    return this.client.request<Team[]>("GET", "/api/oauth/me/teams", {
      token,
    });
  }

  /** Create a new team */
  async create(token: string, params: CreateTeamParams): Promise<Team> {
    return this.client.request<Team>("POST", "/api/oauth/me/teams", {
      token,
      body: params,
    });
  }

  /** Update a team */
  async update(
    token: string,
    teamId: string,
    params: UpdateTeamParams,
  ): Promise<Team> {
    return this.client.request<Team>(
      "PATCH",
      `/api/oauth/me/teams/${teamId}`,
      { token, body: params },
    );
  }

  /** Delete a team */
  async delete(token: string, teamId: string): Promise<void> {
    await this.client.request("DELETE", `/api/oauth/me/teams/${teamId}`, {
      token,
    });
  }

  /** Add a member to a team */
  async addMember(
    token: string,
    teamId: string,
    userId: string,
    role?: "admin" | "member",
  ): Promise<void> {
    await this.client.request(
      "POST",
      `/api/oauth/me/teams/${teamId}/members`,
      { token, body: { user_id: userId, role: role ?? "member" } },
    );
  }

  /** Remove a member from a team */
  async removeMember(
    token: string,
    teamId: string,
    userId: string,
  ): Promise<void> {
    await this.client.request(
      "DELETE",
      `/api/oauth/me/teams/${teamId}/members/${userId}`,
      { token },
    );
  }
}
