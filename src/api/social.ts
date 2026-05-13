import type { PrismClient } from "../client.js";
import type { SocialConnection, GPGKey } from "../types.js";

/** Social connections and GPG keys via the OAuth resource API. */
export class SocialAPI {
  constructor(private readonly client: PrismClient) {}

  // ── Social Connections ──

  /** List linked social accounts. Requires `social:read`. */
  async listConnections(token: string): Promise<SocialConnection[]> {
    const res = await this.client.request<{ connections: SocialConnection[] }>(
      "GET",
      "/api/oauth/me/social-connections",
      { token },
    );
    return res.connections;
  }

  /** Unlink a social account. Requires `social:write`. */
  async disconnect(token: string, connectionId: string): Promise<void> {
    await this.client.request(
      "DELETE",
      `/api/oauth/me/social-connections/${connectionId}`,
      { token },
    );
  }

  // ── GPG Keys ──

  /** List the authenticated user's GPG keys. Requires `gpg:read`. */
  async listGPGKeys(token: string): Promise<GPGKey[]> {
    const res = await this.client.request<{ keys: GPGKey[] }>(
      "GET",
      "/api/oauth/me/gpg-keys",
      { token },
    );
    return res.keys;
  }

  /**
   * Add an armored GPG public key. Requires `gpg:write`. `name` defaults
   * to the first UID on the imported key (or its short key id) when
   * omitted, and is truncated to 128 characters.
   */
  async addGPGKey(
    token: string,
    publicKey: string,
    name?: string,
  ): Promise<GPGKey> {
    return this.client.request<GPGKey>("POST", "/api/oauth/me/gpg-keys", {
      token,
      body: { public_key: publicKey, name },
    });
  }

  /** Remove a GPG key by its row id. Requires `gpg:write`. */
  async removeGPGKey(token: string, keyId: string): Promise<void> {
    await this.client.request("DELETE", `/api/oauth/me/gpg-keys/${keyId}`, {
      token,
    });
  }
}
