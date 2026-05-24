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
  email?: string;
  display_name?: string | null;
  /** Reverse-proxied avatar URL — safe to load directly. */
  avatar_url?: string | null;
  /** Original avatar URL before reverse-proxy rewriting. */
  unproxied_avatar_url?: string | null;
  role: string;
  email_verified?: boolean;
  /** Whether the account is enabled. Only returned by admin endpoints. */
  is_active?: boolean;
  /** Distinguishes real users from synthetic team-mirror users used for
   *  team-owned OAuth apps. Defaults to `"user"` when omitted. */
  kind?: "user" | "team";
  /** Unix seconds. */
  created_at: number;
  /** Unix seconds. Only returned on detail/update endpoints. */
  updated_at?: number;
}

/** Shape returned by `GET /api/oauth/me/profile` — fields beyond
 *  `id` / `username` / `role` are gated by the token's scopes (e.g.
 *  `email` only appears when the token was granted the `email` scope). */
export interface OAuthProfile {
  id: string;
  username: string;
  display_name: string | null;
  /** Reverse-proxied — safe to load directly. */
  avatar_url: string | null;
  unproxied_avatar_url: string | null;
  /** Only present when the token has the `email` scope. */
  email?: string;
  /** Only present when the token has the `email` scope. */
  email_verified?: boolean;
  role: string;
  /** Unix seconds. */
  created_at: number;
}

/** Standard OIDC `userinfo` claims. The exact field set depends on the
 *  scopes the token was issued with (`openid`, `profile`, `email`). */
export interface UserInfo {
  sub: string;
  name?: string;
  preferred_username?: string;
  email?: string;
  email_verified?: boolean;
  /** Proxied picture URL — safe to load directly. */
  picture?: string;
  /** Unix seconds. */
  updated_at?: number;
}

// ── Public Profile (unauthenticated) ──

/**
 * Metadata for a single GPG key surfaced on a user's public profile. The
 * armored key block itself is at the long-standing `/users/:username.gpg`
 * endpoint — this type intentionally only carries identifying fields.
 */
export interface PublicProfileGpgKey {
  fingerprint: string;
  key_id: string;
  name: string;
  /** Unix seconds */
  created_at: number;
}

/** Brief listing of an OAuth app referenced from a public profile. */
export interface PublicProfileApp {
  client_id: string;
  name: string;
  /** Reverse-proxied through the Prism instance — safe to load directly. */
  icon_url: string | null;
  website_url: string | null;
}

/** A user-owned OAuth app surfaced on a public profile. */
export interface PublicProfileOwnedApp extends PublicProfileApp {
  id: string;
  description: string;
  /** Unix seconds */
  created_at: number;
}

/** An app the user has authorized via OAuth, surfaced on a public profile. */
export interface PublicProfileAuthorizedApp extends PublicProfileApp {
  /** When the user last granted consent. Unix seconds. */
  granted_at: number;
}

/**
 * The public face of a user — every field beyond `username` is `null` if the
 * user opted not to share it, the site default keeps it hidden, or the
 * feature is disabled site-wide. A response is only returned at all when
 * the user has explicitly opted in (or you're authenticated as them).
 */
export interface PublicUserProfile {
  username: string;
  display_name: string | null;
  /** Reverse-proxied avatar URL — safe to load directly. */
  avatar_url: string | null;
  /** Original avatar URL before proxy rewriting. */
  unproxied_avatar_url: string | null;
  email: string | null;
  /** Account creation time, Unix seconds. */
  joined_at: number | null;
  gpg_keys: PublicProfileGpgKey[] | null;
  authorized_apps: PublicProfileAuthorizedApp[] | null;
  owned_apps: PublicProfileOwnedApp[] | null;
  /** User-owned, verified domains. */
  domains: PublicProfileDomain[] | null;
  /** Public teams the user is a member of. Honors both the user's own
   *  master toggle and any per-team override. `null` when the master toggle
   *  is off and no per-team override pins anything. */
  joined_teams: PublicProfileJoinedTeam[] | null;
  /**
   * Raw markdown source of the user's profile README. The Prism public
   * profile UI sanitizes this and rewrites image references through the
   * site's image proxy before rendering — third-party consumers MUST do
   * the equivalent (`marked` + `DOMPurify` or similar) before injecting it
   * into a page. `null` when the user has no README, has hidden it, or
   * the source is GitHub and the cached fetch failed with no fallback.
   */
  readme: string | null;
  /** Unix seconds. For `readme_source === "manual"` this is the user's last
   *  edit time; for `"github"` this only changes when the user edits source
   *  metadata (sync time is internal to the cache). */
  readme_updated_at: number | null;
  /** Whether the README was authored in Prism (`"manual"`) or fetched from
   *  the user's GitHub `<login>/<login>` repo (`"github"`). `null` when
   *  the README is hidden. */
  readme_source: "manual" | "github" | null;
}

