-- REPO 23E.1: restore the certified Inbox read-state capability.
grant update (read_at) on table public.inbox_items to authenticated;
