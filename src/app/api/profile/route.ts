import { withAuth } from "@/lib/auth";
import {
  getProfile,
  InvalidPlatformSet,
  setEnabledPlatforms,
  validatePlatformSet,
} from "@/lib/profile";

export const runtime = "nodejs";

/**
 * The caller's account: which Platforms they sell on, and where their
 * Allowance stands. This is what onboarding writes (#16) and what Settings
 * edits afterwards.
 */
export const GET = withAuth(async (_request, user) => {
  try {
    const profile = await getProfile(user.token);
    return Response.json({
      enabled_platforms: profile.enabledPlatforms,
      allowance: {
        used: profile.allowance.used,
        limit: profile.allowance.limit,
        resets_at: profile.allowance.resetsAt,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
});

interface PatchBody {
  enabled_platforms?: unknown;
}

export const PATCH = withAuth(async (request, user) => {
  let body: PatchBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let platforms;
  try {
    platforms = validatePlatformSet(body.enabled_platforms);
  } catch (err) {
    if (err instanceof InvalidPlatformSet) {
      return Response.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  try {
    const profile = await setEnabledPlatforms(user.token, user.id, platforms);
    return Response.json({ enabled_platforms: profile.enabledPlatforms });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
});
