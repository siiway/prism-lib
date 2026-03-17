# 示例：React SPA

适用于 React 单页应用的浏览器端 OAuth 流程。

## 安装

```bash
bun add @siiway/prism
```

## Auth Provider

```tsx
// src/lib/prism.ts
import { PrismClient } from "@siiway/prism";

export const prism = new PrismClient({
  baseUrl: "https://id.example.com",
  clientId: "your-client-id",
  redirectUri: window.location.origin + "/callback",
  scopes: ["openid", "profile", "email"],
});
```

## 登录按钮

```tsx
// src/components/LoginButton.tsx
import { prism } from "../lib/prism";

export function LoginButton() {
  const handleLogin = async () => {
    const { url, pkce } = await prism.createAuthorizationUrl();
    sessionStorage.setItem("pkce_verifier", pkce.codeVerifier);
    sessionStorage.setItem("pkce_state", pkce.state);
    window.location.href = url;
  };

  return <button onClick={handleLogin}>使用 Prism 登录</button>;
}
```

## 回调页面

```tsx
// src/pages/Callback.tsx
import { useEffect, useState } from "react";
import { prism } from "../lib/prism";

export function Callback() {
  const [status, setStatus] = useState("正在交换授权码...");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");

    const savedState = sessionStorage.getItem("pkce_state");
    if (state !== savedState) {
      setStatus("State 不匹配——可能存在 CSRF 攻击");
      return;
    }

    const verifier = sessionStorage.getItem("pkce_verifier");
    if (!code || !verifier) {
      setStatus("缺少 code 或 verifier");
      return;
    }

    prism.exchangeCode(code, verifier).then(async (tokens) => {
      sessionStorage.removeItem("pkce_verifier");
      sessionStorage.removeItem("pkce_state");

      // 存储令牌（生产环境请考虑更安全的方案）
      sessionStorage.setItem("access_token", tokens.access_token);

      const user = await prism.getUserInfo(tokens.access_token);
      setStatus(`欢迎，${user.preferred_username ?? user.name}！`);
    }).catch((err) => {
      setStatus(`错误：${err.message}`);
    });
  }, []);

  return <p>{status}</p>;
}
```

## 使用令牌

```tsx
// src/hooks/usePrism.ts
import { prism } from "../lib/prism";

export function useAccessToken() {
  return sessionStorage.getItem("access_token");
}

export async function fetchProfile() {
  const token = sessionStorage.getItem("access_token");
  if (!token) throw new Error("未登录");
  return prism.profile.get(token);
}
```

::: tip
生产环境中，建议通过后端将令牌存储在 HTTP-only cookie 中，而非 `sessionStorage`，以防止 XSS 攻击。
:::
