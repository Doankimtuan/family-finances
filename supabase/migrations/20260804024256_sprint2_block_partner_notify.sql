alter table public.inbox_items
  add column if not exists assigned_to_user_id uuid references auth.users(id) on delete cascade;

comment on column public.inbox_items.assigned_to_user_id is
  'When set, ReviewItem is for this household member only (partner emergency alerts).';

alter table public.inbox_items
  drop constraint if exists inbox_items_unique_source;

drop index if exists inbox_items_unique_source_assignee;

create unique index inbox_items_unique_source_assignee
  on public.inbox_items (household_id, source_type, source_id, assigned_to_user_id)
  nulls not distinct;

create index if not exists inbox_items_assigned_pending_idx
  on public.inbox_items (assigned_to_user_id, status, created_at desc)
  where assigned_to_user_id is not null;
;
