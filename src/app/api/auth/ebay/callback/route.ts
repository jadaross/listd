import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { exchangeCode, encryptToken } from "@/platforms/ebay/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get("ebay_oauth_state")?.value;

  if (!storedState || storedState !== state) {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }

  // Clear the state cookie
  cookieStore.set("ebay_oauth_state", "", { maxAge: 0, path: "/" });

  const supabase = createServerClient(cookieStore);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "No session" }, { status: 401 });
  }

  let tokens;
  try {
    tokens = await exchangeCode(code);
  } catch (err) {
    console.error("eBay token exchange error:", err);
    return NextResponse.json({ error: "Token exchange failed" }, { status: 502 });
  }

  const expiresAt = new Date(
    Date.now() + tokens.expires_in * 1000
  ).toISOString();

  const accessTokenEnc = encryptToken(tokens.access_token);
  const refreshTokenEnc = encryptToken(tokens.refresh_token);

  const { error: upsertError } = await supabase
    .from("platform_connections")
    .upsert(
      {
        user_id: session.user.id,
        platform: "ebay",
        access_token_enc: accessTokenEnc,
        refresh_token_enc: refreshTokenEnc,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,platform" }
    );

  if (upsertError) {
    console.error("Supabase upsert error:", upsertError);
    return NextResponse.json({ error: "Failed to save connection" }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  return NextResponse.redirect(`${appUrl}/?ebay=connected`);
}
