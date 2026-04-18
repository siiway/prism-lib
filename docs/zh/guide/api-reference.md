# API 参考

## PrismClient

### 构造函数

```ts
new PrismClient(options: PrismClientOptions)
```

| 选项 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `baseUrl` | `string` | 是 | Prism 实例 URL |
| `clientId` | `string` | 是 | OAuth 客户端 ID |
| `redirectUri` | `string` | 是 | 默认回调地址 |
| `clientSecret` | `string` | 否 | 客户端密钥（机密客户端） |
| `scopes` | `string[]` | 否 | 默认范围（`["openid","profile","email"]`） |
| `fetch` | `typeof fetch` | 否 | 自定义 fetch |

### OAuth 方法

| 方法 | 返回值 | 说明 |
| --- | --- | --- |
| `createAuthorizationUrl(options?)` | `Promise<{ url, pkce }>` | 生成带 PKCE 的授权 URL |
| `buildAuthorizationUrl(verifier, options?)` | `Promise<string>` | 使用已有 verifier 的授权 URL |

两个方法均接受 `AuthorizationUrlOptions`：

| 选项 | 类型 | 说明 |
| --- | --- | --- |
| `scopes` | `string[]` | 覆盖默认范围 |
| `optionalScopes` | `string[]` | 用户可拒绝的范围（`scopes` 的子集），作为 `optional_scope` 查询参数传递 |
| `redirectUri` | `string` | 覆盖默认回调地址 |
| `state` | `string` | 自定义 state（省略则自动生成） |
| `nonce` | `string` | OIDC ID 令牌验证用 nonce |
| `exchangeCode(code, verifier, redirectUri?)` | `Promise<TokenResponse>` | 用授权码换取令牌 |
| `refreshToken(refreshToken)` | `Promise<TokenResponse>` | 刷新访问令牌 |
| `introspectToken(token, hint?)` | `Promise<TokenIntrospectionResponse>` | 检查令牌状态 |
| `revokeToken(token, hint?)` | `Promise<void>` | 撤销令牌 |
| `getUserInfo(accessToken)` | `Promise<UserInfo>` | 获取 OIDC 用户信息 |
| `discover()` | `Promise<OIDCDiscovery>` | 获取 OIDC 配置 |
| `jwks()` | `Promise<unknown>` | 获取 JWKS |
| `listConsents(accessToken)` | `Promise<OAuthConsent[]>` | 列出已授权的应用 |
| `revokeConsent(accessToken, clientId)` | `Promise<void>` | 撤销应用授权 |

### 资源 API

#### `prism.profile`

| 方法 | 范围 | 说明 |
| --- | --- | --- |
| `get(token)` | `profile` | 获取用户资料 |
| `update(token, data)` | `profile:write` | 更新显示名称、头像 |

#### `prism.apps`

| 方法 | 范围 | 说明 |
| --- | --- | --- |
| `list(token)` | `apps:read` | 列出自有 OAuth 应用 |
| `create(token, params)` | `apps:write` | 创建新应用 |
| `update(token, id, params)` | `apps:write` | 更新应用 |
| `delete(token, id)` | `apps:write` | 删除应用 |

`CreateAppParams` / `UpdateAppParams` 支持 `optional_scopes?: string[]` 字段，必须是 `allowed_scopes` 的子集。列在此处的范围在授权页面以可选复选框形式展示，用户可拒绝而不影响授权流程。

#### `prism.teams`

| 方法 | 范围 | 说明 |
| --- | --- | --- |
| `list(token)` | `teams:read` | 列出团队 |
| `create(token, params)` | `teams:create` | 创建团队 |
| `update(token, id, params)` | `teams:write` | 更新团队 |
| `delete(token, id)` | `teams:delete` | 删除团队 |
| `addMember(token, teamId, userId, role?)` | `teams:write` | 添加成员 |
| `removeMember(token, teamId, userId)` | `teams:write` | 移除成员 |

#### `prism.domains`

| 方法 | 范围 | 说明 |
| --- | --- | --- |
| `list(token)` | `domains:read` | 列出域名 |
| `add(token, domain)` | `domains:write` | 添加域名 |
| `verify(token, domain)` | `domains:write` | 触发 DNS 验证 |
| `delete(token, domain)` | `domains:write` | 删除域名 |

#### `prism.webhooks`

