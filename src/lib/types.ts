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
}

export interface AnalysisResult {
  photo_analysis: PhotoAnalysis;
  tag_data: TagData;
  listing: Listing;
}

export type Platform = "vinted" | "depop";
export type Tone = "casual" | "professional";
export type Mode = "single" | "bulk";

export interface PhotoGroup {
  label: string;
  indices: number[];
}

export interface GroupResult {
  groups: PhotoGroup[];
}

export interface BulkItem {
  group: PhotoGroup;
  photos: Photo[];
  result: AnalysisResult | null;
  loading: boolean;
  error: string | null;
}
