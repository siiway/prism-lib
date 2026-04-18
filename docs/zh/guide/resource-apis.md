# 资源 API

所有资源 API 都需要有效的访问令牌和相应的权限范围。

## 可选权限范围

应用可以在授权时将某些范围标记为可选。用户在授权页面可通过复选框选择是否授予这些范围——即使拒绝，令牌仍会正常颁发，只是不含被拒绝的范围。

可选范围有两种声明方式：

**按请求声明**（推荐）：构建授权 URL 时传入 `optionalScopes`。

```ts
const { url, pkce } = await prism.createAuthorizationUrl({
  scopes: ["openid", "profile", "team:read"],
  optionalScopes: ["team:read"],   // 用户可拒绝此范围
});
```

**按应用默认**：在应用配置中设置 `optional_scopes`（通过 `prism.apps.update`），对该应用的所有授权请求生效。

```ts
await prism.apps.update(accessToken, appId, {
  allowed_scopes: ["openid", "profile", "team:read"],
  optional_scopes: ["team:read"],
});
```

按请求和按应用声明的可选范围会合并——只要出现在任意一处即为可选。

## 用户资料

范围：`profile`、`profile:write`

```ts
// 获取用户资料
const profile = await prism.profile.get(accessToken);

// 更新资料
await prism.profile.update(accessToken, {
  display_name: "新名称",
  avatar_url: "https://example.com/avatar.png",
});
```

## 应用管理

范围：`apps:read`、`apps:write`

```ts
const apps = await prism.apps.list(accessToken);

const app = await prism.apps.create(accessToken, {
  name: "我的应用",
  redirect_uris: ["http://localhost:3000/callback"],
  allowed_scopes: ["openid", "profile", "email", "profile:write"],
  // 可选范围会在授权页面以复选框形式展示。
  // 用户可以拒绝，令牌仍会颁发，只是不含这些范围。
  optional_scopes: ["profile:write"],
});

await prism.apps.update(accessToken, app.id, { name: "重命名" });
await prism.apps.delete(accessToken, app.id);
```

## 团队

范围：`teams:read`、`teams:write`、`teams:create`、`teams:delete`

```ts
const teams = await prism.teams.list(accessToken);

const team = await prism.teams.create(accessToken, {
  name: "工程团队",
});

await prism.teams.addMember(accessToken, team.id, userId, "member");
await prism.teams.removeMember(accessToken, team.id, userId);
await prism.teams.delete(accessToken, team.id);
```

## 域名验证

范围：`domains:read`、`domains:write`

```ts
const domains = await prism.domains.list(accessToken);

const domain = await prism.domains.add(accessToken, "example.com");
// 添加 DNS TXT 记录：_prism-verify.example.com = prism-verify=<token>

await prism.domains.verify(accessToken, "example.com");
await prism.domains.delete(accessToken, "example.com");
```

## Webhooks

范围：`webhooks:read`、`webhooks:write`

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

## 社交账号和 GPG 密钥

范围：`social:read`、`social:write`、`gpg:read`、`gpg:write`

```ts
const connections = await prism.social.listConnections(accessToken);
await prism.social.disconnect(accessToken, connectionId);

const gpgKeys = await prism.social.listGPGKeys(accessToken);
await prism.social.addGPGKey(accessToken, armoredPublicKey);
await prism.social.removeGPGKey(accessToken, keyId);
```

## 管理员

范围：`admin:users:read`、`admin:users:write`、`admin:config:read`、`admin:config:write`

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

## 站点

站点级权限范围授予对整个站点无限制的跨用户访问能力。当授权用户不是站点管理员，或未启用任何双因素认证时，这些范围会被静默从令牌中移除——OAuth 流程仍会正常完成，只是不含这些范围。当用户是已启用 2FA 的站点管理员时，授权页面会将站点范围显示为可选复选框，并要求完成双因素验证和确认短语。

范围：`site:user:read`

```ts
// 列出站点内所有用户
const { users, total } = await prism.site.listUsers(accessToken, {
  page: 1,
  per_page: 50,
  search: "alice",
});

// 按 ID 查找任意用户，无需团队成员关系
const user = await prism.site.getUser(accessToken, userId);
console.log(user.display_name, user.avatar_url);
```

## 团队范围访问

应用在范围列表中请求无绑定的团队范围（`team:read`、`team:member:read` 等），用户在授权页面选择要绑定的团队后，颁发的令牌携带绑定范围如 `team:<teamId>:member:read`。

团队所有者或管理员可授予除 `team:delete` 以外的所有权限，`team:delete` 仅所有者可授予。

```ts
// OAuth 流程中请求：
// scope = "openid profile team:read team:member:read team:member:profile:read"
//
// 用户选择团队后，令牌携带：
// team:<selectedTeamId>:read  team:<selectedTeamId>:member:read  ...

// 读取令牌绑定的团队
const team = await prism.teamScope.getInfo(accessToken, teamId);

// 列出成员（仅 ID + 角色）
const members = await prism.teamScope.listMembers(accessToken, teamId);

// 获取成员显示名称和头像
const profile = await prism.teamScope.getMemberProfile(accessToken, teamId, userId);
console.log(profile.display_name, profile.avatar_url);

// 管理成员
await prism.teamScope.addMember(accessToken, teamId, newUserId, "member");
await prism.teamScope.updateMemberRole(accessToken, teamId, userId, "admin");
await prism.teamScope.removeMember(accessToken, teamId, userId);
```
