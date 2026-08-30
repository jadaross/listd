import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", async () => (await import("@/test/auth-mock")).authMock());
import { platformListing } from "@/test/fixtures";

const refineListing = vi.fn();
vi.mock("@/lib/llm/refine", () => ({ refineListing }));

const { authState, resetAuthState } = await import("@/test/auth-mock");
const { POST } = await import("./route");

function post(body: unknown, raw?: string) {
  return new Request("http://localhost/api/refine", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw ?? JSON.stringify(body),
  });
}

const valid = {
  platform: "vinted",
  listing: platformListing,
  instructions: ["make it shorter"],
};

beforeEach(() => {
  resetAuthState();
  refineListing.mockReset();
  refineListing.mockResolvedValue(platformListing);
});

describe("POST /api/refine", () => {
  it("returns the refined listing", async () => {
    const res = await POST(post(valid));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(platformListing);
  });

  it("400s on unparsable JSON", async () => {
    expect((await POST(post(null, "<html>"))).status).toBe(400);
  });

  it("400s when instructions is empty", async () => {
    expect((await POST(post({ ...valid, instructions: [] }))).status).toBe(400);
  });

  it("400s when instructions is not an array", async () => {
    expect((await POST(post({ ...valid, instructions: "shorter" }))).status).toBe(400);
  });

  it("400s when the listing is missing", async () => {
    expect((await POST(post({ platform: "vinted", instructions: ["x"] }))).status).toBe(400);
  });

  it("500s when the refiner throws", async () => {
    refineListing.mockRejectedValue(new Error("model refused"));
    const res = await POST(post(valid));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/model refused/);
  });
});

// #8 — every route is behind a bearer token.
describe("authentication", () => {
  it("401s without a bearer token", async () => {
    authState.userId = null;
    const res = await POST(post(valid));
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe("missing_token");
  });

  it("does not call the model for an unauthenticated request", async () => {
    authState.userId = null;
    await POST(post(valid));
    expect(refineListing).not.toHaveBeenCalled();
  });
});
