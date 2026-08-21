-- Investments 12B: financial-integrity boundary.  This migration is deliberately
-- additive: v1 rows remain readable, while all new mutations use unit prices,
-- separate fee transactions, ownership checks, and one replay key.

alter table public.investment_holdings
  add column if not exists accounting_method text;
alter table public.investment_operations
  add column if not exists unit_price_vnd numeric(24,8);
alter table public.investment_valuations
  add column if not exists quantity numeric(38,18),
  add column if not exists unit_price_vnd numeric(24,8);

update public.investment_holdings
set accounting_method = case when asset_class = 'fund' then 'FIFO' else 'WEIGHTED_AVERAGE' end
where accounting_method is null;

create table if not exists public.investment_events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  position_id uuid not null references public.investment_holdings(id) on delete restrict,
  event_type text not null,
  executed_quantity numeric(38,18),
  unit_price numeric(24,8),
  gross_amount numeric(18,0),
  fee_amount numeric(18,0) not null default 0,
  disposed_cost_basis numeric(18,0),
  realized_pnl numeric(18,0),
  source_cash_account_id uuid references public.accounts(id) on delete restrict,
  destination_cash_account_id uuid references public.accounts(id) on delete restrict,
  effective_at timestamptz not null,
  notes text,
  snapshot jsonb not null default '{}'::jsonb,
  legacy_operation_id uuid unique references public.investment_operations(id) on delete restrict,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create table if not exists public.investment_lots (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  position_id uuid not null references public.investment_holdings(id) on delete restrict,
  source_event_id uuid references public.investment_events(id) on delete restrict,
  acquired_at timestamptz not null,
  original_quantity numeric(38,18) not null check (original_quantity > 0),
  remaining_quantity numeric(38,18) not null check (remaining_quantity >= 0),
  unit_cost numeric(24,8) not null check (unit_cost >= 0),
  total_cost numeric(18,0) not null check (total_cost >= 0),
  created_at timestamptz not null default now()
);
alter table public.investment_events enable row level security;
alter table public.investment_lots enable row level security;
drop policy if exists investment_events_select_12b on public.investment_events;
drop policy if exists investment_lots_select_12b on public.investment_lots;
create policy investment_events_select_12b on public.investment_events for select to authenticated
  using (public.is_household_member(household_id));
create policy investment_lots_select_12b on public.investment_lots for select to authenticated
  using (public.is_household_member(household_id));
revoke all on public.investment_events, public.investment_lots from anon, authenticated;
grant select on public.investment_events, public.investment_lots to authenticated;

update public.investment_operations o
set unit_price_vnd = round(o.executed_value_vnd / coalesce(o.destination_quantity, o.source_quantity), 8)
where o.unit_price_vnd is null and coalesce(o.destination_quantity, o.source_quantity) > 0 and o.executed_value_vnd is not null
  and o.operation_type in ('buy', 'sell');
update public.investment_valuations v
set quantity = h.quantity,
    unit_price_vnd = case when h.quantity > 0 then round(v.value_vnd / h.quantity, 8) end
from public.investment_holdings h
where h.id = v.holding_id and v.quantity is null;

-- Existing fund balances are imported as one explicit aggregate lot.  New fund
-- purchases create exact lots and all disposals consume oldest lots first.
insert into public.investment_lots(
  household_id, position_id, acquired_at, original_quantity, remaining_quantity,
  unit_cost, total_cost
)
select h.household_id, h.id, h.created_at, h.quantity, h.quantity,
  round(h.remaining_total_cost_basis / h.quantity, 8), h.remaining_total_cost_basis
from public.investment_holdings h
where h.asset_class = 'fund' and h.quantity > 0
  and h.remaining_total_cost_basis is not null
  and not exists (select 1 from public.investment_lots l where l.position_id = h.id);

