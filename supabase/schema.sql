-- ============================================================
-- NEGM OS — Database schema + RLS policies (Milestone 2.1)
-- ============================================================
--
-- Run this once in:
--   Supabase Dashboard → SQL Editor → New query → Paste → Run
--
-- This creates all tables, RLS policies, indexes, and triggers
-- for milestone 2.1. Safe to re-run (uses IF NOT EXISTS).
-- ============================================================

-- ============================================================
-- 1. PROFILES — extends auth.users with NEGM OS-specific data
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'DR. NEGM',
  initials text not null default 'DN',
  role text not null default 'Owner',
  current_balance numeric(12, 2) not null default 0,
  savings_balance numeric(12, 2) not null default 0,
  preferred_currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 2. DEBTS — money owed to me
-- ============================================================
create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  person_name text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  outstanding numeric(12, 2) not null check (outstanding >= 0 and outstanding <= amount),
  due_date timestamptz,
  note text,
  status text not null default 'pending' check (status in ('pending', 'partial', 'paid', 'overdue')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists debts_user_id_idx on public.debts(user_id);
create index if not exists debts_user_status_idx on public.debts(user_id, status);
create index if not exists debts_user_due_idx on public.debts(user_id, due_date);

-- ============================================================
-- 3. INCOMING_MONEY — expected incoming payments
-- ============================================================
create table if not exists public.incoming_money (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  expected_date timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled', 'received', 'delayed')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists incoming_user_id_idx on public.incoming_money(user_id);
create index if not exists incoming_user_status_idx on public.incoming_money(user_id, status);

-- ============================================================
-- 4. PAYMENTS — payment history (immutable once recorded)
-- ============================================================
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  person_name text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  received_at timestamptz not null default now(),
  method text not null default 'cash' check (method in ('cash', 'bank', 'wallet', 'card')),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists payments_user_id_idx on public.payments(user_id);
create index if not exists payments_user_received_idx on public.payments(user_id, received_at);

-- ============================================================
-- 5. CALENDAR_EVENTS — shifts, lectures, appointments, personal, reminders
-- ============================================================
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  type text not null default 'personal' check (type in ('shift', 'lecture', 'appointment', 'personal', 'reminder')),
  location text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_user_id_idx on public.calendar_events(user_id);
create index if not exists events_user_start_idx on public.calendar_events(user_id, start_time);

-- ============================================================
-- 6. TASKS — todos and reminders
-- ============================================================
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  due_date timestamptz,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  completed boolean not null default false,
  completed_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists tasks_user_completed_idx on public.tasks(user_id, completed);
create index if not exists tasks_user_priority_idx on public.tasks(user_id, priority);

-- ============================================================
-- 7. ACTIVITY_LOG — recent activity feed (append-only)
-- ============================================================
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('payment', 'debt', 'task', 'calendar', 'system')),
  description text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_user_id_idx on public.activity_log(user_id);
create index if not exists activity_user_created_idx on public.activity_log(user_id, created_at desc);

-- ============================================================
-- 8. AUTH_AUDIT_LOG — PIN attempt logging (milestone 2.5)
-- Server-side only — no client RLS policies = client can't read/write.
-- Only the service_role client (which bypasses RLS) can use this.
-- ============================================================
create table if not exists public.auth_audit_log (
  id uuid primary key default gen_random_uuid(),
  user_email text,
  ip_address text,
  user_agent text,
  success boolean not null,
  failure_reason text,
  created_at timestamptz not null default now()
);

create index if not exists audit_email_idx on public.auth_audit_log(user_email);
create index if not exists audit_created_idx on public.auth_audit_log(created_at desc);

-- ============================================================
-- 9. UPDATED_AT TRIGGER — auto-update updated_at on every row change
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$ begin
  new.updated_at = now();
  return new;
end;
 $$;

drop trigger if exists debts_updated_at on public.debts;
create trigger debts_updated_at before update on public.debts
  for each row execute function public.handle_updated_at();

drop trigger if exists incoming_money_updated_at on public.incoming_money;
create trigger incoming_money_updated_at before update on public.incoming_money
  for each row execute function public.handle_updated_at();

drop trigger if exists payments_updated_at on public.payments;
create trigger payments_updated_at before update on public.payments
  for each row execute function public.handle_updated_at();

drop trigger if exists calendar_events_updated_at on public.calendar_events;
create trigger calendar_events_updated_at before update on public.calendar_events
  for each row execute function public.handle_updated_at();

drop trigger if exists tasks_updated_at on public.tasks;
create trigger tasks_updated_at before update on public.tasks
  for each row execute function public.handle_updated_at();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();

-- ============================================================
-- 10. ENABLE RLS ON ALL TABLES
-- ============================================================
alter table public.profiles enable row level security;
alter table public.debts enable row level security;
alter table public.incoming_money enable row level security;
alter table public.payments enable row level security;
alter table public.calendar_events enable row level security;
alter table public.tasks enable row level security;
alter table public.activity_log enable row level security;
alter table public.auth_audit_log enable row level security;

-- ============================================================
-- 11. RLS POLICIES — scope every table to the authenticated user
-- ============================================================
-- PROFILES
drop policy if exists "Profiles viewable by owner" on public.profiles;
create policy "Profiles viewable by owner" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Profiles updatable by owner" on public.profiles;
create policy "Profiles updatable by owner" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "Profiles insertable by owner" on public.profiles;
create policy "Profiles insertable by owner" on public.profiles
  for insert with check (auth.uid() = id);

-- DEBTS
drop policy if exists "Debts viewable by owner" on public.debts;
create policy "Debts viewable by owner" on public.debts
  for select using (auth.uid() = user_id);

drop policy if exists "Debts insertable by owner" on public.debts;
create policy "Debts insertable by owner" on public.debts
  for insert with check (auth.uid() = user_id);

drop policy if exists "Debts updatable by owner" on public.debts;
create policy "Debts updatable by owner" on public.debts
  for update using (auth.uid() = user_id);

drop policy if exists "Debts deletable by owner" on public.debts;
create policy "Debts deletable by owner" on public.debts
  for delete using (auth.uid() = user_id);

-- INCOMING_MONEY
drop policy if exists "Incoming viewable by owner" on public.incoming_money;
create policy "Incoming viewable by owner" on public.incoming_money
  for select using (auth.uid() = user_id);

drop policy if exists "Incoming insertable by owner" on public.incoming_money;
create policy "Incoming insertable by owner" on public.incoming_money
  for insert with check (auth.uid() = user_id);

drop policy if exists "Incoming updatable by owner" on public.incoming_money;
create policy "Incoming updatable by owner" on public.incoming_money
  for update using (auth.uid() = user_id);

drop policy if exists "Incoming deletable by owner" on public.incoming_money;
create policy "Incoming deletable by owner" on public.incoming_money
  for delete using (auth.uid() = user_id);

-- PAYMENTS (insert + select + delete; no update — payments are immutable)
drop policy if exists "Payments viewable by owner" on public.payments;
create policy "Payments viewable by owner" on public.payments
  for select using (auth.uid() = user_id);

drop policy if exists "Payments insertable by owner" on public.payments;
create policy "Payments insertable by owner" on public.payments
  for insert with check (auth.uid() = user_id);

drop policy if exists "Payments deletable by owner" on public.payments;
create policy "Payments deletable by owner" on public.payments
  for delete using (auth.uid() = user_id);

-- CALENDAR_EVENTS
drop policy if exists "Events viewable by owner" on public.calendar_events;
create policy "Events viewable by owner" on public.calendar_events
  for select using (auth.uid() = user_id);

drop policy if exists "Events insertable by owner" on public.calendar_events;
create policy "Events insertable by owner" on public.calendar_events
  for insert with check (auth.uid() = user_id);

drop policy if exists "Events updatable by owner" on public.calendar_events;
create policy "Events updatable by owner" on public.calendar_events
  for update using (auth.uid() = user_id);

drop policy if exists "Events deletable by owner" on public.calendar_events;
create policy "Events deletable by owner" on public.calendar_events
  for delete using (auth.uid() = user_id);

-- TASKS
drop policy if exists "Tasks viewable by owner" on public.tasks;
create policy "Tasks viewable by owner" on public.tasks
  for select using (auth.uid() = user_id);

drop policy if exists "Tasks insertable by owner" on public.tasks;
create policy "Tasks insertable by owner" on public.tasks
  for insert with check (auth.uid() = user_id);

drop policy if exists "Tasks updatable by owner" on public.tasks;
create policy "Tasks updatable by owner" on public.tasks
  for update using (auth.uid() = user_id);

drop policy if exists "Tasks deletable by owner" on public.tasks;
create policy "Tasks deletable by owner" on public.tasks
  for delete using (auth.uid() = user_id);

-- ACTIVITY_LOG (insert + select only — append-only, no update/delete)
drop policy if exists "Activity viewable by owner" on public.activity_log;
create policy "Activity viewable by owner" on public.activity_log
  for select using (auth.uid() = user_id);

drop policy if exists "Activity insertable by owner" on public.activity_log;
create policy "Activity insertable by owner" on public.activity_log
  for insert with check (auth.uid() = user_id);

-- AUTH_AUDIT_LOG: intentionally no policies = client can't access
-- (server-side inserts via service_role bypass RLS).

-- ============================================================
-- 12. AUTO-CREATE PROFILE ON SIGNUP
-- When a new auth.users row is created, automatically create a
-- matching public.profiles row with default values.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$ begin
  insert into public.profiles (id, display_name, initials, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', 'DR. NEGM'),
    coalesce(new.raw_user_meta_data->>'initials', 'DN'),
    'Owner'
  )
  on conflict (id) do nothing;
  return new;
end;
 $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 13. BACKFILL PROFILES for existing auth.users without one
-- (e.g., the owner account you created manually in setup task 3)
-- ============================================================
insert into public.profiles (id, display_name, initials, role)
select
  id,
  coalesce(raw_user_meta_data->>'display_name', 'DR. NEGM'),
  coalesce(raw_user_meta_data->>'initials', 'DN'),
  'Owner'
from auth.users
where id not in (select id from public.profiles);
