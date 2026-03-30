import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "../../../../lib/supabase";
import { razorpay, PLAN_IDS } from "../../../../lib/razorpay";

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan, annual } = await request.json();
  const planId = PLAN_IDS[plan as keyof typeof PLAN_IDS];
  if (!planId) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  const subscription = await razorpay.subscriptions.create({
    plan_id:       planId,
    total_count:   annual ? 12 : 1,
    quantity:      1,
    customer_notify: 1,
    notes:         { user_id: user.id, plan },
  });

  return NextResponse.json({
    subscriptionId: subscription.id,
    keyId:          process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    userEmail:      profile?.email ?? user.email,
    userName:       profile?.full_name ?? "",
  });
}
