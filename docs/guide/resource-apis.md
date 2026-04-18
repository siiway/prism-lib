# Resource APIs

All resource APIs require a valid access token with the appropriate scopes.

## Optional Scopes

Apps can mark certain scopes as optional at authorization time. The user sees them as toggleable checkboxes on the consent screen and may decline them — the token is still issued, just without those scopes.

Optional scopes can be declared two ways:

**Per-request** (recommended): pass `optionalScopes` when building the authorization URL.

```ts
const { url, pkce } = await prism.createAuthorizationUrl({
  scopes: ["openid", "profile", "team:read"],
  optionalScopes: ["team:read"],   // user can decline this
});
```

**Per-app default**: set `optional_scopes` on the app itself (via `prism.apps.update`). These apply to every authorization request from that app unless overridden per-request.

```ts
await prism.apps.update(accessToken, appId, {
  allowed_scopes: ["openid", "profile", "team:read"],
  optional_scopes: ["team:read"],
});
```

Per-request and per-app optional scopes are merged — a scope is optional if it appears in either list.

## Profile

Scope: `profile`, `profile:write`

```ts
// Get user profile
const profile = await prism.profile.get(accessToken);

// Update profile
await prism.profile.update(accessToken, {
  display_name: "New Name",
  avatar_url: "https://example.com/avatar.png",
});
```

## Apps

Scope: `apps:read`, `apps:write`

```ts
const apps = await prism.apps.list(accessToken);

const app = await prism.apps.create(accessToken, {
  name: "My App",
  redirect_uris: ["http://localhost:3000/callback"],
  allowed_scopes: ["openid", "profile", "email", "profile:write"],
  // Optional scopes are shown with a toggle on the consent screen.
  // Users can decline them; the token is still issued without those scopes.
  optional_scopes: ["profile:write"],
});

await prism.apps.update(accessToken, app.id, { name: "Renamed" });
await prism.apps.delete(accessToken, app.id);
```

## Teams

Scope: `teams:read`, `teams:write`, `teams:create`, `teams:delete`

```ts
const teams = await prism.teams.list(accessToken);

const team = await prism.teams.create(accessToken, {
  name: "Engineering",
});

await prism.teams.addMember(accessToken, team.id, userId, "member");
await prism.teams.removeMember(accessToken, team.id, userId);
await prism.teams.delete(accessToken, team.id);
```

## Domains

Scope: `domains:read`, `domains:write`

```ts
const domains = await prism.domains.list(accessToken);

const domain = await prism.domains.add(accessToken, "example.com");
// Add DNS TXT record: _prism-verify.example.com = prism-verify=<token>

await prism.domains.verify(accessToken, "example.com");
await prism.domains.delete(accessToken, "example.com");
```

## Webhooks

Scope: `webhooks:read`, `webhooks:write`

```ts
const hooks = await prism.webhooks.list(accessToken);

const hook = await prism.webhooks.create(accessToken, {
  url: "https://example.com/webhook",
  events: ["user.updated"],
});

await prism.webhooks.update(accessToken, hook.id, { active: false });
const deliveries = await prism.webhooks.listDeliveries(accessToken, hook.id);
await prism.webhooks.delete(accessToken, hook.id);
```

## Social Connections & GPG Keys

Scope: `social:read`, `social:write`, `gpg:read`, `gpg:write`

```ts
const connections = await prism.social.listConnections(accessToken);
await prism.social.disconnect(accessToken, connectionId);

const gpgKeys = await prism.social.listGPGKeys(accessToken);
await prism.social.addGPGKey(accessToken, armoredPublicKey);
await prism.social.removeGPGKey(accessToken, keyId);
```

## Admin

Scope: `admin:users:read`, `admin:users:write`, `admin:config:read`, `admin:config:write`

```ts
const { data: users, total } = await prism.admin.listUsers(accessToken, {
  page: 1,
  per_page: 20,
  search: "john",
});

const user = await prism.admin.getUser(accessToken, userId);
await prism.admin.updateUser(accessToken, userId, { role: "admin" });

const config = await prism.admin.getConfig(accessToken);
await prism.admin.updateConfig(accessToken, { site_name: "My Prism" });
```

## Site

Site-level scopes grant unrestricted cross-user access. They are silently dropped from the token for users who are not site admins or who have no 2FA method enrolled — the consent flow completes normally, just without those scopes. When the authorizing user is a site admin with 2FA enrolled, the consent screen shows the site scopes as optional checkboxes alongside a 2FA challenge and a confirmation phrase.

Scope: `site:user:read`

```ts
// List all users on the site
const { users, total } = await prism.site.listUsers(accessToken, {
  page: 1,
  per_page: 50,
  search: "alice",
});

// Look up any user by ID — no team membership required
const user = await prism.site.getUser(accessToken, userId);
console.log(user.display_name, user.avatar_url);
```

## Team-Scoped Access

Apps request unbound team scopes (`team:read`, `team:member:read`, etc.) in their scope list. On the consent screen, the user selects which team to bind the token to. The issued token carries bound scopes like `team:<teamId>:member:read`.

A team owner or admin can grant all permissions except `team:delete`, which requires the owner role.

```ts
// Request in OAuth flow:
// scope = "openid profile team:read team:member:read team:member:profile:read"
//
// After the user picks a team, the token has:
// team:<selectedTeamId>:read  team:<selectedTeamId>:member:read  ...

// Read the team the token was granted for
const team = await prism.teamScope.getInfo(accessToken, teamId);

// List members (IDs + roles only)
const members = await prism.teamScope.listMembers(accessToken, teamId);

// Resolve a member's display name and avatar
const profile = await prism.teamScope.getMemberProfile(accessToken, teamId, userId);
console.log(profile.display_name, profile.avatar_url);

// Manage membership
await prism.teamScope.addMember(accessToken, teamId, newUserId, "member");
await prism.teamScope.updateMemberRole(accessToken, teamId, userId, "admin");
await prism.teamScope.removeMember(accessToken, teamId, userId);
```
