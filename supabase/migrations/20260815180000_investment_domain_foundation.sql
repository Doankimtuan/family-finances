-- Additive domain foundation. Existing v1 tables and RPCs stay compatible.
create table public.investment_providers (
 id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id) on delete cascade,
 name text not null check (length(trim(name)) between 1 and 160), supported_archetypes text[] not null default '{}',
 default_accounting_methods jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(household_id,name)
);
create table public.investment_instruments (
 id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id) on delete cascade,
 archetype text not null check (archetype in ('SECURITY','FUND','CRYPTO','GOLD','MANUAL_ASSET')), name text not null check (length(trim(name)) between 1 and 200),
 symbol text, quote_asset text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(household_id,archetype,name)
);
create table public.investment_accounts (
 id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id) on delete cascade,
 provider_id uuid not null references public.investment_providers(id) on delete restrict, name text not null check (length(trim(name)) between 1 and 160),
 account_kind text not null check (account_kind in ('BROKERAGE','FUND_PLATFORM','SPOT_WALLET','PERSONAL_CUSTODY','OTHER')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(household_id,provider_id,name)
);
alter table public.investment_holdings
 add column if not exists asset_type text,
 add column if not exists provider_id uuid references public.investment_providers(id) on delete restrict,
 add column if not exists instrument_id uuid references public.investment_instruments(id) on delete restrict,
 add column if not exists investment_account_id uuid references public.investment_accounts(id) on delete restrict,
 add column if not exists accounting_method text,
 add column if not exists data_quality text,
 add column if not exists valuation_source text,
 add column if not exists type_metadata jsonb not null default '{}'::jsonb;
alter table public.investment_holdings add constraint investment_holdings_asset_type_check check (asset_type is null or asset_type in ('SECURITY','FUND','CRYPTO','GOLD','MANUAL_ASSET'));
alter table public.investment_holdings add constraint investment_holdings_accounting_method_check check (accounting_method is null or accounting_method in ('WEIGHTED_AVERAGE','FIFO'));
alter table public.investment_holdings add constraint investment_holdings_data_quality_check check (data_quality is null or data_quality in ('COMPLETE','IMPORTED_AGGREGATE','BASIS_UNKNOWN'));
alter table public.investment_holdings add constraint investment_holdings_valuation_source_check check (valuation_source is null or valuation_source in ('MANUAL','PROVIDER','MARKET_FEED'));
update public.investment_holdings h set
 asset_type=case h.asset_class when 'crypto' then 'CRYPTO' when 'fund' then 'FUND' when 'gold' then 'GOLD' when 'stock' then 'SECURITY' when 'bond' then 'SECURITY' else 'MANUAL_ASSET' end,
 accounting_method=case when h.asset_class='fund' then 'FIFO' else 'WEIGHTED_AVERAGE' end,
 data_quality=case h.history_status when 'full' then 'COMPLETE' when 'opening_position' then 'IMPORTED_AGGREGATE' else 'BASIS_UNKNOWN' end,
 valuation_source=case when exists(select 1 from public.investment_valuations v where v.holding_id=h.id) then 'MANUAL' else null end
