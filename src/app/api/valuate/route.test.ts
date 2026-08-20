import { beforeEach, describe, expect, it, vi } from "vitest";

const valuate = vi.fn();
vi.mock("@/lib/valuation", () => ({ valuate }));

const { POST } = await import("./route");

const item = {
  brand: "Carhartt",
  clothing_type: "Detroit jacket",
  size: "M",
  condition: "Good",
};

const valuation = {
  perPlatform: {
    vinted: {
      low: 55,
      high: 85,
      currency: "GBP",
      confidence: "high",
      comparables: [],
      reasoning: "Listed at £55–£85.",
    },
  },
  query: "Carhartt Detroit jacket size M",
};

function post(body: unknown, raw?: string) {
  return new Request("http://localhost/api/valuate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw ?? JSON.stringify(body),
  });
}

beforeEach(() => {
  valuate.mockReset();
  valuate.mockResolvedValue(valuation);
});

describe("POST /api/valuate", () => {
  it("returns the valuation", async () => {
    const res = await POST(post({ item, platforms: ["vinted"] }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(valuation);
  });

  it("passes the enabled platforms through", async () => {
    await POST(post({ item, platforms: ["vinted", "depop"] }));
    expect(valuate).toHaveBeenCalledWith(item, ["vinted", "depop"]);
  });

  it("400s on unparsable JSON", async () => {
    expect((await POST(post(null, "{"))).status).toBe(400);
  });

  it("400s when the item is missing", async () => {
    expect((await POST(post({ platforms: ["vinted"] }))).status).toBe(400);
  });

  it("400s when the item lacks a size", async () => {
    const { size: _omitted, ...partial } = item;
    expect((await POST(post({ item: partial, platforms: ["vinted"] }))).status).toBe(400);
  });

  it("400s on an empty platform list", async () => {
    const res = await POST(post({ item, platforms: [] }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/At least one platform/);
  });

  it("400s on an unknown platform", async () => {
    const res = await POST(post({ item, platforms: ["grailed"] }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Unknown platform/);
  });

  it("does not value when validation fails", async () => {
    await POST(post({ item, platforms: [] }));
    expect(valuate).not.toHaveBeenCalled();
  });

  it("500s when valuation throws", async () => {
    valuate.mockRejectedValue(new Error("search is down"));
    const res = await POST(post({ item, platforms: ["vinted"] }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/search is down/);
  });
});
