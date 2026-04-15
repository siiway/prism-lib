# 应用通知

`prism.appNotifications` 提供对 Prism 支持的三种实时事件推送渠道的访问：Webhook、Server-Sent Events（SSE）和 WebSocket。

## Webhook

Webhook 管理需要具有该应用写权限的**用户访问令牌**。

```ts
// 列出已注册的 Webhook
const webhooks = await prism.appNotifications.listWebhooks(token, appId);

// 注册新 Webhook
const hook = await prism.appNotifications.createWebhook(token, appId, {
  url: "https://example.com/hooks/prism",
  events: ["user.token_granted", "user.token_revoked"],
  // 若省略 secret，将自动生成
});
// hook.secret 仅在创建响应中返回 — 请立即保存

// 更新 Webhook
await prism.appNotifications.updateWebhook(token, appId, hook.id, {
  is_active: false,
});

// 发送测试 ping
const result = await prism.appNotifications.testWebhook(token, appId, hook.id);
console.log(result.success, result.status); // true, 200

// 查看最近 50 条投递记录
const deliveries = await prism.appNotifications.listDeliveries(token, appId, hook.id);

// 删除 Webhook
await prism.appNotifications.deleteWebhook(token, appId, hook.id);
```

### 验证 Webhook 签名

每个收到的 Webhook 请求都包含 `X-Prism-Signature` 请求头。处理载荷前请先验证签名：

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

## Server-Sent Events（SSE）

### 浏览器 / `EventSource`

在浏览器环境中使用 `openSSE()`。它返回一个原生 `EventSource`，凭据被编码在 URL 中（浏览器的 `EventSource` 不支持自定义请求头）：

```ts
const es = prism.appNotifications.openSSE(appId, clientId, clientSecret);

es.addEventListener("user.token_granted", (e) => {
  const event = JSON.parse(e.data);
  console.log("新授权：", event.data.user_id, event.data.scopes);
});

es.addEventListener("user.token_revoked", (e) => {
  const event = JSON.parse(e.data);
  console.log("已撤销：", event.data.user_id);
});

es.onerror = (err) => {
  console.error("SSE 错误", err);
};

// 使用完毕后关闭：
es.close();
```

断线重连时传入上次收到的事件 ID 以续传：

```ts
const es = prism.appNotifications.openSSE(appId, clientId, clientSecret, lastEventId);
```

### 服务端 / `fetchSSE`

在 Node.js、Bun、Deno 或 Cloudflare Workers 中使用异步可迭代的 `fetchSSE()`。它使用客户端的 `fetch` 实现，并通过 `Authorization: Basic` 请求头发送凭据：

```ts
for await (const event of prism.appNotifications.fetchSSE(appId, clientId, clientSecret)) {
  switch (event.event) {
    case "user.token_granted": {
      const data = event.data as TokenGrantedData;
      console.log("已授权", data.user_id, data.scopes);
      break;
    }
    case "user.token_revoked": {
      const data = event.data as TokenRevokedData;
      console.log("已撤销", data.user_id);
      break;
    }
    case "user.updated": {
      const data = event.data as UserUpdatedData;
      console.log("已更新", data.user_id, data.username);
      break;
    }
  }
}
```

从游标位置续传：

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

ws.addEventListener("open", () => console.log("已连接"));

ws.addEventListener("message", (e) => {
  const event = JSON.parse(e.data) as AppEvent;
  console.log(event.event, event.data);
});

ws.addEventListener("close", () => console.log("已断开"));

// 关闭连接：
ws.close();
```

## 事件类型

| 类型                  | 数据接口            | 说明                           |
|-----------------------|---------------------|--------------------------------|
| `user.token_granted`  | `TokenGrantedData`  | 用户向您的应用授予了访问权限   |
| `user.token_revoked`  | `TokenRevokedData`  | 用户撤销了对您应用的授权       |
| `user.updated`        | `UserUpdatedData`   | 用户个人资料发生了变更         |

```ts
import type {
  AppEvent,
  AppEventType,
  TokenGrantedData,
  TokenRevokedData,
  UserUpdatedData,
} from "prism-lib";

// 强类型事件处理
function handleEvent(event: AppEvent) {
  if (event.event === "user.token_granted") {
    const data = event.data as TokenGrantedData;
    // data.user_id, data.scopes, data.granted_at
  }
}
```

## TypeScript 类型

```ts
interface AppWebhook {
  id: string;
  app_id: string;
  url: string;
  secret?: string; // 仅在创建时返回
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