where h.asset_type is null;
insert into public.investment_providers(household_id,name,supported_archetypes)
select distinct h.household_id,h.provider_custodian,array[h.asset_type]::text[]
from public.investment_holdings h
where h.provider_custodian is not null
on conflict(household_id,name) do update set supported_archetypes=(select array_agg(distinct x) from unnest(public.investment_providers.supported_archetypes || excluded.supported_archetypes) x);
insert into public.investment_instruments(household_id,archetype,name,symbol,metadata)
select h.household_id,h.asset_type,h.name,h.symbol,jsonb_build_object('legacyHoldingId',h.id)
from public.investment_holdings h
where h.asset_type is not null
on conflict(household_id,archetype,name) do nothing;
update public.investment_holdings h set provider_id=p.id
from public.investment_providers p where h.provider_id is null and h.provider_custodian=p.name and h.household_id=p.household_id;
update public.investment_holdings h set instrument_id=i.id
from public.investment_instruments i where h.instrument_id is null and h.asset_type=i.archetype and h.name=i.name and h.household_id=i.household_id;
create table public.investment_events (
 id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id) on delete cascade,
 position_id uuid not null references public.investment_holdings(id) on delete restrict, provider_id uuid references public.investment_providers(id) on delete restrict,
 instrument_id uuid references public.investment_instruments(id) on delete restrict, investment_account_id uuid references public.investment_accounts(id) on delete restrict,
 event_type text not null check (event_type in ('BUY','SELL','SUBSCRIBE','REDEEM','DISTRIBUTION','VALUATION_UPDATE','ADJUSTMENT')),
 executed_quantity numeric(38,18) check (executed_quantity is null or executed_quantity>0), unit_price numeric(24,8) check (unit_price is null or unit_price>=0), nav_per_unit numeric(24,8) check (nav_per_unit is null or nav_per_unit>=0),
 gross_amount numeric(18,0) check (gross_amount is null or gross_amount>=0), fee_amount numeric(18,0) check (fee_amount is null or fee_amount>=0), fee_currency text, tax_amount numeric(18,0) check (tax_amount is null or tax_amount>=0),
 disposed_cost_basis numeric(18,0) check (disposed_cost_basis is null or disposed_cost_basis>=0), realized_pnl numeric(18,0), source_cash_account_id uuid references public.accounts(id) on delete restrict, destination_cash_account_id uuid references public.accounts(id) on delete restrict,
 quote_asset text, effective_at timestamptz not null, notes text check (notes is null or length(notes)<=500), snapshot jsonb not null default '{}'::jsonb, created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);
create table public.investment_lots (
 id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households(id) on delete cascade,
 position_id uuid not null references public.investment_holdings(id) on delete restrict, source_event_id uuid references public.investment_events(id) on delete restrict,
 acquired_at timestamptz not null, original_quantity numeric(38,18) not null check(original_quantity>0), remaining_quantity numeric(38,18) not null check(remaining_quantity>=0 and remaining_quantity<=original_quantity), unit_cost numeric(24,8) not null check(unit_cost>=0), total_cost numeric(18,0) not null check(total_cost>=0), created_at timestamptz not null default now()
);
create index investment_providers_household_idx on public.investment_providers(household_id,name);
create index investment_instruments_household_idx on public.investment_instruments(household_id,archetype,name);
create index investment_accounts_household_idx on public.investment_accounts(household_id,provider_id,name);
create index investment_holdings_domain_idx on public.investment_holdings(household_id,asset_type,provider_id,instrument_id);
create index investment_events_position_date_idx on public.investment_events(household_id,position_id,effective_at desc);
create index investment_lots_position_date_idx on public.investment_lots(household_id,position_id,acquired_at,id);
alter table public.investment_providers enable row level security;
alter table public.investment_instruments enable row level security;
alter table public.investment_accounts enable row level security;
alter table public.investment_events enable row level security;
alter table public.investment_lots enable row level security;
create policy investment_providers_select on public.investment_providers for select to authenticated using(public.is_household_member(household_id));
create policy investment_instruments_select on public.investment_instruments for select to authenticated using(public.is_household_member(household_id));
create policy investment_accounts_select on public.investment_accounts for select to authenticated using(public.is_household_member(household_id));
create policy investment_events_select on public.investment_events for select to authenticated using(public.is_household_member(household_id));
create policy investment_lots_select on public.investment_lots for select to authenticated using(public.is_household_member(household_id));
revoke all on public.investment_providers,public.investment_instruments,public.investment_accounts,public.investment_events,public.investment_lots from anon,authenticated;
grant select on public.investment_providers,public.investment_instruments,public.investment_accounts,public.investment_events,public.investment_lots to authenticated;
