"use client";
import Link from "next/link";
import { createClient } from "../lib/supabase";
import { useRouter } from "next/navigation";
import { UserProfile } from "../types";

const PLAN_BADGE: Record<string, { label: string; col: string }> = {
  free:   { label: "FREE",   col: "#888"    },
  trader: { label: "TRADER", col: "#00E5FF" },
  pro:    { label: "PRO",    col: "#69FF47" },
  team:   { label: "TEAM",   col: "#FFD600" },
};

export default function Navbar({ profile }: { profile: UserProfile | null }) {
  const supabase = createClient();
  const router   = useRouter();
  const badge    = PLAN_BADGE[profile?.plan ?? "free"];

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(6,6,15,0.97)", position: "sticky", top: 0, zIndex: 50, fontFamily: "Courier New, monospace" }}>
      <Link href="/dashboard" style={{ fontSize: 18, fontWeight: 700, color: "#00E5FF", textDecoration: "none" }}>
        Nifty<span style={{ color: "#69FF47" }}>Greeks</span>
      </Link>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        {profile && (
          <span style={{ background: `${badge.col}18`, border: `1px solid ${badge.col}44`, color: badge.col, borderRadius: 4, padding: "2px 8px", fontSize: 9, fontWeight: 700, letterSpacing: 1 }}>
            {badge.label}
          </span>
        )}
        {profile?.plan === "free" && (
          <Link href="/pricing" style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.3)", color: "#00E5FF", padding: "6px 12px", borderRadius: 6, fontSize: 11, textDecoration: "none", fontWeight: 700 }}>
            Upgrade ↑
          </Link>
        )}
        <span style={{ fontSize: 11, color: "#444" }}>{profile?.email}</span>
        <button onClick={signOut} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#666", padding: "6px 10px", borderRadius: 6, cursor: "pointer", fontFamily: "monospace", fontSize: 11 }}>
          Sign out
        </button>
      </div>
    </nav>
  );
}
