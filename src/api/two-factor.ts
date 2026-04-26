import {
  generateCodeChallenge,
  generateState,
  generatePKCEChallenge,
} from "../pkce.js";
import { PrismError } from "../types.js";
import type { PrismClient } from "../client.js";
import type {
  Create2FAChallengeOptions,
  Create2FAChallenge,
  Verify2FACodeResult,
} from "../types.js";

interface ClientWithSecret {
  clientSecret?: string;
}

/**
 * Step-up 2FA — ask Prism to have the user re-confirm with TOTP/passkey
 * before your app performs a sensitive action.
 *
 * Flow:
 *   1. `createChallenge()` — generates PKCE + state, returns the URL to redirect
 *      the user to and the secrets you need to keep on the server side.
 *   2. User completes 2FA on Prism, gets redirected back to your `redirectUri`
 *      with `?code=...&state=...` (or `?error=access_denied`).
 *   3. `verifyCode()` — exchange the code (server-side) for the verification
 *      result `{ user_id, verified_at, action, ... }`.
 *
 * The code is single-use and expires after ~5 minutes.
 */
export class TwoFactorAPI {
  constructor(private readonly client: PrismClient) {}

  /**
   * Build a step-up 2FA URL plus the per-request secrets to store server-side
   * (PKCE verifier and `state`) until the user comes back.
   *
   * @example
   * ```ts
   * const challenge = await prism.twoFactor.createChallenge({
   *   action: "Confirm wire transfer of $1,000",
   *   nonce: orderId,
   * });
   * // Save challenge.codeVerifier + challenge.state in the user's session,
   * // then redirect to challenge.url.
   * ```
   */
  async createChallenge(
    options?: Create2FAChallengeOptions,
  ): Promise<Create2FAChallenge> {
    const pkce = await generatePKCEChallenge();
    const state = options?.state ?? pkce.state;
    const redirectUri = options?.redirectUri ?? this.client.redirectUri;

    const params = new URLSearchParams({
      client_id: this.client.clientId,
      redirect_uri: redirectUri,
      state,
      code_challenge: pkce.codeChallenge,
      code_challenge_method: "S256",
    });
    if (options?.action) params.set("action", options.action);
    if (options?.nonce) params.set("nonce", options.nonce);

    const url = `${this.client.baseUrl}/api/oauth/2fa?${params.toString()}`;
    return {
      url,
      codeVerifier: pkce.codeVerifier,
      state,
      redirectUri,
    };
  }

  /**
   * Build a step-up 2FA URL using a pre-existing PKCE verifier. Useful when
   * you've already stored the verifier and want to rebuild the URL.
   */
  async buildChallengeUrl(
    codeVerifier: string,
    options?: Create2FAChallengeOptions,
  ): Promise<string> {
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = options?.state ?? generateState();
    const redirectUri = options?.redirectUri ?? this.client.redirectUri;

    const params = new URLSearchParams({
      client_id: this.client.clientId,
      redirect_uri: redirectUri,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });
    if (options?.action) params.set("action", options.action);
    if (options?.nonce) params.set("nonce", options.nonce);

    return `${this.client.baseUrl}/api/oauth/2fa?${params.toString()}`;
  }

  /**
   * Exchange a 2FA code (delivered to your `redirect_uri`) for the verification
   * result. Returns `{ user_id, verified_at, action, nonce, method, client_id }`.
   *
   * Single-use: a successful exchange invalidates the code. Throws `PrismError`
   * with `error: "invalid_grant"` if the code is missing/used/expired or PKCE
   * fails.
   *
   * @param code — the `code` query param Prism added to your redirect URL
   * @param codeVerifier — the PKCE verifier returned from `createChallenge()`
   * @param redirectUri — must match what you sent to `createChallenge()`
   *   (defaults to the client's configured `redirectUri`)
   */
  async verifyCode(
    code: string,
    codeVerifier?: string,
    redirectUri?: string,
  ): Promise<Verify2FACodeResult> {
    // The /2fa/verify endpoint accepts a JSON body and authenticates the
    // client via `client_secret` in the body OR HTTP Basic. We send the
    // secret in the body so public clients (no secret) just work.
    const body: Record<string, string> = {
      code,
      client_id: this.client.clientId,
      redirect_uri: redirectUri ?? this.client.redirectUri,
    };
    if (codeVerifier) body.code_verifier = codeVerifier;
    const clientSecret = (this.client as unknown as ClientWithSecret)
      .clientSecret;
    if (clientSecret) body.client_secret = clientSecret;

    return this.client.request<Verify2FACodeResult>(
      "POST",
      "/api/oauth/2fa/verify",
      { body },
    );
  }

  /**
   * Parse the `code` and `state` from a redirect URL Prism sent the user to.
   * Throws `PrismError` if the URL carries an `error` (e.g. `access_denied`)
   * or is missing the expected params.
   *
   * @param url — full callback URL (or just `?code=...&state=...`)
   * @param expectedState — the `state` you stored in the user's session;
   *   the function throws if it doesn't match (CSRF defense)
   */
  parseCallback(
    url: string | URL,
    expectedState?: string,
  ): { code: string; state: string } {
    const u = typeof url === "string" ? new URL(url, this.client.baseUrl) : url;
    const error = u.searchParams.get("error");
    if (error) {
      const desc = u.searchParams.get("error_description") ?? error;
      throw new PrismError(desc, 400, error);
    }
    const code = u.searchParams.get("code");
    const state = u.searchParams.get("state") ?? "";
    if (!code) {
      throw new PrismError("Callback missing code", 400, "invalid_request");
    }
    if (expectedState !== undefined && expectedState !== state) {
      throw new PrismError("State mismatch", 400, "invalid_state");
    }
    return { code, state };
  }
}
