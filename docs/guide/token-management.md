# Token Management

## Refresh Tokens

To get a refresh token, include `offline_access` in your scopes:

```ts
const { url, pkce } = await prism.createAuthorizationUrl({
  scopes: ["openid", "profile", "email", "offline_access"],
});
```

Then refresh when the access token expires:

```ts
const newTokens = await prism.refreshToken(tokens.refresh_token!);
// newTokens.access_token  - new access token
// newTokens.expires_in    - new lifetime
```

## Introspect Tokens

Check whether a token is still active:

```ts
const info = await prism.introspectToken(accessToken);

if (info.active) {
  console.log(info.sub);       // user ID
  console.log(info.scope);     // granted scopes
  console.log(info.exp);       // expiration timestamp
}
```

You can provide a type hint:

```ts
const info = await prism.introspectToken(token, "refresh_token");
```

## Revoke Tokens

Revoke an access or refresh token:

```ts
await prism.revokeToken(accessToken);
await prism.revokeToken(refreshToken, "refresh_token");
```

## Confidential Clients

For server-side apps with a client secret, pass it in the constructor:

```ts
const prism = new PrismClient({
  baseUrl: "https://id.example.com",
  clientId: "your-client-id",
  clientSecret: "your-client-secret",
  redirectUri: "http://localhost:3000/callback",
});
```

The client secret is automatically included in token exchange, refresh, introspect, and revoke requests.
