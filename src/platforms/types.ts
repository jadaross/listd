import type {
  Photo,
  Platform,
  PlatformListing,
  PlatformPriceData,
} from "@/lib/types";
import type { ChipId } from "@/lib/chip-vocab";

export interface PlatformMetadata {
  id: Platform;
  name: string;
  audience: string;
  feeLabel: string;
  feePct: number;
  color: string;
  appUrl: string;
  webUrl: string;
}

export interface PlatformListingSpec {
  /** Prompt fragment for analyse/format/refine: "Format for Vinted: …". */
  promptFragment: string;
  /** Per-platform "fields" schema fragment used by buildFormatPrompt. */
  fieldsSchema: string;
  /** Refinement chips that are meaningful on this platform. */
  relevantChips: ChipId[];
  /** Returns [] if the listing satisfies platform requirements, else error messages. */
  validate(listing: PlatformListing): string[];
}

export interface PlatformMarketQuery {
  brand: string;
  subcategory: string;
}

export interface PlatformMarket {
  fetchPrices(query: PlatformMarketQuery): Promise<PlatformPriceData>;
}

export interface PlatformPublishResult {
  listingId?: string;
  offerId?: string;
  listingUrl?: string;
  warning?: string;
}

/** Optional capability — only platforms with a direct write API implement this. */
export interface PlatformPublish {
  publishListing(args: {
    listing: import("@/lib/types").Listing;
    formatted: PlatformListing;
    photos?: Photo[];
    accessToken: string;
    isSandbox: boolean;
  }): Promise<PlatformPublishResult>;
}
