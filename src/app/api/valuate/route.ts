import { recommend, valuate } from "@/lib/valuation";
import { PLATFORM_IDS } from "@/platforms";
import type { Platform, ValuationItem } from "@/lib/types";

export const runtime = "nodejs";

interface RequestBody {
  item: ValuationItem;
  /**
   * The caller's Enabled Platforms. Moves server-side once #9 lands — at that
   * point this field goes away and the set is read from the user's record.
   */
  platforms: Platform[];
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 });
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { item, platforms } = body;
  if (!item || !item.brand || !item.clothing_type || !item.size || !item.condition) {
    return Response.json(
      { error: "item requires brand, clothing_type, size and condition" },
      { status: 400 }
    );
  }
  if (!Array.isArray(platforms) || platforms.length === 0) {
    return Response.json({ error: "At least one platform must be enabled" }, { status: 400 });
  }

  const unknown = platforms.filter((p) => !PLATFORM_IDS.includes(p));
  if (unknown.length > 0) {
    return Response.json({ error: `Unknown platform: ${unknown.join(", ")}` }, { status: 400 });
  }

  try {
    const valuation = await valuate(item, platforms);
    // Null with a single Enabled Platform — there is nothing to choose
    // between, and no comparison work runs. See ADR-0004.
    return Response.json({ ...valuation, recommendation: recommend(valuation) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: `Valuation failed: ${message}` }, { status: 500 });
  }
}
