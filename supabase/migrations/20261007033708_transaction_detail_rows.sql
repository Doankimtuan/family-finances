create or replace function public.get_transaction_detail_rows(
  p_transaction_id uuid,
  p_household_id uuid
)
returns setof public.transactions
language sql
stable
security invoker
set search_path = ''
as $function$
  with selected as materialized (
    select transaction_row.*
    from public.transactions as transaction_row
    where transaction_row.id = p_transaction_id
      and transaction_row.household_id = p_household_id
  ), visible_rows as (
    select transfer_row.*
    from selected
    join public.transactions as transfer_row
      on transfer_row.household_id = selected.household_id
      and transfer_row.household_id = p_household_id
      and transfer_row.transfer_group_id = selected.transfer_group_id
      and transfer_row.type in ('transfer_out', 'transfer_in')
    where selected.type in ('transfer_out', 'transfer_in')
      and selected.transfer_group_id is not null

    union all

    select selected.*
    from selected
    where selected.type not in ('transfer_out', 'transfer_in')
      or selected.transfer_group_id is null
  )
  select visible_rows.*
  from visible_rows
  order by
    case visible_rows.type
      when 'transfer_out' then 0
      when 'transfer_in' then 1
      else 2
    end,
    visible_rows.id;
$function$;

comment on function public.get_transaction_detail_rows(uuid, uuid) is
  'Returns the selected visible transaction and, for transfer legs, the visible transfer rows in the same household.';

revoke execute on function public.get_transaction_detail_rows(uuid, uuid) from public;
revoke execute on function public.get_transaction_detail_rows(uuid, uuid) from anon;
grant execute on function public.get_transaction_detail_rows(uuid, uuid) to authenticated;
