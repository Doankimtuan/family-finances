create or replace function public.record_investment_initial_purchase(
  p_asset_name text, p_asset_class text, p_quantity numeric, p_unit_price_vnd numeric,
  p_cash_account_id uuid, p_as_of_date date, p_symbol text, p_provider_custodian text,
  p_fees jsonb, p_notes text, p_visibility_context text, p_idempotency_key text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_hh uuid; v_hid uuid; v_existing uuid; v_receipt jsonb;
begin
  v_hh := public.investment_active_household();
  select id into v_existing from public.investment_operations where household_id = v_hh and idempotency_key = p_idempotency_key;
  if found then return public.investment_operation_receipt(v_existing, true); end if;
  if p_asset_class not in ('crypto','stock','fund','gold','bond') or p_quantity <= 0 or scale(p_quantity) > 18 or p_unit_price_vnd <= 0 or p_unit_price_vnd <> trunc(p_unit_price_vnd) or p_as_of_date is null then raise exception 'Invalid initial purchase'; end if;
  perform 1 from public.accounts where id = p_cash_account_id and household_id = v_hh and not is_archived and type not in ('credit_card','savings_product') for update;
  if not found then raise exception 'Cash account not found'; end if;
  insert into public.investment_holdings(household_id,name,symbol,asset_class,provider_custodian,visibility_context,lifecycle_status,history_status,quantity,remaining_total_cost_basis,notes,created_by)
  values(v_hh,trim(p_asset_name),nullif(trim(coalesce(p_symbol,'')),''),p_asset_class,nullif(trim(coalesce(p_provider_custodian,'')),''),coalesce(p_visibility_context,'household'),'active','full',0,0,nullif(trim(coalesce(p_notes,'')),''),auth.uid()) returning id into v_hid;
  v_receipt := public.record_investment_buy(v_hid,p_cash_account_id,p_quantity,round(p_quantity * p_unit_price_vnd),null,p_as_of_date,coalesce(p_fees,'[]'::jsonb),p_notes,p_idempotency_key);
  return v_receipt;
end $$;
