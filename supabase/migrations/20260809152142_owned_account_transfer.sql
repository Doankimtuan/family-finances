-- Phase G1: owned-account transfer — neutral real-ledger movement (not income/expense).
-- Two linked legs (transfer_out + transfer_in) share transfer_group_id.

alter table public.transactions
  drop constraint if exists transactions_type_check;

alter table public.transactions
  add constraint transactions_type_check
  check (
    type in (
      'income',
      'expense',
      'liability_payment',
      'transfer_out',
      'transfer_in'
    )
  );

alter table public.transactions
  add column if not exists transfer_group_id uuid;

create index if not exists idx_transactions_transfer_group
  on public.transactions (household_id, transfer_group_id)
  where transfer_group_id is not null;

alter table public.transactions
  drop constraint if exists transactions_transfer_shape_check;

alter table public.transactions
  add constraint transactions_transfer_shape_check
  check (
    (
      type in ('transfer_out', 'transfer_in')
      and transfer_group_id is not null
      and category_id is null
      and jar_id is null
    )
    or (
      type not in ('transfer_out', 'transfer_in')
      and transfer_group_id is null
    )
  );

create or replace function public.record_owned_account_transfer(
  p_source_account_id uuid,
  p_destination_account_id uuid,
  p_amount numeric,
  p_transaction_date date default null,
  p_note text default null,
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_household_id uuid;
  v_currency char(3);
  v_effective date;
  v_source public.accounts%rowtype;
  v_destination public.accounts%rowtype;
  v_group_id uuid;
  v_source_tx_id uuid;
  v_destination_tx_id uuid;
  v_existing_out public.transactions%rowtype;
  v_existing_in public.transactions%rowtype;
  v_source_key text;
  v_destination_key text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_amount is null or p_amount <= 0 or p_amount <> trunc(p_amount) then
    raise exception 'Amount must be a positive whole number';
  end if;

  if p_source_account_id is null or p_destination_account_id is null then
    raise exception 'Invalid accounts';
  end if;

  if p_source_account_id = p_destination_account_id then
    raise exception 'Source and destination must differ';
  end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id
    and hm.is_active = true
  limit 1;

  if v_household_id is null then
    raise exception 'Not a household member';
  end if;

  select h.base_currency into v_currency
  from public.households h
  where h.id = v_household_id;

  v_currency := coalesce(v_currency, 'VND');
  v_effective := coalesce(p_transaction_date, (timezone('utc', now()))::date);

  if p_idempotency_key is not null then
    v_source_key := p_idempotency_key || ':out';
    v_destination_key := p_idempotency_key || ':in';

    select * into v_existing_out
    from public.transactions t
    where t.household_id = v_household_id
      and t.idempotency_key = v_source_key
      and t.type = 'transfer_out';

    if found then
      select * into v_existing_in
      from public.transactions t
      where t.household_id = v_household_id
        and t.transfer_group_id = v_existing_out.transfer_group_id
        and t.type = 'transfer_in';

      if not found then
        raise exception 'Transfer replay incomplete';
      end if;

      return jsonb_build_object(
        'ok', true,
        'transferGroupId', v_existing_out.transfer_group_id,
        'sourceTransactionId', v_existing_out.id,
        'destinationTransactionId', v_existing_in.id,
        'sourceDelta', -v_existing_out.amount,
        'destinationDelta', v_existing_in.amount,
        'idempotentReplay', true
      );
    end if;
  end if;

  select * into v_source
  from public.accounts a
  where a.id = p_source_account_id
    and a.household_id = v_household_id
    and a.is_archived = false
  for update;

  if not found then
    raise exception 'Source account not found';
  end if;

  if v_source.type = 'credit_card' then
    raise exception 'Source cannot be a credit card';
  end if;

  if v_source.type = 'savings_product' then
    raise exception 'Source cannot be a savings product account';
  end if;

  select * into v_destination
  from public.accounts a
  where a.id = p_destination_account_id
    and a.household_id = v_household_id
    and a.is_archived = false
  for update;

  if not found then
    raise exception 'Destination account not found';
  end if;

  if v_destination.type = 'credit_card' then
    raise exception 'Destination cannot be a credit card';
  end if;

  if v_destination.type = 'savings_product' then
    raise exception 'Destination cannot be a savings product account';
  end if;

  v_group_id := gen_random_uuid();

  insert into public.transactions (
    household_id,
    account_id,
    type,
    amount,
    currency,
    transaction_date,
    note,
    category_id,
    jar_id,
    status,
    idempotency_key,
    transfer_group_id,
    created_by,
    source
  )
  values (
    v_household_id,
    p_source_account_id,
    'transfer_out',
    p_amount,
    v_currency,
    v_effective,
    nullif(trim(coalesce(p_note, '')), ''),
    null,
    null,
    'posted',
    case when p_idempotency_key is null then null else p_idempotency_key || ':out' end,
    v_group_id,
    v_user_id,
    'manual'
  )
  returning id into v_source_tx_id;

  insert into public.transactions (
    household_id,
    account_id,
    type,
    amount,
    currency,
    transaction_date,
    note,
    category_id,
    jar_id,
    status,
    idempotency_key,
    transfer_group_id,
    created_by,
    source
  )
  values (
    v_household_id,
    p_destination_account_id,
    'transfer_in',
    p_amount,
    v_currency,
    v_effective,
    nullif(trim(coalesce(p_note, '')), ''),
    null,
    null,
    'posted',
    case when p_idempotency_key is null then null else p_idempotency_key || ':in' end,
    v_group_id,
    v_user_id,
    'manual'
  )
  returning id into v_destination_tx_id;

  return jsonb_build_object(
    'ok', true,
    'transferGroupId', v_group_id,
    'sourceTransactionId', v_source_tx_id,
    'destinationTransactionId', v_destination_tx_id,
    'sourceDelta', -p_amount,
    'destinationDelta', p_amount,
    'idempotentReplay', false
  );
end;
$$;

revoke all on function public.record_owned_account_transfer(
  uuid, uuid, numeric, date, text, text
) from public;

grant execute on function public.record_owned_account_transfer(
  uuid, uuid, numeric, date, text, text
) to authenticated;;
