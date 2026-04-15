# 跨应用权限

Prism 允许一个 OAuth 应用暴露自定义权限范围，供其他应用代表用户请求。SDK 通过 `prism.appScopePermissions` 提供提供方的操作，并通过标准 OAuth 辅助函数支持消费方。

## 概念

```
app:<应用A的client_id>:<内部范围>
```

- **应用 A（提供方）** — 定义权限范围元数据（标题、描述）以及可选的访问控制规则，控制谁可以注册和请求其权限范围。
- **应用 B（消费方）** — 将该范围加入 `allowed_scopes`，然后在标准 OAuth 授权流程中请求它。
- **用户** — 在授权前看到带有应用 A 自定义标题和描述的授权界面。

---

## 应用 A — SDK（提供方）

### 定义权限范围元数据

```ts
// 列出现有定义
const defs = await prism.appScopePermissions.listDefinitions(token, appAId);

// 创建（或更新）权限范围定义
const def = await prism.appScopePermissions.upsertDefinition(token, appAId, {
  scope: "read_posts",
  title: "读取文章",
  description: "查看用户已发布和草稿状态的文章",
});

// 稍后更新标题 / 描述
await prism.appScopePermissions.updateDefinition(token, appAId, def.id, {
  description: "查看用户的文章（已发布、计划发布和草稿）",
});

// 删除定义
await prism.appScopePermissions.deleteDefinition(token, appAId, def.id);
```

### 管理访问控制规则

```ts
// 列出当前规则
const rules = await prism.appScopePermissions.listAccessRules(token, appAId);

// 仅允许特定合作应用在 OAuth 时请求您的权限范围
await prism.appScopePermissions.createAccessRule(token, appAId, {
  rule_type: "app_allow",
  target_id: "prism_partnerapp_clientid",
});

// 阻止特定所有者在其应用中注册您的权限范围
await prism.appScopePermissions.createAccessRule(token, appAId, {
  rule_type: "owner_deny",
  target_id: "usr_bad_actor_id",
});

// 删除规则
await prism.appScopePermissions.deleteAccessRule(token, appAId, rules[0].id);
```

**规则语义**

| `rule_type`     | 检查时机              | 效果                                               |
|-----------------|-----------------------|----------------------------------------------------|
| `owner_allow`   | `PATCH /apps/:id`     | 白名单：仅列出的用户 ID 可以注册您的权限范围       |
| `owner_deny`    | `PATCH /apps/:id`     | 黑名单：列出的用户 ID 永远不能注册您的权限范围     |
| `app_allow`     | OAuth 授权            | 白名单：仅列出的 client ID 可以请求您的权限范围    |
| `app_deny`      | OAuth 授权            | 黑名单：列出的 client ID 永远不能请求您的权限范围  |

存在任意 `*_allow` 规则时，列表切换为白名单模式；拒绝规则始终生效。

### 在您的 API 中验证传入令牌

当应用 B 调用应用 A 的 API 时，会携带用户的访问令牌。通过令牌自省验证：

```ts
const introspection = await prism.introspectToken(accessToken);

if (!introspection.active) throw new Error("令牌无效或已过期");

const scopes = (introspection.scope ?? "").split(" ");
const requiredScope = `app:${appAClientId}:read_posts`;

if (!scopes.includes(requiredScope))
  throw new Error("缺少必要的权限范围");

// 可选：限定只接受来自特定消费应用的令牌
if (introspection.client_id !== appBClientId)
  throw new Error("令牌不是由预期的应用签发的");

const userId = introspection.sub!;
```

---

## 应用 B — SDK（消费方）

### 1. 在应用 B 的 allowed_scopes 中注册权限范围

```ts
const app = await prism.apps.get(token, appBId);
const currentScopes = app.allowed_scopes;

await prism.apps.update(token, appBId, {
  allowed_scopes: [
    ...currentScopes,
    "app:prism_xxxxx:read_posts",  // 应用 A 的 client_id + 内部范围
  ],
});
```

如果应用 A 的所有者访问规则不允许您的用户，此操作将返回 `403`。

### 2. 在 OAuth 流程中请求权限范围

在授权 URL 中将该范围与标准范围一起传入：

```ts
const { url, pkce } = await prism.createAuthorizationUrl({
  scopes: ["openid", "profile", "app:prism_xxxxx:read_posts"],
  redirectUri: "https://appb.example/callback",
});

// 保存 pkce.codeVerifier，然后将用户重定向到 `url`
```

### 3. 交换授权码

```ts
const tokens = await prism.exchangeCode(code, pkce.codeVerifier);
// tokens.access_token 现在携带跨应用权限范围
```

### 4. 调用应用 A 的 API

```ts
const res = await fetch("https://appa.example/api/posts", {
  headers: { Authorization: `Bearer ${tokens.access_token}` },
});
```

应用 A 自省令牌，确认权限范围存在后返回数据。

---

## 授权界面

当应用 A 已定义权限范围元数据时，OAuth 授权界面会显示：

```
✔  读取文章
   查看用户已发布和草稿状态的文章       ← 应用 A 的描述
   · 应用 A · read_posts               ← 应用名称 · 内部范围
```

未定义元数据时，界面回退到通用描述。

---

## TypeScript 类型

```ts
import type {
  AppScopeDefinition,
  AppScopeAccessRule,
  AppScopeAccessRuleType,
  CreateAppScopeDefinitionParams,
  UpdateAppScopeDefinitionParams,
  CreateAppScopeAccessRuleParams,
} from "@siiway/prism";

const params: CreateAppScopeDefinitionParams = {
  scope: "read_posts",
  title: "读取文章",
  description: "查看已发布和草稿状态的文章",
};

const ruleParam: CreateAppScopeAccessRuleParams = {
  rule_type: "app_allow",
  target_id: "prism_partner_clientid",
};
```
