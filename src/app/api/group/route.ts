import Anthropic from "@anthropic-ai/sdk";
import { buildGroupPrompt } from "@/lib/prompts";
import type { GroupResult } from "@/lib/types";

export const runtime = "edge";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface RequestBody {
  images: string[];
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

  const { images } = body;

  if (!Array.isArray(images) || images.length === 0) {
    return Response.json({ error: "No images provided" }, { status: 400 });
  }

  // Fallback: one group with all indices
  const fallback: GroupResult = {
    groups: [
      {
        label: "All items",
        indices: images.map((_, i) => i),
      },
    ],
  };

  const imageBlocks = images.map((base64) => ({
    type: "image" as const,
    source: {
      type: "base64" as const,
      media_type: "image/jpeg" as const,
      data: base64.replace(/^data:image\/\w+;base64,/, ""),
    },
  }));

  const prompt = buildGroupPrompt(images.length);

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
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

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json(fallback);
    }

    const result: GroupResult = JSON.parse(jsonMatch[0]);

    // Validate: every index 0..n-1 appears exactly once
    const allIndices = result.groups.flatMap((g) => g.indices).sort((a, b) => a - b);
    const expected = images.map((_, i) => i);
    const valid =
      allIndices.length === expected.length &&
      allIndices.every((v, i) => v === expected[i]);

    return Response.json(valid ? result : fallback);
  } catch {
    return Response.json(fallback);
  }
}
