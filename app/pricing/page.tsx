"use client";
import { useState } from "react";
import Link from "next/link";
import { PLAN_PRICES } from "../../types";

declare global { interface Window { Razorpay: any; } }

const plans = [
  {
    key: "free",
    name: "Free",
    price: 0,
    annual: 0,
    color: "#888",
    features: ["1 position", "Black-Scholes model", "2 scenarios", "Basic Greeks chart"],
    cta: "Start Free",
    popular: false,
  },
  {
    key: "trader",
    name: "Trader",
    price: 499,
    annual: 4990,
    color: "#00E5FF",
    features: ["5 positions", "● NSE LIVE data", "Auto-refresh (3 min)", "10 custom scenarios", "All 6 Greeks + chart", "NSE expiry calendar"],
    cta: "Start 14-Day Trial",
    popular: true,
  },
  {
    key: "pro",
    name: "Pro",
    price: 999,
    annual: 9990,
    color: "#69FF47",
    features: ["20 positions", "● NSE LIVE data", "Auto-refresh (1 min)", "Unlimited scenarios", "PDF export", "Strategy DSS AI", "Portfolio P&L"],
    cta: "Start 14-Day Trial",
    popular: false,
  },
  {
    key: "team",
    name: "Team",
    price: 2499,
    annual: 24990,
    color: "#FFD600",
    features: ["50 positions", "5 team members", "Shared portfolio view", "Priority support", "All Pro features", "WhatsApp alerts"],
    cta: "Start 14-Day Trial",
    popular: false,
  },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSubscribe(planKey: string) {
    if (planKey === "free") { window.location.href = "/signup"; return; }
    setLoading(planKey);
    try {
      const res = await fetch("/api/razorpay/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey, annual }),
      });
      const { subscriptionId, keyId, userEmail, userName } = await res.json();
      if (!subscriptionId) { alert("Please login first"); window.location.href = "/login"; return; }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      document.body.appendChild(script);
      script.onload = () => {
        const rzp = new window.Razorpay({
          key: keyId,
          subscription_id: subscriptionId,
          name: "NiftyGreeks",
          description: `${planKey.charAt(0).toUpperCase()+planKey.slice(1)} Plan`,
          prefill: { email: userEmail, name: userName },
          theme: { color: "#00E5FF" },
          handler: () => { window.location.href = "/dashboard?payment=success"; },
        });
        rzp.open();
      };
    } catch (e) {
      alert("Error initiating payment. Please try again.");
    }
    setLoading(null);
  }

  return (
    <div style={{ background: "#06060F", minHeight: "100vh", color: "#fff", fontFamily: "Courier New, monospace", padding: "24px" }}>
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 48 }}>
        <Link href="/" style={{ fontSize: 20, fontWeight: 700, color: "#00E5FF", textDecoration: "none" }}>
          Nifty<span style={{ color: "#69FF47" }}>Greeks</span>
        </Link>
        <Link href="/login" style={{ color: "#888", fontSize: 13, textDecoration: "none" }}>Login</Link>
      </nav>

      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 8 }}>Simple, transparent pricing</h1>
        <p style={{ color: "#555", fontSize: 15 }}>Less than one losing trade per month</p>

        {/* Annual toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginTop: 20 }}>
          <span style={{ fontSize: 13, color: annual ? "#555" : "#fff" }}>Monthly</span>
          <div onClick={() => setAnnual(a => !a)}
            style={{ width: 44, height: 24, borderRadius: 12, background: annual ? "#69FF47" : "rgba(255,255,255,0.1)", cursor: "pointer", position: "relative", transition: "all 0.2s" }}>
            <div style={{ position: "absolute", top: 3, left: annual ? 22 : 3, width: 18, height: 18, borderRadius: "50%", background: annual ? "#000" : "#888", transition: "all 0.2s" }} />
          </div>
          <span style={{ fontSize: 13, color: annual ? "#fff" : "#555" }}>Annual <span style={{ color: "#69FF47", fontSize: 11 }}>Save 2 months</span></span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16, maxWidth: 900, margin: "0 auto" }}>
        {plans.map(p => (
          <div key={p.key} style={{ background: p.popular ? `${p.color}08` : "rgba(255,255,255,0.02)", border: `2px solid ${p.popular ? p.color : "rgba(255,255,255,0.07)"}`, borderRadius: 14, padding: 24, position: "relative" }}>
            {p.popular && (
              <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: p.color, color: "#000", padding: "3px 14px", borderRadius: 12, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>
                MOST POPULAR
              </div>
            )}
            <div style={{ fontSize: 11, color: p.color, letterSpacing: 2, fontWeight: 700, marginBottom: 6 }}>{p.name.toUpperCase()}</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: "#fff", marginBottom: 2 }}>
              {p.price === 0 ? "Free" : `₹${annual ? Math.round((p.annual||p.price*10)/12) : p.price}`}
              {p.price > 0 && <span style={{ fontSize: 13, color: "#555", fontWeight: 400 }}>/mo</span>}
            </div>
            {annual && p.annual > 0 && (
              <div style={{ fontSize: 11, color: "#69FF47", marginBottom: 16 }}>₹{p.annual}/year · 2 months free</div>
            )}
            <div style={{ margin: "20px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }} />
            {p.features.map(f => (
              <div key={f} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                <span style={{ color: p.color, fontSize: 12, marginTop: 1 }}>✓</span>
                <span style={{ fontSize: 12, color: f.startsWith("●") ? "#69FF47" : "#888" }}>{f}</span>
              </div>
            ))}
            <button onClick={() => handleSubscribe(p.key)} disabled={loading === p.key}
              style={{ width: "100%", marginTop: 20, padding: "11px", borderRadius: 8, border: `1px solid ${p.color}`, background: p.popular ? p.color : "transparent", color: p.popular ? "#000" : p.color, cursor: loading === p.key ? "wait" : "pointer", fontWeight: 700, fontSize: 13, fontFamily: "monospace" }}>
              {loading === p.key ? "Loading…" : p.cta}
            </button>
          </div>
        ))}
      </div>

      <p style={{ textAlign: "center", color: "#333", fontSize: 11, marginTop: 32 }}>
        All plans include 14-day free trial · Payments via Razorpay · UPI, Cards, Net Banking accepted · Cancel anytime
      </p>
    </div>
  );
}
