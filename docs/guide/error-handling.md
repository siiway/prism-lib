# Error Handling

All API methods throw `PrismError` when the server returns a non-2xx response.

## PrismError

```ts
import { PrismError } from "@siiway/prism";

try {
  const user = await prism.getUserInfo(expiredToken);
} catch (err) {
  if (err instanceof PrismError) {
    console.log(err.message);  // error message from server
    console.log(err.status);   // HTTP status code (401, 403, etc.)
    console.log(err.code);     // error code (if provided)
    console.log(err.details);  // full error response body
  }
}
```

## Common Error Codes

| Status | Meaning | Typical Cause |
| --- | --- | --- |
| 400 | Bad Request | Invalid parameters |
| 401 | Unauthorized | Expired or invalid token |
| 403 | Forbidden | Insufficient scopes or not an admin |
| 404 | Not Found | Resource does not exist |
| 429 | Too Many Requests | Rate limited |

## Token Refresh Pattern

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

## Custom Fetch

You can provide a custom `fetch` to add logging, retry logic, or other middleware:

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
