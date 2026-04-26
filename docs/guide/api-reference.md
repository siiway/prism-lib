# API Reference

## PrismClient

### Constructor

```ts
new PrismClient(options: PrismClientOptions)
```

| Option | Type | Required | Description |
| --- | --- | --- | --- |
| `baseUrl` | `string` | Yes | Prism instance URL |
| `clientId` | `string` | Yes | OAuth client ID |
| `redirectUri` | `string` | Yes | Default redirect URI |
| `clientSecret` | `string` | No | Client secret (confidential clients) |
| `scopes` | `string[]` | No | Default scopes (`["openid","profile","email"]`) |
| `fetch` | `typeof fetch` | No | Custom fetch |

### OAuth Methods

| Method | Returns | Description |
| --- | --- | --- |
| `createAuthorizationUrl(options?)` | `Promise<{ url, pkce }>` | Generate auth URL with PKCE |
| `buildAuthorizationUrl(verifier, options?)` | `Promise<string>` | Auth URL with existing verifier |

Both methods accept `AuthorizationUrlOptions`:

| Option | Type | Description |
| --- | --- | --- |
| `scopes` | `string[]` | Override default scopes |
| `optionalScopes` | `string[]` | Scopes the user may decline (subset of `scopes`). Emitted as `optional_scope` query param. |
| `redirectUri` | `string` | Override default redirect URI |
| `state` | `string` | Custom state (auto-generated if omitted) |
| `nonce` | `string` | Nonce for OIDC ID token validation |
| `exchangeCode(code, verifier, redirectUri?)` | `Promise<TokenResponse>` | Exchange code for tokens |
| `refreshToken(refreshToken)` | `Promise<TokenResponse>` | Refresh access token |
| `introspectToken(token, hint?)` | `Promise<TokenIntrospectionResponse>` | Check token status |
| `revokeToken(token, hint?)` | `Promise<void>` | Revoke a token |
| `getUserInfo(accessToken)` | `Promise<UserInfo>` | Get OIDC userinfo |
| `discover()` | `Promise<OIDCDiscovery>` | Fetch OIDC configuration |
| `jwks()` | `Promise<unknown>` | Fetch JWKS |
| `listConsents(accessToken)` | `Promise<OAuthConsent[]>` | List granted app consents |
| `revokeConsent(accessToken, clientId)` | `Promise<void>` | Revoke app consent |

### Resource APIs

#### `prism.profile`

| Method | Scope | Description |
| --- | --- | --- |
| `get(token)` | `profile` | Get user profile |
| `update(token, data)` | `profile:write` | Update display_name, avatar_url |

#### `prism.apps`

| Method | Scope | Description |
| --- | --- | --- |
| `list(token)` | `apps:read` | List owned OAuth apps |
| `create(token, params)` | `apps:write` | Create new app |
| `update(token, id, params)` | `apps:write` | Update app |
| `delete(token, id)` | `apps:write` | Delete app |

`CreateAppParams` / `UpdateAppParams` accept an `optional_scopes?: string[]` field — a subset of `allowed_scopes`. Scopes listed here appear as optional checkboxes on the consent screen; users can decline them without blocking the authorization.

#### `prism.teams`

| Method | Scope | Description |
| --- | --- | --- |
| `list(token)` | `teams:read` | List teams |
| `create(token, params)` | `teams:create` | Create team |
| `update(token, id, params)` | `teams:write` | Update team |
| `delete(token, id)` | `teams:delete` | Delete team |
| `addMember(token, teamId, userId, role?)` | `teams:write` | Add member |
| `removeMember(token, teamId, userId)` | `teams:write` | Remove member |

#### `prism.domains`

| Method | Scope | Description |
| --- | --- | --- |
| `list(token)` | `domains:read` | List domains |
| `add(token, domain)` | `domains:write` | Add domain |
| `verify(token, domain)` | `domains:write` | Trigger DNS check |
| `delete(token, domain)` | `domains:write` | Remove domain |

#### `prism.webhooks`

| Method | Scope | Description |
| --- | --- | --- |
| `list(token)` | `webhooks:read` | List webhooks |
| `create(token, params)` | `webhooks:write` | Create webhook |
| `update(token, id, params)` | `webhooks:write` | Update webhook |
| `delete(token, id)` | `webhooks:write` | Delete webhook |
| `listDeliveries(token, id)` | `webhooks:read` | List deliveries |

#### `prism.social`

| Method | Scope | Description |
| --- | --- | --- |
| `listConnections(token)` | `social:read` | List social accounts |
| `disconnect(token, id)` | `social:write` | Unlink account |
| `listGPGKeys(token)` | `gpg:read` | List GPG keys |
| `addGPGKey(token, armoredKey)` | `gpg:write` | Add GPG key |
| `removeGPGKey(token, id)` | `gpg:write` | Remove GPG key |

#### `prism.admin`

