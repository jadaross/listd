import { scoutIdentifyStream } from "@/lib/llm/scout-identify";
import { toStringStreamResponse } from "@/lib/streaming-text";
import type { ScoutGuess } from "@/lib/types";

export const runtime = "edge";

interface RequestBody {
  images: string[];
  previousGuess?: ScoutGuess | null;
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

  const { images, previousGuess } = body;
  if (!Array.isArray(images) || images.length === 0) {
    return Response.json({ error: "No images provided" }, { status: 400 });
  }
  if (images.length > 10) {
    return Response.json({ error: "Maximum 10 images allowed per scout pass" }, { status: 400 });
  }

  return toStringStreamResponse(scoutIdentifyStream({ photos: images, previousGuess }));
}
