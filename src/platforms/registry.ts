import type { Platform } from "@/lib/types";
import type {
  PlatformListingSpec,
  PlatformMarket,
  PlatformMetadata,
  PlatformPublish,
} from "./types";

import { metadata as vintedMetadata } from "./vinted/metadata";
import { listingSpec as vintedListingSpec } from "./vinted/listing-spec";
import { market as vintedMarket } from "./vinted/market";

import { metadata as depopMetadata } from "./depop/metadata";
import { listingSpec as depopListingSpec } from "./depop/listing-spec";
import { market as depopMarket } from "./depop/market";

import { metadata as ebayMetadata } from "./ebay/metadata";
import { listingSpec as ebayListingSpec } from "./ebay/listing-spec";
import { market as ebayMarket } from "./ebay/market";

export const platformMetadata: Record<Platform, PlatformMetadata> = {
  vinted: vintedMetadata,
  depop: depopMetadata,
  ebay: ebayMetadata,
};

export const platformListingSpec: Record<Platform, PlatformListingSpec> = {
  vinted: vintedListingSpec,
  depop: depopListingSpec,
  ebay: ebayListingSpec,
};

export const platformMarket: Record<Platform, PlatformMarket> = {
  vinted: vintedMarket,
  depop: depopMarket,
  ebay: ebayMarket,
};

/**
 * Only platforms with a direct write API publish here today (eBay).
 * `publish` is imported lazily by the eBay route only, to keep its Node-only
 * deps (categories.ts, crypto via auth) out of edge-runtime bundles.
 */
export const platformPublish: Partial<Record<Platform, PlatformPublish>> = {};
