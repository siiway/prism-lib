import type { PrismClient } from "../client.js";
import type { AdminUser, PaginatedResponse } from "../types.js";

/** Site-level user operations (requires site:user:read scope; token owner must be a site admin) */
export class SiteAPI {
  constructor(private readonly client: PrismClient) {}

  /**
   * List all users on the site (paginated).
   * Requires `site:user:read`.
   */
  async listUsers(
    token: string,
    options?: { page?: number; per_page?: number; search?: string },
  ): Promise<PaginatedResponse<AdminUser>> {
    const params: Record<string, string> = {};
    if (options?.page) params.page = String(options.page);
    if (options?.per_page) params.per_page = String(options.per_page);
    if (options?.search) params.search = options.search;

    return this.client.request<PaginatedResponse<AdminUser>>(
      "GET",
      "/api/oauth/me/site/users",
      { token, params },
    );
  }

  /**
   * Get any user by ID.
   * Requires `site:user:read`.
   */
  async getUser(token: string, userId: string): Promise<AdminUser> {
    return this.client.request<AdminUser>(
      "GET",
      `/api/oauth/me/site/users/${userId}`,
      { token },
    );
  }
}