/** A team the user is a member of, surfaced on their public profile.
 *  Only public teams appear here. */
export interface PublicProfileJoinedTeam {
  id: string;
  name: string;
  /** Reverse-proxied avatar URL — safe to load directly. */
  avatar_url: string | null;
  role: "owner" | "co-owner" | "admin" | "member";
}

/** A verified domain attached to either a user or a team's public profile. */
export interface PublicProfileDomain {
  domain: string;
  /** Unix seconds; `null` if the domain was created without verification
   *  recorded (legacy data — modern domains always have this). */
  verified_at: number | null;
}

/**
 * Owner reference exposed on a public team profile. When the team owner has
 * opted to surface themselves but their own user profile is private, only
 * `display_name` is set — `username` and `avatar_url` are `null` so the
 * team page doesn't link out to a profile they haven't opted into.
 */
export interface PublicTeamOwner {
  username: string | null;
  display_name: string;
  avatar_url: string | null;
}

/** A team-owned OAuth app surfaced on a public team profile. */
export interface PublicTeamApp {
  id: string;
  client_id: string;
  name: string;
  description: string;
  icon_url: string | null;
  website_url: string | null;
  created_at: number;
}

/**
 * The public face of a team. Same null-when-hidden semantics as
 * {@link PublicUserProfile}: any section the team chose not to share
 * (or that the site default keeps hidden) is `null`.
 */
export interface PublicTeamProfile {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  unproxied_avatar_url: string | null;
  /** Unix seconds. */
  created_at: number;
  owner: PublicTeamOwner | null;
  /** Total team member count, or `null` if the team chose not to expose it. */
  member_count: number | null;
  apps: PublicTeamApp[] | null;
  domains: PublicProfileDomain[] | null;
  /** Members of the team. Each entry is also gated by that user's own
   *  `profile_show_joined_teams` (and any per-team override) — a member
   *  who hides this team from their profile is also omitted here. */
  members: PublicTeamMember[] | null;
}

/** A team member surfaced on a public team profile. Only members whose
 *  own profile is public AND who haven't hidden this team appear here. */
export interface PublicTeamMember {
  username: string;
  display_name: string;
  avatar_url: string | null;
  role: "owner" | "co-owner" | "admin" | "member";
}

// ── OAuth Apps ──

export interface OAuthApp {
  id: string;
  name: string;
  description?: string;
  client_id: string;
  /** Only returned on create / rotate-secret responses. */
  client_secret?: string;
  /** Reverse-proxied icon URL — safe to load directly. May be null. */
  icon_url?: string | null;
  /** Original icon URL before proxy rewriting. */
  unproxied_icon_url?: string | null;
  website_url?: string | null;
  redirect_uris: string[];
  allowed_scopes: string[];
  optional_scopes?: string[];
  oidc_fields?: string[];
  /** True for public clients (no client secret stored). Some listing
   *  endpoints return this as the raw numeric column (0/1) — treat as
   *  truthy if you encounter that. */
  is_public: boolean;
  is_active?: boolean;
  is_verified?: boolean;
  is_official?: boolean;
  is_first_party?: boolean;
  /** Issue JWT access tokens instead of opaque DB-backed tokens. */
  use_jwt_tokens?: boolean;
  /** If true, the app may authenticate with its own client credentials
   *  (HTTP Basic) to manage its scope definitions, without a user token. */
  allow_self_manage_exported_permissions?: boolean;
  /**
   * Unified ownership reference. After the teams-as-users migration, an
   * app owned by a team has `owner_id === team_id` and the underlying row
   * is a synthetic `kind='team'` user mirroring the team. For personal
   * apps `owner_id` is the creator's user id and `team_id` is null.
   */
  owner_id?: string;
  /** Non-null when the app is owned by a team. Equals the team's id. */
  team_id?: string | null;
  /** Convenience fields surfaced by some listing endpoints. */
  owner_username?: string | null;
  team_name?: string | null;
  team_avatar_url?: string | null;
  /** Unix seconds. */
  created_at: number;
  /** Unix seconds. */
  updated_at?: number;
}

