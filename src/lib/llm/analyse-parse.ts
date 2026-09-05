import type { AnalysisResult } from "@/lib/types";

/**
 * Models sometimes wrap JSON in prose or markdown fences. Extract the first
 * balanced top-level JSON object as a string. Throws if none found.
 *
 * Kept SDK-free so client bundles (e.g. the listing pipeline hook) can call it
 * without pulling in `@anthropic-ai/sdk`.
 */
export function extractJsonObject(text: string): string {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object found in model output");
  return match[0];
}

/**
 * Parse and lightly validate a fully-buffered analyse response. Throws on
 * unparsable JSON or missing top-level sections.
 */
export function parseAnalysisResult(buffer: string): AnalysisResult {
  const parsed = JSON.parse(extractJsonObject(buffer)) as AnalysisResult;
  if (!parsed.listing || !parsed.tag_data) {
    throw new Error("AnalysisResult missing required top-level fields");
  }
  return parsed;
}
