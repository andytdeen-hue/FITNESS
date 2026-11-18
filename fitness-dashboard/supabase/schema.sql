-- Run in Supabase SQL Editor. Keep RLS enabled.
create table if not exists public.daily_logs (
 user_id uuid not null references auth.users(id) on delete cascade,
 day date not null,
 weight_lb numeric(6,2), steps integer, active_kcal numeric(9,1), workout_kcal numeric(9,1),
 calories numeric(9,1), protein_g numeric(8,1), carbs_g numeric(8,1), fat_g numeric(8,1),
 notes text, updated_at timestamptz not null default now(),
 primary key (user_id, day)
);
create table if not exists public.food_entries (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 day date not null, description text not null,
 calories numeric(9,1) not null default 0,
 protein_g numeric(8,1) not null default 0,
 carbs_g numeric(8,1) not null default 0,
 fat_g numeric(8,1) not null default 0,
 created_at timestamptz not null default now()
);
create table if not exists public.preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 goal_lb numeric(6,2) not null default 230,
 goal_date date not null default '2026-12-31',
 base_kcal numeric(8,1) not null default 2600,
 baseline_active_kcal numeric(8,1) not null default 500,
 activity_credit numeric(4,2) not null default 0.5,
 max_credit_kcal numeric(8,1) not null default 450,
 protein_goal_g numeric(8,1) not null default 180,
 fat_goal_g numeric(8,1) not null default 80,
 updated_at timestamptz not null default now()
);
alter table public.daily_logs enable row level security;
alter table public.food_entries enable row level security;
alter table public.preferences enable row level security;
drop policy if exists "own daily logs" on public.daily_logs;
create policy "own daily logs" on public.daily_logs for all to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
drop policy if exists "own food entries" on public.food_entries;
create policy "own food entries" on public.food_entries for all to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
drop policy if exists "own preferences" on public.preferences;
create policy "own preferences" on public.preferences for all to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
