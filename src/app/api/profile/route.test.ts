import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", async () => (await import("@/test/auth-mock")).authMock());

const getProfile = vi.fn();
const setEnabledPlatforms = vi.fn();
vi.mock("@/lib/profile", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/profile")>()),
  getProfile,
  setEnabledPlatforms,
}));

const { authState, resetAuthState } = await import("@/test/auth-mock");
const { GET, PATCH } = await import("./route");

const profile = {
  enabledPlatforms: ["vinted", "depop"],
  allowance: { used: 4, limit: 20, resetsAt: "2026-09-01T00:00:00.000Z" },
};

function get() {
  return new Request("http://localhost/api/profile");
}

function patch(body: unknown, raw?: string) {
  return new Request("http://localhost/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: raw ?? JSON.stringify(body),
  });
}

beforeEach(() => {
  resetAuthState();
  getProfile.mockReset();
  setEnabledPlatforms.mockReset();
  getProfile.mockResolvedValue(profile);
  setEnabledPlatforms.mockImplementation(async (_t, _u, platforms) => ({
    ...profile,
    enabledPlatforms: platforms,
  }));
});

describe("GET /api/profile", () => {
  it("returns the caller's platforms and Allowance", async () => {
    const res = await GET(get());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      enabled_platforms: ["vinted", "depop"],
      allowance: { used: 4, limit: 20, resets_at: "2026-09-01T00:00:00.000Z" },
    });
  });

  it("reads the profile of the authenticated caller", async () => {
    await GET(get());
    expect(getProfile).toHaveBeenCalledWith("test-access-token");
  });

  it("401s without a bearer token", async () => {
    authState.userId = null;
    expect((await GET(get())).status).toBe(401);
  });

  it("500s when the profile cannot be read", async () => {
    getProfile.mockRejectedValue(new Error("permission denied"));
    expect((await GET(get())).status).toBe(500);
  });
});

describe("PATCH /api/profile", () => {
  it("updates the platform set", async () => {
    const res = await PATCH(patch({ enabled_platforms: ["vinted"] }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ enabled_platforms: ["vinted"] });
  });

  it("writes as the authenticated caller, for their own row", async () => {
    await PATCH(patch({ enabled_platforms: ["vinted"] }));
    expect(setEnabledPlatforms).toHaveBeenCalledWith("test-access-token", "test-user-id", ["vinted"]);
  });

  it("401s without a bearer token", async () => {
    authState.userId = null;
    const res = await PATCH(patch({ enabled_platforms: ["vinted"] }));
    expect(res.status).toBe(401);
    expect(setEnabledPlatforms).not.toHaveBeenCalled();
  });

  it("400s on unparsable JSON", async () => {
    expect((await PATCH(patch(null, "{"))).status).toBe(400);
  });

  it("400s on an empty platform set", async () => {
    const res = await PATCH(patch({ enabled_platforms: [] }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/At least one platform/);
  });

  it("400s on an unknown platform", async () => {
    const res = await PATCH(patch({ enabled_platforms: ["grailed"] }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Unknown platform/);
  });

  it("400s when the field is missing entirely", async () => {
    expect((await PATCH(patch({}))).status).toBe(400);
  });

  it("does not write when validation fails", async () => {
    await PATCH(patch({ enabled_platforms: [] }));
    expect(setEnabledPlatforms).not.toHaveBeenCalled();
  });

  it("500s when the write is refused", async () => {
    setEnabledPlatforms.mockRejectedValue(new Error("permission denied"));
    expect((await PATCH(patch({ enabled_platforms: ["vinted"] }))).status).toBe(500);
  });
});
