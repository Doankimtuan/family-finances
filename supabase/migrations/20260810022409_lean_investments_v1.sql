-- Phase F6.1: household-scoped, manual-first Investments with exact quantities.

alter table public.transactions drop constraint if exists transactions_type_check;
alter table public.transactions add constraint transactions_type_check check (
  type in (
    'income', 'expense', 'liability_payment', 'transfer_out', 'transfer_in',
    'investment_buy', 'investment_sell_proceeds', 'investment_income', 'investment_fee'
  )
);

create table public.investment_holdings (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 160),
  symbol text check (symbol is null or length(trim(symbol)) between 1 and 40),
  asset_class text not null check (asset_class in ('crypto', 'stock', 'fund', 'gold', 'bond')),
  provider_custodian text check (provider_custodian is null or length(trim(provider_custodian)) between 1 and 160),
  visibility_context text not null default 'household' check (visibility_context in ('household', 'unclear')),
  lifecycle_status text not null default 'active' check (lifecycle_status in ('active', 'exited', 'under_review')),
  history_status text not null check (history_status in ('full', 'opening_position', 'cost_basis_unknown')),
  quantity numeric(38,18) not null check (quantity >= 0),
  remaining_total_cost_basis numeric(18,0) check (remaining_total_cost_basis is null or remaining_total_cost_basis >= 0),
  notes text check (notes is null or length(notes) <= 500),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint investment_holdings_exit_shape check (
    (quantity = 0 and lifecycle_status = 'exited' and (remaining_total_cost_basis is null or remaining_total_cost_basis = 0))
    or (quantity > 0 and lifecycle_status <> 'exited')
  )
);

create table public.investment_operations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  operation_type text not null check (operation_type in ('opening_position', 'buy', 'sell', 'asset_conversion', 'investment_income')),
  source_holding_id uuid references public.investment_holdings(id) on delete restrict,
  destination_holding_id uuid references public.investment_holdings(id) on delete restrict,
  cash_account_id uuid references public.accounts(id) on delete restrict,
  source_quantity numeric(38,18),
  destination_quantity numeric(38,18),
  executed_value_vnd numeric(18,0),
  quoted_value_vnd numeric(18,0),
  source_basis_consumed numeric(18,0),
  destination_basis_added numeric(18,0),
  realized_result_vnd numeric(18,0),
  income_kind text check (income_kind is null or income_kind in ('dividend', 'interest', 'distribution', 'other')),
  before_quantity numeric(38,18),
  after_quantity numeric(38,18),
  before_basis numeric(18,0),
  after_basis numeric(18,0),
  cash_delta numeric(18,0) not null default 0,
  transaction_id uuid references public.transactions(id) on delete restrict,
  effective_date date not null,
  notes text check (notes is null or length(notes) <= 500),
  correlation_id uuid not null default gen_random_uuid(),
  idempotency_key text not null check (length(trim(idempotency_key)) between 1 and 200),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint investment_operations_quantity_check check (
    (source_quantity is null or source_quantity > 0) and
    (destination_quantity is null or destination_quantity > 0)
  ),
  constraint investment_operations_value_check check (
    (executed_value_vnd is null or executed_value_vnd >= 0) and
    (quoted_value_vnd is null or quoted_value_vnd >= 0)
  ),
  constraint investment_operations_shape_check check (
    (operation_type = 'opening_position' and source_holding_id is null and destination_holding_id is not null and cash_account_id is null and transaction_id is null)
    or (operation_type = 'buy' and source_holding_id is null and destination_holding_id is not null and cash_account_id is not null and transaction_id is not null)
    or (operation_type = 'sell' and source_holding_id is not null and destination_holding_id is null and cash_account_id is not null and transaction_id is not null)
    or (operation_type = 'asset_conversion' and source_holding_id is not null and destination_holding_id is not null and source_holding_id <> destination_holding_id and transaction_id is null)
    or (operation_type = 'investment_income' and source_holding_id is not null and destination_holding_id is null and cash_account_id is not null and transaction_id is not null and income_kind is not null)
  )
);

create unique index investment_operations_household_idempotency_unique
  on public.investment_operations (household_id, idempotency_key);

