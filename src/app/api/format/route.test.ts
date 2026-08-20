import { beforeEach, describe, expect, it, vi } from "vitest";
import { listing, platformListing } from "@/test/fixtures";

const formatListing = vi.fn();
vi.mock("@/lib/llm/format", () => ({ formatListing }));

const { POST } = await import("./route");

function post(body: unknown, raw?: string) {
  return new Request("http://localhost/api/format", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw ?? JSON.stringify(body),
  });
}

beforeEach(() => {
  formatListing.mockReset();
  formatListing.mockResolvedValue(platformListing);
});

describe("POST /api/format", () => {
  it("returns the formatted listing", async () => {
    const res = await POST(post({ listing, platform: "vinted", tone: "casual" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(platformListing);
  });

  it("passes the request through to the formatter", async () => {
    await POST(post({ listing, platform: "depop", tone: "professional" }));
    expect(formatListing).toHaveBeenCalledWith({
      listing,
      platform: "depop",
      tone: "professional",
    });
  });

  it("400s on unparsable JSON", async () => {
    const res = await POST(post(null, "{not json"));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Invalid JSON/);
  });

  it("400s when listing is missing", async () => {
    expect((await POST(post({ platform: "vinted", tone: "casual" }))).status).toBe(400);
  });

  it("400s when platform is missing", async () => {
    expect((await POST(post({ listing, tone: "casual" }))).status).toBe(400);
  });

  it("400s when tone is missing", async () => {
    expect((await POST(post({ listing, platform: "vinted" }))).status).toBe(400);
  });

  it("does not call the model when validation fails", async () => {
    await POST(post({ platform: "vinted" }));
    expect(formatListing).not.toHaveBeenCalled();
  });

  it("500s when the formatter throws", async () => {
    formatListing.mockRejectedValue(new Error("upstream is down"));
    const res = await POST(post({ listing, platform: "vinted", tone: "casual" }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/upstream is down/);
  });
});
