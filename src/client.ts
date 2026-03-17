import {
  generatePKCEChallenge,
  generateCodeChallenge,
  generateCodeVerifier,
  generateState,
} from "./pkce.js";
import { ProfileAPI } from "./api/profile.js";
import { AppsAPI } from "./api/apps.js";
import { TeamsAPI } from "./api/teams.js";
import { DomainsAPI } from "./api/domains.js";
import { WebhooksAPI } from "./api/webhooks.js";
import { AdminAPI } from "./api/admin.js";
import { SocialAPI } from "./api/social.js";
import type {
  PrismClientOptions,
  AuthorizationUrlOptions,
  PKCEChallenge,
  TokenResponse,
  TokenIntrospectionResponse,
  OIDCDiscovery,
  UserInfo,
} from "./types.js";

export class PrismClient {
  readonly baseUrl: string;
  readonly clientId: string;
  private readonly clientSecret?: string;
  readonly redirectUri: string;
  readonly scopes: string[];
  private readonly _fetch: typeof globalThis.fetch;

  // Resource APIs (initialized lazily or on construction)
  readonly profile: ProfileAPI;
  readonly apps: AppsAPI;
  readonly teams: TeamsAPI;
  readonly domains: DomainsAPI;
  readonly webhooks: WebhooksAPI;
  readonly admin: AdminAPI;
  readonly social: SocialAPI;

  constructor(options: PrismClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.redirectUri = options.redirectUri;
    this.scopes = options.scopes ?? ["openid", "profile", "email"];
    this._fetch = options.fetch ?? globalThis.fetch.bind(globalThis);

    this.profile = new ProfileAPI(this);
    this.apps = new AppsAPI(this);
    this.teams = new TeamsAPI(this);
    this.domains = new DomainsAPI(this);
    this.webhooks = new WebhooksAPI(this);
    this.admin = new AdminAPI(this);
    this.social = new SocialAPI(this);
  }

  // ── OIDC Discovery ──

  /** Fetch the OpenID Connect discovery document */
  async discover(): Promise<OIDCDiscovery> {
    return this.request<OIDCDiscovery>(
      "GET",
      "/.well-known/openid-configuration",
    );
  }

  /** Fetch the JWKS (JSON Web Key Set) */
  async jwks(): Promise<unknown> {
    return this.request("GET", "/.well-known/jwks.json");
  }

  // ── Authorization ──

