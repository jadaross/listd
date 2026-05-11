import { getCategories } from "@/lib/categories";
import type { Gender, MainCategory } from "@/lib/categories";
import type { Listing, PlatformListing } from "@/lib/types";
import type { PlatformPublish, PlatformPublishResult } from "../types";
import { EBAY_API_BASE } from "./auth";

const CONDITION_MAP: Record<string, string> = {
  "New with tags": "NEW",
  Excellent: "LIKE_NEW",
  Good: "VERY_GOOD",
  Fair: "GOOD",
};

async function publishListing({
  listing,
  formatted,
  accessToken,
  isSandbox,
}: {
  listing: Listing;
  formatted: PlatformListing;
  accessToken: string;
  isSandbox: boolean;
}): Promise<PlatformPublishResult> {
  const sku = `listd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const condition = CONDITION_MAP[listing.condition] ?? "GOOD";

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
      description: formatted.description,
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
    throw new Error("Failed to create eBay inventory item");
  }

  // Step 2: Create offer
  const offerUrl = `${EBAY_API_BASE}/sell/inventory/v1/offer`;
  const merchantLocationKey = isSandbox ? "DEFAULT" : undefined;

  const offerBody: Record<string, unknown> = {
    sku,
    marketplaceId: "EBAY_GB",
    format: "FIXED_PRICE",
    availableQuantity: 1,
    categoryId: String(categoryId),
    listingDescription: formatted.description,
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
    throw new Error("Failed to create eBay offer");
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
    const viewUrl = isSandbox
      ? "https://www.sandbox.ebay.co.uk/itm/"
      : "https://www.ebay.co.uk/itm/";
    return {
      offerId,
      listingUrl: viewUrl,
      warning: "Listing created as draft — complete on eBay (images required)",
    };
  }

  const publishData = (await publishRes.json()) as { listingId: string };
  const listingId = publishData.listingId;
  const listingUrl = isSandbox
    ? `https://www.sandbox.ebay.co.uk/itm/${listingId}`
    : `https://www.ebay.co.uk/itm/${listingId}`;

  return { listingId, listingUrl };
}

export const publish: PlatformPublish = { publishListing };
