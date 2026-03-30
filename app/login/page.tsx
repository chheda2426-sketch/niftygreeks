"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase";

export default function LoginPage() {
  const [email, setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]     = useState(false);
  const [error, setError]   = useState("");
  const supabase = createClient();

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback` },
    });
    if (error) setError(error.message);
    else setSent(true);
    setLoading(false);
  }

  async function handleGoogle() {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback` },
    });
  }

  return (
    <div style={{ background: "#06060F", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Courier New, monospace", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <Link href="/" style={{ display: "block", textAlign: "center", fontSize: 22, fontWeight: 700, color: "#00E5FF", textDecoration: "none", marginBottom: 32 }}>
          Nifty<span style={{ color: "#69FF47" }}>Greeks</span>
        </Link>

        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 28 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6, textAlign: "center" }}>Welcome back</h1>
          <p style={{ color: "#555", fontSize: 13, textAlign: "center", marginBottom: 24 }}>Sign in to your NiftyGreeks account</p>

          {sent ? (
            <div style={{ background: "rgba(105,255,71,0.08)", border: "1px solid rgba(105,255,71,0.2)", borderRadius: 10, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>📧</div>
              <div style={{ color: "#69FF47", fontWeight: 700, marginBottom: 6 }}>Check your email</div>
              <div style={{ color: "#666", fontSize: 12 }}>We sent a magic link to <strong style={{ color: "#fff" }}>{email}</strong></div>
            </div>
          ) : (
            <>
              {/* Google */}
              <button onClick={handleGoogle} disabled={loading}
                style={{ width: "100%", padding: "11px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "#fff", cursor: "pointer", fontFamily: "monospace", fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span>G</span> Continue with Google
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
                <span style={{ fontSize: 11, color: "#444" }}>or email</span>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
              </div>

              <form onSubmit={handleMagicLink}>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required
                  style={{ width: "100%", background: "#0a0a14", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: 8, padding: "11px 14px", fontFamily: "monospace", fontSize: 13, marginBottom: 12, boxSizing: "border-box" }} />
                {error && <div style={{ color: "#FF6666", fontSize: 11, marginBottom: 10 }}>{error}</div>}
                <button type="submit" disabled={loading || !email}
                  style={{ width: "100%", padding: "11px", borderRadius: 8, background: "#00E5FF", color: "#000", border: "none", fontWeight: 700, fontSize: 13, cursor: loading ? "wait" : "pointer", fontFamily: "monospace" }}>
                  {loading ? "Sending…" : "Send Magic Link →"}
                </button>
              </form>
            </>
          )}
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "#444", marginTop: 16 }}>
          No account? <Link href="/signup" style={{ color: "#00E5FF", textDecoration: "none" }}>Start free trial</Link>
        </p>
      </div>
    </div>
  );
}
