import Anthropic from "@anthropic-ai/sdk";

export const MODELS = {
  analyse: "claude-sonnet-4-6",
  format: "claude-haiku-4-5-20251001",
  refine: "claude-haiku-4-5-20251001",
  marketSynthesis: "claude-haiku-4-5-20251001",
} as const;

let _client: Anthropic | null = null;

export function anthropicClient(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");
  _client = new Anthropic({ apiKey });
  return _client;
}

/**
 * Models sometimes wrap JSON in prose or markdown fences. Extract the first
 * balanced top-level JSON object as a string. Throws if none found.
 */
export function extractJsonObject(text: string): string {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object found in model output");
  return match[0];
}
