import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase";
import { getValidAccessToken } from "@/platforms/ebay/auth";
import { publish } from "@/platforms/ebay/publish";
import type { Listing, PlatformListing } from "@/lib/types";

interface RequestBody {
  listing: Listing;
  formatted: PlatformListing;
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { listing, formatted } = body;
  if (!listing || !formatted) {
    return Response.json(
      { error: "listing and formatted are required" },
      { status: 400 }
    );
  }

  let accessToken: string;
  try {
    accessToken = await getValidAccessToken(session.user.id, supabase);
  } catch {
    return Response.json(
      { error: "eBay account not connected" },
      { status: 403 }
    );
  }

  const isSandbox = process.env.EBAY_ENVIRONMENT !== "production";

  try {
    const result = await publish.publishListing({
      listing,
      formatted,
      accessToken,
      isSandbox,
    });
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 502 });
  }
}
