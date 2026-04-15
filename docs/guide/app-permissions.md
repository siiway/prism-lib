# Cross-App Permissions

Prism lets one OAuth app expose named permission scopes that other apps can request
on behalf of users. The SDK provides `prism.appScopePermissions` for the provider
side and standard OAuth helpers for the consumer side.

## Concepts

```
app:<App_A_client_id>:<inner_scope>
```

- **App A (provider)** — defines scope metadata (title, description) and optional
  access rules controlling who can register and request its scopes.
- **App B (consumer)** — adds the scope to its `allowed_scopes`, then requests it
  during a normal OAuth authorization flow.
- **User** — sees a consent screen with App A's custom title / description before
  approving.

---

## App A — SDK (provider side)

### Define scope metadata

```ts
// List existing definitions
const defs = await prism.appScopePermissions.listDefinitions(token, appAId);

// Create (or update) a scope definition
const def = await prism.appScopePermissions.upsertDefinition(token, appAId, {
  scope: "read_posts",
  title: "Read posts",
  description: "View the user's published and draft posts",
});

// Update title / description later
await prism.appScopePermissions.updateDefinition(token, appAId, def.id, {
  description: "View the user's posts (published, scheduled, and drafts)",
});

// Delete a definition
await prism.appScopePermissions.deleteDefinition(token, appAId, def.id);
```

### Manage access rules

```ts
// List current rules
const rules = await prism.appScopePermissions.listAccessRules(token, appAId);

// Allow only a specific partner app to request your scopes at OAuth time
await prism.appScopePermissions.createAccessRule(token, appAId, {
  rule_type: "app_allow",
  target_id: "prism_partnerapp_clientid",
});

// Block a specific owner from registering your scopes in their app
await prism.appScopePermissions.createAccessRule(token, appAId, {
  rule_type: "owner_deny",
  target_id: "usr_bad_actor_id",
});

// Remove a rule
await prism.appScopePermissions.deleteAccessRule(token, appAId, rules[0].id);
```

**Rule semantics**

| `rule_type`    | Checked at…         | Effect                                                     |
|----------------|---------------------|------------------------------------------------------------|
| `owner_allow`  | `PATCH /apps/:id`   | Allowlist: only listed user IDs may register your scopes   |
| `owner_deny`   | `PATCH /apps/:id`   | Denylist: listed user IDs may never register your scopes   |
| `app_allow`    | OAuth authorize     | Allowlist: only listed client IDs may request your scopes  |
| `app_deny`     | OAuth authorize     | Denylist: listed client IDs may never request your scopes  |

If any `*_allow` rule exists the list becomes an allowlist; deny rules always apply.

### Verify incoming tokens on your API

When App B calls App A's API it passes the user's access token. Verify it with
token introspection:

```ts
const introspection = await prism.introspectToken(accessToken);

if (!introspection.active) throw new Error("Token inactive or expired");

const scopes = (introspection.scope ?? "").split(" ");
const requiredScope = `app:${appAClientId}:read_posts`;

if (!scopes.includes(requiredScope))
  throw new Error("Missing required scope");

// Optional: lock down to a specific consumer app
if (introspection.client_id !== appBClientId)
  throw new Error("Token was not issued to the expected app");

const userId = introspection.sub!;
```

---

## App B — SDK (consumer side)

### 1. Register the scope in App B's allowed_scopes

```ts
const app = await prism.apps.get(token, appBId);
const currentScopes = app.allowed_scopes;

await prism.apps.update(token, appBId, {
  allowed_scopes: [
    ...currentScopes,
    "app:prism_xxxxx:read_posts",  // App A's client_id + inner scope
  ],
});
```

This will fail with `403` if App A's owner access rules don't permit your user.

### 2. Request the scope during OAuth

Include the scope in the authorization URL alongside standard scopes:

```ts
const { url, pkce } = await prism.createAuthorizationUrl({
  scopes: ["openid", "profile", "app:prism_xxxxx:read_posts"],
  redirectUri: "https://appb.example/callback",
});

// Store pkce.codeVerifier, then redirect the user to `url`
```

### 3. Exchange the code

```ts
const tokens = await prism.exchangeCode(code, pkce.codeVerifier);
// tokens.access_token now carries the cross-app scope
```

### 4. Call App A's API

```ts
const res = await fetch("https://appa.example/api/posts", {
  headers: { Authorization: `Bearer ${tokens.access_token}` },
});
```

App A introspects the token, confirms the scope is present, and returns the data.

---

## Consent screen

When App A has defined scope metadata, the OAuth consent screen shows:

```
✔  Read posts
   View the user's published and draft posts   ← App A's description
   · App A · read_posts                        ← app name · inner scope
```

Without a definition the screen falls back to a generic description.

---

## TypeScript types

```ts
import type {
  AppScopeDefinition,
  AppScopeAccessRule,
  AppScopeAccessRuleType,
  CreateAppScopeDefinitionParams,
  UpdateAppScopeDefinitionParams,
  CreateAppScopeAccessRuleParams,
} from "@siiway/prism";

const params: CreateAppScopeDefinitionParams = {
  scope: "read_posts",
  title: "Read posts",
  description: "View published and draft posts",
};

const ruleParam: CreateAppScopeAccessRuleParams = {
  rule_type: "app_allow",
  target_id: "prism_partner_clientid",
};
```
