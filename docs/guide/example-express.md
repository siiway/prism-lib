# Example: Express / Node.js

A complete server-side OAuth flow with Express.

## Setup

```bash
bun add @siiway/prism express
bun add -d @types/express
```

## Code

```ts
import express from "express";
import { PrismClient } from "@siiway/prism";

const app = express();

const prism = new PrismClient({
  baseUrl: "https://id.example.com",
  clientId: "your-client-id",
  clientSecret: "your-client-secret", // confidential client
  redirectUri: "http://localhost:3000/callback",
  scopes: ["openid", "profile", "email", "offline_access"],
});

// In-memory session store (use a real store in production)
const sessions = new Map<string, { codeVerifier: string; tokens?: any }>();

app.get("/login", async (req, res) => {
  const { url, pkce } = await prism.createAuthorizationUrl();
  sessions.set(pkce.state, { codeVerifier: pkce.codeVerifier });
  res.redirect(url);
});

app.get("/callback", async (req, res) => {
  const { code, state } = req.query as { code: string; state: string };
  const session = sessions.get(state);

  if (!session) {
    return res.status(400).send("Invalid state");
  }

  const tokens = await prism.exchangeCode(code, session.codeVerifier);
  session.tokens = tokens;

  const user = await prism.getUserInfo(tokens.access_token);
  res.json({ user, tokens_received: true });
});

app.get("/me", async (req, res) => {
  // In a real app, get the session from a cookie
  const state = req.query.state as string;
  const session = sessions.get(state);

  if (!session?.tokens) {
    return res.status(401).send("Not logged in");
  }

  try {
    const user = await prism.getUserInfo(session.tokens.access_token);
    res.json(user);
  } catch {
    // Try refreshing
    const newTokens = await prism.refreshToken(session.tokens.refresh_token);
    session.tokens = newTokens;
    const user = await prism.getUserInfo(newTokens.access_token);
    res.json(user);
  }
});

app.listen(3000, () => console.log("http://localhost:3000"));
```
