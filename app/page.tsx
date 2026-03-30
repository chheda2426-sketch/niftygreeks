"use client";
import Link from "next/link";

const features = [
  { icon: "📊", title: "Live NSE Option Chain", desc: "Real-time Greeks pulled directly from NSE — Delta, Theta, Vega, Gamma, IV for every strike." },
  { icon: "🎯", title: "Multi-Scenario Analyser", desc: "Model Gap Up, Gap Down, Flat — see exact P&L impact before market opens." },
  { icon: "💼", title: "Portfolio Tracker", desc: "Track multiple NIFTY positions simultaneously with aggregated Greeks and live P&L." },
  { icon: "🤖", title: "Strategy DSS", desc: "AI-powered Decision Support System recommends the best-fit option strategy based on your bias and IV." },
  { icon: "⏱️", title: "Auto-Refresh", desc: "NSE data refreshes every 3 minutes during market hours. Never miss a move." },
  { icon: "📅", title: "NSE Expiry Calendar", desc: "All NIFTY50 weekly and monthly expiries pre-loaded. Holiday-adjusted automatically." },
];

const testimonials = [
  { name: "Rajesh K.", role: "Positional Trader, Mumbai", text: "Finally a dashboard that shows me real NSE Greeks without opening 5 tabs. The scenario analyser alone saved me from a bad trade." },
  { name: "Priya S.", role: "Options Writer, Bangalore", text: "The IV crush scenario feature is brilliant. I use it every expiry morning to plan my strangles." },
  { name: "Amit D.", role: "Derivatives Desk, Pune", text: "Suggested this to our entire trading desk. The multi-position portfolio view is exactly what was missing in the market." },
];

