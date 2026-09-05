alter table public.market_currency_rates
  drop constraint if exists market_currency_rates_provider_check;

alter table public.market_currency_rates
  add constraint market_currency_rates_provider_check
  check (provider = any (array['FRANKFURTER', 'COINGECKO']));

alter table public.investment_operations
  add column if not exists input_currency text not null default 'VND',
  add column if not exists input_amount numeric(38,18),
  add column if not exists input_unit_price numeric(38,18),
  add column if not exists input_total_value numeric(38,18),
  add column if not exists input_executed_value numeric(38,18),
  add column if not exists input_quoted_value numeric(38,18),
  add column if not exists input_cost_basis numeric(38,18),
  add column if not exists input_current_valuation numeric(38,18),
  add column if not exists input_rate_to_vnd numeric(24,8) not null default 1,
  add column if not exists input_rate_date date,
  add column if not exists input_rate_source text not null default 'identity',
  add column if not exists input_rate_provider text;

alter table public.investment_valuations
  add column if not exists input_currency text not null default 'VND',
  add column if not exists input_unit_price numeric(38,18),
  add column if not exists input_total_value numeric(38,18),
  add column if not exists input_rate_to_vnd numeric(24,8) not null default 1,
  add column if not exists input_rate_date date,
  add column if not exists input_rate_source text not null default 'identity',
  add column if not exists input_rate_provider text;

alter table public.investment_fees
  add column if not exists input_currency text not null default 'VND',
  add column if not exists input_amount numeric(38,18),
  add column if not exists input_fee_value numeric(38,18),
  add column if not exists input_rate_to_vnd numeric(24,8) not null default 1,
  add column if not exists input_rate_date date,
  add column if not exists input_rate_source text not null default 'identity',
  add column if not exists input_rate_provider text;

alter table public.investment_operations
  add constraint investment_operations_input_currency_check
  check (input_currency = any (array['VND', 'USDT', 'USDC']));

alter table public.investment_operations
  add constraint investment_operations_input_rate_check
  check (input_rate_to_vnd > 0);

alter table public.investment_operations
  add constraint investment_operations_input_rate_source_check
  check (input_rate_source = any (array['automatic', 'manual', 'identity']));

alter table public.investment_valuations
  add constraint investment_valuations_input_currency_check
  check (input_currency = any (array['VND', 'USDT', 'USDC']));

alter table public.investment_valuations
  add constraint investment_valuations_input_rate_check
  check (input_rate_to_vnd > 0);

alter table public.investment_valuations
  add constraint investment_valuations_input_rate_source_check
  check (input_rate_source = any (array['automatic', 'manual', 'identity']));

alter table public.investment_fees
  add constraint investment_fees_input_currency_check
  check (input_currency = any (array['VND', 'USDT', 'USDC']));

alter table public.investment_fees
  add constraint investment_fees_input_rate_check
  check (input_rate_to_vnd > 0);

alter table public.investment_fees
  add constraint investment_fees_input_rate_source_check
  check (input_rate_source = any (array['automatic', 'manual', 'identity']));

