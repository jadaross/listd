import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

// In-memory cache for app-level (client credentials) token
let _appToken: string | null = null;
let _appTokenExpiresAt = 0;

export async function getAppToken(): Promise<string> {
  const now = Date.now();
  if (_appToken && now < _appTokenExpiresAt - 60_000) {
    return _appToken;
  }

  const credentials = `${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`;
  const basic = Buffer.from(credentials).toString("base64");
  const isSandboxEnv = process.env.EBAY_ENVIRONMENT !== "production";
  const tokenUrl = isSandboxEnv
    ? "https://api.sandbox.ebay.com/identity/v1/oauth2/token"
    : "https://api.ebay.com/identity/v1/oauth2/token";

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: "grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`eBay app token fetch failed: ${text}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  _appToken = data.access_token;
  _appTokenExpiresAt = now + data.expires_in * 1000;
  return _appToken;
}

const isSandbox = process.env.EBAY_ENVIRONMENT !== "production";

export const EBAY_BASE_URL = isSandbox
  ? "https://auth.sandbox.ebay.com"
  : "https://auth.ebay.com";

export const EBAY_API_BASE = isSandbox
  ? "https://api.sandbox.ebay.com"
  : "https://api.ebay.com";

const EBAY_TOKEN_URL = isSandbox
  ? "https://api.sandbox.ebay.com/identity/v1/oauth2/token"
  : "https://api.ebay.com/identity/v1/oauth2/token";

const SCOPES = [
  "https://api.ebay.com/oauth/api_scope/sell.inventory",
  "https://api.ebay.com/oauth/api_scope/sell.account",
].join(" ");

export interface EbayTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number; // seconds
  refresh_token_expires_in?: number;
  token_type: string;
}

export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.EBAY_CLIENT_ID!,
    redirect_uri: process.env.EBAY_RU_NAME!,
    response_type: "code",
    scope: SCOPES,
    state,
  });
  return `${EBAY_BASE_URL}/oauth2/authorize?${params.toString()}`;
}

function basicAuth(): string {
  const credentials = `${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`;
  return Buffer.from(credentials).toString("base64");
}

export async function exchangeCode(code: string): Promise<EbayTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: process.env.EBAY_RU_NAME!,
  });

  const res = await fetch(EBAY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth()}`,
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`eBay token exchange failed: ${text}`);
  }

  return res.json() as Promise<EbayTokenResponse>;
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<EbayTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    scope: SCOPES,
  });

  const res = await fetch(EBAY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth()}`,
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`eBay token refresh failed: ${text}`);
  }

  return res.json() as Promise<EbayTokenResponse>;
}

// AES-256-GCM encryption — format: iv(24 hex):authTag(32 hex):ciphertext(hex)
function getKey(): Buffer {
  const secret = process.env.EBAY_TOKEN_SECRET;
  if (!secret || secret.length !== 64) {
    throw new Error(
      "EBAY_TOKEN_SECRET must be 64 hex characters (32 bytes)"
    );
  }
  return Buffer.from(secret, "hex");
}

export function encryptToken(plain: string): string {
  const key = getKey();
  const iv = randomBytes(12); // 96-bit IV for GCM
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptToken(enc: string): string {
  const key = getKey();
  const parts = enc.split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted token format");
  const [ivHex, authTagHex, ciphertextHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const ciphertext = Buffer.from(ciphertextHex, "hex");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

export async function getValidAccessToken(
  userId: string,
  supabase: SupabaseClient
): Promise<string> {
  const { data, error } = await supabase
    .from("platform_connections")
    .select("access_token_enc, refresh_token_enc, expires_at")
    .eq("user_id", userId)
    .eq("platform", "ebay")
    .single();

  if (error || !data) throw new Error("No eBay connection found");

  const expiresAt = new Date(data.expires_at).getTime();
  const nowMs = Date.now();
  const bufferMs = 5 * 60 * 1000; // 5 minute buffer

  if (nowMs + bufferMs < expiresAt) {
    // Token still valid
    return decryptToken(data.access_token_enc);
  }

  // Refresh
  const refreshToken = decryptToken(data.refresh_token_enc);
  const tokens = await refreshAccessToken(refreshToken);
  const newExpiresAt = new Date(
    Date.now() + tokens.expires_in * 1000
  ).toISOString();

  await supabase
    .from("platform_connections")
    .update({
      access_token_enc: encryptToken(tokens.access_token),
      refresh_token_enc: encryptToken(tokens.refresh_token),
      expires_at: newExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("platform", "ebay");

  return tokens.access_token;
}
