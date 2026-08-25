-- INBOX 18B — canonical Loan/Debt due attention.
-- One pending item per source. The owning Loan/Debt module remains the only
-- place that can execute a payment.

alter table public.inbox_items
  drop constraint if exists inbox_items_kind_check;

alter table public.inbox_items
  add constraint inbox_items_kind_check check (kind in (
    'unmapped_expense',
    'income_suggest',
    'savings_maturity',
    'early_withdrawal_confirmation',
    'emi_complete',
    'emergency_declaration',
    'loan_payment_attention',
    'debt_payment_attention'
  ));

-- Re-deploy the gateway with the two new canonical kinds. The dedupe key is
-- still kind + source identity, so due-state changes refresh one row in place.
create or replace function public.produce_inbox_item(
  p_household_id uuid,
  p_kind text,
  p_source_type text,
  p_source_id uuid,
  p_amount numeric,
  p_currency text,
  p_title text,
  p_context jsonb default '{}'::jsonb,
  p_assigned_to_user_id uuid default null,
  p_expires_at timestamptz default null,
  p_suggested_jar_id uuid default null,
  p_suggested_category_id uuid default null,
  p_dedupe_extra text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kind text[] := array[
    'unmapped_expense', 'income_suggest', 'savings_maturity',
    'early_withdrawal_confirmation', 'emi_complete',
    'emergency_declaration', 'loan_payment_attention',
    'debt_payment_attention'
  ];
  v_removed text[] := array[
    'savings_matured', 'renewal_required', 'penalty_warning',
    'rate_changed_suggestion', 'package_expired', 'payment_reminder'
  ];
  v_dedupe_key text;
  v_cycle_key text := 'none';
  v_item_id uuid;
  v_context jsonb;
  v_currency text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not public.is_household_member(p_household_id) then
    raise exception 'Forbidden';
  end if;
  if not p_kind = any(v_kind) then
    if p_kind = any(v_removed) then
      raise exception 'Removed Inbox kind cannot be produced';
    end if;
    raise exception 'Unknown Inbox kind';
  end if;
  if p_source_type is null or p_source_type not in ('transaction', 'guided', 'plan_movement') then
    raise exception 'Invalid Inbox source type';
  end if;
  if p_kind in ('unmapped_expense', 'income_suggest')
     and (p_source_type <> 'transaction' or p_source_id is null or p_amount is null) then
    raise exception 'Missing required source context';
  end if;
  if p_kind in ('savings_maturity', 'early_withdrawal_confirmation')
     and (p_source_type <> 'guided' or p_context->>'savingId' is null or p_context->>'cycleId' is null) then
    raise exception 'Missing savings context';
  end if;
  if p_kind in ('loan_payment_attention', 'debt_payment_attention')
     and (p_source_type <> 'guided' or p_source_id is null or p_amount is null
       or nullif(p_context->>'dueState', '') is null
       or nullif(p_context->>'dueDate', '') is null) then
    raise exception 'Missing due attention context';
  end if;
  if p_kind = 'emi_complete' and p_context is not null
     and p_context->>'installmentPlanId' is null
     and p_context->>'debtId' is null
     and p_context->>'loanId' is null then
    raise exception 'Missing installment/debt context';
  end if;
  if p_kind = 'emergency_declaration'
     and (p_source_type <> 'plan_movement' or nullif(trim(p_context->>'intentNote'), '') is null) then
    raise exception 'Emergency intent note required';
  end if;
  if p_kind not in ('emergency_declaration') and p_assigned_to_user_id is not null then
    raise exception 'Assignment is only valid for emergency declarations';
  end if;
  if p_kind = 'savings_maturity' and p_expires_at is null then
    p_expires_at := timezone('utc', now()) + interval '31 days';
  end if;
  if p_assigned_to_user_id is not null and not exists (
    select 1 from public.household_members hm
    where hm.household_id = p_household_id
      and hm.user_id = p_assigned_to_user_id
      and hm.is_active = true
  ) then
    raise exception 'Invalid assignee';
  end if;
  if p_kind in ('savings_maturity', 'early_withdrawal_confirmation') then
    v_cycle_key := coalesce(p_context->>'cycleId', 'none');
  end if;

  v_currency := upper(coalesce(nullif(trim(p_currency), ''), 'VND'));
  v_dedupe_key := concat_ws(
    '|', p_kind, p_source_type, p_source_id::text,
    coalesce(nullif(p_context->>'cascadeDay', ''), 'none'),
    v_cycle_key, coalesce(p_assigned_to_user_id::text, 'none'),
    coalesce(p_dedupe_extra, '')
  );
  v_context := jsonb_build_object(
    'version', 1, 'kind', p_kind, 'data', coalesce(p_context, '{}'::jsonb)
  );

  insert into public.inbox_items (
    household_id, kind, status, source_type, source_id, amount, currency,
    title, context_json, assigned_to_user_id, expires_at,
    suggested_jar_id, suggested_category_id, dedupe_key
  ) values (
    p_household_id, p_kind, 'pending', p_source_type, p_source_id,
    p_amount, v_currency, coalesce(nullif(trim(p_title), ''), p_kind),
    v_context, p_assigned_to_user_id, p_expires_at,
    p_suggested_jar_id, p_suggested_category_id, v_dedupe_key
  )
  on conflict (household_id, dedupe_key) where dedupe_key is not null
  do update set
    status = 'pending', updated_at = timezone('utc', now()),
    title = excluded.title, amount = excluded.amount,
    currency = excluded.currency, context_json = excluded.context_json,
    expires_at = excluded.expires_at,
    suggested_jar_id = excluded.suggested_jar_id,
    suggested_category_id = excluded.suggested_category_id
  where public.inbox_items.status = 'pending'
     or (p_kind = 'savings_maturity' and public.inbox_items.status = 'expired')
  returning id into v_item_id;

  if v_item_id is null then
    select id into v_item_id from public.inbox_items
    where household_id = p_household_id and dedupe_key = v_dedupe_key;
  end if;
  return jsonb_build_object('inbox_item_id', v_item_id, 'idempotent', v_item_id is not null);
end;
$$;

revoke all on function public.produce_inbox_item(uuid, text, text, uuid, numeric, text, text, jsonb, uuid, timestamptz, uuid, uuid, text) from public, anon;
grant execute on function public.produce_inbox_item(uuid, text, text, uuid, numeric, text, text, jsonb, uuid, timestamptz, uuid, uuid, text) to authenticated;

create or replace function public.sync_loan_debt_attention_inbox()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
  v_today date := (timezone('utc', now()))::date;
  v_days integer;
  v_state text;
  v_refreshed integer := 0;
  v_archived integer := 0;
  r record;
begin
  select household_id into v_household_id
  from public.household_members
  where user_id = auth.uid() and is_active = true
  limit 1;
  if v_household_id is null then raise exception 'Active household membership required'; end if;

  for r in
    select id, monthly_payment as amount,
           currency, next_payment_date
    from public.loans
    where household_id = v_household_id
      and status = 'active'
      and remaining_principal > 0
      and next_payment_date is not null
      and next_payment_date <= v_today + 7
  loop
    v_days := r.next_payment_date - v_today;
    v_state := case when v_days < 0 then 'overdue'
      when v_days = 0 then 'due_today' else 'due_soon' end;
    perform public.produce_inbox_item(
      v_household_id, 'loan_payment_attention', 'guided', r.id, r.amount,
      r.currency, 'Loan payment attention',
      jsonb_build_object('loanId', r.id, 'dueState', v_state, 'dueDate', r.next_payment_date),
      null, null, null, null, 'loan-payment-attention'
    );
    v_refreshed := v_refreshed + 1;
  end loop;

  for r in
    select id, remaining_amount as amount, currency, due_date
    from public.liabilities
    where household_id = v_household_id
      and status = 'active'
      and remaining_amount > 0
      and due_date is not null
      and due_date <= v_today + 7
  loop
    v_days := r.due_date - v_today;
    v_state := case when v_days < 0 then 'overdue'
      when v_days = 0 then 'due_today' else 'due_soon' end;
    perform public.produce_inbox_item(
      v_household_id, 'debt_payment_attention', 'guided', r.id, r.amount,
      r.currency, 'Debt payment attention',
      jsonb_build_object('debtId', r.id, 'dueState', v_state, 'dueDate', r.due_date),
      null, null, null, null, 'debt-payment-attention'
    );
    v_refreshed := v_refreshed + 1;
  end loop;

  update public.inbox_items i
  set status = 'archived', updated_at = timezone('utc', now()),
      context_json = coalesce(i.context_json, '{}'::jsonb)
        || jsonb_build_object('resolved_by_source_condition', true)
  where i.household_id = v_household_id
    and i.status = 'pending'
    and i.kind in ('loan_payment_attention', 'debt_payment_attention')
    and not exists (
      select 1 from public.loans l
      where i.kind = 'loan_payment_attention' and l.id = i.source_id
        and l.household_id = v_household_id and l.status = 'active'
        and l.remaining_principal > 0 and l.next_payment_date is not null
        and l.next_payment_date <= v_today + 7
    )
    and not exists (
      select 1 from public.liabilities d
      where i.kind = 'debt_payment_attention' and d.id = i.source_id
        and d.household_id = v_household_id and d.status = 'active'
        and d.remaining_amount > 0 and d.due_date is not null
        and d.due_date <= v_today + 7
    );
  get diagnostics v_archived = row_count;
  return jsonb_build_object('refreshed_count', v_refreshed, 'archived_count', v_archived);
end;
$$;

revoke all on function public.sync_loan_debt_attention_inbox() from public, anon;
grant execute on function public.sync_loan_debt_attention_inbox() to authenticated;
;
