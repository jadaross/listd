import Anthropic from "@anthropic-ai/sdk";
import { buildPrompt } from "@/lib/prompts";
import type { Platform, Tone } from "@/lib/types";

export const runtime = "edge";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface RequestBody {
  images: string[];
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

  const { images, platform = "vinted", tone = "casual" } = body;

  if (!Array.isArray(images) || images.length === 0) {
    return Response.json({ error: "No images provided" }, { status: 400 });
  }

  if (images.length > 20) {
    return Response.json(
      { error: "Maximum 20 images allowed per listing" },
      { status: 400 }
    );
  }

  // Build image content blocks for Claude
  const imageBlocks = images.map((base64) => ({
    type: "image" as const,
    source: {
      type: "base64" as const,
      media_type: "image/jpeg" as const,
      data: base64.replace(/^data:image\/\w+;base64,/, ""),
    },
  }));

  const prompt = buildPrompt(platform, tone, images.length);

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            ...imageBlocks,
            { type: "text", text: prompt },
          ],
        },
      ],
    });

    const rawText =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Extract JSON — handles cases where Claude wraps in markdown fences
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
      { error: `AI request failed: ${message}` },
      { status: 500 }
    );
  }
}
