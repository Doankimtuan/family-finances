begin;

create or replace function public.sync_inbox_after_transaction_correction()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_kind text;
  v_status text;
  v_account_name text;
  v_category_name text;
  v_title text;
  v_data jsonb;
begin
  if new.corrects_transaction_id is null then
    return new;
  end if;

  v_kind := case when new.type = 'expense' then 'unmapped_expense' else 'income_suggest' end;
  v_status := case when new.jar_id is null then 'pending' else 'archived' end;

  select a.name
  into v_account_name
  from public.accounts a
  where a.id = new.account_id;

  select c.name
  into v_category_name
  from public.categories c
  where c.id = new.category_id;

  v_title := coalesce(
    nullif(trim(coalesce(new.note, '')), ''),
    nullif(trim(coalesce(v_category_name, '')), ''),
    case when new.type = 'expense' then 'Unmapped expense' else 'Place income' end
  );
  v_data := jsonb_build_object(
    'reason', case when new.type = 'expense' then 'unmapped_expense' else 'income_suggest' end,
    'category_id', new.category_id,
    'category_name', v_category_name,
    'account_id', new.account_id,
    'account_name', v_account_name,
    'note', new.note,
    'corrected_from_transaction_id', new.corrects_transaction_id
  );

  update public.inbox_items i
  set kind = v_kind,
      status = v_status,
      source_id = new.id,
      amount = new.amount,
      currency = new.currency,
      title = v_title,
      suggested_jar_id = new.jar_id,
      suggested_category_id = new.category_id,
      dedupe_key = concat_ws('|', v_kind, 'transaction', new.id::text, 'none', 'none', ''),
      context_json = case
        when i.context_json ? 'data' then
          coalesce(i.context_json, '{}'::jsonb)
            || jsonb_build_object(
              'kind', v_kind,
              'data', coalesce(i.context_json->'data', '{}'::jsonb) || v_data
            )
        else
          coalesce(i.context_json, '{}'::jsonb)
            || jsonb_build_object('kind', v_kind, 'data', v_data)
      end,
      updated_at = timezone('utc', now())
  where i.household_id = new.household_id
    and i.kind in ('unmapped_expense', 'income_suggest')
    and i.status = 'pending'
    and i.source_type = 'transaction'
    and i.source_id = new.corrects_transaction_id;

  return new;
end;
$function$;

create trigger inbox_after_transaction_correction
after insert on public.transactions
for each row
when (new.corrects_transaction_id is not null)
execute function public.sync_inbox_after_transaction_correction();

with candidates as (
  select
    i.id as inbox_item_id,
    i.context_json,
    c.id as correction_id,
    c.household_id,
    c.type as correction_type,
    c.amount as correction_amount,
    c.currency as correction_currency,
    c.note as correction_note,
    c.account_id as correction_account_id,
    c.category_id as correction_category_id,
    c.jar_id as correction_jar_id,
    a.name as correction_account_name,
    category.name as correction_category_name,
    case when c.type = 'expense' then 'unmapped_expense' else 'income_suggest' end as new_kind,
    case when c.jar_id is null then 'pending' else 'archived' end as new_status
  from public.inbox_items i
  join public.transactions original
    on original.id = i.source_id
   and original.status = 'reversed'
  join public.transactions c
    on c.corrects_transaction_id = original.id
   and c.household_id = original.household_id
  join public.accounts a on a.id = c.account_id
  left join public.categories category on category.id = c.category_id
  where i.status = 'pending'
    and i.kind in ('unmapped_expense', 'income_suggest')
    and i.source_type = 'transaction'
), updated as (
  update public.inbox_items i
  set kind = candidates.new_kind,
      status = candidates.new_status,
      source_id = candidates.correction_id,
      amount = candidates.correction_amount,
      currency = candidates.correction_currency,
      title = coalesce(
        nullif(trim(coalesce(candidates.correction_note, '')), ''),
        nullif(trim(coalesce(candidates.correction_category_name, '')), ''),
        case when candidates.correction_type = 'expense' then 'Unmapped expense' else 'Place income' end
      ),
      suggested_jar_id = candidates.correction_jar_id,
      suggested_category_id = candidates.correction_category_id,
      dedupe_key = concat_ws('|', candidates.new_kind, 'transaction', candidates.correction_id::text, 'none', 'none', ''),
      context_json = case
        when candidates.context_json ? 'data' then
          coalesce(candidates.context_json, '{}'::jsonb)
            || jsonb_build_object(
              'kind', candidates.new_kind,
              'data', coalesce(candidates.context_json->'data', '{}'::jsonb)
                || jsonb_build_object(
                  'reason', candidates.new_kind,
                  'category_id', candidates.correction_category_id,
                  'category_name', candidates.correction_category_name,
                  'account_id', candidates.correction_account_id,
                  'account_name', candidates.correction_account_name,
                  'note', candidates.correction_note,
                  'corrected_from_transaction_id', candidates.correction_id
                )
            )
        else
          coalesce(candidates.context_json, '{}'::jsonb)
            || jsonb_build_object(
              'kind', candidates.new_kind,
              'data', jsonb_build_object(
                'reason', candidates.new_kind,
                'category_id', candidates.correction_category_id,
                'category_name', candidates.correction_category_name,
                'account_id', candidates.correction_account_id,
                'account_name', candidates.correction_account_name,
                'note', candidates.correction_note,
                'corrected_from_transaction_id', candidates.correction_id
              )
            )
      end,
      updated_at = timezone('utc', now())
  from candidates
  where i.id = candidates.inbox_item_id
  returning i.id
)
select count(*) from updated;

commit;
