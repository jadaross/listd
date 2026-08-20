import type { Platform } from "@/lib/types";
import { platformMetadata } from "./registry";

export type { Platform } from "@/lib/types";
export * from "./types";
export { platformMetadata, platformListingSpec } from "./registry";

/** The canonical platform ordering. */
export const PLATFORM_IDS: readonly Platform[] = ["vinted", "depop", "ebay"];

/** Convert a list price into a take-home estimate after platform fees. */
export function netPrice(price: number, platform: Platform): number {
  return price * (1 - platformMetadata[platform].feePct / 100);
}
