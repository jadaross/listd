import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Three ways to reach Supabase, kept apart on purpose.
 *
 *   anonClient    — verifies a bearer token. No user attached.
 *   userClient    — acts AS the caller, so RLS decides what they may touch.
 *   serviceClient — bypasses RLS. The meter only. See ADR-0007.
 *
 * Reaching for the service client where a user client would do is how a
 * multi-tenant app leaks one user's row to another: RLS stops being the
 * safety net the moment every query runs as the service role.
 *
 * The clients are stateless: no session is persisted and no token is
 * refreshed, because a server has no session to keep — the iOS app owns the
 * session and sends its access token on every request.
 */

const STATELESS = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
} as const;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

let _anon: SupabaseClient | null = null;
let _service: SupabaseClient | null = null;

/** Anonymous client — used to verify bearer tokens against Supabase Auth. */
export function anonClient(): SupabaseClient {
  if (_anon) return _anon;
  _anon = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    STATELESS
  );
  return _anon;
}

/**
 * A client that acts as the signed-in caller. Every query it makes is subject
 * to the same RLS policies and column grants the iOS app would hit directly,
 * so a bug here cannot read or write another user's row.
 */
export function userClient(accessToken: string): SupabaseClient {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    { ...STATELESS, global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  );
}

/**
 * Bypasses RLS entirely. Only the Allowance meter should use it: the meter has
 * to move a counter the user is deliberately forbidden from writing, which is
 * exactly the case RLS cannot express. Never hand this to a request path that
 * is only reading the caller's own data.
 */
export function serviceClient(): SupabaseClient {
  if (_service) return _service;
  _service = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    STATELESS
  );
  return _service;
}

/** Test seam: drops the memoised clients so env changes take effect. */
export function resetSupabaseClients(): void {
  _anon = null;
  _service = null;
}
