-- INBOX 18C — independent read state and bounded open-queue support.
alter table public.inbox_items
  add column if not exists read_at timestamptz;

create index if not exists inbox_items_open_read_cursor_idx
  on public.inbox_items (household_id, status, created_at desc, id desc)
  where status = 'pending';

create index if not exists inbox_items_open_unread_idx
  on public.inbox_items (household_id, status)
  where status = 'pending' and read_at is null;
