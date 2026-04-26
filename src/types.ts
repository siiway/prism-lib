// ── Configuration ──

export interface PrismClientOptions {
  /** Base URL of the Prism instance (e.g. "https://id.example.com") */
  baseUrl: string;
  /** OAuth client ID */
  clientId: string;
  /** OAuth client secret (only for confidential clients — server-side) */
  clientSecret?: string;
  /** Default redirect URI */
  redirectUri: string;
  /** Default scopes to request */
  scopes?: string[];
  /** Custom fetch implementation (defaults to global fetch) */
  fetch?: typeof globalThis.fetch;
}

// ── OAuth ──

export interface AuthorizationUrlOptions {
  /** Override default scopes */
  scopes?: string[];
  /**
   * Scopes from the request that the user may decline on the consent screen.
   * Must be a subset of `scopes`. Declined scopes are omitted from the token
   * but the authorization still succeeds.
   */
  optionalScopes?: string[];
  /** Override default redirect URI */
  redirectUri?: string;
  /** Custom state parameter (auto-generated if omitted) */
  state?: string;
  /** Nonce for OpenID Connect ID token validation */
  nonce?: string;
}

export interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
  state: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
}

export interface TokenIntrospectionResponse {
  active: boolean;
  scope?: string;
  client_id?: string;
  username?: string;
  token_type?: string;
  exp?: number;
  iat?: number;
  sub?: string;
  aud?: string;
  iss?: string;
}

export interface OIDCDiscovery {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  jwks_uri: string;
  introspection_endpoint?: string;
  revocation_endpoint?: string;
  scopes_supported?: string[];
  response_types_supported?: string[];
  grant_types_supported?: string[];
  subject_types_supported?: string[];
  id_token_signing_alg_values_supported?: string[];
  code_challenge_methods_supported?: string[];
}

// ── User / Profile ──

