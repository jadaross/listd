import type { AnalysisResult, Platform, Tone } from "@/lib/types";
import { platformListingSpec } from "@/platforms";
import { MODELS, anthropicClient, extractJsonObject } from "./client";

export interface AnalyseInput {
  /** base64 JPEG strings, optionally with a `data:` prefix. */
  photos: string[];
  tone: Tone;
  /** When set, the prompt is platform-specific; otherwise the neutral prompt is used. */
  platform?: Platform;
}

const TONE_HINT: Record<Tone, string> = {
  casual:
    "The description should be casual, friendly, and conversational — like how a real person sells on Depop or Vinted. Use natural language. Keep it genuine and relatable. No corporate speak.",
  professional:
    "The description should be clean, factual, and professional. Lead with the most important details. No slang. Focus on measurements, condition, fabric, and fit. Concise.",
};

function jsonShape(): string {
  return `{
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
}`;
}

const COMMON_RULES = `Rules:

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
- care_instructions: plain English summary of care symbols/text`;

function buildPlatformPrompt(platform: Platform, tone: Tone, photoCount: number): string {
  return `You are an expert clothing photographer and professional reselling assistant for secondhand fashion platforms.

Analyse these ${photoCount} clothing photo(s) and return ONLY a valid JSON object — no markdown code fences, no explanation text, just raw JSON starting with { and ending with }.

${platformListingSpec[platform].promptFragment}

${TONE_HINT[tone]}

Return exactly this JSON structure (fill in all fields):

${jsonShape()}

${COMMON_RULES}

LISTING:
- brand: from tag if visible, otherwise infer from logo/design, otherwise "Unknown"
- condition: infer from visible wear, pilling, fading, stains. Be honest.
- price_min/price_max: realistic GBP resale prices. Consider brand, condition, type, and typical secondhand market values. For luxury/designer, price higher. For fast fashion in good condition, price accordingly.
- price_reasoning: one sentence explaining the price logic
- title: ${platform === 'ebay' ? 'max 80 characters' : 'max 60 characters'}
- description: ${platform === 'depop' ? '3–4 short punchy sentences, max 60 words. Give it personality. No filler phrases.' : platform === 'vinted' ? '4–5 clear sentences, max 80 words. Lead with the most important details. No waffle.' : '4–6 sentences, 150–250 words. Detailed and factual. Include fabric, visible measurements, condition specifics, care info.'}
- hashtags: ${platform === 'depop' ? 'UP TO 5 actual hashtag strings with # prefix (mix: 3 descriptive — type/brand/material — + 1–2 style/aesthetic like #y2k, #cottagecore). Each tag must be genuinely relevant.' : 'EMPTY ARRAY []. ' + (platform === 'vinted' ? 'Vinted has no hashtag system — its search reads title and description directly, so bake keywords into those instead.' : 'eBay has no tag field — search runs off the 80-char title and item specifics, so pack keywords into the title.')}
- gender: "women" | "men" | "kids" | "unisex" — who this item is for
- main_category: "tops" | "bottoms" | "dresses" | "outerwear" | "knitwear" | "swimwear" | "underwear" | "sportswear" | "shoes" | "accessories" | "bags" | "other"
- subcategory: specific item type, e.g. "jeans", "hoodie", "midi dress", "trainers"`;
}

function buildNeutralPrompt(tone: Tone, photoCount: number): string {
  return `You are an expert clothing photographer and professional reselling assistant for secondhand fashion platforms.

Analyse these ${photoCount} clothing photo(s) and return ONLY a valid JSON object — no markdown code fences, no explanation text, just raw JSON starting with { and ending with }.

${TONE_HINT[tone]}

Return exactly this JSON structure (fill in all fields):

${jsonShape()}

${COMMON_RULES}

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

function imageBlocks(photos: string[]) {
  return photos.map((b64) => ({
    type: "image" as const,
    source: {
      type: "base64" as const,
      media_type: "image/jpeg" as const,
      data: b64.replace(/^data:image\/\w+;base64,/, ""),
    },
  }));
}

function buildPrompt(input: AnalyseInput): string {
  return input.platform
    ? buildPlatformPrompt(input.platform, input.tone, input.photos.length)
    : buildNeutralPrompt(input.tone, input.photos.length);
}

/**
 * Returns the parsed AnalysisResult. Throws on invalid JSON or missing top-level
 * fields. Suitable for tests, scripts, anywhere SSE framing is not needed.
 */
export async function analyseListing(input: AnalyseInput): Promise<AnalysisResult> {
  const client = anthropicClient();
  const message = await client.messages.create({
    model: MODELS.analyse,
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [...imageBlocks(input.photos), { type: "text", text: buildPrompt(input) }],
      },
    ],
  });
  const text = message.content[0].type === "text" ? message.content[0].text : "";
  return parseAnalysisResult(text);
}

/**
 * Streams raw text deltas from the model. The full concatenated text is the JSON
 * payload — consumers buffer until done, then call parseAnalysisResult.
 */
export function analyseListingStream(input: AnalyseInput): ReadableStream<string> {
  return new ReadableStream({
    async start(controller) {
      try {
        const client = anthropicClient();
        const stream = await client.messages.create({
          model: MODELS.analyse,
          max_tokens: 2048,
          stream: true,
          messages: [
            {
              role: "user",
              content: [...imageBlocks(input.photos), { type: "text", text: buildPrompt(input) }],
            },
          ],
        });
        for await (const chunk of stream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            controller.enqueue(chunk.delta.text);
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}

/**
 * Parse and lightly validate a fully-buffered model response. Throws on
 * unparsable JSON or missing top-level sections.
 */
export function parseAnalysisResult(buffer: string): AnalysisResult {
  const parsed = JSON.parse(extractJsonObject(buffer)) as AnalysisResult;
  if (!parsed.listing || !parsed.photo_analysis || !parsed.tag_data) {
    throw new Error("AnalysisResult missing required top-level fields");
  }
  return parsed;
}