export default function LandingPage() {
  return (
    <div style={{ background: "#06060F", color: "#fff", fontFamily: "'Courier New', monospace", minHeight: "100vh" }}>

      {/* NAV */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", position: "sticky", top: 0, background: "rgba(6,6,15,0.95)", backdropFilter: "blur(10px)", zIndex: 50 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#00E5FF", letterSpacing: 1 }}>
          Nifty<span style={{ color: "#69FF47" }}>Greeks</span>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Link href="/pricing" style={{ color: "#888", fontSize: 13, textDecoration: "none" }}>Pricing</Link>
          <Link href="/login" style={{ color: "#888", fontSize: 13, textDecoration: "none" }}>Login</Link>
          <Link href="/signup" style={{ background: "rgba(0,229,255,0.12)", border: "1px solid rgba(0,229,255,0.4)", color: "#00E5FF", padding: "8px 18px", borderRadius: 8, fontSize: 13, textDecoration: "none", fontWeight: 700 }}>
            Start Free →
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ textAlign: "center", padding: "80px 24px 60px" }}>
        <div style={{ display: "inline-block", background: "rgba(105,255,71,0.1)", border: "1px solid rgba(105,255,71,0.3)", borderRadius: 20, padding: "4px 14px", fontSize: 11, color: "#69FF47", letterSpacing: 2, marginBottom: 24 }}>
          ● MARKET HOURS · LIVE NSE DATA
        </div>
        <h1 style={{ fontSize: "clamp(32px,6vw,64px)", fontWeight: 700, lineHeight: 1.15, margin: "0 auto 20px", maxWidth: 800 }}>
          Track NIFTY Options Greeks<br />
          <span style={{ color: "#00E5FF" }}>Live from NSE</span>
        </h1>
        <p style={{ fontSize: 17, color: "#666", maxWidth: 560, margin: "0 auto 36px", lineHeight: 1.7 }}>
          Real-time Delta, Theta, Vega, Gamma pulled directly from NSE option chain.
          Multi-scenario P&amp;L analysis. AI strategy recommendations. Built for serious Indian traders.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/signup" style={{ background: "#00E5FF", color: "#000", padding: "14px 32px", borderRadius: 10, fontSize: 15, fontWeight: 700, textDecoration: "none" }}>
            Start Free — No Credit Card
          </Link>
          <Link href="/pricing" style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "#aaa", padding: "14px 32px", borderRadius: 10, fontSize: 15, textDecoration: "none" }}>
            View Pricing ₹499/mo →
          </Link>
        </div>
        <p style={{ fontSize: 11, color: "#333", marginTop: 16 }}>14-day free trial on all paid plans · Cancel anytime</p>
      </section>

      {/* DASHBOARD PREVIEW */}
      <section style={{ padding: "0 24px 80px", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(0,229,255,0.2)", borderRadius: 16, padding: 24, position: "relative" }}>
          <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#00E5FF", color: "#000", padding: "3px 16px", borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
            LIVE DASHBOARD PREVIEW
          </div>
          {/* Simulated dashboard preview */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
            {[
              { label: "Delta", val: "0.418", col: "#00E5FF" },
              { label: "Theta ₹/day", val: "-17.32", col: "#FF4444" },
              { label: "Vega", val: "17.80", col: "#69FF47" },
              { label: "Gamma", val: "0.00032", col: "#FFD600" },
              { label: "IV %", val: "28.57%", col: "#FF6B35" },
              { label: "Premium ₹", val: "₹422.00", col: "#B388FF" },
            ].map(c => (
              <div key={c.label} style={{ background: `${c.col}12`, border: `1px solid ${c.col}33`, borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ color: "#555", fontSize: 9, letterSpacing: 1, textTransform: "uppercase", marginBottom: 5 }}>{c.label}</div>
                <div style={{ color: c.col, fontSize: 20, fontWeight: 700 }}>{c.val}</div>
                <div style={{ color: "#69FF47", fontSize: 9, marginTop: 3 }}>▲ 0.0012</div>
              </div>
            ))}
          </div>
          <div style={{ background: "rgba(105,255,71,0.08)", border: "1px solid rgba(105,255,71,0.2)", borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between" }}>
            <div><div style={{ fontSize: 9, color: "#444" }}>LIVE P&L</div><div style={{ fontSize: 24, fontWeight: 700, color: "#69FF47" }}>+₹49,920</div></div>
            <div style={{ textAlign: "right" }}><div style={{ fontSize: 9, color: "#444" }}>ROI</div><div style={{ fontSize: 24, fontWeight: 700, color: "#69FF47" }}>+118.3%</div></div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: "60px 24px", maxWidth: 900, margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Everything you need to trade options smarter</h2>
        <p style={{ textAlign: "center", color: "#555", marginBottom: 48, fontSize: 15 }}>Built specifically for NSE NIFTY F&amp;O traders</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
          {features.map(f => (
            <div key={f.title} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{f.title}</div>
              <div style={{ color: "#555", fontSize: 13, lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: "60px 24px", maxWidth: 900, margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", fontSize: 28, fontWeight: 700, marginBottom: 40 }}>Trusted by Indian Traders</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
          {testimonials.map(t => (
            <div key={t.name} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 20 }}>
              <div style={{ color: "#FFD600", fontSize: 16, marginBottom: 10 }}>★★★★★</div>
              <p style={{ color: "#888", fontSize: 13, lineHeight: 1.7, marginBottom: 14 }}>"{t.text}"</p>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{t.name}</div>
              <div style={{ color: "#555", fontSize: 11 }}>{t.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "60px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>Start tracking live Greeks today</h2>
        <p style={{ color: "#555", marginBottom: 28, fontSize: 15 }}>Join traders using NiftyGreeks to make smarter options decisions.</p>
        <Link href="/signup" style={{ background: "#00E5FF", color: "#000", padding: "14px 40px", borderRadius: 10, fontSize: 16, fontWeight: 700, textDecoration: "none" }}>
          Start Free Trial →
        </Link>
        <p style={{ color: "#333", fontSize: 11, marginTop: 12 }}>No credit card required · 14-day free trial · Cancel anytime</p>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "24px", textAlign: "center" }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#00E5FF", marginBottom: 8 }}>Nifty<span style={{ color: "#69FF47" }}>Greeks</span></div>
        <p style={{ color: "#333", fontSize: 11, maxWidth: 500, margin: "0 auto 12px" }}>
          For educational and analytical purposes only. Not investment advice. NSE data is indicative. Verify before trading.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", fontSize: 12, color: "#444" }}>
          <Link href="/pricing" style={{ color: "#444", textDecoration: "none" }}>Pricing</Link>
          <Link href="/login" style={{ color: "#444", textDecoration: "none" }}>Login</Link>
        </div>
      </footer>
    </div>
  );
}
