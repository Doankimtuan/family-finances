-- First-class user-managed transaction tags.
-- Categories remain the primary financial classification; tags are optional,
-- cross-cutting household labels and must never alter ledger balances.

create table if not exists public.transaction_tags (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  icon_key text not null,
  color_key text,
  archived_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transaction_tags_name_nonempty check (length(trim(name)) > 0),
  constraint transaction_tags_name_length check (char_length(name) <= 64),
  constraint transaction_tags_icon_key_nonempty check (length(trim(icon_key)) > 0),
  constraint transaction_tags_icon_key_length check (char_length(icon_key) <= 64),
  constraint transaction_tags_color_key_length check (color_key is null or char_length(color_key) <= 32)
);

create unique index if not exists transaction_tags_household_name_unique
  on public.transaction_tags (household_id, lower(name))
  where archived_at is null;
create index if not exists idx_transaction_tags_household_active
  on public.transaction_tags (household_id, created_at desc)
  where archived_at is null;

create table if not exists public.transaction_tag_assignments (
  household_id uuid not null references public.households(id) on delete cascade,
  transaction_id uuid not null references public.transactions(id) on delete restrict,
  tag_id uuid not null references public.transaction_tags(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (transaction_id, tag_id)
);

create index if not exists idx_transaction_tag_assignments_household_tag
  on public.transaction_tag_assignments (household_id, tag_id, transaction_id);
create index if not exists idx_transaction_tag_assignments_household_transaction
  on public.transaction_tag_assignments (household_id, transaction_id, tag_id);

create or replace function public.validate_transaction_tag_assignment()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_transaction_household uuid;
  v_tag_household uuid;
  v_tag_archived_at timestamptz;
begin
  select household_id into v_transaction_household
  from public.transactions
  where id = new.transaction_id;

  select household_id, archived_at into v_tag_household, v_tag_archived_at
  from public.transaction_tags
  where id = new.tag_id;

  if v_transaction_household is null
    or v_tag_household is null
    or v_tag_archived_at is not null
    or new.household_id <> v_transaction_household
    or new.household_id <> v_tag_household then
    raise exception 'Invalid transaction tag assignment';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_transaction_tag_assignment_trigger
  on public.transaction_tag_assignments;
create trigger validate_transaction_tag_assignment_trigger
  before insert or update of household_id, transaction_id, tag_id
  on public.transaction_tag_assignments
  for each row execute function public.validate_transaction_tag_assignment();

alter table public.transaction_tags enable row level security;
alter table public.transaction_tag_assignments enable row level security;

drop policy if exists transaction_tags_select_member on public.transaction_tags;
create policy transaction_tags_select_member on public.transaction_tags
  for select to authenticated
  using (public.is_household_member(household_id));
drop policy if exists transaction_tags_insert_member on public.transaction_tags;
create policy transaction_tags_insert_member on public.transaction_tags
  for insert to authenticated
  with check (public.is_household_member(household_id));
drop policy if exists transaction_tags_update_member on public.transaction_tags;
create policy transaction_tags_update_member on public.transaction_tags
  for update to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

drop policy if exists transaction_tag_assignments_select_member on public.transaction_tag_assignments;
create policy transaction_tag_assignments_select_member
  on public.transaction_tag_assignments for select to authenticated
  using (public.is_household_member(household_id));
drop policy if exists transaction_tag_assignments_insert_member on public.transaction_tag_assignments;
create policy transaction_tag_assignments_insert_member
  on public.transaction_tag_assignments for insert to authenticated
  with check (public.is_household_member(household_id));
drop policy if exists transaction_tag_assignments_delete_member on public.transaction_tag_assignments;
create policy transaction_tag_assignments_delete_member
  on public.transaction_tag_assignments for delete to authenticated
  using (public.is_household_member(household_id));

grant select, insert, update on public.transaction_tags to authenticated;
grant select, insert, delete on public.transaction_tag_assignments to authenticated;;
