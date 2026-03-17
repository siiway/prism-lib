export { PrismClient } from "./client.js";

// Types
export type {
  PrismClientOptions,
  AuthorizationUrlOptions,
  PKCEChallenge,
  TokenResponse,
  TokenIntrospectionResponse,
  OIDCDiscovery,
  User,
  UserInfo,
  OAuthApp,
  CreateAppParams,
  UpdateAppParams,
  Team,
  TeamMember,
  TeamWithMembers,
  CreateTeamParams,
  UpdateTeamParams,
  Domain,
  Webhook,
  WebhookDelivery,
  CreateWebhookParams,
  UpdateWebhookParams,
  SocialConnection,
  GPGKey,
  PersonalAccessToken,
  CreatePATParams,
  AdminUser,
  PaginatedResponse,
  SiteConfig,
  OAuthConsent,
} from "./types.js";

export { PrismError } from "./types.js";

// PKCE utilities
export {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  generatePKCEChallenge,
} from "./pkce.js";

// API modules (for advanced use)
export { ProfileAPI } from "./api/profile.js";
export { AppsAPI } from "./api/apps.js";
export { TeamsAPI } from "./api/teams.js";
export { DomainsAPI } from "./api/domains.js";
export { WebhooksAPI } from "./api/webhooks.js";
export { AdminAPI } from "./api/admin.js";
export { SocialAPI } from "./api/social.js";
