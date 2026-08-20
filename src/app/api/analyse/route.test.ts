import { beforeEach, describe, expect, it, vi } from "vitest";
import { analysisResult } from "@/test/fixtures";
import { readStringStream } from "@/lib/streaming-text";

const analyseListingStream = vi.fn();
vi.mock("@/lib/llm/analyse", () => ({ analyseListingStream }));

const { POST } = await import("./route");

const PHOTO = "data:image/jpeg;base64,AAAA";

function post(body: unknown, raw?: string) {
  return new Request("http://localhost/api/analyse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw ?? JSON.stringify(body),
  });
}

function streamOf(text: string): ReadableStream<string> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(text);
      controller.close();
    },
  });
}

beforeEach(() => {
  analyseListingStream.mockReset();
  analyseListingStream.mockReturnValue(streamOf(JSON.stringify(analysisResult)));
});

describe("POST /api/analyse", () => {
  it("streams the analysis back as SSE", async () => {
    const res = await POST(post({ images: [PHOTO], tone: "casual" }));
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    expect(JSON.parse(await readStringStream(res))).toEqual(analysisResult);
  });

  it("defaults the tone to casual", async () => {
    await POST(post({ images: [PHOTO] }));
    expect(analyseListingStream).toHaveBeenCalledWith(
      expect.objectContaining({ tone: "casual" })
    );
  });

  it("forwards the platform when one is given", async () => {
    await POST(post({ images: [PHOTO], tone: "casual", platform: "depop" }));
    expect(analyseListingStream).toHaveBeenCalledWith(
      expect.objectContaining({ platform: "depop" })
    );
  });

  it("400s on unparsable JSON", async () => {
    expect((await POST(post(null, "nope"))).status).toBe(400);
  });

  it("400s when images is missing", async () => {
    expect((await POST(post({ tone: "casual" }))).status).toBe(400);
  });

  it("400s on an empty images array", async () => {
    expect((await POST(post({ images: [], tone: "casual" }))).status).toBe(400);
  });

  it("400s above the 20-image ceiling", async () => {
    const res = await POST(post({ images: Array(21).fill(PHOTO), tone: "casual" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Maximum 20/);
  });

  it("accepts exactly 20 images", async () => {
    const res = await POST(post({ images: Array(20).fill(PHOTO), tone: "casual" }));
    expect(res.status).toBe(200);
  });

  it("does not call the model when validation fails", async () => {
    await POST(post({ images: [] }));
    expect(analyseListingStream).not.toHaveBeenCalled();
  });
});