export interface CreateAppParams {
  name: string;
  description?: string;
  icon_url?: string;
  website_url?: string;
  redirect_uris: string[];
  allowed_scopes?: string[];
  optional_scopes?: string[];
  oidc_fields?: string[];
  is_public?: boolean;
  use_jwt_tokens?: boolean;
  allow_self_manage_exported_permissions?: boolean;
}

export interface UpdateAppParams {
  name?: string;
  description?: string;
  icon_url?: string | null;
  website_url?: string | null;
  redirect_uris?: string[];
  allowed_scopes?: string[];
  optional_scopes?: string[];
  oidc_fields?: string[];
  is_public?: boolean;
  use_jwt_tokens?: boolean;
  /** Opt-in: allow the app to register/manage its scope definitions using
   *  HTTP Basic auth with its client credentials. */
  allow_self_manage_exported_permissions?: boolean;
}

// ── Teams ──

export interface Team {
  id: string;
  name: string;
  description?: string;
  /** Reverse-proxied avatar URL — safe to load directly. */
  avatar_url?: string | null;
  /** Original avatar URL before reverse-proxy rewriting. */
  unproxied_avatar_url?: string | null;
  /** User's role in this team (from list endpoints) */
  role?: string;
  /** User's role in this team (from detail endpoint) */
  my_role?: string;
  /** When the user joined this team (from OAuth list) */
  joined_at?: number;
  /** Whether the caller has chosen to surface this team on their own
   *  public profile. `null` means "follow the master toggle"; only
   *  surfaced on session-API listings of the caller's memberships. */
  show_on_profile?: boolean | null;
  /** Whether the team has opted into a public profile at all. */
  profile_is_public?: boolean;
  /** Per-section overrides — `null` means "follow the site default". */
  profile_show_description?: boolean | null;
  profile_show_avatar?: boolean | null;
  profile_show_owner?: boolean | null;
  profile_show_member_count?: boolean | null;
  profile_show_apps?: boolean | null;
  profile_show_domains?: boolean | null;
  profile_show_members?: boolean | null;
  /** Unix seconds. */
  created_at: number;
  /** Unix seconds. */
  updated_at?: number;
}

export interface TeamMember {
  user_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string | null;
  unproxied_avatar_url?: string | null;
  role: "owner" | "co-owner" | "admin" | "member";
  /** Whether this member opted to surface the team on their own profile.
   *  `null` means "follow the user's master toggle". */
  show_on_profile?: boolean | null;
  /** Unix seconds. */
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
  avatar_url?: string | null;
  /** Master toggle for the team's public profile. */
  profile_is_public?: boolean;
  /** Per-section overrides — `null` resets to the site default. */
  profile_show_description?: boolean | null;
  profile_show_avatar?: boolean | null;
  profile_show_owner?: boolean | null;
  profile_show_member_count?: boolean | null;
  profile_show_apps?: boolean | null;
  profile_show_domains?: boolean | null;
  profile_show_members?: boolean | null;
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

/**
 * A team-owned OAuth app surfaced via the `/me/team-apps` endpoint. Returned
 * for any team the bearer is a member of, but only owners and co-owners may
 * actually mutate the app via PATCH/DELETE — non-owners get a 403 even
 * though the app appears in the listing.
 */
export interface TeamOwnedApp {
  id: string;
  name: string;
  description: string | null;
  client_id: string;
  icon_url: string | null;
  unproxied_icon_url: string | null;
  website_url: string | null;
  is_public: boolean;
  is_active: boolean;
  team_id: string;
  team_name: string;
  /** Reverse-proxied team avatar — safe to load directly. */
  team_avatar_url: string | null;
  unproxied_team_avatar_url: string | null;
  /** Caller's role inside the owning team. */
  my_role: "owner" | "co-owner" | "admin" | "member";
  /** True when the caller can grant scopes / mutate the app
   *  (i.e. role is owner or co-owner). */
  can_grant: boolean;
  created_at: number;
  updated_at: number;
}

// ── Domains ──

/**
 * Shape returned by `GET /api/oauth/me/domains` — only the four fields below
 * are exposed under the OAuth resource API. The full row (with id,
 * verification_token, ownership) is only available via the session API.
 */
export interface OAuthDomain {
  domain: string;
  /** Unix seconds, or `null` for unverified domains. */
  verified_at: number | null;
  /** Unix seconds at which the next periodic re-verification is scheduled. */
  next_reverify_at: number | null;
  /** Unix seconds. */
  created_at: number;
}

/**
 * Shape returned by the session API (`/api/domains`, `/api/teams/:id/domains`)
 * and team-domain helpers. Includes ownership and the verification token used
 * to publish DNS/HTTP/HTML challenges.
 */
export interface Domain {
  id: string;
  domain: string;
  /** Server stores this as 0/1; clients should compare with `=== 1` or
   *  rely on truthiness. */
  verified: boolean | number;
  verification_token: string;
  /** Unix seconds, or `null` for unverified domains. */
  verified_at: number | null;
  /** Unix seconds at which the next periodic re-verification is scheduled. */
  next_reverify_at?: number | null;
  /** Which method ultimately satisfied verification, if any. */
  verification_method?: "dns-txt" | "http-file" | "html-meta" | null;
  /** Unix seconds. */
  created_at: number;
}

// ── Webhooks ──

/**
 * A user-scoped webhook registered via the OAuth resource API
 * (`/api/oauth/me/webhooks`) or the session API (`/api/user/webhooks`).
 * The `is_active` flag is delivered as the raw 0/1 column on list responses;
 * the SDK passes it through unchanged.
 */
export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  /** Server stores this as 0/1; compare with `=== 1` or rely on truthiness. */
  is_active: boolean | number;
  /** Only returned on creation. */
  secret?: string;
  /** Unix seconds. */
  created_at: number;
  /** Unix seconds. Only returned on list/get. */
  updated_at?: number;
}

