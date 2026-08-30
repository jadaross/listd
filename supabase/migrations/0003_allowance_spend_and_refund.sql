-- Moving the Allowance meter. See docs/adr/0007-metered-from-day-one.md.
--
-- The meter cannot be moved with a plain UPDATE from the API: "spend a unit if
-- one is left" is a read-then-write, and two valuations racing on the same
-- account would both read the same remaining unit and both spend it. Doing it
-- in one statement makes Postgres re-check the condition against the updated
-- row after taking its lock, so the second caller sees the first caller's spend.
--
-- Both functions are SECURITY DEFINER and executable only by service_role:
-- the meter is server-side, and a client that could call these could refund
-- itself indefinitely.

-- ── Spend ─────────────────────────────────────────────────────────────────
-- Returns one row: whether a unit was spent, the state after the attempt, and
-- when the period rolls over. Returns NO rows when the profile does not exist,
-- which the caller treats as an error rather than as an exhausted Allowance.
create function public.spend_allowance(p_user_id uuid)
returns table (
  allowed boolean,
  allowance_used integer,
  allowance_limit integer,
  resets_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_period timestamptz := date_trunc('month', now());
  v_used integer;
  v_limit integer;
  v_start timestamptz;
begin
  -- One statement, so the row lock is held for microseconds and no valuation
  -- work happens inside it. The period rolls over here rather than on a
  -- schedule: a lapsed period is indistinguishable from a fresh one, and this
  -- way an account that goes quiet for a year needs no cron to come back.
  update public.profiles p
     set allowance_used =
           case when p.allowance_period_start < v_period then 1
                else p.allowance_used + 1 end,
         allowance_period_start = greatest(p.allowance_period_start, v_period)
   where p.id = p_user_id
     and (p.allowance_period_start < v_period
          or p.allowance_used < p.allowance_limit)
  returning p.allowance_used, p.allowance_limit, p.allowance_period_start
       into v_used, v_limit, v_start;

  if found then
    return query select true, v_used, v_limit, v_start + interval '1 month';
    return;
  end if;

  -- Nothing was spent. Either the Allowance is exhausted, or there is no such
  -- profile — tell those apart by looking.
  select p.allowance_used, p.allowance_limit, p.allowance_period_start
    into v_used, v_limit, v_start
    from public.profiles p
   where p.id = p_user_id;

  if not found then
    return;
  end if;

  return query select false, v_used, v_limit, v_start + interval '1 month';
end;
$$;

comment on function public.spend_allowance(uuid) is
  'Spends one unit of a user''s Allowance if any remains, rolling the period '
  'over first when it has lapsed. Service role only.';

-- ── Refund ────────────────────────────────────────────────────────────────
-- A valuation that fails must not cost the user anything (#9). The unit is
-- reserved before the work starts — reserving is what makes the race safe —
-- so a failure hands it back.
--
-- Scoped to the current period: if the month rolled over between the spend and
-- the failure, the spent unit belongs to a period that no longer exists and
-- refunding it would hand the user a free unit of the new one.
create function public.refund_allowance(p_user_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.profiles p
     set allowance_used = greatest(p.allowance_used - 1, 0)
   where p.id = p_user_id
     and p.allowance_period_start = date_trunc('month', now());
$$;

comment on function public.refund_allowance(uuid) is
  'Hands back a unit reserved for a valuation that then failed. Service role only.';

-- ── Grants ────────────────────────────────────────────────────────────────
-- CREATE FUNCTION grants EXECUTE to PUBLIC by default, which would put both of
-- these on PostgREST's /rpc surface for anon and authenticated.
revoke execute on function public.spend_allowance(uuid) from public, anon, authenticated;
revoke execute on function public.refund_allowance(uuid) from public, anon, authenticated;
grant execute on function public.spend_allowance(uuid) to service_role;
grant execute on function public.refund_allowance(uuid) to service_role;
