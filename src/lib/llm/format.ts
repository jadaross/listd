import type { Listing, Platform, PlatformListing, Tone } from "@/lib/types";
import { platformListingSpec, platformMetadata } from "@/platforms";
import { MODELS, anthropicClient } from "./client";
import { extractJsonObject } from "./analyse-parse";

export interface FormatInput {
  listing: Listing;
  platform: Platform;
  tone: Tone;
}

const TONE_HINT: Record<Tone, string> = {
  casual:
    "The description should be casual, friendly, and conversational — like how a real person sells on Depop or Vinted. Use natural language. Keep it genuine and relatable. No corporate speak.",
  professional:
    "The description should be clean, factual, and professional. Lead with the most important details. No slang. Focus on measurements, condition, fabric, and fit. Concise.",
};

function buildPrompt({ listing, platform, tone }: FormatInput): string {
  const spec = platformListingSpec[platform];
  return `You are a secondhand fashion listing specialist. Reformat the following clothing listing for ${platformMetadata[platform].name}.

${spec.promptFragment}

${TONE_HINT[tone]}

Source listing (neutral format):
${JSON.stringify(listing, null, 2)}

Return ONLY a valid JSON object — no markdown code fences, no explanation text, just raw JSON:

{
  "title": "",
  "description": "",
  "hashtags": [],
  "fields": [
    { "label": "", "value": "", "hint": "" }
  ]
}

Rules for title / description / hashtags:
- title: adapt to platform requirements (max chars, format conventions)
- description: rewrite for platform audience and length requirements
- hashtags: format correctly for platform (with/without # prefix, count)
- Keep all factual details accurate — only change style, length, and format
- Do NOT invent new information

Rules for fields (these are the dropdowns/inputs the seller picks on the ${platformMetadata[platform].name} listing form):
${spec.fieldsSchema}

For every field:
- "value" MUST come from the allowed list when one is given (don't paraphrase).
- "hint" is optional — only include it when the rationale is non-obvious.
- If the source listing genuinely lacks the info, pick the best safe default (e.g. "Unbranded" if no brand) rather than leaving the value empty.`;
}

export async function formatListing(input: FormatInput): Promise<PlatformListing> {
  const client = anthropicClient();
  const message = await client.messages.create({
    model: MODELS.format,
    max_tokens: 512,
    messages: [{ role: "user", content: buildPrompt(input) }],
  });
  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const parsed = JSON.parse(extractJsonObject(text)) as PlatformListing;
  if (!parsed.title || !parsed.description) {
    throw new Error("PlatformListing missing title or description");
  }
  parsed.hashtags = parsed.hashtags ?? [];
  return parsed;
}