  /**
   * Generate PKCE challenge and build the authorization URL.
   * Returns both the URL and the PKCE challenge (store `codeVerifier` for token exchange).
   */
  async createAuthorizationUrl(
    options?: AuthorizationUrlOptions,
  ): Promise<{ url: string; pkce: PKCEChallenge }> {
    const pkce = await generatePKCEChallenge();
    const scopes = options?.scopes ?? this.scopes;
    const redirectUri = options?.redirectUri ?? this.redirectUri;

    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.clientId,
      redirect_uri: redirectUri,
      scope: scopes.join(" "),
      state: options?.state ?? pkce.state,
      code_challenge: pkce.codeChallenge,
      code_challenge_method: "S256",
    });

    if (options?.nonce) {
      params.set("nonce", options.nonce);
    }

    const url = `${this.baseUrl}/api/oauth/authorize?${params.toString()}`;
    return { url, pkce };
  }

  /**
   * Build an authorization URL with a pre-existing PKCE verifier.
   * Useful when you've already generated and stored the verifier.
   */
  async buildAuthorizationUrl(
    codeVerifier: string,
    options?: AuthorizationUrlOptions,
  ): Promise<string> {
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const scopes = options?.scopes ?? this.scopes;
    const redirectUri = options?.redirectUri ?? this.redirectUri;
    const state = options?.state ?? generateState();

    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.clientId,
      redirect_uri: redirectUri,
      scope: scopes.join(" "),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    if (options?.nonce) {
      params.set("nonce", options.nonce);
    }

    return `${this.baseUrl}/api/oauth/authorize?${params.toString()}`;
  }

  // ── Token Exchange ──

  /**
   * Exchange an authorization code for tokens.
   * @param code - The authorization code from the callback
   * @param codeVerifier - The PKCE code verifier used when creating the authorization URL
   * @param redirectUri - Override the default redirect URI
   */
  async exchangeCode(
    code: string,
    codeVerifier: string,
    redirectUri?: string,
  ): Promise<TokenResponse> {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri ?? this.redirectUri,
      client_id: this.clientId,
      code_verifier: codeVerifier,
    });

    if (this.clientSecret) {
      body.set("client_secret", this.clientSecret);
    }

    return this.requestForm<TokenResponse>("/api/oauth/token", body);
  }

  /**
   * Refresh an access token using a refresh token.
   * Requires `offline_access` scope to have been granted.
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: this.clientId,
    });

    if (this.clientSecret) {
      body.set("client_secret", this.clientSecret);
    }

    return this.requestForm<TokenResponse>("/api/oauth/token", body);
  }

  // ── Token Management ──

  /** Introspect a token to check if it's active and get metadata */
  async introspectToken(
    token: string,
    tokenTypeHint?: "access_token" | "refresh_token",
  ): Promise<TokenIntrospectionResponse> {
    const body = new URLSearchParams({ token });
    if (tokenTypeHint) body.set("token_type_hint", tokenTypeHint);
    if (this.clientSecret) {
      body.set("client_id", this.clientId);
      body.set("client_secret", this.clientSecret);
    }

    return this.requestForm<TokenIntrospectionResponse>(
      "/api/oauth/introspect",
      body,
    );
  }

  /** Revoke an access or refresh token */
  async revokeToken(
    token: string,
    tokenTypeHint?: "access_token" | "refresh_token",
  ): Promise<void> {
    const body = new URLSearchParams({ token });
    if (tokenTypeHint) body.set("token_type_hint", tokenTypeHint);
    if (this.clientSecret) {
      body.set("client_id", this.clientId);
      body.set("client_secret", this.clientSecret);
    }

    await this.requestForm("/api/oauth/revoke", body);
  }

  // ── UserInfo ──

  /** Fetch the authenticated user's info via the OIDC userinfo endpoint */
  async getUserInfo(accessToken: string): Promise<UserInfo> {
    return this.request<UserInfo>("GET", "/api/oauth/userinfo", {
      token: accessToken,
    });
  }

  // ── Consent Management ──

  /** List apps the user has granted OAuth access to */
  async listConsents(accessToken: string) {
    return this.request<
      Array<{
        client_id: string;
        app_name: string;
        scopes: string[];
        created_at: string;
      }>
    >("GET", "/api/oauth/consents", { token: accessToken });
  }

  /** Revoke OAuth consent for a specific app */
  async revokeConsent(accessToken: string, clientId: string): Promise<void> {
    await this.request("DELETE", `/api/oauth/consents/${clientId}`, {
      token: accessToken,
    });
  }

  // ── PKCE Helpers (static) ──

  static generateCodeVerifier = generateCodeVerifier;
  static generateCodeChallenge = generateCodeChallenge;
  static generateState = generateState;
  static generatePKCEChallenge = generatePKCEChallenge;

  // ── Internal HTTP helpers ──

  /** @internal Make a JSON API request */
  async request<T>(
    method: string,
    path: string,
    options?: {
      token?: string;
      body?: unknown;
      params?: Record<string, string>;
    },
  ): Promise<T> {
    const url = new URL(path, this.baseUrl);
    if (options?.params) {
      for (const [k, v] of Object.entries(options.params)) {
        url.searchParams.set(k, v);
      }
    }

    const headers: Record<string, string> = {};
    if (options?.token) {
      headers["Authorization"] = `Bearer ${options.token}`;
    }
    if (options?.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const response = await this._fetch(url.toString(), {
      method,
      headers,
      body:
        options?.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      let errorBody:
        | { error?: string; message?: string; code?: string }
        | undefined;
      try {
        errorBody = (await response.json()) as {
          error?: string;
          message?: string;
          code?: string;
        };
      } catch {
        // response body is not JSON
      }

      const { PrismError: PrismErrorClass } = await import("./types.js");
      throw new PrismErrorClass(
        errorBody?.message ?? errorBody?.error ?? response.statusText,
        response.status,
        errorBody?.code,
        errorBody,
      );
    }

    // Some endpoints return 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  /** @internal Make a form-encoded request */
  private async requestForm<T>(
    path: string,
    body: URLSearchParams,
  ): Promise<T> {
    const url = new URL(path, this.baseUrl);

    const response = await this._fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!response.ok) {
      let errorBody:
        | { error?: string; message?: string; code?: string }
        | undefined;
      try {
        errorBody = (await response.json()) as {
          error?: string;
          message?: string;
          code?: string;
        };
      } catch {
        // response body is not JSON
      }

      const { PrismError: PrismErrorClass } = await import("./types.js");
      throw new PrismErrorClass(
        errorBody?.message ?? errorBody?.error ?? response.statusText,
        response.status,
        errorBody?.code,
        errorBody,
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }
}
