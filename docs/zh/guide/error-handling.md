# 错误处理

当服务器返回非 2xx 响应时，所有 API 方法都会抛出 `PrismError`。

## PrismError

```ts
import { PrismError } from "@siiway/prism";

try {
  const user = await prism.getUserInfo(expiredToken);
} catch (err) {
  if (err instanceof PrismError) {
    console.log(err.message);  // 服务器返回的错误消息
    console.log(err.status);   // HTTP 状态码（401、403 等）
    console.log(err.code);     // 错误代码（如果有）
    console.log(err.details);  // 完整的错误响应体
  }
}
```

## 常见错误码

| 状态码 | 含义 | 常见原因 |
| --- | --- | --- |
| 400 | 请求错误 | 无效的参数 |
| 401 | 未授权 | 令牌过期或无效 |
| 403 | 禁止访问 | 权限范围不足或非管理员 |
| 404 | 未找到 | 资源不存在 |
| 429 | 请求过多 | 触发了速率限制 |

## 令牌刷新模式

```ts
async function apiCall<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof PrismError && err.status === 401 && refreshToken) {
      const newTokens = await prism.refreshToken(refreshToken);
      accessToken = newTokens.access_token;
      refreshToken = newTokens.refresh_token ?? refreshToken;
      return await fn();
    }
    throw err;
  }
}

const user = await apiCall(() => prism.getUserInfo(accessToken));
```

## 自定义 Fetch

你可以提供自定义 `fetch` 来添加日志、重试逻辑或其他中间件：

```ts
const prism = new PrismClient({
  baseUrl: "https://id.example.com",
  clientId: "your-client-id",
  redirectUri: "http://localhost:3000/callback",
  fetch: async (url, init) => {
    console.log(`[prism] ${init?.method ?? "GET"} ${url}`);
    return globalThis.fetch(url, init);
  },
});
```