| Method | Scope | Description |
| --- | --- | --- |
| `listUsers(token, options?)` | `admin:users:read` | List all users (paginated) |
| `getUser(token, id)` | `admin:users:read` | Get user |
| `updateUser(token, id, data)` | `admin:users:write` | Update user |
| `deleteUser(token, id)` | `admin:users:delete` | Delete user |
| `getConfig(token)` | `admin:config:read` | Read site config |
| `updateConfig(token, config)` | `admin:config:write` | Update site config |
| `listWebhooks(token)` | `admin:webhooks:read` | List admin webhooks |
| `createWebhook(token, params)` | `admin:webhooks:write` | Create admin webhook |
| `updateWebhook(token, id, params)` | `admin:webhooks:write` | Update admin webhook |
| `deleteWebhook(token, id)` | `admin:webhooks:delete` | Delete admin webhook |
| `testWebhook(token, id)` | `admin:webhooks:write` | Send test delivery |
| `listWebhookDeliveries(token, id)` | `admin:webhooks:read` | Delivery history |
| `createInvite(token, options?)` | `admin:invites:create` | Create site invite |
| `listInvites(token)` | `admin:invites:read` | List invites |
| `deleteInvite(token, id)` | `admin:invites:delete` | Revoke invite |

#### `prism.site`

Site-level scopes are silently omitted from the token when the authorizing user is not a site admin or has no 2FA method enrolled — the OAuth flow still completes with the remaining scopes. When the user is an admin with 2FA enrolled, the consent screen shows site scopes as optional checkboxes alongside a 2FA challenge and confirmation phrase.

| Method | Scope | Description |
| --- | --- | --- |
| `listUsers(token, options?)` | `site:user:read` | List all users on the site (paginated) |
| `getUser(token, id)` | `site:user:read` | Get any user by ID |

#### `prism.teamScope`

Team-scoped tokens are issued when an app requests `team:read`, `team:write`, `team:member:read`, `team:member:write`, `team:member:profile:read`, or `team:delete` and the user selects a specific team on the consent screen. The token carries bound scopes like `team:<teamId>:member:read`.

| Method | Scope | Description |
| --- | --- | --- |
| `getInfo(token, teamId)` | `team:<id>:read` | Read team name, description, avatar |
| `updateInfo(token, teamId, data)` | `team:<id>:write` | Update team name/description/avatar |
| `listMembers(token, teamId)` | `team:<id>:member:read` | List member IDs and roles |
| `getMemberProfile(token, teamId, userId)` | `team:<id>:member:profile:read` | Get member display name and avatar |
| `addMember(token, teamId, userId, role?)` | `team:<id>:member:write` | Add a user to the team |
| `updateMemberRole(token, teamId, userId, role)` | `team:<id>:member:write` | Change a member's role |
| `removeMember(token, teamId, userId)` | `team:<id>:member:write` | Remove a member |

#### `prism.twoFactor`

Step-up 2FA — ask Prism to have the user re-confirm with TOTP/passkey before your app performs a sensitive action. Mirrors the OAuth Authorization Code grant: redirect, callback, server-side exchange.

| Method | Description |
| --- | --- |
| `createChallenge(options?)` | Build a step-up URL + PKCE verifier + state. Redirect the user to `url`; store `codeVerifier` and `state` server-side. |
| `buildChallengeUrl(verifier, options?)` | Rebuild a step-up URL using a previously-generated PKCE verifier. |
| `parseCallback(url, expectedState?)` | Pull `code` and `state` from the redirect Prism sent the user to. Throws on `error=…` query params or state mismatch. |
| `verifyCode(code, codeVerifier?, redirectUri?)` | Server-side: exchange the single-use code for `{ user_id, verified_at, action, nonce, method }`. |

```ts
// 1. Redirect the user
const challenge = await prism.twoFactor.createChallenge({
  action: "Confirm wire transfer of $1,000",
  nonce: orderId,
});
session.codeVerifier = challenge.codeVerifier;
session.state = challenge.state;
res.redirect(challenge.url);

// 2. On callback (?code=…&state=…)
const { code } = prism.twoFactor.parseCallback(req.url, session.state);
const result = await prism.twoFactor.verifyCode(code, session.codeVerifier);
// result.user_id matches the user, result.action echoes back what they confirmed
```

### Static Helpers

```ts
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  generatePKCEChallenge,
} from "@siiway/prism";
```

| Function | Returns | Description |
| --- | --- | --- |
| `generateCodeVerifier(length?)` | `string` | Random PKCE code verifier |
| `generateCodeChallenge(verifier)` | `Promise<string>` | S256 code challenge |
| `generateState()` | `string` | Random state parameter |
| `generatePKCEChallenge()` | `Promise<PKCEChallenge>` | Full PKCE challenge object |

## Available Scopes

```
openid, profile, profile:write, email,
apps:read, apps:write,
teams:read, teams:write, teams:create, teams:delete,
domains:read, domains:write,
gpg:read, gpg:write,
social:read, social:write,
webhooks:read, webhooks:write,
admin:users:read, admin:users:write, admin:users:delete,
admin:config:read, admin:config:write,
admin:invites:read, admin:invites:create, admin:invites:delete,
admin:webhooks:read, admin:webhooks:write, admin:webhooks:delete,
site:user:read, site:user:write, site:user:delete,
site:team:read, site:team:write, site:team:delete,
site:config:read, site:config:write, site:token:revoke,
team:read, team:write, team:delete,
team:member:read, team:member:write, team:member:profile:read,
offline_access
```
