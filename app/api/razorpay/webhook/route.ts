import { NextResponse } from "next/server";
import { createServiceClient } from "../../../../lib/supabase";
import { verifyWebhookSignature } from "../../../../lib/razorpay";

export async function POST(request: Request) {
  const body      = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  if (!verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event   = JSON.parse(body);
  const supabase = createServiceClient();

  const userId       = event.payload?.subscription?.entity?.notes?.user_id;
  const plan         = event.payload?.subscription?.entity?.notes?.plan;
  const subId        = event.payload?.subscription?.entity?.id;
  const subStatus    = event.payload?.subscription?.entity?.status;

  if (!userId) return NextResponse.json({ ok: true });

  switch (event.event) {
    case "subscription.activated":
    case "subscription.charged":
      await supabase.from("profiles").update({
        plan,
        razorpay_subscription_id: subId,
        subscription_status: "active",
      }).eq("id", userId);
      break;

    case "subscription.cancelled":
    case "subscription.expired":
      await supabase.from("profiles").update({
        plan: "free",
        subscription_status: "inactive",
      }).eq("id", userId);
      break;

    case "subscription.paused":
      await supabase.from("profiles").update({ subscription_status: "inactive" }).eq("id", userId);
      break;
  }

  return NextResponse.json({ ok: true });
}
