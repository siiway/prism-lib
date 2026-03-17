# 示例：Express / Node.js

使用 Express 实现完整的服务端 OAuth 流程。

## 安装

```bash
bun add @siiway/prism express
bun add -d @types/express
```

## 代码

```ts
import express from "express";
import { PrismClient } from "@siiway/prism";

const app = express();

const prism = new PrismClient({
  baseUrl: "https://id.example.com",
  clientId: "your-client-id",
  clientSecret: "your-client-secret", // 机密客户端
  redirectUri: "http://localhost:3000/callback",
  scopes: ["openid", "profile", "email", "offline_access"],
});

// 内存会话存储（生产环境请使用真实的存储方案）
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
    return res.status(400).send("无效的 state");
  }

  const tokens = await prism.exchangeCode(code, session.codeVerifier);
  session.tokens = tokens;

  const user = await prism.getUserInfo(tokens.access_token);
  res.json({ user, tokens_received: true });
});

app.get("/me", async (req, res) => {
  // 实际应用中应从 cookie 获取会话
  const state = req.query.state as string;
  const session = sessions.get(state);

  if (!session?.tokens) {
    return res.status(401).send("未登录");
  }

  try {
    const user = await prism.getUserInfo(session.tokens.access_token);
    res.json(user);
  } catch {
    // 尝试刷新令牌
    const newTokens = await prism.refreshToken(session.tokens.refresh_token);
    session.tokens = newTokens;
    const user = await prism.getUserInfo(newTokens.access_token);
    res.json(user);
  }
});

app.listen(3000, () => console.log("http://localhost:3000"));
```