create or replace function public.investment_assert_holding_12b(p_holding_id uuid, p_household_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare h record;
begin
  select household_id, financial_scope, owner_membership_id into h
  from public.investment_holdings where id = p_holding_id and household_id = p_household_id for update;
  if not found then raise exception 'Investment holding not found'; end if;
  perform public.assert_financial_mutation(h.household_id, h.financial_scope, h.owner_membership_id);
end $$;

create or replace function public.investment_assert_account_12b(p_account_id uuid, p_household_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare a record;
begin
  select household_id, financial_scope, owner_membership_id into a
  from public.accounts where id = p_account_id and household_id = p_household_id
    and not is_archived and type not in ('credit_card','savings_product') for update;
  if not found then raise exception 'Cash account not found'; end if;
  perform public.assert_financial_mutation(a.household_id, a.financial_scope, a.owner_membership_id);
end $$;

create or replace function public.investment_consume_holding(
  p_household_id uuid, p_holding_id uuid, p_quantity numeric
) returns jsonb language plpgsql security definer set search_path = public as $$
declare h public.investment_holdings%rowtype; l record; take numeric; consumed numeric := 0;
  after_q numeric; after_b numeric; method text;
begin
  if p_quantity is null or p_quantity <= 0 or scale(p_quantity) > 18 then raise exception 'Invalid quantity'; end if;
  select * into h from public.investment_holdings where id=p_holding_id and household_id=p_household_id for update;
  if not found then raise exception 'Investment holding not found'; end if;
  perform public.assert_financial_mutation(h.household_id,h.financial_scope,h.owner_membership_id);
  if p_quantity > h.quantity then raise exception 'Insufficient quantity'; end if;
  method := coalesce(h.accounting_method, case when h.asset_class='fund' then 'FIFO' else 'WEIGHTED_AVERAGE' end);
  if method='FIFO' and h.asset_class='fund' and h.remaining_total_cost_basis is not null then
    for l in select * from public.investment_lots where position_id=p_holding_id and remaining_quantity>0 order by acquired_at,id for update loop
      exit when consumed >= p_quantity;
      take := least(l.remaining_quantity,p_quantity-consumed);
      consumed := consumed + take;
      after_b := coalesce(after_b,0) + round(take*l.unit_cost,0);
      update public.investment_lots set remaining_quantity=remaining_quantity-take where id=l.id;
    end loop;
    if consumed < p_quantity then raise exception 'Insufficient FIFO lots'; end if;
  else
    after_b := case when h.remaining_total_cost_basis is null then null
      when p_quantity=h.quantity then h.remaining_total_cost_basis
      else round(h.remaining_total_cost_basis*p_quantity/h.quantity,0) end;
  end if;
  after_q := h.quantity-p_quantity;
  update public.investment_holdings set quantity=after_q,
    remaining_total_cost_basis=case when h.remaining_total_cost_basis is null then null else h.remaining_total_cost_basis-after_b end,
    lifecycle_status=case when after_q=0 then 'exited' else lifecycle_status end, updated_at=now() where id=h.id;
  return jsonb_build_object('beforeQuantity',h.quantity,'afterQuantity',after_q,'beforeBasis',h.remaining_total_cost_basis,
    'afterBasis',case when h.remaining_total_cost_basis is null then null else h.remaining_total_cost_basis-after_b end,
    'consumedBasis',after_b);
end $$;

create or replace function public.investment_add_holding(
  p_household_id uuid, p_holding_id uuid, p_quantity numeric, p_basis numeric
) returns jsonb language plpgsql security definer set search_path = public as $$
declare h public.investment_holdings%rowtype; after_b numeric;
begin
  if p_quantity is null or p_quantity <= 0 or scale(p_quantity)>18 then raise exception 'Invalid quantity'; end if;
  select * into h from public.investment_holdings where id=p_holding_id and household_id=p_household_id for update;
  if not found then raise exception 'Investment holding not found'; end if;
  perform public.assert_financial_mutation(h.household_id,h.financial_scope,h.owner_membership_id);
  after_b := case when h.remaining_total_cost_basis is null then null else h.remaining_total_cost_basis+coalesce(p_basis,0) end;
  update public.investment_holdings set quantity=quantity+p_quantity,remaining_total_cost_basis=after_b,lifecycle_status='active',updated_at=now() where id=h.id;
  return jsonb_build_object('beforeQuantity',h.quantity,'afterQuantity',h.quantity+p_quantity,'beforeBasis',h.remaining_total_cost_basis,'afterBasis',after_b);
end $$;

drop function if exists public.record_investment_buy(uuid,uuid,numeric,numeric,numeric,date,jsonb,text,text);
drop function if exists public.record_investment_sell(uuid,uuid,numeric,numeric,numeric,date,jsonb,text,text);
drop function if exists public.record_investment_valuation(uuid,numeric,date,text,text,text);

create or replace function public.record_investment_buy(
  p_holding_id uuid,p_cash_account_id uuid,p_bought_quantity numeric,p_unit_price_vnd numeric,p_total_value_vnd numeric,
  p_quoted_value_vnd numeric,p_effective_date date,p_fees jsonb,p_notes text,p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare hh uuid; h public.investment_holdings%rowtype; old_id uuid; add_result jsonb; fee jsonb; fee_tx uuid; tx uuid; op uuid;
  total numeric; cash_fee numeric:=0; net_q numeric:=p_bought_quantity; fee_h uuid; fee_index int:=0; fee_basis numeric:=0;
begin
  hh:=public.investment_active_household();
  select id into old_id from public.investment_operations where household_id=hh and idempotency_key=p_idempotency_key;
  if found then return public.investment_operation_receipt(old_id,true); end if;
  select * into h from public.investment_holdings where id=p_holding_id and household_id=hh for update;
  if not found then raise exception 'Investment holding not found'; end if;
  perform public.assert_financial_mutation(h.household_id,h.financial_scope,h.owner_membership_id);
  perform public.investment_assert_account_12b(p_cash_account_id,hh);
  total:=case when h.asset_class='bond' then p_total_value_vnd else round(p_bought_quantity*p_unit_price_vnd,0) end;
  if p_bought_quantity<=0 or total<=0 or (h.asset_class<>'bond' and (p_unit_price_vnd is null or p_total_value_vnd is not null)) or (h.asset_class='bond' and (p_total_value_vnd is null or p_unit_price_vnd is not null)) then raise exception 'Invalid buy price'; end if;
  for fee in select value from jsonb_array_elements(coalesce(p_fees,'[]'::jsonb)) loop
    if fee->>'source'='cash' then cash_fee:=cash_fee+coalesce((fee->>'amountVnd')::numeric,0);
    elsif fee->>'source'='destination_asset' then net_q:=net_q-(fee->>'quantity')::numeric;
    elsif fee->>'source'='other_investment' then fee_h:=(fee->>'holdingId')::uuid; perform public.investment_assert_holding_12b(fee_h,hh); fee_basis:=fee_basis+coalesce((public.investment_consume_holding(hh,fee_h,(fee->>'quantity')::numeric)->>'consumedBasis')::numeric,0);
    else raise exception 'Unsupported buy fee source'; end if;
  end loop;
  if net_q<=0 then raise exception 'Fee consumes destination quantity'; end if;
  insert into public.transactions(household_id,account_id,type,amount,currency,transaction_date,status,idempotency_key,created_by,source)
  values(hh,p_cash_account_id,'investment_buy',total,'VND',p_effective_date,'posted',p_idempotency_key||':principal',auth.uid(),'manual') returning id into tx;
  add_result:=public.investment_add_holding(hh,p_holding_id,net_q,total+fee_basis);
  insert into public.investment_operations(household_id,operation_type,destination_holding_id,cash_account_id,destination_quantity,executed_value_vnd,unit_price_vnd,quoted_value_vnd,destination_basis_added,before_quantity,after_quantity,before_basis,after_basis,cash_delta,transaction_id,effective_date,notes,idempotency_key,created_by)
  values(hh,'buy',p_holding_id,p_cash_account_id,net_q,total,p_unit_price_vnd,p_quoted_value_vnd,total+fee_basis,(add_result->>'beforeQuantity')::numeric,(add_result->>'afterQuantity')::numeric,(add_result->>'beforeBasis')::numeric,(add_result->>'afterBasis')::numeric,-total-cash_fee,tx,p_effective_date,p_notes,p_idempotency_key,auth.uid()) returning id into op;
  if h.asset_class='fund' then
    insert into public.investment_lots(household_id,position_id,acquired_at,original_quantity,remaining_quantity,unit_cost,total_cost)
    values(hh,p_holding_id,p_effective_date::timestamptz,net_q,net_q,round((total+fee_basis)/net_q,8),total+fee_basis);
  end if;
  for fee in select value from jsonb_array_elements(coalesce(p_fees,'[]'::jsonb)) loop fee_index:=fee_index+1; if fee->>'source'='cash' then
    insert into public.transactions(household_id,account_id,type,amount,currency,transaction_date,status,idempotency_key,created_by,source) values(hh,p_cash_account_id,'investment_fee',(fee->>'amountVnd')::numeric,'VND',p_effective_date,'posted',p_idempotency_key||':fee:'||fee_index,auth.uid(),'manual') returning id into fee_tx;
    insert into public.investment_fees(household_id,operation_id,fee_source,amount_vnd,fee_value_vnd,cash_account_id,transaction_id) values(hh,op,'cash',(fee->>'amountVnd')::numeric,(fee->>'feeValueVnd')::numeric,p_cash_account_id,fee_tx);
  else fee_h:=case when fee->>'source'='destination_asset' then p_holding_id else (fee->>'holdingId')::uuid end; insert into public.investment_fees(household_id,operation_id,fee_source,quantity,fee_value_vnd,fee_holding_id) values(hh,op,fee->>'source',(fee->>'quantity')::numeric,(fee->>'feeValueVnd')::numeric,fee_h); end if; end loop;
  return public.investment_operation_receipt(op,false);
end $$;

create or replace function public.record_investment_sell(
  p_holding_id uuid,p_cash_account_id uuid,p_sold_quantity numeric,p_unit_price_vnd numeric,p_total_value_vnd numeric,
  p_quoted_value_vnd numeric,p_effective_date date,p_fees jsonb,p_notes text,p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare hh uuid; h public.investment_holdings%rowtype; old_id uuid; fee jsonb; fee_h uuid; cash_fee numeric:=0; source_fee numeric:=0; other_fee numeric:=0; total numeric; c jsonb; tx uuid; op uuid; fee_tx uuid; i int:=0;
begin
  hh:=public.investment_active_household(); select id into old_id from public.investment_operations where household_id=hh and idempotency_key=p_idempotency_key; if found then return public.investment_operation_receipt(old_id,true); end if;
  select * into h from public.investment_holdings where id=p_holding_id and household_id=hh for update; if not found then raise exception 'Investment holding not found'; end if;
  perform public.assert_financial_mutation(h.household_id,h.financial_scope,h.owner_membership_id); perform public.investment_assert_account_12b(p_cash_account_id,hh);
  total:=case when h.asset_class='bond' then p_total_value_vnd else round(p_sold_quantity*p_unit_price_vnd,0) end;
  if p_sold_quantity<=0 or total<=0 or (h.asset_class<>'bond' and (p_unit_price_vnd is null or p_total_value_vnd is not null)) or (h.asset_class='bond' and (p_total_value_vnd is null or p_unit_price_vnd is not null)) then raise exception 'Invalid sell price'; end if;
  for fee in select value from jsonb_array_elements(coalesce(p_fees,'[]'::jsonb)) loop if fee->>'source'='cash' then cash_fee:=cash_fee+(fee->>'amountVnd')::numeric; elsif fee->>'source'='source_asset' then source_fee:=source_fee+(fee->>'quantity')::numeric; elsif fee->>'source'='other_investment' then fee_h:=(fee->>'holdingId')::uuid; perform public.investment_assert_holding_12b(fee_h,hh); other_fee:=other_fee+(fee->>'feeValueVnd')::numeric; else raise exception 'Unsupported sell fee source'; end if; end loop;
  c:=public.investment_consume_holding(hh,p_holding_id,p_sold_quantity+source_fee);
  if total-cash_fee<=0 then raise exception 'Invalid sell proceeds'; end if;
  insert into public.transactions(household_id,account_id,type,amount,currency,transaction_date,status,idempotency_key,created_by,source) values(hh,p_cash_account_id,'investment_sell_proceeds',total,'VND',p_effective_date,'posted',p_idempotency_key||':principal',auth.uid(),'manual') returning id into tx;
  insert into public.investment_operations(household_id,operation_type,source_holding_id,cash_account_id,source_quantity,executed_value_vnd,unit_price_vnd,quoted_value_vnd,source_basis_consumed,realized_result_vnd,before_quantity,after_quantity,before_basis,after_basis,cash_delta,transaction_id,effective_date,notes,idempotency_key,created_by)
  values(hh,'sell',p_holding_id,p_cash_account_id,p_sold_quantity+source_fee,total,p_unit_price_vnd,p_quoted_value_vnd,(c->>'consumedBasis')::numeric,case when c->>'consumedBasis' is null then null else total-cast(c->>'consumedBasis' as numeric)-other_fee-cash_fee end,(c->>'beforeQuantity')::numeric,(c->>'afterQuantity')::numeric,(c->>'beforeBasis')::numeric,(c->>'afterBasis')::numeric,total-cash_fee,tx,p_effective_date,p_notes,p_idempotency_key,auth.uid()) returning id into op;
  for fee in select value from jsonb_array_elements(coalesce(p_fees,'[]'::jsonb)) loop i:=i+1; if fee->>'source'='cash' then insert into public.transactions(household_id,account_id,type,amount,currency,transaction_date,status,idempotency_key,created_by,source) values(hh,p_cash_account_id,'investment_fee',(fee->>'amountVnd')::numeric,'VND',p_effective_date,'posted',p_idempotency_key||':fee:'||i,auth.uid(),'manual') returning id into fee_tx; insert into public.investment_fees(household_id,operation_id,fee_source,amount_vnd,fee_value_vnd,cash_account_id,transaction_id) values(hh,op,'cash',(fee->>'amountVnd')::numeric,(fee->>'feeValueVnd')::numeric,p_cash_account_id,fee_tx); else fee_h:=case when fee->>'source'='source_asset' then p_holding_id else (fee->>'holdingId')::uuid end; insert into public.investment_fees(household_id,operation_id,fee_source,quantity,fee_value_vnd,fee_holding_id) values(hh,op,fee->>'source',(fee->>'quantity')::numeric,(fee->>'feeValueVnd')::numeric,fee_h); end if; end loop;
  return public.investment_operation_receipt(op,false);
end $$;

create or replace function public.record_investment_valuation(
  p_holding_id uuid,p_unit_price_vnd numeric,p_total_value_vnd numeric,p_valuation_date date,p_source text,p_notes text,p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare hh uuid; h public.investment_holdings%rowtype; existing uuid; v numeric; id uuid;
begin
  hh:=public.investment_active_household(); select id into existing from public.investment_valuations where household_id=hh and idempotency_key=p_idempotency_key; if found then return jsonb_build_object('operationId',existing,'holdingId',p_holding_id,'cashDelta',0,'transactionIds','[]'::jsonb,'idempotentReplay',true); end if;
  select * into h from public.investment_holdings where id=p_holding_id and household_id=hh; if not found then raise exception 'Investment holding not found'; end if; perform public.assert_financial_mutation(h.household_id,h.financial_scope,h.owner_membership_id);
  if h.asset_class='bond' then v:=p_total_value_vnd; if v is null or p_unit_price_vnd is not null then raise exception 'Invalid valuation price'; end if; else v:=round(h.quantity*p_unit_price_vnd,0); if p_unit_price_vnd is null or p_total_value_vnd is not null then raise exception 'Invalid valuation unit price'; end if; end if;
  insert into public.investment_valuations(household_id,holding_id,value_vnd,quantity,unit_price_vnd,valuation_date,source,notes,idempotency_key,created_by) values(hh,p_holding_id,v,h.quantity,p_unit_price_vnd,p_valuation_date,p_source,p_notes,p_idempotency_key,auth.uid()) returning id into id;
  return jsonb_build_object('operationId',id,'holdingId',p_holding_id,'cashDelta',0,'transactionIds','[]'::jsonb,'idempotentReplay',false);
end $$;

revoke all on function public.record_investment_buy(uuid,uuid,numeric,numeric,numeric,numeric,date,jsonb,text,text) from public,anon;
revoke all on function public.record_investment_sell(uuid,uuid,numeric,numeric,numeric,numeric,date,jsonb,text,text) from public,anon;
revoke all on function public.record_investment_valuation(uuid,numeric,numeric,date,text,text,text) from public,anon;
grant execute on function public.record_investment_buy(uuid,uuid,numeric,numeric,numeric,numeric,date,jsonb,text,text) to authenticated;
grant execute on function public.record_investment_sell(uuid,uuid,numeric,numeric,numeric,numeric,date,jsonb,text,text) to authenticated;
grant execute on function public.record_investment_valuation(uuid,numeric,numeric,date,text,text,text) to authenticated;

-- Defense in depth for legacy conversion/income RPCs: SECURITY DEFINER does not
-- bypass these triggers because auth.uid() is still the caller.
create or replace function public.guard_investment_mutation_12b()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if tg_table_name='investment_operations' then
    if new.source_holding_id is not null then
      perform public.investment_assert_holding_12b(new.source_holding_id,new.household_id);
    end if;
    if new.destination_holding_id is not null then
      perform public.investment_assert_holding_12b(new.destination_holding_id,new.household_id);
    end if;
    if new.cash_account_id is not null then
      perform public.investment_assert_account_12b(new.cash_account_id,new.household_id);
    end if;
  elsif tg_table_name='transactions' then
    perform public.investment_assert_account_12b(new.account_id,new.household_id);
  end if;
  return new;
end $$;
drop trigger if exists investment_operation_ownership_12b on public.investment_operations;
create trigger investment_operation_ownership_12b before insert on public.investment_operations
for each row execute function public.guard_investment_mutation_12b();
drop trigger if exists investment_transaction_ownership_12b on public.transactions;
create trigger investment_transaction_ownership_12b before insert on public.transactions
for each row when (new.type in ('investment_buy','investment_sell_proceeds','investment_income','investment_fee'))
execute function public.guard_investment_mutation_12b();

revoke all on function public.investment_assert_holding_12b(uuid,uuid) from public,anon,authenticated;
revoke all on function public.investment_assert_account_12b(uuid,uuid) from public,anon,authenticated;
revoke all on function public.guard_investment_mutation_12b() from public,anon,authenticated;
