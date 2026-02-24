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
    "price_reasoning": ""
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
- title: max 60 characters
- description: 150–200 words
- hashtags: 8–10 items (actual hashtag strings including # for Depop, keywords without # for Vinted)`;
}
