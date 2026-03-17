import type { PrismClient } from "../client.js";
import type { SocialConnection, GPGKey } from "../types.js";

/** Social connections and GPG keys via resource API */
export class SocialAPI {
  constructor(private readonly client: PrismClient) {}

  // ── Social Connections ──

  /** List linked social accounts */
  async listConnections(token: string): Promise<SocialConnection[]> {
    return this.client.request<SocialConnection[]>(
      "GET",
      "/api/oauth/me/social-connections",
      { token },
    );
  }

  /** Unlink a social account */
  async disconnect(token: string, connectionId: string): Promise<void> {
    await this.client.request(
      "DELETE",
      `/api/oauth/me/social-connections/${connectionId}`,
      { token },
    );
  }

  // ── GPG Keys ──

  /** List GPG keys */
  async listGPGKeys(token: string): Promise<GPGKey[]> {
    return this.client.request<GPGKey[]>("GET", "/api/oauth/me/gpg-keys", {
      token,
    });
  }

  /** Add a GPG public key */
  async addGPGKey(token: string, armoredKey: string): Promise<GPGKey> {
    return this.client.request<GPGKey>("POST", "/api/oauth/me/gpg-keys", {
      token,
      body: { armored_key: armoredKey },
    });
  }

  /** Remove a GPG key */
  async removeGPGKey(token: string, keyId: string): Promise<void> {
    await this.client.request("DELETE", `/api/oauth/me/gpg-keys/${keyId}`, {
      token,
    });
  }
}
