import type { PlatformListing } from "@/lib/types";
import type { ChipId } from "@/lib/chip-vocab";
import type { PlatformListingSpec } from "../types";

const promptFragment =
  'Format for Depop: include 8–10 relevant hashtags in the "hashtags" array with # prefix. Title: Brand + Type + Key Feature, max 60 chars, sentence case (capitalise first word only). Descriptions suit a younger, fashion-forward audience.';

const fieldsSchema = `Return these fields in the "fields" array, in this order. Use the EXACT label strings and pick values from the allowed sets:

- { "label": "Department", "value": "<one of: Womenswear | Menswear | Kidswear | Unisex>" }
- { "label": "Product type", "value": "<e.g. 'T-shirts', 'Hoodies', 'Jeans', 'Jackets', 'Trainers'>" }
- { "label": "Brand", "value": "<brand or 'Unbranded'>" }
- { "label": "Size", "value": "<UK/EU size>" }
- { "label": "Condition", "value": "<MUST be one of: Brand new | Like new | Used – Excellent | Used – Good | Used – Fair>" }
- { "label": "Colour", "value": "<primary colour>" }
- { "label": "Style", "value": "<one or two of: Streetwear | Y2K | Vintage | Retro | Sportswear | Workwear | Cottagecore | Grunge | Preppy | Punk | Skater | Minimalist>" }
- { "label": "Age", "value": "<one of: 2020s | 2010s | Y2K | 90s | 80s | 70s | 60s>", "hint": "Only include if item is genuinely vintage. Omit this row entirely if not." }
- { "label": "Source", "value": "<one of: Vintage | Pre-loved | New>" }`;

const REQUIRED_LABELS = [
  "Department",
  "Product type",
  "Brand",
  "Size",
  "Condition",
  "Colour",
  "Style",
  "Source",
] as const;

const relevantChips: ChipId[] = [
  "shorter",
  "longer",
  "casual",
  "serious",
  "measurements",
  "hashtags",
  "condition",
  "vintage",
];

function validate(listing: PlatformListing): string[] {
  const errors: string[] = [];
  const fields = listing.fields ?? [];
  for (const label of REQUIRED_LABELS) {
    const f = fields.find((x) => x.label === label);
    if (!f || !f.value.trim()) errors.push(`Missing "${label}"`);
  }
  return errors;
}

export const listingSpec: PlatformListingSpec = {
  promptFragment,
  fieldsSchema,
  relevantChips,
  validate,
};
