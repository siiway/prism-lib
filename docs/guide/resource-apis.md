# Resource APIs

All resource APIs require a valid access token with the appropriate scopes.

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
  allowed_scopes: ["openid", "profile", "email"],
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

Site-level scopes grant unrestricted cross-user access and can only be authorized by site admins via a special OAuth consent flow (requires 2FA + confirmation phrase). The resulting token must belong to a site admin.

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
