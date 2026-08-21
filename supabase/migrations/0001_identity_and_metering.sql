-- Identity, Enabled Platforms and the Allowance meter.
-- See docs/adr/0006-supabase-for-auth-and-metering.md and
--     docs/adr/0007-metered-from-day-one.md
--
-- Vocabulary is CONTEXT.md's: a Platform is a resale destination, an Enabled
-- Platform is one the user actually sells on, and the Allowance is how much
-- valuing they may do before being asked to pay.

create type public.platform as enum ('vinted', 'depop', 'ebay');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,

  -- Lives server-side because both the Valuation and the meter read it.
  enabled_platforms public.platform[] not null
    default array['vinted', 'depop', 'ebay']::public.platform[],

  -- The meter. Counted server-side; never writable by the client (see grants).
  allowance_used integer not null default 0,
  allowance_limit integer not null default 20,
  allowance_period_start timestamptz not null default date_trunc('month', now()),

  created_at timestamptz not null default now(),

  constraint enabled_platforms_not_empty
    check (cardinality(enabled_platforms) > 0),
  constraint allowance_used_non_negative
    check (allowance_used >= 0)
);

comment on column public.profiles.enabled_platforms is
  'Platforms this user sells on. Only these are ever valued — ADR-0004.';
comment on column public.profiles.allowance_used is
  'Server-side only. Client has no update grant on this column.';

-- ── Row Level Security ────────────────────────────────────────────────────
alter table public.profiles enable row level security;
-- Applies the policies to the table owner too, so nothing quietly bypasses them.
alter table public.profiles force row level security;

-- auth.uid() is wrapped in a SELECT so it is evaluated once per query rather
-- than once per row.
create policy profiles_select_own on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy profiles_update_own on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ── Column grants ─────────────────────────────────────────────────────────
-- RLS is row-level, not column-level: without these grants a user passing the
-- row check could zero their own allowance_used. The client may read its whole
-- row but may only ever write enabled_platforms. The meter is moved by the
-- service role, which bypasses RLS.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (enabled_platforms) on public.profiles to authenticated;

-- ── Profile creation ──────────────────────────────────────────────────────
-- Every auth identity gets a profile, so no code path has to cope with a
-- signed-in user that has no row.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
