import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase";
import { getValidAccessToken, EBAY_API_BASE } from "@/lib/ebay-auth";
import { getCategories } from "@/lib/categories";
import type { Listing, PlatformListing } from "@/lib/types";
import type { Gender, MainCategory } from "@/lib/categories";

interface RequestBody {
  listing: Listing;
  formatted: PlatformListing;
}

const CONDITION_MAP: Record<string, string> = {
  "New with tags": "NEW",
  Excellent: "LIKE_NEW",
  Good: "VERY_GOOD",
  Fair: "GOOD",
};

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
  const sku = `listd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const condition =
    CONDITION_MAP[listing.condition] ?? "GOOD";

  const cats = getCategories(
    (listing.gender ?? "women") as Gender,
    (listing.main_category ?? "other") as MainCategory
  );
  const categoryId = cats.ebay.id;

  const listingPrice = listing.price_min;

  // Step 1: Create inventory item
  const inventoryUrl = `${EBAY_API_BASE}/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`;
  const inventoryBody = {
    product: {
      title: formatted.title,
      description: `${formatted.description}\n\n${formatted.hashtags.join(" ")}`,
      aspects: {
        Brand: [listing.brand || "Unknown"],
        Size: [listing.size || "See description"],
        Colour: [listing.colour_primary || "See description"],
        Material: listing.material ? [listing.material] : undefined,
        Condition: [listing.condition],
      },
    },
    condition,
    availability: {
      shipToLocationAvailability: { quantity: 1 },
    },
  };

  const inventoryRes = await fetch(inventoryUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Content-Language": "en-GB",
      "Accept-Language": "en-GB",
    },
    body: JSON.stringify(inventoryBody),
  });

  if (!inventoryRes.ok && inventoryRes.status !== 204) {
    const errText = await inventoryRes.text();
    console.error("eBay inventory PUT error:", errText);
    return Response.json(
      { error: "Failed to create eBay inventory item" },
      { status: 502 }
    );
  }

  // Step 2: Create offer
  const offerUrl = `${EBAY_API_BASE}/sell/inventory/v1/offer`;

  // eBay sandbox merchant location key (required) — use a placeholder
  const merchantLocationKey = isSandbox ? "DEFAULT" : undefined;

  const offerBody: Record<string, unknown> = {
    sku,
    marketplaceId: "EBAY_GB",
    format: "FIXED_PRICE",
    availableQuantity: 1,
    categoryId: String(categoryId),
    listingDescription: `${formatted.description}\n\n${formatted.hashtags.join(" ")}`,
    listingPolicies: {},
    pricingSummary: {
      price: {
        value: String(listingPrice.toFixed(2)),
        currency: "GBP",
      },
    },
    ...(merchantLocationKey ? { merchantLocationKey } : {}),
  };

  const offerRes = await fetch(offerUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Content-Language": "en-GB",
    },
    body: JSON.stringify(offerBody),
  });

  if (!offerRes.ok) {
    const errText = await offerRes.text();
    console.error("eBay offer POST error:", errText);
    return Response.json(
      { error: "Failed to create eBay offer" },
      { status: 502 }
    );
  }

  const offerData = (await offerRes.json()) as { offerId: string };
  const offerId = offerData.offerId;

  // Step 3: Publish offer
  const publishUrl = `${EBAY_API_BASE}/sell/inventory/v1/offer/${offerId}/publish`;
  const publishRes = await fetch(publishUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!publishRes.ok) {
    const errText = await publishRes.text();
    console.error("eBay publish error:", errText);
    // Return offerId so user can complete on eBay
    const viewUrl = isSandbox
      ? `https://www.sandbox.ebay.co.uk/itm/`
      : `https://www.ebay.co.uk/itm/`;
    return Response.json({
      offerId,
      listingUrl: viewUrl,
      warning: "Listing created as draft — complete on eBay (images required)",
    });
  }

  const publishData = (await publishRes.json()) as { listingId: string };
  const listingId = publishData.listingId;
  const listingUrl = isSandbox
    ? `https://www.sandbox.ebay.co.uk/itm/${listingId}`
    : `https://www.ebay.co.uk/itm/${listingId}`;

  return Response.json({ listingId, listingUrl });
}
