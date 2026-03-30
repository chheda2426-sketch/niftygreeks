import { createServerSupabaseClient } from "../../lib/supabase";
import { redirect } from "next/navigation";
import Navbar from "../../components/Navbar";
import DashboardClient from "../../components/DashboardClient";
import { UserProfile } from "../../types";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { payment?: string };
}) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: positions } = await supabase
    .from("positions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div style={{ background: "#06060F", minHeight: "100vh" }}>
      <Navbar profile={profile as UserProfile} />

      {searchParams.payment === "success" && (
        <div style={{ background: "rgba(105,255,71,0.1)", border: "1px solid rgba(105,255,71,0.3)", padding: "12px 20px", textAlign: "center", fontSize: 13, color: "#69FF47", fontFamily: "monospace" }}>
          ✓ Payment successful! Your plan has been upgraded. Welcome to NiftyGreeks Pro!
        </div>
      )}

      <DashboardClient
        profile={profile as UserProfile}
        initialPositions={positions ?? []}
      />
    </div>
  );
}
