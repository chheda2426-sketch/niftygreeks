import Razorpay from "razorpay";

export const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export const PLAN_IDS = {
  trader: process.env.RAZORPAY_PLAN_TRADER!,
  pro:    process.env.RAZORPAY_PLAN_PRO!,
  team:   process.env.RAZORPAY_PLAN_TEAM!,
};

export function verifyWebhookSignature(body: string, signature: string): boolean {
  const crypto = require("crypto");
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");
  return expected === signature;
}
