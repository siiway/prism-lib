/**
 * Verify a Prism ML-DSA-65 access token without a client secret.
 *
 * App A calls this to confirm that:
 *  1. The token was genuinely issued by Prism (cryptographic signature).
 *  2. The token was issued FOR App A (`aud` contains App A's client_id).
 *  3. The token grants the expected scope.
 *  4. The token has not expired.
 *
 * The JWKS is fetched from `{issuer}/.well-known/jwks.json` and cached
 * in memory for the lifetime of the module (re-fetched after a key-miss).
 *
 * No client secret is needed — the ML-DSA-65 public key does all the work.
 */

import { ml_dsa65 } from "@noble/post-quantum/ml-dsa.js";

// ── Base64url helpers ─────────────────────────────────────────────────────────

function b64urlToBytes(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = (4 - (padded.length % 4)) % 4;
  const bin = atob(padded + "=".repeat(pad));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

// ── JWKS cache ────────────────────────────────────────────────────────────────

interface JwksCache {
  keys: Map<string, Uint8Array>; // kid → publicKey bytes
  fetchedAt: number;
}

// Module-level cache (one entry per issuer)
const jwksCache = new Map<string, JwksCache>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function fetchMLDSAKeys(
  issuer: string,
  forceRefresh = false,
): Promise<Map<string, Uint8Array>> {
  const cached = jwksCache.get(issuer);
  if (cached && !forceRefresh && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.keys;
  }

  const url = `${issuer.replace(/\/$/, "")}/.well-known/jwks.json`;
  const res = await fetch(url);
  if (!res.ok)
    throw new Error(`Failed to fetch JWKS from ${url}: ${res.status}`);

  const { keys } = (await res.json()) as { keys: unknown[] };
  const map = new Map<string, Uint8Array>();

  for (const key of keys) {
    const k = key as Record<string, unknown>;
    if (
      k.kty === "ML-DSA" &&
      k.alg === "ML-DSA-65" &&
      typeof k.pub === "string" &&
      typeof k.kid === "string"
    ) {
      map.set(k.kid, b64urlToBytes(k.pub));
    }
  }

  jwksCache.set(issuer, { keys: map, fetchedAt: Date.now() });
  return map;
}

// ── Payload type ──────────────────────────────────────────────────────────────

export interface VerifiedAccessToken {
  /** Prism issuer URL */
  iss: string;
  /** User ID */
  sub: string;
  /** Intended audiences — includes this app's client_id for cross-app tokens */
  aud: string[];
  /** OAuth client (App B) that obtained the token */
  client_id: string;
  /** Token ID (jti) — use for idempotency or replay detection */
  jti: string;
  /** Space-separated scope string */
  scope: string;
  /** Issued-at (Unix seconds) */
  iat: number;
  /** Expiry (Unix seconds) */
  exp: number;
}

// ── Main API ──────────────────────────────────────────────────────────────────

export interface VerifyTokenOptions {
  /**
   * Your app's client_id. When provided, the `aud` claim must contain it.
   * Strongly recommended for cross-app token verification.
   */
  audience?: string;
  /**
   * Required scope. When provided, the token must include it.
   */
  requiredScope?: string;
}

/**
 * Verify a Prism access token using ML-DSA-65 post-quantum signatures.
 *
 * @example
 * ```ts
 * import { verifyToken } from '@siiway/prism';
 *
 * const token = await verifyToken(req.headers.authorization.slice(7), {
 *   issuer: 'https://prism.example.com',
 *   audience: 'my-app-client-id',
 *   requiredScope: 'app:my-app-client-id:read_posts',
 * });
 * console.log('User:', token.sub, 'via app:', token.client_id);
 * ```
 */
export async function verifyToken(
  token: string,
  options: VerifyTokenOptions & { issuer: string },
): Promise<VerifiedAccessToken> {
  const { issuer, audience, requiredScope } = options;

  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Not a valid JWT");

  const [headerB64, bodyB64, sigB64] = parts;

  // Decode header to get kid
  const header = JSON.parse(
    new TextDecoder().decode(b64urlToBytes(headerB64)),
  ) as Record<string, unknown>;

  if (header.alg !== "ML-DSA-65") {
    throw new Error(`Unsupported algorithm: ${header.alg}`);
  }
  const kid = String(header.kid ?? "");

  // Fetch JWKS (cached), retry once on key-miss to handle key rotation
  let keys = await fetchMLDSAKeys(issuer);
  let publicKey = keys.get(kid);
  if (!publicKey) {
    keys = await fetchMLDSAKeys(issuer, true);
    publicKey = keys.get(kid);
  }
  if (!publicKey) throw new Error(`Unknown kid: ${kid}`);

  // Verify signature
  const msg = new TextEncoder().encode(`${headerB64}.${bodyB64}`);
  const sig = b64urlToBytes(sigB64);
  if (!ml_dsa65.verify(publicKey, msg, sig))
    throw new Error("Invalid JWT signature");

  // Decode payload
  const payload = JSON.parse(
    new TextDecoder().decode(b64urlToBytes(bodyB64)),
  ) as VerifiedAccessToken;

  // Validate standard claims
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) throw new Error("Token expired");
  if (payload.iss !== issuer)
    throw new Error(`Unexpected issuer: ${payload.iss}`);

  // Audience check
  if (audience) {
    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!aud.includes(audience))
      throw new Error(`Token audience does not include ${audience}`);
  }

  // Scope check
  if (requiredScope) {
    const scopes = payload.scope.split(" ");
    if (!scopes.includes(requiredScope))
      throw new Error(`Token missing required scope: ${requiredScope}`);
  }

  return payload;
}
