import type { PrismClient } from "../client.js";
import type { OAuthDomain } from "../types.js";

/**
 * Response from `POST /api/oauth/me/domains` — carries the DNS TXT record
 * the caller needs to publish before verification can succeed.
 */
export interface AddDomainResponse {
  id: string;
  domain: string;
  verification_token: string;
  /** Subdomain at which to publish the TXT record. */
  txt_record: string;
  /** TXT value to publish. */
  txt_value: string;
}

/**
 * Response from `POST /api/oauth/me/domains/:domain/verify`. The endpoint
 * performs a DNS TXT lookup against the well-known record; if the value
 * is missing the response is `{ verified: false }` with no further detail.
 */
export interface VerifyDomainResponse {
  verified: boolean;
  /** Unix seconds — set only when verification succeeded. */
  verified_at?: number;
  /** Set when the domain was already verified before the call. */
  message?: string;
}

/** Domain verification via the OAuth resource API. */
export class DomainsAPI {
  constructor(private readonly client: PrismClient) {}

  /** List the authenticated user's verified domains. Requires
   *  the `domains:read` scope. */
  async list(token: string): Promise<OAuthDomain[]> {
    const res = await this.client.request<{ domains: OAuthDomain[] }>(
      "GET",
      "/api/oauth/me/domains",
      { token },
    );
    return res.domains;
  }

  /** Register a domain pending verification. Requires `domains:write`.
   *  The response carries the TXT record the user must publish; call
   *  {@link verify} afterwards to trigger the DNS lookup. */
  async add(token: string, domain: string): Promise<AddDomainResponse> {
    return this.client.request<AddDomainResponse>(
      "POST",
      "/api/oauth/me/domains",
      { token, body: { domain } },
    );
  }

  /** Trigger DNS TXT verification for an already-added domain. Requires
   *  `domains:write`. Returns `{ verified: false }` when the record
   *  isn't published yet — call again after the DNS propagates. */
  async verify(token: string, domain: string): Promise<VerifyDomainResponse> {
    return this.client.request<VerifyDomainResponse>(
      "POST",
      `/api/oauth/me/domains/${encodeURIComponent(domain)}/verify`,
      { token },
    );
  }

  /** Remove a domain from the authenticated user. Requires
   *  `domains:write`. The domain identifier is the domain name, not the
   *  row id. */
  async delete(token: string, domain: string): Promise<void> {
    await this.client.request(
      "DELETE",
      `/api/oauth/me/domains/${encodeURIComponent(domain)}`,
      { token },
    );
  }
}
