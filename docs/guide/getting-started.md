# Getting Started

## Prerequisites

- A running [Prism](https://github.com/siiway/prism) instance
- An OAuth app registered in Prism (Settings > OAuth Apps)
- Your app's **Client ID** and **Redirect URI**

## Install

```bash
# Bun
bun add @siiway/prism

# npm
npm install @siiway/prism

# pnpm
pnpm add @siiway/prism
```

## Create a Client

```ts
import { PrismClient } from "@siiway/prism";

const prism = new PrismClient({
  baseUrl: "https://id.example.com",
  clientId: "your-client-id",
  redirectUri: "http://localhost:3000/callback",
  scopes: ["openid", "profile", "email"],
});
```

### Options

| Option | Type | Required | Description |
| --- | --- | --- | --- |
|  |  | Yes | Base URL of your Prism instance |
|  |  | Yes | OAuth client ID |
|  |  | Yes | Default redirect URI after login |
|  |  | No | Client secret (server-side only) |
|  |  | No | Default scopes (defaults to ) |
|  |  | No | Custom fetch implementation |

## Next Steps

- [OAuth Flow](./oauth-flow) - Learn the full authorization flow
- [Token Management](./token-management) - Refresh, introspect, and revoke tokens
- [Resource APIs](./resource-apis) - Access user data with tokens
