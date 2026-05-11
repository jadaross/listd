import type { PlatformListing } from "@/lib/types";
import type { ChipId } from "@/lib/chip-vocab";
import type { PlatformListingSpec } from "../types";

const promptFragment =
  'Format for eBay: title max 80 characters. Include condition-specific language buyers search for. Description should be detailed and factual — include fabric, measurements if visible, condition detail, and care info. Use "hashtags" array for 5-8 eBay-style item specifics keywords (no # prefix) that match eBay search terms. 150-200 words in description is appropriate.';

const fieldsSchema = `Return these fields in the "fields" array, in this order. Use the EXACT label strings and pick values from the allowed sets:

- { "label": "Category", "value": "<eBay path, e.g. 'Clothes, Shoes & Accessories > Women > Women's Clothing > Coats, Jackets & Waistcoats'>" }
- { "label": "Department", "value": "<one of: Women | Men | Boys | Girls | Unisex Adult | Unisex Kids>" }
- { "label": "Type", "value": "<specific type like 'Hoodie', 'Denim Jacket', 'Polo Shirt', 'Jeans', 'Midi Dress'>" }
- { "label": "Brand", "value": "<brand or 'Unbranded'>" }
- { "label": "Size", "value": "<size as written on the tag>" }
- { "label": "Size Type", "value": "<one of: Regular | Plus | Petite | Big & Tall | Maternity>" }
- { "label": "Style", "value": "<one or two of: Casual | Smart Casual | Workwear | Streetwear | Vintage | Sportswear | Bohemian | Y2K | Preppy | Grunge>" }
- { "label": "Colour", "value": "<primary colour>" }
- { "label": "Material", "value": "<dominant material from the tag or visible fabric>" }
- { "label": "Condition", "value": "<MUST be one of: New with tags | New without tags | New with defects | Pre-owned – Excellent | Pre-owned – Good | Pre-owned – Fair>" }`;

const REQUIRED_LABELS = [
  "Category",
  "Department",
  "Type",
  "Brand",
  "Size",
  "Size Type",
  "Style",
  "Colour",
  "Material",
  "Condition",
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
