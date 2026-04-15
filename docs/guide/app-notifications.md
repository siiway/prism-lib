# App Notifications

`prism.appNotifications` provides access to all three real-time event delivery channels
that Prism supports for OAuth applications: webhooks, Server-Sent Events (SSE), and
WebSocket.

## Webhooks

Webhook management requires a **user access token** with write access to the app.

```ts
// List registered webhooks
const webhooks = await prism.appNotifications.listWebhooks(token, appId);

// Register a new webhook
const hook = await prism.appNotifications.createWebhook(token, appId, {
  url: "https://example.com/hooks/prism",
  events: ["user.token_granted", "user.token_revoked"],
  // secret is auto-generated if omitted
});
// hook.secret is only present in the creation response — store it now

// Update a webhook
await prism.appNotifications.updateWebhook(token, appId, hook.id, {
  is_active: false,
});

// Send a test ping
const result = await prism.appNotifications.testWebhook(token, appId, hook.id);
console.log(result.success, result.status); // true, 200

// View last 50 deliveries
const deliveries = await prism.appNotifications.listDeliveries(token, appId, hook.id);

// Delete a webhook
await prism.appNotifications.deleteWebhook(token, appId, hook.id);
```

### Verifying webhook signatures

Every incoming webhook request includes an `X-Prism-Signature` header. Verify it
before processing the payload:

```ts
import { createHmac, timingSafeEqual } from "node:crypto";

function verifyWebhookSignature(
  secret: string,
  rawBody: string | Buffer,
  signatureHeader: string,
): boolean {
  const expected =
    "sha256=" +
    createHmac("sha256", secret).update(rawBody).digest("hex");
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
}
```

## Server-Sent Events (SSE)

### Browser / `EventSource`

In a browser environment, use `openSSE()`. It returns a native `EventSource` whose
credentials are encoded in the URL (browsers cannot set custom headers on
`EventSource`):

```ts
const es = prism.appNotifications.openSSE(appId, clientId, clientSecret);

es.addEventListener("user.token_granted", (e) => {
  const event = JSON.parse(e.data);
  console.log("new grant:", event.data.user_id, event.data.scopes);
});

es.addEventListener("user.token_revoked", (e) => {
  const event = JSON.parse(e.data);
  console.log("revoked:", event.data.user_id);
});

es.onerror = (err) => {
  console.error("SSE error", err);
};

// Later, clean up:
es.close();
```

To resume after reconnection pass the last received event ID:

```ts
const es = prism.appNotifications.openSSE(appId, clientId, clientSecret, lastEventId);
```

### Server-side / `fetchSSE`

On Node.js, Bun, Deno, or Cloudflare Workers use the async-iterable `fetchSSE()`.
It uses the client's `fetch` implementation and sends credentials via the
`Authorization: Basic` header:

```ts
for await (const event of prism.appNotifications.fetchSSE(appId, clientId, clientSecret)) {
  switch (event.event) {
    case "user.token_granted": {
      const data = event.data as TokenGrantedData;
      console.log("granted", data.user_id, data.scopes);
      break;
    }
    case "user.token_revoked": {
      const data = event.data as TokenRevokedData;
      console.log("revoked", data.user_id);
      break;
    }
    case "user.updated": {
      const data = event.data as UserUpdatedData;
      console.log("updated", data.user_id, data.username);
      break;
    }
  }
}
```

Resume from a cursor:

```ts
for await (const event of prism.appNotifications.fetchSSE(
  appId,
  clientId,
  clientSecret,
  lastEventId,
)) {
  // ...
}
```

## WebSocket

```ts
const ws = prism.appNotifications.openWebSocket(appId, clientId, clientSecret);

ws.addEventListener("open", () => console.log("connected"));

ws.addEventListener("message", (e) => {
  const event = JSON.parse(e.data) as AppEvent;
  console.log(event.event, event.data);
});

ws.addEventListener("close", () => console.log("disconnected"));

// Later:
ws.close();
```

## Event types

| Type                 | Data interface      | Description                          |
|----------------------|---------------------|--------------------------------------|
| `user.token_granted` | `TokenGrantedData`  | User granted your app access         |
| `user.token_revoked` | `TokenRevokedData`  | User revoked your app's access       |
| `user.updated`       | `UserUpdatedData`   | User profile changed                 |

```ts
import type {
  AppEvent,
  AppEventType,
  TokenGrantedData,
  TokenRevokedData,
  UserUpdatedData,
} from "prism-lib";

// Strongly-typed event handler
function handleEvent(event: AppEvent) {
  if (event.event === "user.token_granted") {
    const data = event.data as TokenGrantedData;
    // data.user_id, data.scopes, data.granted_at
  }
}
```

## TypeScript types

```ts
interface AppWebhook {
  id: string;
  app_id: string;
  url: string;
  secret?: string; // only present on creation
  events: AppEventType[];
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

interface AppWebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: string;
  response_status: number | null;
  success: boolean;
  delivered_at: number;
}

interface AppEvent<T = unknown> {
  event: AppEventType;
  timestamp: number;
  data: T;
}
```
