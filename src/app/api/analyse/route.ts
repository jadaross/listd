import Anthropic from "@anthropic-ai/sdk";
import { buildPrompt, buildNeutralPrompt } from "@/lib/prompts";
import type { Platform, Tone } from "@/lib/types";

export const runtime = "edge";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface RequestBody {
  images: string[];
  platform?: Platform; // optional — bulk mode still sends it; single mode omits for neutral prompt
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

  const { images, platform, tone = "casual" } = body;

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

  const prompt = platform
    ? buildPrompt(platform, tone, images.length)
    : buildNeutralPrompt(tone, images.length);

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    stream: true,
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

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of response) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(chunk.delta.text)}\n\n`)
            );
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}
