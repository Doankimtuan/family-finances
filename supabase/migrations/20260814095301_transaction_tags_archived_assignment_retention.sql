-- Allow historical archived labels to remain on a transaction while preventing
-- new assignments. This keeps detail saves idempotent after a label is archived.
create or replace function public.set_transaction_tags(
  p_transaction_id uuid,
  p_tag_ids uuid[] default array[]::uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_household_id uuid;
  v_normalized_tag_ids uuid[];
  v_tag_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select household_id into v_household_id
  from public.household_members
  where user_id = v_user_id
  order by created_at asc
  limit 1;

  if v_household_id is null then
    raise exception 'Household membership required';
  end if;

  if not exists (
    select 1 from public.transactions
    where id = p_transaction_id and household_id = v_household_id
  ) then
    raise exception 'Transaction not found';
  end if;

  select coalesce(array_agg(distinct tag_id), array[]::uuid[])
  into v_normalized_tag_ids
  from unnest(coalesce(p_tag_ids, array[]::uuid[])) as tag_id;

  v_tag_count := coalesce(cardinality(v_normalized_tag_ids), 0);
  if v_tag_count > 10 then
    raise exception 'Too many transaction tags';
  end if;

  if v_tag_count <> (
    select count(*) from public.transaction_tags t
    where t.household_id = v_household_id
      and t.id = any(v_normalized_tag_ids)
      and (
        t.archived_at is null
        or exists (
          select 1
          from public.transaction_tag_assignments a
          where a.transaction_id = p_transaction_id
            and a.tag_id = t.id
        )
      )
  ) then
    raise exception 'Invalid transaction tags';
  end if;

  delete from public.transaction_tag_assignments
  where household_id = v_household_id
    and transaction_id = p_transaction_id;

  if v_tag_count > 0 then
    insert into public.transaction_tag_assignments (
      household_id,
      transaction_id,
      tag_id
    )
    select v_household_id, p_transaction_id, tag_id
    from unnest(v_normalized_tag_ids) as tag_id;
  end if;
end;
$$;

revoke all on function public.set_transaction_tags(uuid, uuid[]) from public;
grant execute on function public.set_transaction_tags(uuid, uuid[]) to authenticated;
