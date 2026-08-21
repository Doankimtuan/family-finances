create or replace function public.record_investment_valuation(
  p_holding_id uuid,p_unit_price_vnd numeric,p_total_value_vnd numeric,p_valuation_date date,p_source text,p_notes text,p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare hh uuid; h public.investment_holdings%rowtype; existing uuid; v numeric; v_id uuid;
begin
  hh:=public.investment_active_household();
  select iv.id into existing from public.investment_valuations iv where iv.household_id=hh and iv.idempotency_key=p_idempotency_key;
  if found then return jsonb_build_object('operationId',existing,'holdingId',p_holding_id,'cashDelta',0,'transactionIds','[]'::jsonb,'idempotentReplay',true); end if;
  select * into h from public.investment_holdings where id=p_holding_id and household_id=hh;
  if not found then raise exception 'Investment holding not found'; end if;
  perform public.assert_financial_mutation(h.household_id,h.financial_scope,h.owner_membership_id);
  if h.asset_class='bond' then
    v:=p_total_value_vnd;
    if v is null or p_unit_price_vnd is not null then raise exception 'Invalid valuation price'; end if;
  else
    v:=round(h.quantity*p_unit_price_vnd,0);
    if p_unit_price_vnd is null or p_total_value_vnd is not null then raise exception 'Invalid valuation unit price'; end if;
  end if;
  insert into public.investment_valuations(household_id,holding_id,value_vnd,quantity,unit_price_vnd,valuation_date,source,notes,idempotency_key,created_by)
  values(hh,p_holding_id,v,h.quantity,p_unit_price_vnd,p_valuation_date,p_source,p_notes,p_idempotency_key,auth.uid())
  returning investment_valuations.id into v_id;
  return jsonb_build_object('operationId',v_id,'holdingId',p_holding_id,'cashDelta',0,'transactionIds','[]'::jsonb,'idempotentReplay',false);
end $$;
revoke all on function public.record_investment_valuation(uuid,numeric,numeric,date,text,text,text) from public,anon;
grant execute on function public.record_investment_valuation(uuid,numeric,numeric,date,text,text,text) to authenticated;
