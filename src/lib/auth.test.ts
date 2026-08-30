import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
vi.mock("@/lib/supabase", () => ({ anonClient: () => ({ auth: { getUser } }) }));

const { authenticate, withAuth } = await import("./auth");

/** A structurally valid JWT with the given claims. Never signed — the
 *  signature is Supabase's business, and `getUser` is mocked here. */
function jwt(claims: Record<string, unknown>): string {
  const b64 = (o: unknown) =>
    btoa(JSON.stringify(o)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64(claims)}.signature-not-checked-here`;
}

const inAnHour = Math.floor(Date.now() / 1000) + 3600;
const anHourAgo = Math.floor(Date.now() / 1000) - 3600;

function request(authorization?: string): Request {
  return new Request("http://localhost/api/valuate", {
    method: "POST",
    headers: authorization ? { Authorization: authorization } : {},
  });
}

beforeEach(() => {
  getUser.mockReset();
  getUser.mockResolvedValue({ data: { user: { id: "user-from-supabase" } }, error: null });
});

describe("authenticate", () => {
  it("resolves a valid token to a user", async () => {
    const result = await authenticate(request(`Bearer ${jwt({ sub: "x", exp: inAnHour })}`));
    expect(result).toEqual({
      user: { id: "user-from-supabase", token: expect.any(String) },
    });
  });

  it("takes the user id from Supabase, never from the token's own claims", async () => {
    const result = await authenticate(
      request(`Bearer ${jwt({ sub: "an-id-the-client-made-up", exp: inAnHour })}`)
    );
    expect("user" in result && result.user.id).toBe("user-from-supabase");
  });

  it("accepts a lowercase bearer scheme", async () => {
    const result = await authenticate(request(`bearer ${jwt({ exp: inAnHour })}`));
    expect("user" in result).toBe(true);
  });

  it("reports a missing header distinctly", async () => {
    expect(await authenticate(request())).toEqual({ failure: "missing_token" });
  });

  it("reports an empty bearer value as missing", async () => {
    expect(await authenticate(request("Bearer   "))).toEqual({ failure: "missing_token" });
  });

  it("reports a non-JWT as malformed", async () => {
    expect(await authenticate(request("Bearer not-a-jwt"))).toEqual({
      failure: "malformed_token",
    });
  });

  it("reports undecodable claims as malformed", async () => {
    expect(await authenticate(request("Bearer aaa.!!!not-base64!!!.ccc"))).toEqual({
      failure: "malformed_token",
    });
  });

  it("reports an expired token distinctly from a rejected one", async () => {
    expect(await authenticate(request(`Bearer ${jwt({ exp: anHourAgo })}`))).toEqual({
      failure: "expired_token",
    });
  });

  it("does not call Supabase for a token it can already tell is expired", async () => {
    await authenticate(request(`Bearer ${jwt({ exp: anHourAgo })}`));
    expect(getUser).not.toHaveBeenCalled();
  });

  it("reports a token Supabase rejects as invalid", async () => {
    getUser.mockResolvedValue({ data: null, error: { message: "bad signature" } });
    expect(await authenticate(request(`Bearer ${jwt({ exp: inAnHour })}`))).toEqual({
      failure: "invalid_token",
    });
  });

  it("reports a token for a deleted user as invalid", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect(await authenticate(request(`Bearer ${jwt({ exp: inAnHour })}`))).toEqual({
      failure: "invalid_token",
    });
  });
});

describe("withAuth", () => {
  it("passes the verified user to the handler", async () => {
    const handler = vi.fn(async () => Response.json({ ok: true }));
    const wrapped = withAuth(handler);
    await wrapped(request(`Bearer ${jwt({ exp: inAnHour })}`));
    expect(handler).toHaveBeenCalledWith(expect.any(Request), {
      id: "user-from-supabase",
      token: expect.any(String),
    });
  });

  it("401s and never runs the handler when there is no token", async () => {
    const handler = vi.fn(async () => Response.json({ ok: true }));
    const res = await withAuth(handler)(request());
    expect(res.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("names the failure in the body so the client can react to it", async () => {
    const res = await withAuth(async () => Response.json({ ok: true }))(
      request(`Bearer ${jwt({ exp: anHourAgo })}`)
    );
    expect(await res.json()).toMatchObject({ code: "expired_token" });
  });
});
