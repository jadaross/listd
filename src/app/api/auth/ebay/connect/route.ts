import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { buildAuthUrl } from "@/lib/ebay-auth";

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  // Ensure an anonymous session exists
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }
  }

  // Generate CSRF state token
  const state = randomBytes(32).toString("hex");

  // Store state in httpOnly cookie (10 minute TTL)
  cookieStore.set("ebay_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10,
    path: "/",
  });

  return NextResponse.redirect(buildAuthUrl(state));
}
