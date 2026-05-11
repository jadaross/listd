import type { Listing, Platform, PlatformListing, Tone } from "./types";

const TONE_MAP: Record<Tone, string> = {
  casual:
    "The description should be casual, friendly, and conversational — like how a real person sells on Depop or Vinted. Use natural language. Keep it genuine and relatable. No corporate speak.",
  professional:
    "The description should be clean, factual, and professional. Lead with the most important details. No slang. Focus on measurements, condition, fabric, and fit. Concise.",
};

const PLATFORM_MAP: Record<Platform, string> = {
  depop:
    'Format for Depop: include 8–10 relevant hashtags in the "hashtags" array with # prefix. Title: Brand + Type + Key Feature, max 60 chars, sentence case (capitalise first word only). Descriptions suit a younger, fashion-forward audience.',
  vinted:
    'Format for Vinted: Title max 60 characters, sentence case (capitalise first word and proper nouns only — no title case). Description: 3–4 sentences max 80 words. MUST include the item size in the description. Each sentence goes on its own line with a blank line between them. Do NOT suggest outfit pairings, styling ideas, or what to wear it with — focus on fabric, condition, fit, and key details only. Put 8–10 search keywords (no # prefix) in the "hashtags" array.',
  ebay:
    'Format for eBay: title max 80 characters. Include condition-specific language buyers search for. Description should be detailed and factual — include fabric, measurements if visible, condition detail, and care info. Use "hashtags" array for 5-8 eBay-style item specifics keywords (no # prefix) that match eBay search terms. 150-200 words in description is appropriate.',
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

export function buildNeutralPrompt(tone: Tone, photoCount: number): string {
  return `You are an expert clothing photographer and professional reselling assistant for secondhand fashion platforms.

Analyse these ${photoCount} clothing photo(s) and return ONLY a valid JSON object — no markdown code fences, no explanation text, just raw JSON starting with { and ending with }.

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
- title: max 70 characters, descriptive and search-friendly (brand + type + key feature)
- description: 4–5 clear sentences, 80–100 words. Lead with the most important details. Factual and thorough.
- hashtags: 8–10 general search keywords relevant across all resale platforms (no # prefix)
- gender: "women" | "men" | "kids" | "unisex" — who this item is for
- main_category: "tops" | "bottoms" | "dresses" | "outerwear" | "knitwear" | "swimwear" | "underwear" | "sportswear" | "shoes" | "accessories" | "bags" | "other"
- subcategory: specific item type, e.g. "jeans", "hoodie", "midi dress", "trainers"`;
}

export function buildFormatPrompt(platform: Platform, tone: Tone, listing: Listing): string {
  return `You are a secondhand fashion listing specialist. Reformat the following clothing listing for ${PLATFORM_LABELS[platform]}.

${PLATFORM_MAP[platform]}

${TONE_MAP[tone]}

Source listing (neutral format):
${JSON.stringify(listing, null, 2)}

Return ONLY a valid JSON object — no markdown code fences, no explanation text, just raw JSON:

{
  "title": "",
  "description": "",
  "hashtags": []
}

Rules:
- title: adapt to platform requirements (max chars, format conventions)
- description: rewrite for platform audience and length requirements
- hashtags: format correctly for platform (with/without # prefix, count)
- Keep all factual details accurate — only change style, length, and format
- Do NOT invent new information`;
}

const PLATFORM_LABELS: Record<Platform, string> = {
  depop: "Depop",
  vinted: "Vinted",
  ebay: "eBay",
};

export function buildRefinePrompt(
  platform: Platform,
  listing: PlatformListing,
  instructions: string[]
): string {
  return `You are a secondhand fashion listing specialist. Refine an existing ${PLATFORM_LABELS[platform]} listing based on user feedback.

${PLATFORM_MAP[platform]}

Current listing:
${JSON.stringify(listing, null, 2)}

Apply these refinements (do them all, in order):
${instructions.map((i, idx) => `${idx + 1}. ${i}`).join("\n")}

Return ONLY a valid JSON object — no markdown code fences, no explanation text, just raw JSON:

{
  "title": "",
  "description": "",
  "hashtags": []
}

Rules:
- Apply every refinement above. If two refinements conflict, the later one wins.
- Keep all factual details accurate — only change style, length, and format.
- Do NOT invent new information (no measurements unless asked; no condition claims that weren't in the source).
- Respect platform format rules (title length, hashtag conventions).`;
}
