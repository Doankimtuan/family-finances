create or replace function public.record_investment_buy(
  p_holding_id uuid, p_cash_account_id uuid, p_bought_quantity numeric, p_executed_value_vnd numeric,
  p_quoted_value_vnd numeric, p_effective_date date, p_fees jsonb, p_notes text, p_idempotency_key text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_hh uuid; v_oid uuid; v_existing uuid; v_h public.investment_holdings%rowtype; v_add jsonb; v_fee jsonb;
  v_cash_fee numeric(18,0):=0; v_fee_basis numeric(18,0):=0; v_net_q numeric(38,18); v_tx uuid; v_fee_h uuid; v_consume jsonb;
begin
  v_hh := public.investment_active_household();
  select id into v_existing from public.investment_operations where household_id=v_hh and idempotency_key=p_idempotency_key;
  if found then return public.investment_operation_receipt(v_existing,true); end if;
  select * into v_h from public.investment_holdings where id=p_holding_id and household_id=v_hh for update;
  if not found then raise exception 'Investment holding not found'; end if;
  perform 1 from public.accounts where id=p_cash_account_id and household_id=v_hh and not is_archived and type not in ('credit_card','savings_product') for update;
  if not found then raise exception 'Cash account not found'; end if;
  if p_bought_quantity<=0 or scale(p_bought_quantity)>18 or p_executed_value_vnd<=0 or p_executed_value_vnd<>trunc(p_executed_value_vnd) then raise exception 'Invalid buy'; end if;
  v_net_q:=p_bought_quantity;
  for v_fee in select value from jsonb_array_elements(coalesce(p_fees,'[]'::jsonb)) loop
    if v_fee->>'source'='cash' then v_cash_fee:=v_cash_fee+(v_fee->>'amountVnd')::numeric;
    elsif v_fee->>'source'='destination_asset' then v_net_q:=v_net_q-(v_fee->>'quantity')::numeric;
    elsif v_fee->>'source'='other_investment' then
      v_fee_h:=(v_fee->>'holdingId')::uuid;
      if v_fee_h=p_holding_id then raise exception 'Other fee holding must differ from destination'; end if;
      v_consume:=public.investment_consume_holding(v_hh,v_fee_h,(v_fee->>'quantity')::numeric);
      if v_consume->>'consumedBasis' is null then raise exception 'Fee cost basis unavailable'; end if;
      v_fee_basis:=v_fee_basis+(v_consume->>'consumedBasis')::numeric;
    else raise exception 'Unsupported buy fee source'; end if;
  end loop;
  if v_net_q<=0 then raise exception 'Fee consumes destination quantity'; end if;
  insert into public.transactions(household_id,account_id,type,amount,currency,transaction_date,note,category_id,jar_id,status,idempotency_key,created_by,source)
  values(v_hh,p_cash_account_id,'investment_buy',p_executed_value_vnd+v_cash_fee,'VND',p_effective_date,nullif(trim(coalesce(p_notes,'')),''),null,null,'posted',p_idempotency_key||':cash',auth.uid(),'manual') returning id into v_tx;
  v_add:=public.investment_add_holding(v_hh,p_holding_id,v_net_q,p_executed_value_vnd+v_cash_fee+v_fee_basis);
  insert into public.investment_operations(household_id,operation_type,destination_holding_id,cash_account_id,destination_quantity,executed_value_vnd,quoted_value_vnd,destination_basis_added,before_quantity,after_quantity,before_basis,after_basis,cash_delta,transaction_id,effective_date,notes,idempotency_key,created_by)
  values(v_hh,'buy',p_holding_id,p_cash_account_id,v_net_q,p_executed_value_vnd,p_quoted_value_vnd,p_executed_value_vnd+v_cash_fee+v_fee_basis,(v_add->>'beforeQuantity')::numeric,(v_add->>'afterQuantity')::numeric,(v_add->>'beforeBasis')::numeric,(v_add->>'afterBasis')::numeric,-(p_executed_value_vnd+v_cash_fee),v_tx,p_effective_date,nullif(trim(coalesce(p_notes,'')),''),p_idempotency_key,auth.uid()) returning id into v_oid;
  for v_fee in select value from jsonb_array_elements(coalesce(p_fees,'[]'::jsonb)) loop
    if v_fee->>'source'='cash' then
      insert into public.investment_fees(household_id,operation_id,fee_source,amount_vnd,fee_value_vnd,cash_account_id,transaction_id) values(v_hh,v_oid,'cash',(v_fee->>'amountVnd')::numeric,(v_fee->>'feeValueVnd')::numeric,p_cash_account_id,v_tx);
    else
      v_fee_h:=case when v_fee->>'source'='destination_asset' then p_holding_id else (v_fee->>'holdingId')::uuid end;
      insert into public.investment_fees(household_id,operation_id,fee_source,quantity,fee_value_vnd,fee_holding_id) values(v_hh,v_oid,v_fee->>'source',(v_fee->>'quantity')::numeric,(v_fee->>'feeValueVnd')::numeric,v_fee_h);
    end if;
  end loop;
  return public.investment_operation_receipt(v_oid,false);
end $$;

create or replace function public.record_investment_sell(
  p_holding_id uuid, p_cash_account_id uuid, p_sold_quantity numeric, p_executed_value_vnd numeric,
  p_quoted_value_vnd numeric, p_effective_date date, p_fees jsonb, p_notes text, p_idempotency_key text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_hh uuid; v_oid uuid; v_existing uuid; v_fee jsonb; v_cash_fee numeric(18,0):=0; v_source_fee numeric(38,18):=0;
  v_other_fee_value numeric(18,0):=0; v_total_q numeric(38,18); v_c jsonb; v_tx uuid; v_net numeric(18,0); v_fee_h uuid; v_other jsonb;
begin
  v_hh:=public.investment_active_household(); select id into v_existing from public.investment_operations where household_id=v_hh and idempotency_key=p_idempotency_key;
  if found then return public.investment_operation_receipt(v_existing,true); end if;
  perform 1 from public.accounts where id=p_cash_account_id and household_id=v_hh and not is_archived and type not in ('credit_card','savings_product') for update; if not found then raise exception 'Cash account not found'; end if;
  for v_fee in select value from jsonb_array_elements(coalesce(p_fees,'[]'::jsonb)) loop
    if v_fee->>'source'='cash' then v_cash_fee:=v_cash_fee+(v_fee->>'amountVnd')::numeric;
    elsif v_fee->>'source'='source_asset' then v_source_fee:=v_source_fee+(v_fee->>'quantity')::numeric;
    elsif v_fee->>'source'='other_investment' then
      if (v_fee->>'holdingId')::uuid=p_holding_id then raise exception 'Other fee holding must differ from source'; end if;
      v_other_fee_value:=v_other_fee_value+(v_fee->>'feeValueVnd')::numeric;
    else raise exception 'Unsupported sell fee source'; end if;
  end loop;
  v_total_q:=p_sold_quantity+v_source_fee; v_net:=p_executed_value_vnd-v_cash_fee;
  if p_sold_quantity<=0 or v_net<=0 then raise exception 'Invalid sell'; end if;
  v_c:=public.investment_consume_holding(v_hh,p_holding_id,v_total_q);
  insert into public.transactions(household_id,account_id,type,amount,currency,transaction_date,note,category_id,jar_id,status,idempotency_key,created_by,source)
  values(v_hh,p_cash_account_id,'investment_sell_proceeds',v_net,'VND',p_effective_date,nullif(trim(coalesce(p_notes,'')),''),null,null,'posted',p_idempotency_key||':cash',auth.uid(),'manual') returning id into v_tx;
  insert into public.investment_operations(household_id,operation_type,source_holding_id,cash_account_id,source_quantity,executed_value_vnd,quoted_value_vnd,source_basis_consumed,realized_result_vnd,before_quantity,after_quantity,before_basis,after_basis,cash_delta,transaction_id,effective_date,notes,idempotency_key,created_by)
  values(v_hh,'sell',p_holding_id,p_cash_account_id,v_total_q,p_executed_value_vnd,p_quoted_value_vnd,(v_c->>'consumedBasis')::numeric,case when v_c->>'consumedBasis' is null then null else v_net-(v_c->>'consumedBasis')::numeric-v_other_fee_value end,(v_c->>'beforeQuantity')::numeric,(v_c->>'afterQuantity')::numeric,(v_c->>'beforeBasis')::numeric,(v_c->>'afterBasis')::numeric,v_net,v_tx,p_effective_date,nullif(trim(coalesce(p_notes,'')),''),p_idempotency_key,auth.uid()) returning id into v_oid;
  for v_fee in select value from jsonb_array_elements(coalesce(p_fees,'[]'::jsonb)) loop
    if v_fee->>'source'='cash' then insert into public.investment_fees(household_id,operation_id,fee_source,amount_vnd,fee_value_vnd,cash_account_id,transaction_id) values(v_hh,v_oid,'cash',(v_fee->>'amountVnd')::numeric,(v_fee->>'feeValueVnd')::numeric,p_cash_account_id,v_tx);
    else
      v_fee_h:=case when v_fee->>'source'='source_asset' then p_holding_id else (v_fee->>'holdingId')::uuid end;
      if v_fee->>'source'='other_investment' then v_other:=public.investment_consume_holding(v_hh,v_fee_h,(v_fee->>'quantity')::numeric); end if;
      insert into public.investment_fees(household_id,operation_id,fee_source,quantity,fee_value_vnd,fee_holding_id) values(v_hh,v_oid,v_fee->>'source',(v_fee->>'quantity')::numeric,(v_fee->>'feeValueVnd')::numeric,v_fee_h);
    end if;
  end loop;
  return public.investment_operation_receipt(v_oid,false);
end $$;

create or replace function public.record_investment_conversion(
  p_source_holding_id uuid, p_destination_holding_id uuid, p_source_quantity numeric, p_destination_quantity numeric,
  p_executed_value_vnd numeric, p_quoted_value_vnd numeric, p_effective_date date, p_fees jsonb, p_notes text, p_idempotency_key text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_hh uuid; v_oid uuid; v_existing uuid; v_fee jsonb; v_source_fee numeric(38,18):=0; v_dest_fee numeric(38,18):=0;
  v_source_c jsonb; v_dest_a jsonb; v_basis numeric(18,0); v_cash_basis numeric(18,0):=0; v_fee_h uuid; v_other jsonb; v_tx uuid; v_fee_tx uuid; v_fee_effects jsonb:='[]'::jsonb;
begin
  v_hh:=public.investment_active_household(); select id into v_existing from public.investment_operations where household_id=v_hh and idempotency_key=p_idempotency_key;
  if found then return public.investment_operation_receipt(v_existing,true); end if;
  if p_source_holding_id=p_destination_holding_id then raise exception 'Conversion holdings must differ'; end if;
  for v_fee in select value from jsonb_array_elements(coalesce(p_fees,'[]'::jsonb)) loop
    if v_fee->>'source'='source_asset' then v_source_fee:=v_source_fee+(v_fee->>'quantity')::numeric;
    elsif v_fee->>'source'='destination_asset' then v_dest_fee:=v_dest_fee+(v_fee->>'quantity')::numeric;
    elsif v_fee->>'source'='cash' then v_cash_basis:=v_cash_basis+(v_fee->>'amountVnd')::numeric;
    elsif v_fee->>'source'<>'other_investment' then raise exception 'Unsupported conversion fee source'; end if;
  end loop;
  if p_destination_quantity-v_dest_fee<=0 then raise exception 'Fee consumes destination quantity'; end if;
  v_source_c:=public.investment_consume_holding(v_hh,p_source_holding_id,p_source_quantity+v_source_fee);
  v_basis:=(v_source_c->>'consumedBasis')::numeric;
  for v_fee in select value from jsonb_array_elements(coalesce(p_fees,'[]'::jsonb)) where value->>'source'='other_investment' loop
    if (v_fee->>'holdingId')::uuid in (p_source_holding_id,p_destination_holding_id) then raise exception 'Other fee holding must differ from conversion legs'; end if;
    v_other:=public.investment_consume_holding(v_hh,(v_fee->>'holdingId')::uuid,(v_fee->>'quantity')::numeric);
    if v_basis is not null and v_other->>'consumedBasis' is not null then v_basis:=v_basis+(v_other->>'consumedBasis')::numeric; else v_basis:=null; end if;
  end loop;
  if v_basis is not null then v_basis:=v_basis+v_cash_basis; end if;
  v_dest_a:=public.investment_add_holding(v_hh,p_destination_holding_id,p_destination_quantity-v_dest_fee,v_basis);
  insert into public.investment_operations(household_id,operation_type,source_holding_id,destination_holding_id,source_quantity,destination_quantity,executed_value_vnd,quoted_value_vnd,source_basis_consumed,destination_basis_added,before_quantity,after_quantity,before_basis,after_basis,cash_delta,effective_date,notes,idempotency_key,created_by)
  values(v_hh,'asset_conversion',p_source_holding_id,p_destination_holding_id,p_source_quantity+v_source_fee,p_destination_quantity-v_dest_fee,p_executed_value_vnd,p_quoted_value_vnd,(v_source_c->>'consumedBasis')::numeric,v_basis,(v_source_c->>'beforeQuantity')::numeric,(v_source_c->>'afterQuantity')::numeric,(v_source_c->>'beforeBasis')::numeric,(v_source_c->>'afterBasis')::numeric,-v_cash_basis,p_effective_date,nullif(trim(coalesce(p_notes,'')),''),p_idempotency_key,auth.uid()) returning id into v_oid;
  for v_fee in select value from jsonb_array_elements(coalesce(p_fees,'[]'::jsonb)) loop
    v_fee_tx:=null;
    if v_fee->>'source'='cash' then
      perform 1 from public.accounts where id=(v_fee->>'cashAccountId')::uuid and household_id=v_hh and not is_archived and type not in ('credit_card','savings_product') for update; if not found then raise exception 'Cash account not found'; end if;
      insert into public.transactions(household_id,account_id,type,amount,currency,transaction_date,note,category_id,jar_id,status,idempotency_key,created_by,source)
      values(v_hh,(v_fee->>'cashAccountId')::uuid,'investment_fee',(v_fee->>'amountVnd')::numeric,'VND',p_effective_date,nullif(trim(coalesce(p_notes,'')),''),null,null,'posted',p_idempotency_key||':fee:'||(select count(*) from public.investment_fees where operation_id=v_oid),auth.uid(),'manual') returning id into v_fee_tx;
      insert into public.investment_fees(household_id,operation_id,fee_source,amount_vnd,fee_value_vnd,cash_account_id,transaction_id) values(v_hh,v_oid,'cash',(v_fee->>'amountVnd')::numeric,(v_fee->>'feeValueVnd')::numeric,(v_fee->>'cashAccountId')::uuid,v_fee_tx);
    else
      v_fee_h:=case v_fee->>'source' when 'source_asset' then p_source_holding_id when 'destination_asset' then p_destination_holding_id else (v_fee->>'holdingId')::uuid end;
      insert into public.investment_fees(household_id,operation_id,fee_source,quantity,fee_value_vnd,fee_holding_id) values(v_hh,v_oid,v_fee->>'source',(v_fee->>'quantity')::numeric,(v_fee->>'feeValueVnd')::numeric,v_fee_h);
    end if;
  end loop;
  return public.investment_operation_receipt(v_oid,false);
end $$;

create or replace function public.record_investment_income(
  p_holding_id uuid, p_cash_account_id uuid, p_amount_vnd numeric, p_income_kind text, p_effective_date date, p_notes text, p_idempotency_key text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_hh uuid; v_oid uuid; v_existing uuid; v_tx uuid;
begin
  v_hh:=public.investment_active_household(); select id into v_existing from public.investment_operations where household_id=v_hh and idempotency_key=p_idempotency_key;
  if found then return public.investment_operation_receipt(v_existing,true); end if;
  perform 1 from public.investment_holdings where id=p_holding_id and household_id=v_hh for update; if not found then raise exception 'Investment holding not found'; end if;
  perform 1 from public.accounts where id=p_cash_account_id and household_id=v_hh and not is_archived and type not in ('credit_card','savings_product') for update; if not found then raise exception 'Cash account not found'; end if;
  if p_amount_vnd<=0 or p_amount_vnd<>trunc(p_amount_vnd) or p_income_kind not in ('dividend','interest','distribution','other') then raise exception 'Invalid investment income'; end if;
  insert into public.transactions(household_id,account_id,type,amount,currency,transaction_date,note,category_id,jar_id,status,idempotency_key,created_by,source)
  values(v_hh,p_cash_account_id,'investment_income',p_amount_vnd,'VND',p_effective_date,nullif(trim(coalesce(p_notes,'')),''),null,null,'posted',p_idempotency_key||':cash',auth.uid(),'manual') returning id into v_tx;
  insert into public.investment_operations(household_id,operation_type,source_holding_id,cash_account_id,executed_value_vnd,income_kind,cash_delta,transaction_id,effective_date,notes,idempotency_key,created_by)
  values(v_hh,'investment_income',p_holding_id,p_cash_account_id,p_amount_vnd,p_income_kind,p_amount_vnd,v_tx,p_effective_date,nullif(trim(coalesce(p_notes,'')),''),p_idempotency_key,auth.uid()) returning id into v_oid;
  return public.investment_operation_receipt(v_oid,false);
end $$;

;