| 方法 | 范围 | 说明 |
| --- | --- | --- |
| `list(token)` | `webhooks:read` | 列出 Webhooks |
| `create(token, params)` | `webhooks:write` | 创建 Webhook |
| `update(token, id, params)` | `webhooks:write` | 更新 Webhook |
| `delete(token, id)` | `webhooks:write` | 删除 Webhook |
| `listDeliveries(token, id)` | `webhooks:read` | 列出投递记录 |

#### `prism.social`

| 方法 | 范围 | 说明 |
| --- | --- | --- |
| `listConnections(token)` | `social:read` | 列出社交账号 |
| `disconnect(token, id)` | `social:write` | 解除关联 |
| `listGPGKeys(token)` | `gpg:read` | 列出 GPG 密钥 |
| `addGPGKey(token, armoredKey)` | `gpg:write` | 添加 GPG 密钥 |
| `removeGPGKey(token, id)` | `gpg:write` | 删除 GPG 密钥 |

#### `prism.admin`

| 方法 | 范围 | 说明 |
| --- | --- | --- |
| `listUsers(token, options?)` | `admin:users:read` | 列出所有用户（分页） |
| `getUser(token, id)` | `admin:users:read` | 获取用户 |
| `updateUser(token, id, data)` | `admin:users:write` | 更新用户 |
| `deleteUser(token, id)` | `admin:users:delete` | 删除用户 |
| `getConfig(token)` | `admin:config:read` | 读取站点配置 |
| `updateConfig(token, config)` | `admin:config:write` | 更新站点配置 |
| `listWebhooks(token)` | `admin:webhooks:read` | 列出管理员 Webhooks |
| `createWebhook(token, params)` | `admin:webhooks:write` | 创建管理员 Webhook |
| `updateWebhook(token, id, params)` | `admin:webhooks:write` | 更新管理员 Webhook |
| `deleteWebhook(token, id)` | `admin:webhooks:delete` | 删除管理员 Webhook |
| `testWebhook(token, id)` | `admin:webhooks:write` | 发送测试投递 |
| `listWebhookDeliveries(token, id)` | `admin:webhooks:read` | 投递历史 |
| `createInvite(token, options?)` | `admin:invites:create` | 创建站点邀请 |
| `listInvites(token)` | `admin:invites:read` | 列出邀请 |
| `deleteInvite(token, id)` | `admin:invites:delete` | 撤销邀请 |

#### `prism.site`

站点级权限范围在授权用户非站点管理员或未启用任何 2FA 时，会被静默从令牌中移除——OAuth 流程仍会正常完成，只是不含这些范围。当用户是已启用 2FA 的站点管理员时，授权页面将站点范围显示为可选复选框，并要求完成双因素验证和确认短语。

| 方法 | 范围 | 说明 |
| --- | --- | --- |
| `listUsers(token, options?)` | `site:user:read` | 列出站点内所有用户（分页） |
| `getUser(token, id)` | `site:user:read` | 按 ID 获取任意用户 |

#### `prism.teamScope`

团队范围令牌在应用请求 `team:read`、`team:write`、`team:member:read` 等范围时颁发，用户在授权页面选择特定团队后，令牌携带绑定范围如 `team:<teamId>:member:read`。

| 方法 | 范围 | 说明 |
| --- | --- | --- |
| `getInfo(token, teamId)` | `team:<id>:read` | 读取团队名称、描述、头像 |
| `updateInfo(token, teamId, data)` | `team:<id>:write` | 更新团队名称/描述/头像 |
| `listMembers(token, teamId)` | `team:<id>:member:read` | 列出成员 ID 和角色 |
| `getMemberProfile(token, teamId, userId)` | `team:<id>:member:profile:read` | 获取成员显示名称和头像 |
| `addMember(token, teamId, userId, role?)` | `team:<id>:member:write` | 添加成员 |
| `updateMemberRole(token, teamId, userId, role)` | `team:<id>:member:write` | 修改成员角色 |
| `removeMember(token, teamId, userId)` | `team:<id>:member:write` | 移除成员 |

### 静态工具函数

```ts
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  generatePKCEChallenge,
} from "@siiway/prism";
```

| 函数 | 返回值 | 说明 |
| --- | --- | --- |
| `generateCodeVerifier(length?)` | `string` | 随机 PKCE code verifier |
| `generateCodeChallenge(verifier)` | `Promise<string>` | S256 code challenge |
| `generateState()` | `string` | 随机 state 参数 |
| `generatePKCEChallenge()` | `Promise<PKCEChallenge>` | 完整 PKCE challenge 对象 |

## 可用权限范围

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
