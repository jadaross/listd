import Anthropic from "@anthropic-ai/sdk";
import { buildFormatPrompt } from "@/lib/prompts";
import type { Listing, Platform, Tone } from "@/lib/types";

export const runtime = "edge";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface RequestBody {
  listing: Listing;
  platform: Platform;
  tone: Tone;
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 500 }
    );
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { listing, platform, tone } = body;

  if (!listing || !platform || !tone) {
    return Response.json(
      { error: "listing, platform, and tone are required" },
      { status: 400 }
    );
  }

  const prompt = buildFormatPrompt(platform, tone, listing);

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const rawText =
      response.content[0].type === "text" ? response.content[0].text : "";

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json(
        { error: "Could not parse AI response", raw: rawText },
        { status: 500 }
      );
    }

    const result = JSON.parse(jsonMatch[0]);
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json(
      { error: `Format request failed: ${message}` },
      { status: 500 }
    );
  }
}
