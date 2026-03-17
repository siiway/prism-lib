# 令牌管理

## 刷新令牌

要获取刷新令牌，需要在请求范围中包含 `offline_access`：

```ts
const { url, pkce } = await prism.createAuthorizationUrl({
  scopes: ["openid", "profile", "email", "offline_access"],
});
```

当访问令牌过期时进行刷新：

```ts
const newTokens = await prism.refreshToken(tokens.refresh_token!);
// newTokens.access_token  - 新的访问令牌
// newTokens.expires_in    - 新的有效期
```

## 令牌内省

检查令牌是否仍然有效：

```ts
const info = await prism.introspectToken(accessToken);

if (info.active) {
  console.log(info.sub);       // 用户 ID
  console.log(info.scope);     // 已授权的范围
  console.log(info.exp);       // 过期时间戳
}
```

可以提供类型提示：

```ts
const info = await prism.introspectToken(token, "refresh_token");
```

## 撤销令牌

撤销访问令牌或刷新令牌：

```ts
await prism.revokeToken(accessToken);
await prism.revokeToken(refreshToken, "refresh_token");
```

## 机密客户端

对于有客户端密钥的服务端应用，在构造函数中传入密钥：

```ts
const prism = new PrismClient({
  baseUrl: "https://id.example.com",
  clientId: "your-client-id",
  clientSecret: "your-client-secret",
  redirectUri: "http://localhost:3000/callback",
});
```

客户端密钥会自动包含在令牌交换、刷新、内省和撤销请求中。
