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

// `extractJsonObject` and `parseAnalysisResult` live in `./analyse-parse` so
// that client bundles can import them without pulling the Anthropic SDK.