export interface WebhookDelivery {
  id: string;
  webhook_id?: string;
  event_type: string;
  response_status: number | null;
  /** Server stores this as 0/1; truthiness check is fine. */
  success: boolean | number;
  /** Unix seconds. */
  delivered_at: number;
}

export interface CreateWebhookParams {
  name: string;
  url: string;
  events: string[];
  /** Auto-generated when omitted. */
  secret?: string;
}

export interface UpdateWebhookParams {
  name?: string;
  url?: string;
  events?: string[];
  is_active?: boolean;
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
  /** Decoded provider profile data — opaque per-provider JSON. */
  profile?: unknown;
  /** Unix seconds. */
  connected_at: number;
}

// ── GPG Keys ──

export interface GPGKey {
  id: string;
  key_id: string;
  fingerprint: string;
  /** User-supplied label (defaults to the first UID on the imported key). */
  name: string;
  /** Unix seconds. */
  created_at: number;
  /** Unix seconds, or `null` if never used to sign a challenge. */
  last_used_at?: number | null;
}

// ── Personal Access Tokens ──

export interface PersonalAccessToken {
  id: string;
  name: string;
  scopes: string[];
  /** Unix seconds, or `null` if never used. */
  last_used_at?: number | null;
  /** Unix seconds, or `null` for non-expiring tokens. */
  expires_at?: number | null;
  /** Unix seconds. */
  created_at: number;
  /** The full token string. Only returned on creation — never re-fetched. */
  token?: string;
}

export interface CreatePATParams {
  name: string;
  scopes: string[];
  /** Days until expiry. Omit for a non-expiring token. */
  expires_in_days?: number;
}

// ── Admin ──

/**
 * A user record returned by the admin/site listing endpoints. The
 * `totp_enabled` / `passkey_count` fields only appear on `GET /api/user/me`
 * (session API) — listings don't carry them.
 */
export interface AdminUser extends User {
  app_count?: number;
}

/**
 * Generic paginated envelope returned by listing endpoints.
 * The resource array is keyed by name (e.g. `users`, `apps`) rather
 * than a generic `data` field.
 */
