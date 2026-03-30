import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../lib/supabase";
import { fetchNSEGreeks } from "../../../lib/nse";
import { PLAN_LIMITS } from "../../../types";

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
  const plan = (profile?.plan ?? "free") as keyof typeof PLAN_LIMITS;

  if (!PLAN_LIMITS[plan].liveNSE) {
    return NextResponse.json({ error: "Upgrade to Trader or Pro for live NSE data" }, { status: 403 });
  }

  const { strike, expiry, optType } = await request.json();
  const data = await fetchNSEGreeks(strike, expiry, optType);
  if (!data) return NextResponse.json({ error: "Could not fetch NSE data" }, { status: 502 });

  return NextResponse.json(data);
}
