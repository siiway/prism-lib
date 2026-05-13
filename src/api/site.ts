import type { PrismClient } from "../client.js";
import type { AdminUser, PaginatedResponse } from "../types.js";

/**
 * Site-level user operations. Every method requires the documented
 * `site:user:*` scope AND the token owner to be a site admin — non-admin
 * tokens are rejected even with the right scope.
 */
export class SiteAPI {
  constructor(private readonly client: PrismClient) {}

  /**
   * List every user on the site. Requires `site:user:read`. The server
   * caps `limit` at 100 and uses `q` for substring search across
   * username, email, and display name.
   */
  async listUsers(
    token: string,
    options?: { page?: number; limit?: number; q?: string },
  ): Promise<PaginatedResponse<AdminUser>> {
    const params: Record<string, string> = {};
    if (options?.page) params.page = String(options.page);
    if (options?.limit) params.limit = String(options.limit);
    if (options?.q) params.q = options.q;

    const res = await this.client.request<{
      users: AdminUser[];
      total: number;
      page: number;
      limit: number;
    }>("GET", "/api/oauth/me/site/users", { token, params });
    return {
      items: res.users,
      total: res.total,
      page: res.page,
      limit: res.limit,
    };
  }

  /** Get any user by ID. Requires `site:user:read`. */
  async getUser(token: string, userId: string): Promise<AdminUser> {
    const res = await this.client.request<{ user: AdminUser }>(
      "GET",
      `/api/oauth/me/site/users/${userId}`,
      { token },
    );
    return res.user;
  }
}
