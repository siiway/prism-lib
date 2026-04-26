# 公开资料

Prism 用户可以启用 `/u/<username>` 路径下的公开资料页面，团队所有者也可以将团队公开为 `/t/<team-id>`。SDK 同时支持两个接口——无需令牌、权限范围或 OAuth 流程。

## 获取公开用户资料

```ts
import { PrismClient } from "@siiway/prism";

const client = new PrismClient({
  baseUrl: "https://your-prism-domain",
  clientId: "your-client-id",
  redirectUri: "https://yourapp.example/callback",
});

const profile = await client.getPublicProfile("alice");

if (profile === null) {
  // 用户不存在、未启用公开资料，或站点已禁用此功能——
  // 三种情况下 Prism 都返回同一个 404，因此该接口无法用于枚举
  // 用户名。
  return;
}

console.log(profile.display_name, profile.gpg_keys);
```

对于 404/403 响应，`getPublicProfile()` 返回 `null`；网络错误、5xx 或 JSON 解析失败等异常情况则抛出 `PrismError`。

## 可空字段

除 `username` 外的所有字段在用户隐藏时都可能为 `null`：

```ts
interface PublicUserProfile {
  username: string;
  display_name: string | null;
  avatar_url: string | null;            // 已代理过——可直接加载
  unproxied_avatar_url: string | null;  // 原始上游 URL
  email: string | null;
  joined_at: number | null;             // Unix 秒
  gpg_keys: PublicProfileGpgKey[] | null;
  authorized_apps: PublicProfileAuthorizedApp[] | null;
  owned_apps: PublicProfileOwnedApp[] | null;
  domains: PublicProfileDomain[] | null;  // 用户拥有的已验证域名
}
```

仅渲染非空字段：

```tsx
{profile.display_name && <h1>{profile.display_name}</h1>}
{profile.avatar_url && <img src={profile.avatar_url} alt="" />}
{profile.gpg_keys?.length && <GpgKeyList keys={profile.gpg_keys} />}
{profile.domains?.length && <DomainList domains={profile.domains} />}
```

## 获取公开团队资料

```ts
const team = await client.getPublicTeamProfile("team_abc123");

if (team === null) {
  // 团队不存在、未公开，或站点已禁用此功能。
  return;
}

console.log(team.name, team.member_count, team.apps);
```

形态与用户接口一致——团队选择隐藏的分区会以 `null` 返回：

```ts
interface PublicTeamProfile {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  unproxied_avatar_url: string | null;
  created_at: number;
  owner: PublicTeamOwner | null;     // 见下方"所有者隐私"
  member_count: number | null;       // 仅数字，永不返回成员列表
  apps: PublicTeamApp[] | null;
  domains: PublicProfileDomain[] | null;
}
```

### 所有者隐私

`team.owner` 有一条特殊规则。当团队选择暴露所有者，但该所有者**自身**的用户资料仍处于私密状态时，SDK 会返回：

```ts
{ username: null, display_name: "Alice", avatar_url: null }
```

也就是说——只有显示名称可见。`username` 为 `null`，避免你不小心生成一个指向 `/u/alice` 的链接（而该用户从未选择公开自己）。在生成链接前请先判断 `owner.username`：

```tsx
{team.owner && (
  team.owner.username
    ? <Link to={`/u/${team.owner.username}`}>@{team.owner.username}</Link>
    : <span>{team.owner.display_name}</span>
)}
```

## 预览私密资料

两个方法都支持传入 `accessToken` 用于预览私密资料：

```ts
// 用户：仅所有者本人的令牌可以绕过私密标志
const profile = await client.getPublicProfile(myUsername, {
  accessToken: mySessionToken,
});

// 团队：任何团队成员（不限所有者）的令牌都可以——便于在团队设置
// 中实现"预览公开资料"按钮
const team = await client.getPublicTeamProfile(teamId, {
  accessToken: mySessionToken,
});
```

无关令牌（既非所有者也非团队成员）会被忽略——响应仍取决于目标自身的选择。

## GPG 公钥

`gpg_keys` 数组只包含元数据：

```ts
{
  fingerprint: "abcd1234...",
  key_id: "abcdef0123456789",
  name: "laptop",
  created_at: 1730000000
}
```

如需完整的 ASCII-armored 公钥文本，请直接访问长期存在的联邦化接口：

```bash
curl https://your-prism-domain/users/alice.gpg
```

该接口不受公开资料的可见性开关影响。

## 参见

用户面板的交互、数据库结构以及管理员默认值，详见 Prism 主文档的[公开资料](https://prism.wss.moe/zh/public-profile)章节。
