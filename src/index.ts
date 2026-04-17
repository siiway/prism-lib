export { PrismClient } from "./client.js";
export { verifyToken } from "./jwt.js";
export type { VerifiedAccessToken, VerifyTokenOptions } from "./jwt.js";

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
  TeamDetail,
  TeamWithMembers,
  CreateTeamParams,
  UpdateTeamParams,
  TeamInvite,
  CreateTeamInviteParams,
  TeamInviteInfo,
  TeamDomain,
  TeamApp,
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
  AppEventType,
  AppWebhook,
  AppWebhookDelivery,
  CreateAppWebhookParams,
  UpdateAppWebhookParams,
  AppEvent,
  TokenGrantedData,
  TokenRevokedData,
  UserUpdatedData,
  AppScopeDefinition,
  AppScopeAccessRule,
  AppScopeAccessRuleType,
  CreateAppScopeDefinitionParams,
  UpdateAppScopeDefinitionParams,
  CreateAppScopeAccessRuleParams,
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
export { AppNotificationsAPI } from "./api/app-notifications.js";
export { AppScopePermissionsAPI } from "./api/app-scope-permissions.js";
export { SiteAPI } from "./api/site.js";
