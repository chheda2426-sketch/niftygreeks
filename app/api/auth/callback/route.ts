import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../lib/supabase";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code  = searchParams.get("code");
  const next  = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      // Upsert user profile
      await supabase.from("profiles").upsert({
        id:        data.user.id,
        email:     data.user.email,
        full_name: data.user.user_metadata?.full_name ?? null,
        plan:      "free",
      }, { onConflict: "id", ignoreDuplicates: true });
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