export interface PaginatedResponse<T> {
  /** Resource items for this page. */
  items: T[];
  total: number;
  page: number;
  limit: number;
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

/**
 * Subset of site config that the unauthenticated `/api/site` endpoint
 * surfaces. Useful for branding the consent screen, deciding whether to
 * show the "Register" affordance, choosing a captcha widget, etc.
 */
export interface PublicSiteInfo {
  site_name: string;
  site_description: string;
  /** Reverse-proxied — safe to load directly. */
  site_icon_url: string | null;
  unproxied_site_icon_url: string | null;
  allow_registration: boolean;
  invite_only: boolean;
  captcha_provider: string;
  captcha_site_key: string;
  pow_difficulty: number;
  require_email_verification: boolean;
  email_verify_methods: "link" | "send" | "both";
  accent_color: string;
  custom_css: string;
  initialized: boolean;
  r2_enabled: boolean;
  tg_notify_source_slug: string;
  enable_public_profiles: boolean;
  default_profile_show_display_name: boolean;
  default_profile_show_avatar: boolean;
  default_profile_show_email: boolean;
  default_profile_show_joined_at: boolean;
  default_profile_show_gpg_keys: boolean;
  default_profile_show_authorized_apps: boolean;
  default_profile_show_owned_apps: boolean;
  default_profile_show_domains: boolean;
  default_profile_show_joined_teams: boolean;
  default_profile_show_readme: boolean;
  profile_readme_max_bytes: number;
  github_readme_has_site_token: boolean;
  github_readme_cache_ttl_seconds: number;
  default_team_profile_show_description: boolean;
  default_team_profile_show_avatar: boolean;
  default_team_profile_show_owner: boolean;
  default_team_profile_show_member_count: boolean;
  default_team_profile_show_apps: boolean;
  default_team_profile_show_domains: boolean;
  default_team_profile_show_members: boolean;
  enabled_providers: Array<{
    slug: string;
    name: string;
    provider: string;
    icon_url?: string | null;
  }>;
}

// ── Consent ──

/**
 * A consent record returned by `GET /api/oauth/consents`. The list is
 * grouped by app: each entry carries the app's metadata plus the active
 * tokens issued under that consent. Revoking a consent (or any of its
 * tokens individually) is done via the OAuth client methods on
 * {@link PrismClient}.
 */
export interface OAuthConsent {
  client_id: string;
  scopes: string[];
  /** Unix seconds when consent was first granted. */
  granted_at: number;
  app: {
    name: string;
    description: string;
    /** Reverse-proxied — safe to load directly. */
    icon_url: string | null;
    unproxied_icon_url: string | null;
    website_url: string | null;
    is_verified: boolean;
  };
  tokens: Array<{
    /** Opaque token id used by `revokeConsentToken`. */
    id: string;
    scopes: string[];
    /** Unix seconds. */
    created_at: number;
    /** Unix seconds. */
    expires_at: number;
    /** True when the access token has a refresh token attached
     *  (i.e. the user granted `offline_access`). */
    is_persistent: boolean;
  }>;
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
  /** Force the user-facing 2FA page to require a captcha solve before
   *  approving, even if the site's `require_captcha_for_2fa` setting is off.
   *  Site admins control which provider is used. Cannot disable an enforced
   *  site-wide captcha — only require one when the site default is off. */
  requireCaptcha?: boolean;
}

export interface Create2FAChallenge {
  /** URL to redirect the user to. Carries only `challenge_id` and `state` — the
   *  action text and redirect URI are pinned server-side and not in the URL. */
  url: string;
  /** Opaque challenge ID Prism issued — primarily diagnostic; you usually
   *  only need `url`, `codeVerifier`, and `state`. */
  challengeId: string;
  /**
   * PKCE code verifier — store this server-side (e.g. in the user's session)
   * and pass it to `verifyCode()` when the user comes back.
   */
  codeVerifier: string;
  /** State value sent in the URL — verify on callback to defend against CSRF. */
  state: string;
  /** Effective redirect URI used (may be the client default or an override). */
  redirectUri: string;
  /** Unix seconds when the challenge expires (typically 15 min from creation). */
  expiresAt: number;
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
  /** Which factor satisfied the challenge. `"sudo"` means the user did not
   *  re-prompt for TOTP/passkey: a previous successful 2FA on the same session
   *  for this client was still inside its grace window. Apps performing very
   *  high-stakes operations should require `method !== "sudo"`. */
  method: "totp" | "passkey" | "backup" | "sudo";
}

// ── Device Code Flow (RFC 8628) ──

/** Response from the device authorization endpoint (`POST /api/oauth/device/code`). */
export interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete: string;
  expires_in: number;
  interval: number;
}

/** Options for requesting a device code. */
export interface DeviceCodeOptions {
  scopes?: string[];
  codeChallenge?: string;
  codeChallengeMethod?: string;
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
