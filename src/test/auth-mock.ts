import type { AuthedHandler } from "@/lib/auth";

/**
 * Stands in for `@/lib/auth` in route tests. Token verification is covered
 * properly in `src/lib/auth.test.ts`; here we only need a signed-in caller,
 * and the ability to take them away again to prove the route is actually
 * wrapped rather than merely importing the wrapper.
 *
 * Use it as:
 *
 *   vi.mock("@/lib/auth", async () => (await import("@/test/auth-mock")).authMock());
 *   import { authState } from "@/test/auth-mock";
 */

export const authState: { userId: string | null; token: string } = {
  userId: "test-user-id",
  token: "test-access-token",
};

/** Back to a signed-in caller. Call from `beforeEach`. */
export function resetAuthState(): void {
  authState.userId = "test-user-id";
  authState.token = "test-access-token";
}

export function authMock() {
  return {
    withAuth: (handler: AuthedHandler) => async (request: Request) => {
      if (authState.userId === null) {
        return Response.json(
          { error: "Authorization header with a bearer token is required", code: "missing_token" },
          { status: 401 }
        );
      }
      return handler(request, { id: authState.userId, token: authState.token });
    },
  };
}