create or replace function public.record_investment_with_input_currency(
  p_operation_type text,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_household_id uuid;
  v_operation_id uuid;
  v_receipt jsonb;
  v_currency text := upper(trim(coalesce(p_payload->>'inputCurrency', '')));
  v_rate_source text := lower(trim(coalesce(p_payload->>'inputRateSource', 'automatic')));
  v_rate numeric;
  v_rate_date date;
  v_rate_provider text;
  v_fees jsonb := coalesce(p_payload->'fees', '[]'::jsonb);
  v_fee jsonb;
  v_fee_rows jsonb := '[]'::jsonb;
  v_key text := p_payload->>'idempotencyKey';
begin
  v_household_id := public.investment_active_household();
  if v_currency not in ('VND', 'USDT', 'USDC') then
    raise exception 'Invalid investment input currency';
  end if;
  if p_operation_type not in (
    'opening_position', 'initial_purchase', 'buy', 'sell',
    'asset_conversion', 'investment_income', 'valuation'
  ) then
    raise exception 'Invalid investment operation type';
  end if;
  if v_currency <> 'VND' and v_rate_source not in ('automatic', 'manual') then
    raise exception 'Invalid investment rate source';
  end if;

  if v_currency <> 'VND' then
    if p_operation_type in ('opening_position', 'initial_purchase') then
      if p_payload->>'assetClass' <> 'crypto' then
        raise exception 'Crypto input currency is only valid for Crypto assets';
      end if;
    elsif p_operation_type in ('buy', 'sell', 'investment_income', 'valuation') then
      perform 1
      from public.investment_holdings
      where id = (p_payload->>'holdingId')::uuid
        and household_id = v_household_id
        and asset_class = 'crypto';
      if not found then
        raise exception 'Crypto input currency is only valid for Crypto assets';
      end if;
    elsif p_operation_type = 'asset_conversion' then
      perform 1
      from public.investment_holdings
      where id in (
        (p_payload->>'sourceHoldingId')::uuid,
        (p_payload->>'destinationHoldingId')::uuid
      )
        and household_id = v_household_id
        and asset_class = 'crypto';
      if not found then
        raise exception 'Crypto input currency is only valid for Crypto assets';
      end if;
    end if;
  end if;

  if v_currency = 'VND' then
    v_rate := 1;
    v_rate_source := 'identity';
    v_rate_provider := 'IDENTITY';
  elsif v_rate_source = 'manual' then
    v_rate := nullif(p_payload->>'inputRateToVnd', '')::numeric;
    if v_rate is null or v_rate <= 0 then
      raise exception 'Investment currency rate unavailable';
    end if;
    v_rate_date := timezone('utc', now())::date;
    v_rate_provider := 'MANUAL';
  else
    select rate, rate_date, provider
      into v_rate, v_rate_date, v_rate_provider
    from public.market_currency_rates
    where base_currency = v_currency
      and quote_currency = 'VND'
      and fetched_at >= now() - interval '24 hours'
    order by fetched_at desc
    limit 1;
    if v_rate is null or v_rate <= 0 then
      raise exception 'Investment currency rate unavailable';
    end if;
    v_rate_source := 'automatic';
  end if;

  for v_fee in select value from jsonb_array_elements(v_fees) loop
    v_fee_rows := v_fee_rows || jsonb_build_array(
      v_fee || jsonb_build_object(
        'amountVnd', case
          when v_fee->>'inputAmount' is not null then
            round((v_fee->>'inputAmount')::numeric * v_rate, 0)
          else nullif(v_fee->>'amountVnd', '')::numeric
        end,
        'feeValueVnd', case
          when v_fee->>'inputFeeValue' is not null then
            round((v_fee->>'inputFeeValue')::numeric * v_rate, 0)
          else nullif(v_fee->>'feeValueVnd', '')::numeric
        end
      )
    );
  end loop;
  v_fees := v_fee_rows;

  case p_operation_type
    when 'opening_position' then
      v_receipt := public.record_investment_opening_position(
        p_asset_name => p_payload->>'assetName',
        p_asset_class => p_payload->>'assetClass',
        p_quantity => (p_payload->>'quantity')::numeric,
        p_as_of_date => (p_payload->>'asOfDate')::date,
        p_symbol => p_payload->>'symbol',
        p_provider_custodian => p_payload->>'providerCustodian',
        p_remaining_total_cost_basis => case
          when p_payload->>'inputRemainingTotalCostBasis' is null then null
          else round((p_payload->>'inputRemainingTotalCostBasis')::numeric * v_rate, 0)
        end,
        p_current_valuation => case
          when p_payload->>'inputCurrentValuation' is null then null
          else round((p_payload->>'inputCurrentValuation')::numeric * v_rate, 0)
        end,
        p_notes => p_payload->>'notes',
        p_visibility_context => p_payload->>'visibilityContext',
        p_idempotency_key => v_key,
        p_financial_scope => p_payload->>'financialScope',
        p_instrument_id => nullif(p_payload->>'instrumentId', '')::uuid
      );
    when 'initial_purchase' then
      v_receipt := public.record_investment_initial_purchase(
        p_asset_name => p_payload->>'assetName',
        p_asset_class => p_payload->>'assetClass',
        p_quantity => (p_payload->>'quantity')::numeric,
        p_unit_price_vnd => case
          when p_payload->>'inputUnitPrice' is null then null
          else round((p_payload->>'inputUnitPrice')::numeric * v_rate, 8)
        end,
        p_cash_account_id => (p_payload->>'cashAccountId')::uuid,
        p_as_of_date => (p_payload->>'asOfDate')::date,
        p_symbol => p_payload->>'symbol',
        p_provider_custodian => p_payload->>'providerCustodian',
        p_fees => v_fees,
        p_notes => p_payload->>'notes',
        p_visibility_context => p_payload->>'visibilityContext',
        p_idempotency_key => v_key,
        p_financial_scope => p_payload->>'financialScope',
        p_total_value_vnd => case
          when p_payload->>'inputUnitPrice' is not null then null
          when p_payload->>'inputTotalValue' is null then null
          else round((p_payload->>'inputTotalValue')::numeric * v_rate, 0)
        end,
        p_instrument_id => nullif(p_payload->>'instrumentId', '')::uuid
      );
    when 'buy' then
      v_receipt := public.record_investment_buy(
        p_holding_id => (p_payload->>'holdingId')::uuid,
        p_cash_account_id => (p_payload->>'cashAccountId')::uuid,
        p_bought_quantity => (p_payload->>'boughtQuantity')::numeric,
        p_unit_price_vnd => case
          when p_payload->>'inputUnitPrice' is null then null
          else round((p_payload->>'inputUnitPrice')::numeric * v_rate, 8)
        end,
        p_total_value_vnd => case
          when p_payload->>'inputUnitPrice' is not null then null
          when p_payload->>'inputTotalValue' is null then null
          else round((p_payload->>'inputTotalValue')::numeric * v_rate, 0)
        end,
        p_quoted_value_vnd => case
          when p_payload->>'inputQuotedValue' is null then null
          else round((p_payload->>'inputQuotedValue')::numeric * v_rate, 0)
        end,
        p_effective_date => (p_payload->>'effectiveDate')::date,
        p_fees => v_fees,
        p_notes => p_payload->>'notes',
        p_idempotency_key => v_key
      );
    when 'sell' then
      v_receipt := public.record_investment_sell(
        p_holding_id => (p_payload->>'holdingId')::uuid,
        p_cash_account_id => (p_payload->>'cashAccountId')::uuid,
        p_sold_quantity => (p_payload->>'soldQuantity')::numeric,
        p_unit_price_vnd => case
          when p_payload->>'inputUnitPrice' is null then null
          else round((p_payload->>'inputUnitPrice')::numeric * v_rate, 8)
        end,
        p_total_value_vnd => case
          when p_payload->>'inputUnitPrice' is not null then null
          when p_payload->>'inputTotalValue' is null then null
          else round((p_payload->>'inputTotalValue')::numeric * v_rate, 0)
        end,
        p_quoted_value_vnd => case
          when p_payload->>'inputQuotedValue' is null then null
          else round((p_payload->>'inputQuotedValue')::numeric * v_rate, 0)
        end,
        p_effective_date => (p_payload->>'effectiveDate')::date,
        p_fees => v_fees,
        p_notes => p_payload->>'notes',
        p_idempotency_key => v_key
      );
    when 'asset_conversion' then
      v_receipt := public.record_investment_conversion(
        p_source_holding_id => (p_payload->>'sourceHoldingId')::uuid,
        p_destination_holding_id => (p_payload->>'destinationHoldingId')::uuid,
        p_source_quantity => (p_payload->>'sourceQuantity')::numeric,
        p_destination_quantity => (p_payload->>'destinationQuantity')::numeric,
        p_executed_value_vnd => case
          when p_payload->>'inputExecutedValue' is null then null
          else round((p_payload->>'inputExecutedValue')::numeric * v_rate, 0)
        end,
        p_quoted_value_vnd => case
          when p_payload->>'inputQuotedValue' is null then null
          else round((p_payload->>'inputQuotedValue')::numeric * v_rate, 0)
        end,
        p_effective_date => (p_payload->>'effectiveDate')::date,
        p_fees => v_fees,
        p_notes => p_payload->>'notes',
        p_idempotency_key => v_key
      );
    when 'investment_income' then
      v_receipt := public.record_investment_income(
        p_holding_id => (p_payload->>'holdingId')::uuid,
        p_cash_account_id => (p_payload->>'cashAccountId')::uuid,
        p_amount_vnd => round((p_payload->>'inputAmount')::numeric * v_rate, 0),
        p_income_kind => p_payload->>'incomeKind',
        p_effective_date => (p_payload->>'effectiveDate')::date,
        p_notes => p_payload->>'notes',
        p_idempotency_key => v_key
      );
    when 'valuation' then
      v_receipt := public.record_investment_valuation(
        p_holding_id => (p_payload->>'holdingId')::uuid,
        p_unit_price_vnd => case
          when p_payload->>'inputUnitPrice' is null then null
          else round((p_payload->>'inputUnitPrice')::numeric * v_rate, 8)
        end,
        p_total_value_vnd => case
          when p_payload->>'inputUnitPrice' is not null then null
          when p_payload->>'inputTotalValue' is null then null
          else round((p_payload->>'inputTotalValue')::numeric * v_rate, 0)
        end,
        p_valuation_date => (p_payload->>'valuationDate')::date,
        p_source => p_payload->>'source',
        p_notes => p_payload->>'notes',
        p_idempotency_key => v_key
      );
  end case;

  v_operation_id := nullif(v_receipt->>'operationId', '')::uuid;
  if v_operation_id is null then
    raise exception 'Investment operation receipt unavailable';
  end if;

  update public.investment_operations
  set input_currency = v_currency,
      input_amount = nullif(p_payload->>'inputAmount', '')::numeric,
      input_unit_price = nullif(p_payload->>'inputUnitPrice', '')::numeric,
      input_total_value = nullif(p_payload->>'inputTotalValue', '')::numeric,
      input_executed_value = nullif(p_payload->>'inputExecutedValue', '')::numeric,
      input_quoted_value = nullif(p_payload->>'inputQuotedValue', '')::numeric,
      input_cost_basis = nullif(p_payload->>'inputRemainingTotalCostBasis', '')::numeric,
      input_current_valuation = nullif(p_payload->>'inputCurrentValuation', '')::numeric,
      input_rate_to_vnd = v_rate,
      input_rate_date = coalesce(v_rate_date, timezone('utc', now())::date),
      input_rate_source = v_rate_source,
      input_rate_provider = v_rate_provider
  where id = v_operation_id;

  update public.investment_fees
  set input_currency = v_currency,
      input_amount = nullif((v_fees->0)->>'inputAmount', '')::numeric,
      input_fee_value = nullif((v_fees->0)->>'inputFeeValue', '')::numeric,
      input_rate_to_vnd = v_rate,
      input_rate_date = coalesce(v_rate_date, timezone('utc', now())::date),
      input_rate_source = v_rate_source,
      input_rate_provider = v_rate_provider
  where operation_id = v_operation_id;

  if p_operation_type = 'valuation' then
    update public.investment_valuations
    set input_currency = v_currency,
        input_unit_price = nullif(p_payload->>'inputUnitPrice', '')::numeric,
        input_total_value = nullif(p_payload->>'inputTotalValue', '')::numeric,
        input_rate_to_vnd = v_rate,
        input_rate_date = coalesce(v_rate_date, timezone('utc', now())::date),
        input_rate_source = v_rate_source,
        input_rate_provider = v_rate_provider
    where id = v_operation_id;
  elsif p_operation_type = 'opening_position' then
    update public.investment_valuations
    set input_currency = v_currency,
        input_total_value = nullif(p_payload->>'inputCurrentValuation', '')::numeric,
        input_rate_to_vnd = v_rate,
        input_rate_date = coalesce(v_rate_date, timezone('utc', now())::date),
        input_rate_source = v_rate_source,
        input_rate_provider = v_rate_provider
    where idempotency_key = v_key || ':opening-valuation';
  end if;

  update public.investment_events
  set snapshot = coalesce(snapshot, '{}'::jsonb) || jsonb_build_object(
    'inputCurrency', v_currency,
    'inputRateToVnd', v_rate,
    'inputRateDate', coalesce(v_rate_date, timezone('utc', now())::date),
    'inputRateSource', v_rate_source,
    'inputRateProvider', v_rate_provider
  )
  where legacy_operation_id = v_operation_id;

  return v_receipt;
end;
$function$;

revoke all on function public.record_investment_with_input_currency(text, jsonb)
  from public, anon, authenticated;

grant execute on function public.record_investment_with_input_currency(text, jsonb)
  to authenticated;
