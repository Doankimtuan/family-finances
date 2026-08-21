-- Debt 10B: movement accounts must follow the canonical liquid-account contract.

create or replace function public.is_debt_movement_account_type(p_type text)
returns boolean
language sql
immutable
set search_path = public
as $$
  select p_type in (
    'cash',
    'checking',
    'savings',
    'ewallet',
    'brokerage',
    'other'
  );
$$;

revoke all on function public.is_debt_movement_account_type(text) from public, anon, authenticated;

alter function public.create_debt(text, text, text, text, numeric, date, date, text, uuid, text, text)
  rename to _create_debt_unchecked_10b;

alter function public.record_debt_payment(uuid, uuid, numeric, date, text, text)
  rename to _record_debt_payment_unchecked_10b;

create or replace function public.create_debt(
  p_name text,
  p_counterparty text,
  p_direction text,
  p_creation_mode text,
  p_principal_amount numeric,
  p_start_date date default null,
  p_due_date date default null,
  p_note text default null,
  p_account_id uuid default null,
  p_idempotency_key text default null,
  p_financial_scope text default 'household'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
begin
  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = auth.uid()
  limit 1;

  if v_household_id is null then
    raise exception 'Not a household member';
  end if;

  if p_creation_mode = 'money_moved' and not exists (
    select 1
    from public.accounts a
    where a.id = p_account_id
      and a.household_id = v_household_id
      and a.is_archived = false
      and public.is_debt_movement_account_type(a.type)
  ) then
    raise exception 'Account not found or not eligible';
  end if;

  return public._create_debt_unchecked_10b(
    p_name,
    p_counterparty,
    p_direction,
    p_creation_mode,
    p_principal_amount,
    p_start_date,
    p_due_date,
    p_note,
    p_account_id,
    p_idempotency_key,
    p_financial_scope
  );
end;
$$;

create or replace function public.record_debt_payment(
  p_debt_id uuid,
  p_account_id uuid,
  p_amount numeric,
  p_effective_date date default null,
  p_note text default null,
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
  v_result jsonb;
  v_remaining_amount numeric;
  v_status text;
begin
  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = auth.uid()
  limit 1;

  if v_household_id is null then
    raise exception 'Not a household member';
  end if;

  if not exists (
    select 1
    from public.accounts a
    where a.id = p_account_id
      and a.household_id = v_household_id
      and a.is_archived = false
      and public.is_debt_movement_account_type(a.type)
  ) then
    raise exception 'Account not found or not eligible';
  end if;

  v_result := public._record_debt_payment_unchecked_10b(
    p_debt_id,
    p_account_id,
    p_amount,
    p_effective_date,
    p_note,
    p_idempotency_key
  );

  if coalesce((v_result->>'idempotentReplay')::boolean, false) then
    select l.remaining_amount, l.status
      into v_remaining_amount, v_status
    from public.liabilities l
    where l.id = (v_result->>'debtId')::uuid
      and l.household_id = v_household_id;
    v_result := v_result || jsonb_build_object(
      'remainingAmount', v_remaining_amount,
      'completed', v_status = 'completed'
    );
  end if;

  return v_result;
end;
$$;

revoke all on function public._create_debt_unchecked_10b(text, text, text, text, numeric, date, date, text, uuid, text, text) from public, anon, authenticated;
revoke all on function public._record_debt_payment_unchecked_10b(uuid, uuid, numeric, date, text, text) from public, anon, authenticated;
revoke all on function public.create_debt(text, text, text, text, numeric, date, date, text, uuid, text, text) from public, anon;
revoke all on function public.record_debt_payment(uuid, uuid, numeric, date, text, text) from public, anon;
grant execute on function public.create_debt(text, text, text, text, numeric, date, date, text, uuid, text, text) to authenticated;
grant execute on function public.record_debt_payment(uuid, uuid, numeric, date, text, text) to authenticated;
