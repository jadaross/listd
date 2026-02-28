import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ connected: false });
  }

  const { data } = await supabase
    .from("platform_connections")
    .select("platform_username, expires_at")
    .eq("user_id", session.user.id)
    .eq("platform", "ebay")
    .single();

  if (!data) {
    return NextResponse.json({ connected: false });
  }

  return NextResponse.json({
    connected: true,
    username: data.platform_username ?? null,
    expiresAt: new Date(data.expires_at).getTime(),
  });
}
