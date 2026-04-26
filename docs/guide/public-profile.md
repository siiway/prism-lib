# Public Profiles

Prism users can opt into a public-facing profile at `/u/<username>`, and team owners can opt their teams into one at `/t/<team-id>`. The SDK exposes both endpoints — no token, scopes, or OAuth flow required.

## Fetch a public user profile

```ts
import { PrismClient } from "@siiway/prism";

const client = new PrismClient({
  baseUrl: "https://your-prism-domain",
  clientId: "your-client-id",
  redirectUri: "https://yourapp.example/callback",
});

const profile = await client.getPublicProfile("alice");

if (profile === null) {
  // User doesn't exist, hasn't opted in, or the instance has the
  // feature disabled — Prism returns the same 404 for all three so
  // the endpoint can't be used to enumerate usernames.
  return;
}

console.log(profile.display_name, profile.gpg_keys);
```

`getPublicProfile()` returns `null` for any 404/403 response and throws `PrismError` for unexpected errors (network, 5xx, malformed JSON).

## Optional fields

Every field beyond `username` can be `null` if the user opted not to share it:

```ts
interface PublicUserProfile {
  username: string;
  display_name: string | null;
  avatar_url: string | null;            // already proxied — safe to load
  unproxied_avatar_url: string | null;  // raw upstream URL
  email: string | null;
  joined_at: number | null;             // unix seconds
  gpg_keys: PublicProfileGpgKey[] | null;
  authorized_apps: PublicProfileAuthorizedApp[] | null;
  owned_apps: PublicProfileOwnedApp[] | null;
  domains: PublicProfileDomain[] | null;  // verified, user-owned domains
}
```

Render only what's truthy:

```tsx
{profile.display_name && <h1>{profile.display_name}</h1>}
{profile.avatar_url && <img src={profile.avatar_url} alt="" />}
{profile.gpg_keys?.length && <GpgKeyList keys={profile.gpg_keys} />}
{profile.domains?.length && <DomainList domains={profile.domains} />}
```

## Fetch a public team profile

```ts
const team = await client.getPublicTeamProfile("team_abc123");

if (team === null) {
  // Team doesn't exist, isn't public, or the feature is disabled.
  return;
}

console.log(team.name, team.member_count, team.apps);
```

The shape mirrors users — every section the team chose to hide comes back as `null`:

```ts
interface PublicTeamProfile {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  unproxied_avatar_url: string | null;
  created_at: number;
  owner: PublicTeamOwner | null;     // see "Owner privacy" below
  member_count: number | null;       // count only, never the list
  apps: PublicTeamApp[] | null;
  domains: PublicProfileDomain[] | null;
}
```

### Owner privacy

`team.owner` follows a small extra rule worth knowing about. When the team has opted to surface its owner, but the owner's *own* user profile is still private, the SDK returns:

```ts
{ username: null, display_name: "Alice", avatar_url: null }
```

That is — only the display name. `username` is `null` so you don't accidentally render a `/u/alice` link to a profile the user hasn't opted into. Branch on `owner.username` before generating any link:

```tsx
{team.owner && (
  team.owner.username
    ? <Link to={`/u/${team.owner.username}`}>@{team.owner.username}</Link>
    : <span>{team.owner.display_name}</span>
)}
```

## Preview a private profile

Both methods accept an `accessToken` for previewing private profiles:

```ts
// User: only the owner's own token bypasses the private flag
const profile = await client.getPublicProfile(myUsername, {
  accessToken: mySessionToken,
});

// Team: any team member's token works (not just the owner) — useful for
// "preview public profile" buttons inside team settings
const team = await client.getPublicTeamProfile(teamId, {
  accessToken: mySessionToken,
});
```

A token belonging to someone unrelated to the target is ignored — the response still depends on the target's own opt-in.

## GPG keys

The `gpg_keys` array surfaces metadata only:

```ts
{
  fingerprint: "abcd1234...",
  key_id: "abcdef0123456789",
  name: "laptop",
  created_at: 1730000000
}
```

For the full ASCII-armored key block, fetch the long-standing federated endpoint:

```bash
curl https://your-prism-domain/users/alice.gpg
```

That endpoint is independent of the public-profile visibility flags.

## See also

The user-facing UX, schema, and admin defaults are documented in the main Prism docs at [Public Profiles](https://prism.wss.moe/public-profile).
