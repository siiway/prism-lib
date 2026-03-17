# OAuth Flow

Prism uses **OAuth 2.0 Authorization Code + PKCE** for secure authentication. The SDK handles PKCE automatically.

## Overview



## Step 1: Create Authorization URL

```ts
const { url, pkce } = await prism.createAuthorizationUrl();

// IMPORTANT: Store the code verifier for step 3
// Browser: sessionStorage.setItem("pkce_verifier", pkce.codeVerifier);
// Server: store in session

// Redirect user to Prism login
window.location.href = url;
```

You can customize the request:

```ts
const { url, pkce } = await prism.createAuthorizationUrl({
  scopes: ["openid", "profile", "email", "offline_access"],
  redirectUri: "http://localhost:3000/auth/callback",
  state: "my-custom-state",
  nonce: "my-nonce", // for ID token validation
});
```

## Step 2: Handle Callback

After the user logs in, Prism redirects back to your  with a  and  parameter.

```ts
// Parse callback URL
const params = new URLSearchParams(window.location.search);
const code = params.get("code");
const state = params.get("state");

// Validate state matches what you stored
```

## Step 3: Exchange Code for Tokens

```ts
const codeVerifier = sessionStorage.getItem("pkce_verifier")!;
const tokens = await prism.exchangeCode(code, codeVerifier);

// tokens.access_token  - Use for API calls
// tokens.id_token      - OIDC identity token (if openid scope)
// tokens.refresh_token - For refreshing (if offline_access scope)
// tokens.expires_in    - Token lifetime in seconds
```

## Step 4: Get User Info

```ts
const user = await prism.getUserInfo(tokens.access_token);

console.log(user.sub);                // unique user ID
console.log(user.preferred_username); // username
console.log(user.email);             // email address
console.log(user.name);              // display name
console.log(user.picture);           // avatar URL
```

## Using a Pre-existing Verifier

If you generate the PKCE verifier separately (e.g., on the server), use :

```ts
import { generateCodeVerifier } from "@siiway/prism";

const verifier = generateCodeVerifier();
// store verifier in session

const url = await prism.buildAuthorizationUrl(verifier, {
  state: "my-state",
});
```

## OIDC Discovery

Fetch the OpenID Connect discovery document:

```ts
const config = await prism.discover();
// config.issuer
// config.authorization_endpoint
// config.token_endpoint
// config.userinfo_endpoint
// config.jwks_uri
```
