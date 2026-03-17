# 快速开始

## 前提条件

- 一个运行中的 [Prism](https://github.com/siiway/prism) 实例
- 在 Prism 中注册的 OAuth 应用（设置 > OAuth 应用）
- 你的应用的 **Client ID** 和 **Redirect URI**

## 安装

```bash
# Bun
bun add @siiway/prism

# npm
npm install @siiway/prism

# pnpm
pnpm add @siiway/prism
```

## 创建客户端

```ts
import { PrismClient } from "@siiway/prism";

const prism = new PrismClient({
  baseUrl: "https://id.example.com",
  clientId: "your-client-id",
  redirectUri: "http://localhost:3000/callback",
  scopes: ["openid", "profile", "email"],
});
```

### 选项

| 选项 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `baseUrl` | `string` | 是 | Prism 实例的 URL |
| `clientId` | `string` | 是 | OAuth 客户端 ID |
| `redirectUri` | `string` | 是 | 登录后的默认回调地址 |
| `clientSecret` | `string` | 否 | 客户端密钥（仅服务端） |
| `scopes` | `string[]` | 否 | 默认请求的权限范围（默认 `openid profile email`） |
| `fetch` | `typeof fetch` | 否 | 自定义 fetch 实现 |

## 下一步

- [OAuth 流程](./oauth-flow) - 了解完整的授权流程
- [令牌管理](./token-management) - 刷新、内省和撤销令牌
- [资源 API](./resource-apis) - 使用令牌访问用户数据
