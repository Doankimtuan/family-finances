-- 18C.1: read state is the only direct Inbox column mutation.
grant update (read_at) on public.inbox_items to authenticated;

drop policy if exists inbox_items_read_state_update_member on public.inbox_items;
create policy inbox_items_read_state_update_member on public.inbox_items
  for update to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));