create table public.investment_fees (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  operation_id uuid not null references public.investment_operations(id) on delete restrict,
  fee_source text not null check (fee_source in ('cash', 'source_asset', 'destination_asset', 'other_investment')),
  quantity numeric(38,18),
  amount_vnd numeric(18,0),
  fee_value_vnd numeric(18,0) not null check (fee_value_vnd > 0),
  fee_holding_id uuid references public.investment_holdings(id) on delete restrict,
  cash_account_id uuid references public.accounts(id) on delete restrict,
  transaction_id uuid references public.transactions(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint investment_fees_shape_check check (
    (fee_source = 'cash' and amount_vnd is not null and amount_vnd > 0 and quantity is null and fee_holding_id is null and cash_account_id is not null)
    or (fee_source <> 'cash' and quantity is not null and quantity > 0 and amount_vnd is null and fee_holding_id is not null and cash_account_id is null and transaction_id is null)
  )
);

create table public.investment_valuations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  holding_id uuid not null references public.investment_holdings(id) on delete restrict,
  value_vnd numeric(18,0) not null check (value_vnd >= 0),
  valuation_date date not null,
  source text not null check (source in ('manual', 'statement', 'provider')),
  notes text check (notes is null or length(notes) <= 500),
  supersedes_valuation_id uuid references public.investment_valuations(id) on delete restrict,
  idempotency_key text not null check (length(trim(idempotency_key)) between 1 and 200),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index investment_valuations_household_idempotency_unique
  on public.investment_valuations (household_id, idempotency_key);
create index idx_investment_holdings_household on public.investment_holdings (household_id, lifecycle_status, created_at);
create index idx_investment_operations_holding_activity on public.investment_operations (household_id, source_holding_id, destination_holding_id, effective_date desc);
create index idx_investment_operations_correlation on public.investment_operations (household_id, correlation_id);
create index idx_investment_fees_operation on public.investment_fees (household_id, operation_id);
create index idx_investment_valuations_latest on public.investment_valuations (household_id, holding_id, valuation_date desc, created_at desc);

alter table public.investment_holdings enable row level security;
alter table public.investment_operations enable row level security;
alter table public.investment_fees enable row level security;
alter table public.investment_valuations enable row level security;

create policy investment_holdings_select on public.investment_holdings for select to authenticated
  using (public.is_household_member(household_id));
create policy investment_operations_select on public.investment_operations for select to authenticated
  using (public.is_household_member(household_id));
create policy investment_fees_select on public.investment_fees for select to authenticated
  using (public.is_household_member(household_id));
create policy investment_valuations_select on public.investment_valuations for select to authenticated
  using (public.is_household_member(household_id));

revoke all on public.investment_holdings, public.investment_operations, public.investment_fees, public.investment_valuations from anon, authenticated;
grant select on public.investment_holdings, public.investment_operations, public.investment_fees, public.investment_valuations to authenticated;

create or replace function public.investment_active_household()
returns uuid language plpgsql security definer set search_path = public as $$
declare v_household_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select hm.household_id into v_household_id from public.household_members hm
  where hm.user_id = auth.uid() and hm.is_active = true limit 1;
  if v_household_id is null then raise exception 'Not a household member'; end if;
  return v_household_id;
end $$;

create or replace function public.investment_consume_holding(
  p_household_id uuid, p_holding_id uuid, p_quantity numeric
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_h public.investment_holdings%rowtype; v_consumed numeric(18,0); v_after_q numeric(38,18); v_after_b numeric(18,0);
begin
  if p_quantity is null or p_quantity <= 0 or scale(p_quantity) > 18 then raise exception 'Invalid quantity'; end if;
  select * into v_h from public.investment_holdings where id = p_holding_id and household_id = p_household_id for update;
  if not found then raise exception 'Investment holding not found'; end if;
  if p_quantity > v_h.quantity then raise exception 'Insufficient quantity'; end if;
  v_after_q := v_h.quantity - p_quantity;
  if v_h.remaining_total_cost_basis is null then v_consumed := null; v_after_b := null;
  elsif p_quantity = v_h.quantity then v_consumed := v_h.remaining_total_cost_basis; v_after_b := 0;
  else v_consumed := round(v_h.remaining_total_cost_basis * p_quantity / v_h.quantity); v_after_b := v_h.remaining_total_cost_basis - v_consumed;
  end if;
  update public.investment_holdings set quantity = v_after_q, remaining_total_cost_basis = v_after_b,
    lifecycle_status = case when v_after_q = 0 then 'exited' else lifecycle_status end, updated_at = now() where id = v_h.id;
  return jsonb_build_object('beforeQuantity', v_h.quantity, 'afterQuantity', v_after_q, 'beforeBasis', v_h.remaining_total_cost_basis, 'afterBasis', v_after_b, 'consumedBasis', v_consumed);
end $$;

create or replace function public.investment_add_holding(
  p_household_id uuid, p_holding_id uuid, p_quantity numeric, p_basis numeric
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_h public.investment_holdings%rowtype; v_after_b numeric(18,0);
begin
  if p_quantity is null or p_quantity <= 0 or scale(p_quantity) > 18 then raise exception 'Invalid quantity'; end if;
  select * into v_h from public.investment_holdings where id = p_holding_id and household_id = p_household_id for update;
  if not found then raise exception 'Investment holding not found'; end if;
  if v_h.remaining_total_cost_basis is null then v_after_b := null; else v_after_b := v_h.remaining_total_cost_basis + coalesce(p_basis, 0); end if;
  update public.investment_holdings set quantity = quantity + p_quantity, remaining_total_cost_basis = v_after_b,
    lifecycle_status = 'active', updated_at = now() where id = v_h.id;
  return jsonb_build_object('beforeQuantity', v_h.quantity, 'afterQuantity', v_h.quantity + p_quantity, 'beforeBasis', v_h.remaining_total_cost_basis, 'afterBasis', v_after_b);
end $$;

create or replace function public.investment_operation_receipt(p_operation_id uuid, p_replay boolean)
returns jsonb language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'operationId', o.id, 'holdingId', coalesce(o.destination_holding_id, o.source_holding_id),
    'sourceHoldingId', o.source_holding_id, 'destinationHoldingId', o.destination_holding_id,
    'transactionIds', coalesce((select jsonb_agg(x.id) from (
      select o.transaction_id id where o.transaction_id is not null union all
      select f.transaction_id from public.investment_fees f where f.operation_id = o.id and f.transaction_id is not null
    ) x), '[]'::jsonb),
    'beforeQuantity', o.before_quantity, 'afterQuantity', o.after_quantity,
    'beforeBasis', o.before_basis, 'afterBasis', o.after_basis, 'cashDelta', o.cash_delta,
    'realizedResult', o.realized_result_vnd, 'correlationId', o.correlation_id,
    'feeEffects', coalesce((select jsonb_agg(jsonb_build_object('source', f.fee_source, 'feeValueVnd', f.fee_value_vnd, 'transactionId', f.transaction_id)) from public.investment_fees f where f.operation_id = o.id), '[]'::jsonb),
    'idempotentReplay', p_replay
  ) from public.investment_operations o where o.id = p_operation_id
$$;

revoke all on function public.investment_active_household() from public, anon, authenticated;
revoke all on function public.investment_consume_holding(uuid, uuid, numeric) from public, anon, authenticated;
revoke all on function public.investment_add_holding(uuid, uuid, numeric, numeric) from public, anon, authenticated;
revoke all on function public.investment_operation_receipt(uuid, boolean) from public, anon, authenticated;

create or replace function public.record_investment_opening_position(
  p_asset_name text, p_asset_class text, p_quantity numeric, p_as_of_date date,
  p_symbol text, p_provider_custodian text, p_remaining_total_cost_basis numeric,
  p_current_valuation numeric, p_notes text, p_visibility_context text, p_idempotency_key text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_hh uuid; v_hid uuid; v_oid uuid; v_existing uuid; v_history text;
begin
  v_hh := public.investment_active_household();
  select id into v_existing from public.investment_operations where household_id = v_hh and idempotency_key = p_idempotency_key;
  if found then return public.investment_operation_receipt(v_existing, true); end if;
  if p_asset_class not in ('crypto','stock','fund','gold','bond') or p_quantity <= 0 or scale(p_quantity) > 18 or p_as_of_date is null then raise exception 'Invalid opening position'; end if;
  if p_remaining_total_cost_basis is not null and (p_remaining_total_cost_basis < 0 or p_remaining_total_cost_basis <> trunc(p_remaining_total_cost_basis)) then raise exception 'Invalid basis'; end if;
  v_history := case when p_remaining_total_cost_basis is null then 'cost_basis_unknown' else 'opening_position' end;
  insert into public.investment_holdings(household_id,name,symbol,asset_class,provider_custodian,visibility_context,lifecycle_status,history_status,quantity,remaining_total_cost_basis,notes,created_by)
  values(v_hh,trim(p_asset_name),nullif(trim(coalesce(p_symbol,'')),''),p_asset_class,nullif(trim(coalesce(p_provider_custodian,'')),''),coalesce(p_visibility_context,'household'),'active',v_history,p_quantity,p_remaining_total_cost_basis,nullif(trim(coalesce(p_notes,'')),''),auth.uid()) returning id into v_hid;
  insert into public.investment_operations(household_id,operation_type,destination_holding_id,destination_quantity,destination_basis_added,before_quantity,after_quantity,before_basis,after_basis,effective_date,notes,idempotency_key,created_by)
  values(v_hh,'opening_position',v_hid,p_quantity,p_remaining_total_cost_basis,0,p_quantity,case when p_remaining_total_cost_basis is null then null else 0 end,p_remaining_total_cost_basis,p_as_of_date,nullif(trim(coalesce(p_notes,'')),''),p_idempotency_key,auth.uid()) returning id into v_oid;
  if p_current_valuation is not null then
    insert into public.investment_valuations(household_id,holding_id,value_vnd,valuation_date,source,notes,idempotency_key,created_by)
    values(v_hh,v_hid,p_current_valuation,p_as_of_date,'manual',nullif(trim(coalesce(p_notes,'')),''),p_idempotency_key || ':opening-valuation',auth.uid());
  end if;
  return public.investment_operation_receipt(v_oid, false);
end $$;

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

create or replace function public.record_investment_valuation(
  p_holding_id uuid, p_value_vnd numeric, p_valuation_date date, p_source text, p_notes text, p_idempotency_key text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_hh uuid; v_vid uuid; v_h public.investment_holdings%rowtype;
begin
  v_hh:=public.investment_active_household();
  select id into v_vid from public.investment_valuations where household_id=v_hh and idempotency_key=p_idempotency_key;
  if found then return jsonb_build_object('operationId',v_vid,'holdingId',p_holding_id,'sourceHoldingId',null,'destinationHoldingId',p_holding_id,'transactionIds','[]'::jsonb,'beforeQuantity',null,'afterQuantity',null,'beforeBasis',null,'afterBasis',null,'cashDelta',0,'realizedResult',null,'correlationId',v_vid,'feeEffects','[]'::jsonb,'idempotentReplay',true); end if;
  select * into v_h from public.investment_holdings where id=p_holding_id and household_id=v_hh; if not found then raise exception 'Investment holding not found'; end if;
  if p_value_vnd<0 or p_value_vnd<>trunc(p_value_vnd) or p_source not in ('manual','statement','provider') then raise exception 'Invalid valuation'; end if;
  insert into public.investment_valuations(household_id,holding_id,value_vnd,valuation_date,source,notes,idempotency_key,created_by)
  values(v_hh,p_holding_id,p_value_vnd,p_valuation_date,p_source,nullif(trim(coalesce(p_notes,'')),''),p_idempotency_key,auth.uid()) returning id into v_vid;
  return jsonb_build_object('operationId',v_vid,'holdingId',p_holding_id,'sourceHoldingId',null,'destinationHoldingId',p_holding_id,'transactionIds','[]'::jsonb,'beforeQuantity',v_h.quantity,'afterQuantity',v_h.quantity,'beforeBasis',v_h.remaining_total_cost_basis,'afterBasis',v_h.remaining_total_cost_basis,'cashDelta',0,'realizedResult',null,'correlationId',v_vid,'feeEffects','[]'::jsonb,'idempotentReplay',false);
end $$;

revoke all on function public.record_investment_opening_position(text,text,numeric,date,text,text,numeric,numeric,text,text,text) from public, anon;
revoke all on function public.record_investment_buy(uuid,uuid,numeric,numeric,numeric,date,jsonb,text,text) from public, anon;
revoke all on function public.record_investment_sell(uuid,uuid,numeric,numeric,numeric,date,jsonb,text,text) from public, anon;
revoke all on function public.record_investment_conversion(uuid,uuid,numeric,numeric,numeric,numeric,date,jsonb,text,text) from public, anon;
revoke all on function public.record_investment_income(uuid,uuid,numeric,text,date,text,text) from public, anon;
revoke all on function public.record_investment_valuation(uuid,numeric,date,text,text,text) from public, anon;
grant execute on function public.record_investment_opening_position(text,text,numeric,date,text,text,numeric,numeric,text,text,text) to authenticated;
grant execute on function public.record_investment_buy(uuid,uuid,numeric,numeric,numeric,date,jsonb,text,text) to authenticated;
grant execute on function public.record_investment_sell(uuid,uuid,numeric,numeric,numeric,date,jsonb,text,text) to authenticated;
grant execute on function public.record_investment_conversion(uuid,uuid,numeric,numeric,numeric,numeric,date,jsonb,text,text) to authenticated;
grant execute on function public.record_investment_income(uuid,uuid,numeric,text,date,text,text) to authenticated;
grant execute on function public.record_investment_valuation(uuid,numeric,date,text,text,text) to authenticated;
