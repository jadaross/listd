import { userClient } from "@/lib/supabase";
import { PLATFORM_IDS } from "@/platforms";
import type { Platform } from "@/lib/types";
import type { AllowanceState } from "@/lib/allowance";

/**
 * A user's Enabled Platforms and their meter.
 *
 * Enabled Platforms live server-side rather than on the device because both
 * the Valuation and the meter read them (ADR-0006) — and because a client that
 * could pass its own platform list could ask for work it had not enabled.
 *
 * Every query here runs through `userClient`, so RLS and the column grants are
 * doing the enforcing: the read can only ever return the caller's own row, and
 * the write is physically incapable of touching the meter.
 */

export interface Profile {
  enabledPlatforms: Platform[];
  allowance: AllowanceState;
}

interface ProfileRow {
  enabled_platforms: Platform[];
  allowance_used: number;
  allowance_limit: number;
  allowance_period_start: string;
}

const SELECT = "enabled_platforms, allowance_used, allowance_limit, allowance_period_start";

function toProfile(row: ProfileRow): Profile {
  const periodStart = new Date(row.allowance_period_start);
  // The period is a calendar month, matching `date_trunc('month', now())` in
  // the migration — the meter's period boundary is defined there, not here.
  const resets = new Date(
    Date.UTC(periodStart.getUTCFullYear(), periodStart.getUTCMonth() + 1, 1)
  );
  return {
    enabledPlatforms: row.enabled_platforms,
    allowance: {
      used: row.allowance_used,
      limit: row.allowance_limit,
      resetsAt: resets.toISOString(),
    },
  };
}

export async function getProfile(token: string): Promise<Profile> {
  const { data, error } = await userClient(token)
    .from("profiles")
    .select(SELECT)
    .single();

  if (error) throw new Error(`Could not read profile: ${error.message}`);
  return toProfile(data as ProfileRow);
}

/** The caller's Enabled Platforms — what the Valuation is allowed to value. */
export async function getEnabledPlatforms(token: string): Promise<Platform[]> {
  return (await getProfile(token)).enabledPlatforms;
}

export class InvalidPlatformSet extends Error {}

/**
 * Validates here as well as in the database. The `enabled_platforms_not_empty`
 * check constraint is the real guarantee — this exists so the caller gets a
 * sentence explaining the problem instead of a Postgres constraint name.
 */
export function validatePlatformSet(input: unknown): Platform[] {
  if (!Array.isArray(input) || input.length === 0) {
    throw new InvalidPlatformSet("At least one platform must stay enabled");
  }
  const unknown = input.filter((p) => !PLATFORM_IDS.includes(p as Platform));
  if (unknown.length > 0) {
    throw new InvalidPlatformSet(`Unknown platform: ${unknown.join(", ")}`);
  }
  // Deduplicated so the stored set says what it means; order follows the
  // platform registry rather than however the client happened to send it.
  return PLATFORM_IDS.filter((p) => input.includes(p));
}

/**
 * `userId` narrows the UPDATE to one row explicitly. RLS would already scope it
 * to the caller — this is belt and braces, and it keeps the statement from
 * being a full-table update if a policy is ever loosened.
 */
export async function setEnabledPlatforms(
  token: string,
  userId: string,
  platforms: Platform[]
): Promise<Profile> {
  const { data, error } = await userClient(token)
    .from("profiles")
    .update({ enabled_platforms: platforms })
    .eq("id", userId)
    .select(SELECT)
    .single();

  if (error) throw new Error(`Could not update enabled platforms: ${error.message}`);
  return toProfile(data as ProfileRow);
}
