export interface Photo {
  id: string;
  previewUrl: string;
  compressed: string; // base64 JPEG, max 1024px
}

export interface PhotoScore {
  index: number;
  shot_type: string;
  quality_score: number;
  issues: string[];
  is_usable: boolean;
}

export interface PhotoAnalysis {
  scores: PhotoScore[];
  missing_shots: string[];
  suggestions: string[];
  has_tag_photo: boolean;
  ready_to_list: boolean;
}

export interface TagData {
  brand: string | null;
  size: string | null;
  size_system: string | null;
  fabric_composition: string | null;
  country_of_manufacture: string | null;
  care_instructions: string | null;
  rn_number: string | null;
  style_number: string | null;
  barcode_visible: boolean;
}

export type Condition = "New with tags" | "Excellent" | "Good" | "Fair";

export interface Listing {
  brand: string;
  clothing_type: string;
  colour_primary: string;
  colour_secondary: string | null;
  condition: Condition;
  size: string;
  material: string;
  title: string;
  description: string;
  hashtags: string[];
  price_min: number;
  price_max: number;
  price_reasoning: string;
  gender?: "women" | "men" | "kids" | "unisex";
  main_category?: string;
  subcategory?: string;
}

export interface PlatformPriceData {
  median: number | null;
  min: number | null;
  max: number | null;
  count: number;
  currency: string;
  sold_median?: number | null;
  sold_count?: number | null;
}

export interface PlatformReasoning {
  /** "good" — why this platform suits the item */
  platform_reasoning: string;
  /** "bad" — the main trade-off */
  trade_off: string;
  /** e.g. "6 days" */
  estimated_sell_time: string;
  /** e.g. "~140/wk" */
  estimated_views_per_week: string;
}

export interface MarketIntelligence {
  recommended_platform: Platform;
  recommended_price: number;
  sell_likelihood: "high" | "medium" | "low";
  /** Per-platform reasoning so the recommendation screen can show a deep-dive for any platform */
  per_platform: Record<Platform, PlatformReasoning>;
  key_insight: string;
}

export interface MarketInsights {
  ebay: PlatformPriceData;
  vinted: PlatformPriceData;
  depop: PlatformPriceData;
  query: string;
  intelligence: MarketIntelligence | null;
}

/**
 * A single dropdown / form field on a platform's listing form.
 * Each row is rendered as a copyable label + value pair so the user can
 * paste the right value into the platform app/website.
 */
export interface ListingField {
  /** Human label exactly as it appears on the platform's form (e.g. "Parcel size", "Condition", "Department"). */
  label: string;
  /** The value the user should select or paste. */
  value: string;
  /** Optional short hint explaining why this value was chosen. */
  hint?: string;
}

export interface PlatformListing {
  title: string;
  description: string;
  hashtags: string[];
  /** Platform-specific form fields (Vinted parcel size, eBay department, etc.). Optional for backwards-compat. */
  fields?: ListingField[];
}

export interface FormattedListings {
  vinted?: PlatformListing;
  depop?: PlatformListing;
  ebay?: PlatformListing;
}

export interface AnalysisResult {
  photo_analysis: PhotoAnalysis;
  tag_data: TagData;
  listing: Listing;
}

export type Platform = "vinted" | "depop" | "ebay";
export type Tone = "casual" | "professional";

export interface EbayConnectionStatus {
  connected: boolean;
  username: string | null;
  expiresAt: number | null;
}
