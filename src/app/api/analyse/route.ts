import { analyseListingStream } from "@/lib/llm/analyse";
import { toStringStreamResponse } from "@/lib/streaming-text";
import type { Platform, Tone } from "@/lib/types";

export const runtime = "nodejs";

interface RequestBody {
  images: string[];
  platform?: Platform;
  tone: Tone;
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 });
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
    return Response.json({ error: "Maximum 20 images allowed per listing" }, { status: 400 });
  }

  return toStringStreamResponse(analyseListingStream({ photos: images, tone, platform }));
}
