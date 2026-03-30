-- ══════════════════════════════════════════════════════════
--  NiftyGreeks — Supabase Schema
--  Run this in Supabase → SQL Editor → New Query
-- ══════════════════════════════════════════════════════════

-- 1. User Profiles
create table if not exists profiles (
  id                      uuid primary key references auth.users(id) on delete cascade,
  email                   text,
  full_name               text,
  plan                    text not null default 'free' check (plan in ('free','trader','pro','team')),
  razorpay_subscription_id text,
  subscription_status     text check (subscription_status in ('active','inactive','trialing')),
  trial_ends_at           timestamptz,
  created_at              timestamptz default now()
);

-- Enable Row Level Security
alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, full_name, plan)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    'free'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ──────────────────────────────────────────────────────────

-- 2. Saved Positions
create table if not exists positions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  label         text not null,
  strike        integer not null,
  opt_type      text not null check (opt_type in ('CE','PE')),
  expiry_date   date not null,
  expiry_label  text not null,
  dte           integer not null,
  entry_price   numeric(10,2) not null default 0,
  lot_size      integer not null default 65,
  iv            numeric(6,4) not null default 0.2857,
  color         text default '#00E5FF',
  created_at    timestamptz default now()
);

alter table positions enable row level security;

create policy "Users can manage own positions"
  on positions for all using (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────

-- 3. Useful indexes
create index if not exists positions_user_id_idx on positions(user_id);
create index if not exists profiles_plan_idx on profiles(plan);

-- ──────────────────────────────────────────────────────────

-- 4. Verify everything works
select 'Schema created successfully' as status;
