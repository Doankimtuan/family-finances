begin;

do $$
declare
  v_holding_id constant uuid := 'b65855cb-7d05-4dda-9693-6b9e9e3bacfe';
  v_operation_id constant uuid := 'bd5329af-d2fd-4a72-8ec3-bb826bfcac04';
  v_event_id constant uuid := '08113a21-02c2-476b-99e8-1d6793a6cc5a';
  v_quantity constant numeric(38,18) := 1816.530426884650317900;
  v_input_unit_price constant numeric(38,18) := 0.2202;
  v_input_cost_basis constant numeric(38,18) := 400;
  v_rate constant numeric(24,8) := 26000;
  v_unit_price_vnd constant numeric(24,8) := 5725.2;
  v_cost_basis_vnd constant numeric(18,0) := 10400000;
begin
  if not exists (
    select 1
    from public.investment_holdings
    where id = v_holding_id
      and quantity = 1822.610000000000000000
      and remaining_total_cost_basis = 18955144000
  ) and not exists (
    select 1
    from public.investment_holdings
    where id = v_holding_id
      and quantity = v_quantity
      and remaining_total_cost_basis = v_cost_basis_vnd
  ) then
    raise exception 'ENA holding does not match the expected pre-migration state';
  end if;

  update public.investment_holdings
  set quantity = v_quantity,
      remaining_total_cost_basis = v_cost_basis_vnd,
      updated_at = now()
  where id = v_holding_id;

  update public.investment_operations
  set destination_quantity = v_quantity,
      destination_basis_added = v_cost_basis_vnd,
      after_quantity = v_quantity,
      after_basis = v_cost_basis_vnd,
      unit_price_vnd = v_unit_price_vnd,
      input_currency = 'USDT',
      input_unit_price = v_input_unit_price,
      input_cost_basis = v_input_cost_basis,
      input_rate_to_vnd = v_rate,
      input_rate_source = 'manual'
  where id = v_operation_id
    and destination_holding_id = v_holding_id;

  if not found then
    raise exception 'ENA opening operation was not found';
  end if;

  update public.investment_events
  set executed_quantity = v_quantity,
      snapshot = snapshot || jsonb_build_object(
        'afterBasis', v_cost_basis_vnd,
        'afterQuantity', v_quantity,
        'inputCurrency', 'USDT',
        'inputCostBasis', v_input_cost_basis,
        'inputRateToVnd', v_rate,
        'inputRateSource', 'manual',
        'inputUnitPrice', v_input_unit_price
      )
  where id = v_event_id
    and position_id = v_holding_id
    and legacy_operation_id = v_operation_id;

  if not found then
    raise exception 'ENA historical event was not found';
  end if;
end;
$$;

commit;
;
