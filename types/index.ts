export type Plan = "free" | "trader" | "pro" | "team";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  plan: Plan;
  razorpay_subscription_id: string | null;
  subscription_status: "active" | "inactive" | "trialing" | null;
  trial_ends_at: string | null;
  created_at: string;
}

export interface Position {
  id: string;
  user_id: string;
  label: string;
  strike: number;
  opt_type: "CE" | "PE";
  expiry_date: string;
  expiry_label: string;
  dte: number;
  entry_price: number;
  lot_size: number;
  iv: number;
  color: string;
  created_at: string;
}

export interface Scenario {
  id: number;
  label: string;
  target: number;
  iv_delta: number;
  col: string;
}

export interface LiveGreeks {
  spot: number;
  ltp: number;
  iv: number;
  delta: number;
  theta: number;
  vega: number;
  gamma: number;
  oi: number;
  volume: number;
  bid: number;
  ask: number;
  fetchTime: string;
}

export const PLAN_LIMITS: Record<Plan, {
  positions: number;
  liveNSE: boolean;
  autoRefresh: boolean;
  scenarios: number;
  export: boolean;
  teamMembers: number;
}> = {
  free:   { positions:1,  liveNSE:false, autoRefresh:false, scenarios:2, export:false, teamMembers:1 },
  trader: { positions:5,  liveNSE:true,  autoRefresh:true,  scenarios:10, export:false, teamMembers:1 },
  pro:    { positions:20, liveNSE:true,  autoRefresh:true,  scenarios:50, export:true,  teamMembers:1 },
  team:   { positions:50, liveNSE:true,  autoRefresh:true,  scenarios:50, export:true,  teamMembers:5 },
};

export const PLAN_PRICES: Record<Plan, { monthly: number; annual: number; label: string }> = {
  free:   { monthly:0,    annual:0,     label:"Free"   },
  trader: { monthly:499,  annual:4990,  label:"Trader" },
  pro:    { monthly:999,  annual:9990,  label:"Pro"    },
  team:   { monthly:2499, annual:24990, label:"Team"   },
};
