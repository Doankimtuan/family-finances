-- Keep the existing initial-purchase API, but route it through the 12B
-- per-unit buy boundary so it inherits fee, ownership, FIFO, and replay rules.
create or replace function public.record_investment_initial_purchase(
  p_asset_name text, p_asset_class text, p_quantity numeric, p_unit_price_vnd numeric,
  p_cash_account_id uuid, p_as_of_date date, p_symbol text, p_provider_custodian text,
  p_fees jsonb, p_notes text, p_visibility_context text, p_idempotency_key text,
  p_financial_scope text default 'household'
) returns jsonb language plpgsql security definer set search_path=public as $$
declare hh uuid; holding_id uuid; existing uuid; scope text; owner_id uuid;
begin
  hh:=public.investment_active_household();
  scope:=lower(trim(coalesce(p_financial_scope,'household')));
  if scope not in ('household','personal') then raise exception 'Invalid financial scope'; end if;
  owner_id:=case when scope='personal' then public.active_membership_id(hh) else null end;
  select id into existing from public.investment_operations where household_id=hh and idempotency_key=p_idempotency_key;
  if found then return public.investment_operation_receipt(existing,true); end if;
  perform public.investment_assert_account_12b(p_cash_account_id,hh);
  insert into public.investment_holdings(
    household_id,name,symbol,asset_class,provider_custodian,visibility_context,
    lifecycle_status,history_status,quantity,remaining_total_cost_basis,notes,
    created_by,financial_scope,owner_membership_id,accounting_method
  ) values (
    hh,trim(p_asset_name),nullif(trim(coalesce(p_symbol,'')),''),p_asset_class,
    nullif(trim(coalesce(p_provider_custodian,'')),''),coalesce(p_visibility_context,'household'),
    'exited','full',0,0,nullif(trim(coalesce(p_notes,'')),''),auth.uid(),scope,owner_id,
    case when p_asset_class='fund' then 'FIFO' else 'WEIGHTED_AVERAGE' end
  ) returning id into holding_id;
  return public.record_investment_buy(
    holding_id,p_cash_account_id,p_quantity,p_unit_price_vnd,null,null,p_as_of_date,
    coalesce(p_fees,'[]'::jsonb),p_notes,p_idempotency_key
  );
end $$;
revoke all on function public.record_investment_initial_purchase(text,text,numeric,numeric,uuid,date,text,text,jsonb,text,text,text,text) from public,anon;
grant execute on function public.record_investment_initial_purchase(text,text,numeric,numeric,uuid,date,text,text,jsonb,text,text,text,text) to authenticated;
