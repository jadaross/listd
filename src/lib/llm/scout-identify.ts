import type { PhotoAnalysis, ScoutGuess, TagData } from "@/lib/types";
import { MODELS, anthropicClient } from "./client";
import { extractJsonObject } from "./analyse-parse";

export interface ScoutIdentifyInput {
  /** base64 JPEG strings, optionally with a `data:` prefix. */
  photos: string[];
  /** When set, the model is told it's a tag re-run — confirm or correct the prior guess. */
  previousGuess?: ScoutGuess | null;
}

export interface ScoutIdentifyOutput {
  guess: ScoutGuess;
  photo_analysis: PhotoAnalysis;
  tag_data: TagData;
  has_tag_photo: boolean;
  confidence_level: 1 | 2 | 3;
}

function jsonShape(): string {
  return `{
  "guess": {
    "title": "",
    "guess_short": "",
    "guess_tight": "",
    "search_query": ""
  },
  "photo_analysis": {
    "scores": [{ "index": 0, "shot_type": "front view", "quality_score": 4, "issues": [], "is_usable": true }],
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
  "has_tag_photo": false,
  "confidence_level": 1
}`;
}

function buildPrompt(input: ScoutIdentifyInput): string {
  const photoCount = input.photos.length;
  const prior = input.previousGuess
    ? `\n\nA prior pass already guessed: "${input.previousGuess.title}" — "${input.previousGuess.guess_short}". You're seeing a brand-tag photo this time. Confirm or correct the model, era and size; use guess_tight to restate the find with the extra info.`
    : "";

  return `You are a sharp vintage and secondhand reseller doing a fast in-shop assessment. A scout is standing in front of an item and needs to know what it is in one breath.${prior}

Analyse these ${photoCount} photo(s) and return ONLY a valid JSON object — no markdown code fences, no explanation text, just raw JSON starting with { and ending with }.

Return exactly this JSON structure (fill in all fields):

${jsonShape()}

Rules:

GUESS:
- title: headline name of the item, e.g. "Carhartt Detroit Jacket". Brand + style + clothing type. Skip generic words like "vintage" unless that's the differentiator.
- guess_short: one line, " · " separated, in the voice of a reseller eyeballing the item. e.g. "Brown duck canvas · looks 90s · size M". Pre-tag — only what you can actually see.
- guess_tight: same voice but tighter when a tag is confirmed, e.g. "Carhartt Detroit J97 · 90s · brown duck · M". If no tag info is available, repeat guess_short.
- search_query: 4–8 words a reseller would type into eBay to find sold comparables. No quotes, no punctuation other than spaces. Brand + style/model + key feature + size.

CONFIDENCE_LEVEL:
- 1 (Low): brand is a guess; model/era not pinned.
- 2 (Med): brand + general category confident; era or specific model uncertain.
- 3 (High): tag confirms brand and model, size visible. Only set 3 when a readable tag is in one of the photos.

PHOTO ANALYSIS (same schema as the sell flow):
- shot_type options: "front view" | "back view" | "tag/label" | "detail shot" | "defect" | "measurement" | "styled/on-body" | "flat lay" | "unknown"
- quality_score: 5=excellent, 4=good, 3=acceptable, 2=poor, 1=unusable
- has_tag_photo: true only if a brand/care tag is clearly readable in at least one photo
- ready_to_list: ignore for the scout flow; set to true

TAG DATA:
- Extract ALL readable text from any tag/label visible. Null any field you can't see.
- size_system: "UK" | "EU" | "US" | "IT" | "Universal" | null
- rn_number: US FTC Registered Identification Number (format "RN XXXXX")

Be honest about uncertainty. Don't invent a model number you can't read.`;
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

/**
 * Streams raw text deltas. The full concatenated text is the JSON payload —
 * consumers buffer until done, then call `parseScoutIdentifyResult`.
 */
export function scoutIdentifyStream(input: ScoutIdentifyInput): ReadableStream<string> {
  return new ReadableStream({
    async start(controller) {
      try {
        const client = anthropicClient();
        const stream = await client.messages.create({
          model: MODELS.analyse,
          max_tokens: 1024,
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

export function parseScoutIdentifyResult(buffer: string): ScoutIdentifyOutput {
  const parsed = JSON.parse(extractJsonObject(buffer)) as ScoutIdentifyOutput;
  if (!parsed.guess || !parsed.photo_analysis || !parsed.tag_data) {
    throw new Error("ScoutIdentify response missing required top-level fields");
  }
  // Clamp confidence to the allowed range — defensive against off-by-one from the model.
  const lvl = parsed.confidence_level;
  parsed.confidence_level = (lvl === 2 ? 2 : lvl === 3 ? 3 : 1) as 1 | 2 | 3;
  if (!parsed.guess.guess_tight) parsed.guess.guess_tight = parsed.guess.guess_short;
  return parsed;
}
