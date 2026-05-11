import type { PlatformListing } from "@/lib/types";
import type { ChipId } from "@/lib/chip-vocab";
import type { PlatformListingSpec } from "../types";

const promptFragment =
  'Format for Vinted: Title max 60 characters, sentence case (capitalise first word and proper nouns only — no title case). Description: 3–4 sentences max 80 words. MUST include the item size in the description. Each sentence goes on its own line with a blank line between them. Do NOT suggest outfit pairings, styling ideas, or what to wear it with — focus on fabric, condition, fit, and key details only. Put 8–10 search keywords (no # prefix) in the "hashtags" array.';

const fieldsSchema = `Return these fields in the "fields" array, in this order. Use the EXACT label strings and pick values from the allowed sets:

- { "label": "Category", "value": "<cascade like 'Women > Clothing > Outerwear > Coats & jackets' or 'Men > Clothing > Tops > T-shirts & vests'>", "hint": "Pick the most specific path that fits" }
- { "label": "Brand", "value": "<brand name, or 'Unbranded'>" }
- { "label": "Size", "value": "<UK or EU size that matches the item, e.g. 'M', 'UK 10', 'EU 38'>" }
- { "label": "Condition", "value": "<MUST be one of: New with tags | New without tags | Very good | Good | Satisfactory>" }
- { "label": "Colour", "value": "<one of: Black | Brown | White | Grey | Beige | Pink | Purple | Red | Orange | Yellow | Green | Blue | Multi>" }
- { "label": "Material", "value": "<one of: Cotton | Polyester | Wool | Leather | Denim | Linen | Silk | Synthetic | Cashmere | Nylon | Viscose | Blend | Other>" }
- { "label": "Parcel size", "value": "<MUST be one of: Small | Medium | Large>", "hint": "Small: tops, accessories. Medium: jeans, dresses, jumpers. Large: coats, boots, bulky items." }`;

const REQUIRED_LABELS = [
  "Category",
  "Brand",
  "Size",
  "Condition",
  "Colour",
  "Material",
  "Parcel size",
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
