import type { PrismClient } from "../client.js";
import type { Domain } from "../types.js";

/** Domain verification via resource API */
export class DomainsAPI {
  constructor(private readonly client: PrismClient) {}

  /** List the authenticated user's domains */
  async list(token: string): Promise<Domain[]> {
    return this.client.request<Domain[]>("GET", "/api/oauth/me/domains", {
      token,
    });
  }

  /** Add a domain for verification */
  async add(token: string, domain: string): Promise<Domain> {
    return this.client.request<Domain>("POST", "/api/oauth/me/domains", {
      token,
      body: { domain },
    });
  }

  /** Trigger DNS re-verification for a domain */
  async verify(token: string, domain: string): Promise<Domain> {
    return this.client.request<Domain>(
      "POST",
      `/api/oauth/me/domains/${domain}/verify`,
      { token },
    );
  }

  /** Remove a domain */
  async delete(token: string, domain: string): Promise<void> {
    await this.client.request(
      "DELETE",
      `/api/oauth/me/domains/${domain}`,
      { token },
    );
  }
}
