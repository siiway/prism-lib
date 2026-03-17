# @siiway/prism

[中文](./README.zh-CN.md)

TypeScript SDK for integrating [Prism](https://github.com/siiway/prism) OAuth 2.0 / OpenID Connect identity platform as an authentication source into your services.

## Features

- OAuth 2.0 Authorization Code + PKCE flow
- OpenID Connect discovery + userinfo
- Token management (exchange, refresh, introspect, revoke)
- Resource APIs: profile, apps, teams, domains, webhooks, admin
- Full TypeScript types for all API responses
- Zero runtime dependencies
- Dual ESM/CJS output
- Works in browser, Node.js, Bun, Deno, Cloudflare Workers

## Install

```bash
# Bun
bun add @siiway/prism

# npm
npm install @siiway/prism

# pnpm
pnpm add @siiway/prism
```

## Quick Start

```ts
import { PrismClient } from "@siiway/prism";

const prism = new PrismClient({
  baseUrl: "https://id.example.com",
  clientId: "your-client-id",
  redirectUri: "http://localhost:3000/callback",
  scopes: ["openid", "profile", "email"],
});

// 1. Redirect user to Prism for login
const { url, pkce } = await prism.createAuthorizationUrl();
// Store pkce.codeVerifier in session, then redirect:
// window.location.href = url;

// 2. Handle callback -- exchange code for tokens
const tokens = await prism.exchangeCode(code, pkce.codeVerifier);

// 3. Get user info
const user = await prism.getUserInfo(tokens.access_token);

// 4. Refresh tokens (requires offline_access scope)
const newTokens = await prism.refreshToken(tokens.refresh_token!);
```

## Documentation

Full documentation is available at [docs/](./docs/) (powered by VitePress):

```bash
bun run docs:dev
```

## API Overview

| Module | Methods |
| --- | --- |
| `PrismClient` | `createAuthorizationUrl()`, `exchangeCode()`, `refreshToken()`, `getUserInfo()`, `introspectToken()`, `revokeToken()`, `discover()` |
| `prism.profile` | `get()`, `update()` |
| `prism.apps` | `list()`, `create()`, `update()`, `delete()` |
| `prism.teams` | `list()`, `create()`, `update()`, `delete()`, `addMember()`, `removeMember()` |
| `prism.domains` | `list()`, `add()`, `verify()`, `delete()` |
| `prism.webhooks` | `list()`, `create()`, `update()`, `delete()`, `listDeliveries()` |
| `prism.social` | `listConnections()`, `disconnect()`, `listGPGKeys()`, `addGPGKey()`, `removeGPGKey()` |
| `prism.admin` | `listUsers()`, `getUser()`, `updateUser()`, `deleteUser()`, `getConfig()`, `updateConfig()` |

## License

GNU General Public License 3.0. See [LICENSE](./LICENSE) for details.
