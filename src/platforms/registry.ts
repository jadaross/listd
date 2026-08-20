import type { Platform } from "@/lib/types";
import type { PlatformListingSpec, PlatformMetadata } from "./types";

import { metadata as vintedMetadata } from "./vinted/metadata";
import { listingSpec as vintedListingSpec } from "./vinted/listing-spec";

import { metadata as depopMetadata } from "./depop/metadata";
import { listingSpec as depopListingSpec } from "./depop/listing-spec";

import { metadata as ebayMetadata } from "./ebay/metadata";
import { listingSpec as ebayListingSpec } from "./ebay/listing-spec";

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
