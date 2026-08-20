import type { Platform, PlatformListing } from "@/lib/types";
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
  /** Per-platform "fields" schema fragment used by the format prompt. */
  fieldsSchema: string;
  /** Refinement chips that are meaningful on this platform. */
  relevantChips: ChipId[];
  /** Returns [] if the listing satisfies platform requirements, else error messages. */
  validate(listing: PlatformListing): string[];
}
