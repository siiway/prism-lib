# OAuth 流程

Prism 使用 **OAuth 2.0 授权码模式 + PKCE** 进行安全认证。SDK 会自动处理 PKCE。

## 概述

```
你的应用                     Prism
   |                          |
   |-- 1. createAuthUrl() --> |
   |   (重定向用户)            |
   |                          |
   |<-- 2. callback?code= --- |
   |                          |
   |-- 3. exchangeCode() --> |
   |<-- tokens --------------|
   |                          |
   |-- 4. getUserInfo() ---> |
   |<-- 用户数据 -------------|
```

## 第一步：创建授权 URL

```ts
const { url, pkce } = await prism.createAuthorizationUrl();

// 重要：保存 code verifier 用于第三步
// 浏览器：sessionStorage.setItem("pkce_verifier", pkce.codeVerifier);
// 服务端：存储在 session 中

// 将用户重定向到 Prism 登录
window.location.href = url;
```

你可以自定义请求参数：

```ts
const { url, pkce } = await prism.createAuthorizationUrl({
  scopes: ["openid", "profile", "email", "offline_access"],
  redirectUri: "http://localhost:3000/auth/callback",
  state: "my-custom-state",
  nonce: "my-nonce", // 用于 ID Token 验证
});
```

## 第二步：处理回调

用户登录后，Prism 会重定向回你的 `redirectUri`，并携带 `code` 和 `state` 参数。

```ts
// 解析回调 URL
const params = new URLSearchParams(window.location.search);
const code = params.get("code");
const state = params.get("state");

// 验证 state 与之前存储的是否匹配
```

## 第三步：用授权码换取令牌

```ts
const codeVerifier = sessionStorage.getItem("pkce_verifier")!;
const tokens = await prism.exchangeCode(code, codeVerifier);

// tokens.access_token  - 用于 API 调用
// tokens.id_token      - OIDC 身份令牌（需要 openid 范围）
// tokens.refresh_token - 用于刷新（需要 offline_access 范围）
// tokens.expires_in    - 令牌有效期（秒）
```

## 第四步：获取用户信息

```ts
const user = await prism.getUserInfo(tokens.access_token);

console.log(user.sub);                // 用户唯一 ID
console.log(user.preferred_username); // 用户名
console.log(user.email);             // 邮箱
console.log(user.name);              // 显示名称
console.log(user.picture);           // 头像 URL
```

## 使用已有的 Verifier

如果你需要单独生成 PKCE verifier（如在服务端），使用 `buildAuthorizationUrl`：

```ts
import { generateCodeVerifier } from "@siiway/prism";

const verifier = generateCodeVerifier();
// 将 verifier 存储在 session 中

const url = await prism.buildAuthorizationUrl(verifier, {
  state: "my-state",
});
```

## OIDC 发现

获取 OpenID Connect 发现文档：

```ts
const config = await prism.discover();
// config.issuer
// config.authorization_endpoint
// config.token_endpoint
// config.userinfo_endpoint
// config.jwks_uri
```
