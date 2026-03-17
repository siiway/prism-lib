# Example: React SPA

A browser-based OAuth flow for a React single-page application.

## Setup

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

## Login Button

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

  return <button onClick={handleLogin}>Sign in with Prism</button>;
}
```

## Callback Page

```tsx
// src/pages/Callback.tsx
import { useEffect, useState } from "react";
import { prism } from "../lib/prism";

export function Callback() {
  const [status, setStatus] = useState("Exchanging code...");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");

    const savedState = sessionStorage.getItem("pkce_state");
    if (state !== savedState) {
      setStatus("State mismatch - possible CSRF");
      return;
    }

    const verifier = sessionStorage.getItem("pkce_verifier");
    if (!code || !verifier) {
      setStatus("Missing code or verifier");
      return;
    }

    prism.exchangeCode(code, verifier).then(async (tokens) => {
      sessionStorage.removeItem("pkce_verifier");
      sessionStorage.removeItem("pkce_state");

      // Store tokens (consider a more secure approach in production)
      sessionStorage.setItem("access_token", tokens.access_token);

      const user = await prism.getUserInfo(tokens.access_token);
      setStatus(`Welcome, ${user.preferred_username ?? user.name}!`);
    }).catch((err) => {
      setStatus(`Error: ${err.message}`);
    });
  }, []);

  return <p>{status}</p>;
}
```

## Using the Token

```tsx
// src/hooks/usePrism.ts
import { prism } from "../lib/prism";

export function useAccessToken() {
  return sessionStorage.getItem("access_token");
}

export async function fetchProfile() {
  const token = sessionStorage.getItem("access_token");
  if (!token) throw new Error("Not logged in");
  return prism.profile.get(token);
}
```

::: tip
For production apps, store tokens in HTTP-only cookies via your backend rather than `sessionStorage` to prevent XSS attacks.
:::
