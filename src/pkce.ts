import type { PKCEChallenge } from "./types.js";

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  if (typeof globalThis.crypto !== "undefined") {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    // Fallback for older Node.js without globalThis.crypto
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return bytes;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) {
    binary += String.fromCharCode(b);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256(plain: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await globalThis.crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(hash);
}

/** Generate a random code verifier string (43–128 characters) */
export function generateCodeVerifier(length = 64): string {
  const bytes = randomBytes(length);
  return base64UrlEncode(bytes).slice(0, length);
}

/** Derive S256 code challenge from a code verifier */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const hash = await sha256(verifier);
  return base64UrlEncode(hash);
}

/** Generate a random state string */
export function generateState(): string {
  return base64UrlEncode(randomBytes(32));
}

/** Generate a full PKCE challenge (verifier + challenge + state) */
export async function generatePKCEChallenge(): Promise<PKCEChallenge> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateState();
  return { codeVerifier, codeChallenge, state };
}
