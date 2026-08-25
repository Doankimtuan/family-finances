-- 18D: Inbox is readable by authenticated household members only.
revoke all on table public.inbox_items from anon, public;

grant select on table public.inbox_items to authenticated;
grant update (read_at) on table public.inbox_items to authenticated;;
