-- ============================================================================
-- 00007_household_lifecycle_rls_fix.sql
-- Allow household creator to insert the first member (self) during setup.
-- ============================================================================

drop policy if exists household_members_insert_policy on public.household_members;

create policy household_members_insert_policy
on public.household_members
for insert
with check (
  public.is_household_member(household_members.household_id)
  or (
    household_members.user_id = auth.uid()
    and exists (
      select 1
      from public.household_invitations i
      where i.household_id = household_members.household_id
        and lower(i.email::text) = public.current_jwt_email()
        and i.status = 'pending'
        and i.expires_at > now()
    )
  )
  or (
    household_members.user_id = auth.uid()
    and household_members.invited_by = auth.uid()
    and exists (
      select 1
      from public.households h
      where h.id = household_members.household_id
        and h.created_by = auth.uid()
    )
    and not exists (
      select 1
      from public.household_members hm
      where hm.household_id = household_members.household_id
    )
  )
);
