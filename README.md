# NiftyGreeks 🚀
### Live NSE Options Greeks Dashboard — SaaS for Indian Traders

> Real-time Delta, Theta, Vega, Gamma from NSE · Multi-scenario P&L · Razorpay subscriptions · Built with Next.js 14

---

## 📁 Project Structure

```
niftygreeks/
├── app/
│   ├── page.tsx                          ← Landing page (marketing)
│   ├── pricing/page.tsx                  ← Pricing + Razorpay checkout
│   ├── login/page.tsx                    ← Login (magic link + Google)
│   ├── signup/page.tsx                   ← Signup page
│   ├── dashboard/page.tsx                ← Protected dashboard
│   └── api/
│       ├── auth/callback/route.ts        ← Supabase auth callback
│       ├── nse/route.ts                  ← NSE live data fetch (plan-gated)
│       ├── positions/route.ts            ← CRUD for saved positions
│       └── razorpay/
│           ├── create-subscription/      ← Start Razorpay subscription
│           └── webhook/route.ts          ← Handle payment events
├── components/
│   ├── DashboardClient.tsx               ← Full Greeks dashboard UI
│   └── Navbar.tsx                        ← Top navigation
├── lib/
│   ├── supabase.ts                       ← DB client (browser + server)
│   ├── razorpay.ts                       ← Payment client
│   └── nse.ts                            ← NSE data fetcher via Claude API
├── types/index.ts                        ← TypeScript types + plan limits
├── middleware.ts                         ← Auth route protection
├── supabase-schema.sql                   ← Run this in Supabase SQL editor
└── .env.example                          ← All required env vars
```

---

## 🛠️ Step-by-Step Deployment

### STEP 1 — Prerequisites
Install these on your machine:
- Node.js 18+ → https://nodejs.org
- Git → https://git-scm.com

### STEP 2 — Clone & Install

```bash
git clone <your-repo-url> niftygreeks
cd niftygreeks
npm install
```

### STEP 3 — Set Up Supabase (Free)

1. Go to https://supabase.com → Create new project
2. Note your project URL and anon key (Settings → API)
3. Go to SQL Editor → New Query
4. Paste the entire contents of `supabase-schema.sql` and click Run
5. Go to Authentication → Providers → Enable Google OAuth
   - Add your Google Client ID & Secret from https://console.cloud.google.com
6. Go to Authentication → URL Configuration → Add Site URL: `https://yourdomain.com`
7. Add Redirect URL: `https://yourdomain.com/api/auth/callback`

### STEP 4 — Set Up Razorpay

1. Create account at https://razorpay.com
2. Complete KYC (required for live payments)
3. Get API Keys from Settings → API Keys
4. Create subscription plans at Subscriptions → Plans:
   - **Trader Plan**: ₹499/month, 1 month interval
   - **Pro Plan**: ₹999/month, 1 month interval
   - **Team Plan**: ₹2499/month, 1 month interval
   - Note the plan IDs (format: `plan_xxxx`)
5. Set up webhook at Settings → Webhooks:
   - URL: `https://yourdomain.com/api/razorpay/webhook`
   - Select events: `subscription.activated`, `subscription.charged`, `subscription.cancelled`, `subscription.expired`
   - Note the webhook secret

### STEP 5 — Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values:

```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com

NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxx
RAZORPAY_KEY_SECRET=xxxx
RAZORPAY_WEBHOOK_SECRET=xxxx
RAZORPAY_PLAN_TRADER=plan_xxxx
RAZORPAY_PLAN_PRO=plan_xxxx
RAZORPAY_PLAN_TEAM=plan_xxxx

ANTHROPIC_API_KEY=sk-ant-xxxx
```

### STEP 6 — Test Locally

```bash
npm run dev
```

Open http://localhost:3000

Test the full flow:
- [ ] Landing page loads
- [ ] Sign up with email magic link
- [ ] Dashboard loads after login
- [ ] Pricing page shows correctly
- [ ] Use Razorpay test keys for payment test

### STEP 7 — Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Go to https://vercel.com → New Project → Import your repo
3. Add all environment variables in Vercel dashboard
4. Deploy → Vercel gives you a URL
5. Update `NEXT_PUBLIC_APP_URL` to your Vercel URL
6. Update Supabase redirect URLs with your Vercel URL
7. Update Razorpay webhook URL with your Vercel URL

```bash
# Or deploy via Vercel CLI
npm i -g vercel
vercel --prod
```

---

## 💰 Razorpay Plan Setup Details

In Razorpay Dashboard → Subscriptions → Plans, create:

| Plan    | Period | Interval | Amount    |
|---------|--------|----------|-----------|
| Trader  | monthly| 1        | ₹499 × 100 paisa = 49900 |
| Pro     | monthly| 1        | ₹999 × 100 = 99900 |
| Team    | monthly| 1        | ₹2499 × 100 = 249900 |

> Note: Razorpay amounts are in **paise** (100 paise = ₹1)

---

## 🔐 Plan Feature Limits

Defined in `types/index.ts`:

| Feature         | Free | Trader | Pro  | Team |
|-----------------|------|--------|------|------|
| Positions       | 1    | 5      | 20   | 50   |
| Live NSE data   | ✗    | ✓      | ✓    | ✓    |
| Auto-refresh    | ✗    | ✓      | ✓    | ✓    |
| Scenarios       | 2    | 10     | 50   | 50   |
| Export to PDF   | ✗    | ✗      | ✓    | ✓    |
| Team members    | 1    | 1      | 1    | 5    |

---

## 📣 Marketing Launch Checklist

- [ ] Domain registered (niftygreeks.in or similar)
- [ ] Vercel deployment live
- [ ] Razorpay KYC approved
- [ ] Tested full signup → payment → dashboard flow
- [ ] Create Telegram channel for users
- [ ] Post on Twitter/X with dashboard screenshot
- [ ] Share in 5 NSE options trading Telegram groups
- [ ] Record a 3-minute YouTube demo video
- [ ] Set up Google Analytics (add to layout.tsx)

---

## 🆘 Common Issues

**Login not redirecting after email click**
→ Check Supabase Redirect URLs include `/api/auth/callback`

**Razorpay webhook not firing**
→ Verify webhook URL is publicly accessible (not localhost)
→ Check webhook secret matches `.env.local`

**NSE fetch returning null**
→ Verify `ANTHROPIC_API_KEY` is set correctly
→ Check Anthropic account has web search access

**Build errors**
→ Run `npm run build` locally first to catch TypeScript errors

---

## 📞 Support

Built for Dharmesh at BILT Yamunanagar.
All components are modular — each file is independently editable.

**Key files to customise:**
- `app/page.tsx` — Landing page copy and testimonials
- `types/index.ts` — Change plan prices and limits
- `app/pricing/page.tsx` — Pricing page UI
- `components/DashboardClient.tsx` — Main dashboard features
