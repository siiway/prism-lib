import { generatePKCEChallenge } from "../pkce.js";
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
 * Flow (server-initiated, phishing-resistant):
 *   1. `createChallenge()` — your server calls Prism over HTTPS to register
 *      the action and pin the redirect URI. Prism returns an opaque
 *      `challenge_id` and the URL to redirect the user to. The URL contains
 *      no action text or redirect URI: a phisher who only controls a URL
 *      cannot trick the user into confirming an arbitrary action.
 *   2. User completes 2FA on Prism, gets redirected to the pinned redirect
 *      URI with `?code=...&state=...` (or `?error=access_denied`).
 *   3. `verifyCode()` — exchange the code (server-side) for the verification
 *      result `{ user_id, verified_at, action, nonce, method }`.
 *
 * The challenge is single-use, expires after 15 min; the resulting code is
 * also single-use and expires 5 min after the user confirms.
 */
export class TwoFactorAPI {
  constructor(private readonly client: PrismClient) {}

  /**
   * Create a server-initiated 2FA challenge and build the URL the user should
   * be redirected to. Calls Prism's `POST /api/oauth/2fa/challenges` with
   * the app's credentials, so the action text and redirect URI are pinned
   * server-side and cannot be tampered with by anyone who only controls a URL.
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
    // Always generate PKCE — the worker requires it for public clients,
    // and it costs nothing to use for confidential clients too.
    const pkce = await generatePKCEChallenge();
    const state = options?.state ?? pkce.state;
    const redirectUri = options?.redirectUri ?? this.client.redirectUri;

    const body: Record<string, string> = {
      client_id: this.client.clientId,
      redirect_uri: redirectUri,
      code_challenge: pkce.codeChallenge,
      code_challenge_method: "S256",
    };
    if (options?.action) body.action = options.action;
    if (options?.nonce) body.nonce = options.nonce;

    const clientSecret = (this.client as unknown as ClientWithSecret)
      .clientSecret;
    if (clientSecret) body.client_secret = clientSecret;

    const res = await this.client.request<{
      challenge_id: string;
      expires_at: number;
      url: string;
    }>("POST", "/api/oauth/2fa/challenges", { body });

    // The server returns a fully-formed URL, but we tack on `state` here
    // since the server doesn't store it (the user might want a different
    // state per-redirect). Use the server's URL as the base so we honor
    // any redirect normalization it does.
    const url = new URL(res.url);
    url.searchParams.set("state", state);

    return {
      url: url.toString(),
      challengeId: res.challenge_id,
      codeVerifier: pkce.codeVerifier,
      state,
      redirectUri,
      expiresAt: res.expires_at,
    };
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
