export type Platform = "vinted" | "depop" | "ebay";
export type Tone = "casual" | "professional";

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

/** The platform-agnostic description of an item. See CONTEXT.md — "Neutral Listing". */
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

/**
 * A single dropdown / form field on a platform's listing form, rendered as a
 * copyable label + value pair so the user can paste it into the platform app.
 */
export interface ListingField {
  /** Human label exactly as it appears on the platform's form ("Parcel size", "Department"). */
  label: string;
  /** The value the user should select or paste. */
  value: string;
  /** Optional short hint explaining why this value was chosen. */
  hint?: string;
}

/** A Neutral Listing rewritten for one platform. See CONTEXT.md — "Platform-formatted Listing". */
export interface PlatformListing {
  title: string;
  description: string;
  hashtags: string[];
  fields?: ListingField[];
}

export interface AnalysisResult {
  photo_analysis: PhotoAnalysis;
  tag_data: TagData;
  listing: Listing;
}
