-- The Preferred Platform: which Enabled Platform bower writes for first.
-- A standing user choice, distinct from the Recommendation, which is earned
-- per Item from Comparables. See CONTEXT.md.

alter table public.profiles
  add column preferred_platform public.platform not null default 'vinted';

comment on column public.profiles.preferred_platform is
  'The Enabled Platform listings are written for by default. Must be one of enabled_platforms.';

-- It has to be one the user actually sells on. Disabling the preferred one
-- therefore has to move the preference in the same statement, which is the
-- client's job — the constraint just refuses to let the two drift apart.
alter table public.profiles
  add constraint preferred_platform_is_enabled
    check (preferred_platform = any (enabled_platforms));

-- The client may write it, same as enabled_platforms. Still no write to the meter.
grant update (preferred_platform) on public.profiles to authenticated;