export interface User {
  id: string;
  username: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  /** Original avatar URL before reverse-proxy rewriting */
  unproxied_avatar_url?: string;
  role: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserInfo {
  sub: string;
  name?: string;
  preferred_username?: string;
  email?: string;
  email_verified?: boolean;
  /** Proxied picture URL */
  picture?: string;
  updated_at?: number;
}

// ── OAuth Apps ──

export interface OAuthApp {
  id: string;
  name: string;
  description?: string;
  client_id: string;
  client_secret?: string;
  website_url?: string;
  redirect_uris: string[];
  allowed_scopes: string[];
  optional_scopes: string[];
  oidc_fields?: string[];
  is_public: boolean;
  /** If true, the app may authenticate with its own client credentials
   *  (HTTP Basic) to manage its scope definitions, without a user token. */
  allow_self_manage_exported_permissions?: boolean;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAppParams {
  name: string;
  description?: string;
  website_url?: string;
  redirect_uris: string[];
  allowed_scopes: string[];
  optional_scopes?: string[];
  oidc_fields?: string[];
  is_public?: boolean;
}

export interface UpdateAppParams {
  name?: string;
  description?: string;
  website_url?: string;
  redirect_uris?: string[];
  allowed_scopes?: string[];
  optional_scopes?: string[];
  oidc_fields?: string[];
  is_public?: boolean;
  /** Opt-in: allow the app to register/manage its scope definitions using
   *  HTTP Basic auth with its client credentials. */
  allow_self_manage_exported_permissions?: boolean;
}

// ── Teams ──

export interface Team {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  /** Original avatar URL before reverse-proxy rewriting */
  unproxied_avatar_url?: string;
  /** User's role in this team (from list endpoints) */
  role?: string;
  /** User's role in this team (from detail endpoint) */
  my_role?: string;
  /** When the user joined this team (from OAuth list) */
  joined_at?: number;
  created_at: number;
  updated_at?: number;
}

export interface TeamMember {
  user_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  /** Original avatar URL before reverse-proxy rewriting */
  unproxied_avatar_url?: string;
  role: "owner" | "co-owner" | "admin" | "member";
  joined_at: number;
}

export interface TeamDetail extends Team {
  my_role: string;
}

export interface TeamWithMembers {
  team: TeamDetail;
  members: TeamMember[];
}

export interface CreateTeamParams {
  name: string;
  description?: string;
  avatar_url?: string;
}

export interface UpdateTeamParams {
  name?: string;
  description?: string;
  avatar_url?: string;
}

// ── Team Invites ──

export interface TeamInvite {
  token: string;
  team_id: string;
  role: string;
  created_by: string;
  creator_username?: string;
  email: string | null;
  max_uses: number;
  uses: number;
  expires_at: number;
  created_at: number;
}

export interface CreateTeamInviteParams {
  role?: "co-owner" | "admin" | "member";
  max_uses?: number;
  expires_in_hours?: number;
  email?: string;
}

export interface TeamInviteInfo {
  team: {
    id: string;
    name: string;
    avatar_url: string | null;
    unproxied_avatar_url?: string | null;
  };
  invite: { role: string; expires_at: number };
  user: unknown;
}

// ── Team Domains ──

export interface TeamDomain {
  id: string;
  domain: string;
  verified: boolean;
  verification_token: string;
  txt_record?: string;
  txt_value?: string;
  verified_by_parent?: string;
  created_at: number;
}

// ── Team Apps ──

export interface TeamApp extends OAuthApp {
  team_id: string;
  is_active: boolean;
  is_verified: boolean;
  is_official: boolean;
  is_first_party: boolean;
}

// ── Domains ──

export interface Domain {
  id: string;
  domain: string;
  verified: boolean;
  verification_token: string;
  owner_id: string;
  team_id?: string;
  created_at: string;
  verified_at?: string;
}

// ── Webhooks ──

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  secret?: string;
  created_at: string;
  updated_at: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event: string;
  status_code?: number;
  success: boolean;
  created_at: string;
}

export interface CreateWebhookParams {
  url: string;
  events: string[];
  secret?: string;
}

export interface UpdateWebhookParams {
  url?: string;
  events?: string[];
  active?: boolean;
  secret?: string;
}

// ── App notification channels ──

/** Event types emitted by Prism to OAuth app notification endpoints. */
export type AppEventType =
  | "user.token_granted"
  | "user.token_revoked"
  | "user.updated"
  | "*";

/** A webhook registered on an OAuth app (app-to-app notifications). */
export interface AppWebhook {
  id: string;
  app_id: string;
  url: string;
  /** Only returned on creation. */
  secret?: string;
  events: AppEventType[];
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

export interface AppWebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: string;
  response_status: number | null;
  success: boolean;
  delivered_at: number;
}

export interface CreateAppWebhookParams {
  url: string;
  events?: AppEventType[];
  /** Auto-generated if omitted. */
  secret?: string;
}

export interface UpdateAppWebhookParams {
  url?: string;
  events?: AppEventType[];
  secret?: string;
  is_active?: boolean;
}

/**
 * A single event message received over SSE or WebSocket.
 * The `data` field matches the payload of the corresponding Prism event.
 */
export interface AppEvent<T = unknown> {
  event: AppEventType;
  timestamp: number;
  data: T;
}

/** Data payload for `user.token_granted`. */
export interface TokenGrantedData {
  user_id: string;
  scopes: string[];
  granted_at: number;
}

/** Data payload for `user.token_revoked`. */
export interface TokenRevokedData {
  user_id: string;
}

/** Data payload for `user.updated`. */
export interface UserUpdatedData {
  user_id: string;
  username?: string;
  display_name?: string;
}

// ── App Scope Definitions ──

/**
 * Metadata for a custom permission scope exposed by an OAuth app.
 * Title and description appear on the consent screen.
 */
export interface AppScopeDefinition {
  id: string;
  app_id: string;
  /** Inner scope identifier, e.g. `"read_posts"` */
  scope: string;
  title: string;
  description: string;
  created_at: number;
  updated_at: number;
}

export interface CreateAppScopeDefinitionParams {
  scope: string;
  title: string;
  description?: string;
}

export interface UpdateAppScopeDefinitionParams {
  title?: string;
  description?: string;
}

// ── App Scope Access Rules ──

export type AppScopeAccessRuleType =
  | "owner_allow"
  | "owner_deny"
  | "app_allow"
  | "app_deny";

/**
 * An access-control rule governing who may register or request
 * this app's cross-app permission scopes.
 *
 * - `owner_allow` / `owner_deny` — controls which user **owners** may add
 *   `app:<client_id>:<scope>` to their app's `allowed_scopes`.
 * - `app_allow` / `app_deny` — controls which **client apps** may request
 *   those scopes during the OAuth authorization flow.
 *
 * If any `*_allow` rule exists the list becomes an allowlist;
 * `*_deny` rules are always enforced regardless.
 */
export interface AppScopeAccessRule {
  id: string;
  app_id: string;
  rule_type: AppScopeAccessRuleType;
  /** `client_id` for `app_*` rules; `user_id` for `owner_*` rules */
  target_id: string;
  created_at: number;
}

export interface CreateAppScopeAccessRuleParams {
  rule_type: AppScopeAccessRuleType;
  target_id: string;
}

// ── Social Connections ──

export interface SocialConnection {
  id: string;
  provider: string;
  provider_user_id: string;
  provider_username?: string;
  created_at: string;
}

// ── GPG Keys ──

export interface GPGKey {
  id: string;
  key_id: string;
  fingerprint: string;
  email?: string;
  created_at: string;
}

// ── Personal Access Tokens ──

export interface PersonalAccessToken {
  id: string;
  name: string;
  scopes: string[];
  last_used_at?: string;
  expires_at?: string;
  created_at: string;
  /** Only present in the creation response */
  token?: string;
}

export interface CreatePATParams {
  name: string;
  scopes: string[];
  expires_at?: string;
}

// ── Admin ──

export interface AdminUser extends User {
  totp_enabled?: boolean;
  passkey_count?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
}

export interface TeamScopeTeam {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  unproxied_avatar_url?: string;
  created_at: number;
}

export interface TeamScopeMember {
  user_id: string;
  role: string;
  joined_at: number;
}

export interface TeamScopeMemberProfile extends TeamScopeMember {
  username: string;
  display_name?: string;
  avatar_url?: string;
  unproxied_avatar_url?: string;
}

export interface SiteConfig {
  [key: string]: unknown;
}

// ── Consent ──

export interface OAuthConsent {
  client_id: string;
  app_name: string;
  scopes: string[];
  created_at: string;
}

// ── Step-up 2FA ──

export interface Create2FAChallengeOptions {
  /** Override the client's default redirect URI for this challenge. */
  redirectUri?: string;
  /**
   * Human-readable description of the action the user is being asked to
   * confirm (e.g. "Confirm wire transfer of $1,000"). Shown verbatim on the
   * Prism confirmation page and echoed back in the verify response.
   */
  action?: string;
  /**
   * Opaque app-defined value, returned as-is in the verify response. Use it
   * to bind the 2FA result to a specific operation (e.g. an order ID).
   */
  nonce?: string;
  /** Custom state parameter (auto-generated if omitted). */
  state?: string;
}

export interface Create2FAChallenge {
  /** URL to redirect the user to. */
  url: string;
  /**
   * PKCE code verifier — store this server-side (e.g. in the user's session)
   * and pass it to `verifyCode()` when the user comes back.
   */
  codeVerifier: string;
  /** State value sent in the URL — verify on callback to defend against CSRF. */
  state: string;
  /** Effective redirect URI used (may be the client default or an override). */
  redirectUri: string;
}

export interface Verify2FACodeResult {
  /** Prism user ID who completed the 2FA. */
  user_id: string;
  /** Echo of the OAuth client_id that requested the challenge. */
  client_id: string;
  /** Unix seconds when the 2FA was completed. */
  verified_at: number;
  /** Echo of the `action` you passed to `createChallenge()` (or null). */
  action: string | null;
  /** Echo of the `nonce` you passed to `createChallenge()` (or null). */
  nonce: string | null;
  /** Which factor satisfied the challenge. */
  method: "totp" | "passkey" | "backup";
}

// ── Errors ──

export class PrismError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "PrismError";
  }
}
