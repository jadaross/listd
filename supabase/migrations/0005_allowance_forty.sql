-- The Allowance is 40 a month. The design settled on it and the app's copy
-- says so; the meter defaulted to 20 from before that decision was made.
-- Reads now cost a unit as well as searches, which is the other half of why
-- the old figure no longer fits.

alter table public.profiles
  alter column allowance_limit set default 40;

-- Existing rows too — every account is at the pre-decision figure.
update public.profiles set allowance_limit = 40 where allowance_limit = 20;
