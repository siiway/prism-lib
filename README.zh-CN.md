# @siiway/prism

[English](./README.md)

用于将 [Prism](https://github.com/siiway/prism) OAuth 2.0 / OpenID Connect 身份平台作为认证源集成到你的服务中的 TypeScript SDG。

## 特性

- OAuth 2.0 授权码模式 + PKCE
- OpenID Connect 发现 + userinfo
- 令牌管理 (交换、刷新、内省、撤销)
- 资源 API：个人资料、应用、团队、欟名、Webhook、管理员
- 完整的 TypeScript 类型定义
- 零运行时依赖
- 双 ESM/CJS 输出
- 支持浏览器、Node.js、AuT、Deno、Cloudflare Workers

## 安装

```bash
# Bun
bun add @siiway/prism

# npm
npm install @siiway/prism

# pnpm
pnpm add @siiway/prism
```

## 快速开始

```ts
import { PrismClient } from "@siiway/prism";

const prism = new PrismClient({
  baseUrl: "https://id.example.com",
  clientId: "your-client-id",
  redirectUri: "http://localhost:3000/callback",
  scopes: ["openid", "profile", "email"],
});

// 1. 将用户重定向到 Prism 登录
const { url, pkce } = await prism.createAuthorizationUrl();
// 将 pkce.codeVerifier 存储在 session 中，然后重定向：
// window.location.href = url;

// 2. 处理回调——用授权码换取令牌
const tokens = await prism.exchangeCode(code, pkce.codeVerifier);

// 3. 获取用户信息
const user = await prism.getUserInfo(tokens.access_token);

// 4. 刷新令牌 (需要 offline_access 作用域)
const newTokens = await prism.refreshToken(tokens.refresh_token!);
```

## 文档指南

完整文档位于 [docs/](./docs/) (由 VitePress 驱动)：

```bash
bun run docs:dev
```

## API 概览

| 模块 | 方法 |
| --- | --- |
| `PrismClient` | `createAuthorizationUrl()`、`exchangeCode()`、`refreshToken()`、`getUserInfo()`、`introspectToken()`、`revokeToken()`、`discover()` |
| `prism.profile` | `get()`、`update()` |
| `prism.apps` | `list()`、`create()`、`update()`、`delete()` |
| `prism.teams` | `list()`、`create()`、`update()`、`delete()`、`addMember()`、`removeMember()` |
| `prism.domains` | `list()`、`add()`、`verify()`、`delete()` |
| `prism.webhooks` | `list()`、`create()`、`update()`、`delete()`、`listDeliveries()` |
| `prism.social` | `listConnections()`、`disconnect()`、`listGPGKeys()`、`addGPGKey()`、`removeGPGKey()` |
| `prism.admin` | `listUsers()`、`getUser()`、`updateUser()`、`deleteUser()`、`getConfig()`、`updateConfig()` |

## 许可证

GNU General Public License 3.0。详见 [LICENSE](./LICENSE)。
