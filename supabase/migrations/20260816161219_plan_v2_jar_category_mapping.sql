-- PLAN 04: allow household members to remap owned categories to a Jar.
-- This changes only categories.jar_id, which is consulted for future capture
-- defaults. Historical transactions.jar_id values are intentionally untouched.

alter table public.jars
  add column if not exists is_name_custom boolean not null default false;

comment on column public.jars.is_name_custom is
  'True when the user supplied the display name; false allows catalog localization.';

alter table public.categories enable row level security;

drop policy if exists categories_update_member on public.categories;
create policy categories_update_member on public.categories
  for update to authenticated
  using (
    household_id is not null
    and is_system = false
    and public.is_household_member(household_id)
  )
  with check (
    household_id is not null
    and is_system = false
    and public.is_household_member(household_id)
  );

grant update (jar_id, updated_at) on public.categories to authenticated;
;
