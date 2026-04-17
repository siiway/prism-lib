# 资源 API

所有资源 API 都需要有效的访问令牌和相应的权限范围。

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
  allowed_scopes: ["openid", "profile", "email"],
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

站点级权限范围授予对整个站点无限制的跨用户访问能力，只能由站点管理员通过特殊 OAuth 授权流程（需要双因素验证和确认短语）授予。生成的令牌也必须属于站点管理员。

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
