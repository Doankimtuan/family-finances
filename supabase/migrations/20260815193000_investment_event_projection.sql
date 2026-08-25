-- Project legacy atomic RPC operations into the Prompt 09.1 immutable event ledger.
alter table public.investment_events add column if not exists legacy_operation_id uuid unique references public.investment_operations(id) on delete restrict;
create or replace function public.project_investment_operation_event()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_type text; v_position uuid; v_cash_source uuid; v_cash_destination uuid;
begin
  v_type := case new.operation_type
    when 'opening_position' then 'HISTORICAL_IMPORT'
    when 'buy' then 'BUY'
    when 'sell' then 'SELL'
    when 'investment_income' then case when new.income_kind = 'dividend' then 'DIVIDEND' else 'DISTRIBUTION' end
    else 'ADJUSTMENT'
  end;
  v_position := coalesce(new.destination_holding_id, new.source_holding_id);
  v_cash_source := case when new.operation_type = 'buy' then new.cash_account_id end;
  v_cash_destination := case when new.operation_type in ('sell','investment_income') then new.cash_account_id end;
  insert into public.investment_events(
    household_id, position_id, event_type, executed_quantity, gross_amount,
    disposed_cost_basis, realized_pnl, source_cash_account_id, destination_cash_account_id,
    effective_at, notes, snapshot, legacy_operation_id, created_by
  ) values (
    new.household_id, v_position, v_type,
    coalesce(new.destination_quantity, new.source_quantity), new.executed_value_vnd,
    new.source_basis_consumed, new.realized_result_vnd, v_cash_source, v_cash_destination,
    new.effective_date::timestamptz, new.notes,
    jsonb_build_object(
      'operationType', new.operation_type,
      'quotedValueVnd', new.quoted_value_vnd,
      'beforeQuantity', new.before_quantity,
      'afterQuantity', new.after_quantity,
      'beforeBasis', new.before_basis,
      'afterBasis', new.after_basis,
      'cashDelta', new.cash_delta,
      'transactionId', new.transaction_id,
      'correlationId', new.correlation_id,
      'sourceHoldingId', new.source_holding_id,
      'destinationHoldingId', new.destination_holding_id
    ),
    new.id, new.created_by
  ) on conflict (legacy_operation_id) do nothing;
  return new;
end $$;
drop trigger if exists investment_operation_event_projection on public.investment_operations;
create trigger investment_operation_event_projection
after insert on public.investment_operations
for each row execute function public.project_investment_operation_event();
insert into public.investment_events(
  household_id, position_id, event_type, executed_quantity, gross_amount,
  disposed_cost_basis, realized_pnl, source_cash_account_id, destination_cash_account_id,
  effective_at, notes, snapshot, legacy_operation_id, created_by
)
select
  o.household_id,
  coalesce(o.destination_holding_id, o.source_holding_id),
  case o.operation_type
    when 'opening_position' then 'HISTORICAL_IMPORT'
    when 'buy' then 'BUY'
    when 'sell' then 'SELL'
    when 'investment_income' then case when o.income_kind = 'dividend' then 'DIVIDEND' else 'DISTRIBUTION' end
    else 'ADJUSTMENT'
  end,
  coalesce(o.destination_quantity, o.source_quantity), o.executed_value_vnd,
  o.source_basis_consumed, o.realized_result_vnd,
  case when o.operation_type = 'buy' then o.cash_account_id end,
  case when o.operation_type in ('sell','investment_income') then o.cash_account_id end,
  o.effective_date::timestamptz, o.notes,
  jsonb_build_object('operationType', o.operation_type, 'quotedValueVnd', o.quoted_value_vnd, 'beforeQuantity', o.before_quantity, 'afterQuantity', o.after_quantity, 'beforeBasis', o.before_basis, 'afterBasis', o.after_basis, 'cashDelta', o.cash_delta, 'transactionId', o.transaction_id, 'correlationId', o.correlation_id),
  o.id, o.created_by
from public.investment_operations o
on conflict (legacy_operation_id) do nothing;
create or replace function public.project_investment_fee_event()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.investment_events e
  set fee_amount = totals.amount
  from (select coalesce(sum(fee_value_vnd),0) amount from public.investment_fees where operation_id = new.operation_id) totals
  where e.legacy_operation_id = (select id from public.investment_operations where id = new.operation_id);
  return new;
end $$;
drop trigger if exists investment_fee_event_projection on public.investment_fees;
create trigger investment_fee_event_projection
after insert on public.investment_fees
for each row execute function public.project_investment_fee_event();
