import type { Platform, Tone } from "./types";

const TONE_MAP: Record<Tone, string> = {
  casual:
    "The description should be casual, friendly, and conversational — like how a real person sells on Depop or Vinted. Use natural language. You can mention styling ideas or how the item fits. Keep it genuine and relatable. No corporate speak.",
  professional:
    "The description should be clean, factual, and professional. Lead with the most important details. No slang. Focus on measurements, condition, fabric, and fit. Concise.",
};

const PLATFORM_MAP: Record<Platform, string> = {
  depop:
    'Format for Depop: include 8–10 relevant hashtags in the "hashtags" array. Titles should follow: Brand + Type + Key Feature (max 60 chars). Descriptions suit a younger, fashion-forward audience.',
  vinted:
    'Format for Vinted: Vinted does not use hashtags — instead, put 8–10 relevant search keywords in the "hashtags" array that can be woven into the description. Titles should be descriptive and clear. Max 60 chars.',
  ebay:
    'Format for eBay: title max 80 characters (eBay allows more than Vinted/Depop). Include condition-specific language buyers search for. Description should be detailed and factual — include fabric, measurements if visible, condition detail, and care info. Use "hashtags" array for 5-8 eBay-style item specifics keywords (no # prefix) that match eBay search terms. 200-300 words in description is appropriate.',
};

export function buildPrompt(
  platform: Platform,
  tone: Tone,
  photoCount: number
): string {
  return `You are an expert clothing photographer and professional reselling assistant for secondhand fashion platforms.

Analyse these ${photoCount} clothing photo(s) and return ONLY a valid JSON object — no markdown code fences, no explanation text, just raw JSON starting with { and ending with }.

${PLATFORM_MAP[platform]}

${TONE_MAP[tone]}

Return exactly this JSON structure (fill in all fields):

{
  "photo_analysis": {
    "scores": [
      {
        "index": 0,
        "shot_type": "front view",
        "quality_score": 4,
        "issues": [],
        "is_usable": true
      }
    ],
    "missing_shots": [],
    "suggestions": [],
    "has_tag_photo": false,
    "ready_to_list": true
  },
  "tag_data": {
    "brand": null,
    "size": null,
    "size_system": null,
    "fabric_composition": null,
    "country_of_manufacture": null,
    "care_instructions": null,
    "rn_number": null,
    "style_number": null,
    "barcode_visible": false
  },
  "listing": {
    "brand": "",
    "clothing_type": "",
    "colour_primary": "",
    "colour_secondary": null,
    "condition": "Good",
    "size": "",
    "material": "",
    "title": "",
    "description": "",
    "hashtags": [],
    "price_min": 0,
    "price_max": 0,
    "price_reasoning": "",
    "gender": "women",
    "main_category": "tops",
    "subcategory": ""
  }
}

Rules:

PHOTO ANALYSIS:
- shot_type options: "front view" | "back view" | "tag/label" | "detail shot" | "defect" | "measurement" | "styled/on-body" | "flat lay" | "unknown"
- quality_score: 5=excellent (sharp, well-lit, clean background, full item), 4=good, 3=acceptable, 2=poor (suggest retake), 1=unusable
- Check missing_shots against: front view, back view, care label/tag, detail shot, defect (if wear is visible), measurement
- suggestions: specific, actionable advice ("Photograph the care label — buyers need fabric content to verify authenticity")
- ready_to_list: true only if there are no missing critical shots and all scores are 3+

TAG DATA:
- Extract ALL readable text from any tag/label visible in any photo
- rn_number: US FTC Registered Identification Number (format "RN XXXXX") — critical for vintage dating
- size_system: "UK" | "EU" | "US" | "IT" | "Universal" | null
- care_instructions: plain English summary of care symbols/text

LISTING:
- brand: from tag if visible, otherwise infer from logo/design, otherwise "Unknown"
- condition: infer from visible wear, pilling, fading, stains. Be honest.
- price_min/price_max: realistic GBP resale prices. Consider brand, condition, type, and typical secondhand market values. For luxury/designer, price higher. For fast fashion in good condition, price accordingly.
- price_reasoning: one sentence explaining the price logic
- title: ${platform === 'ebay' ? 'max 80 characters' : 'max 60 characters'}
- description: ${platform === 'depop' ? '3–4 short punchy sentences, max 60 words. Give it personality. No filler phrases.' : platform === 'vinted' ? '4–5 clear sentences, max 80 words. Lead with the most important details. No waffle.' : '4–6 sentences, 150–250 words. Detailed and factual. Include fabric, visible measurements, condition specifics, care info.'}
- hashtags: ${platform === 'depop' ? '8–10 actual hashtag strings including # prefix' : platform === 'vinted' ? '8–10 keywords without # for Vinted search' : '5–8 eBay-style item specifics keywords without # prefix'}
- gender: "women" | "men" | "kids" | "unisex" — who this item is for
- main_category: "tops" | "bottoms" | "dresses" | "outerwear" | "knitwear" | "swimwear" | "underwear" | "sportswear" | "shoes" | "accessories" | "bags" | "other"
- subcategory: specific item type, e.g. "jeans", "hoodie", "midi dress", "trainers"`;
}

export function buildGroupPrompt(imageCount: number): string {
  return `You are analysing ${imageCount} clothing photo(s). Group them by clothing item — photos of the same item go in the same group, different items go in separate groups.

Return ONLY a valid JSON object — no markdown code fences, no explanation text, just raw JSON starting with { and ending with }.

{
  "groups": [
    { "label": "Blue denim jacket", "indices": [0, 1, 2] },
    { "label": "White cotton t-shirt", "indices": [3, 4] }
  ]
}

Rules:
- Each index (0-based) must appear exactly once across all groups
- label: short descriptive name for the item (e.g. "Black leather boots", "Floral midi dress")
- If you cannot distinguish separate items, put all indices in one group`;
}
