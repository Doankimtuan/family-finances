-- Prompt 09.1 lifecycle metadata. The v1 tables and RPCs remain compatible.
alter table public.investment_events drop constraint if exists investment_events_event_type_check;
alter table public.investment_events add constraint investment_events_event_type_check check (event_type in ('BUY','SELL','SUBSCRIBE','ALLOCATE','REDEEM','DISTRIBUTION','DIVIDEND','VALUATION_UPDATE','HISTORICAL_IMPORT','ADJUSTMENT'));
alter table public.investment_events add column if not exists requested_amount numeric(18,0) check (requested_amount is null or requested_amount >= 0);
alter table public.investment_events add column if not exists quantity_unit text check (quantity_unit is null or quantity_unit in ('LUONG','CHI','GRAM'));
alter table public.investment_events add column if not exists base_asset text;
alter table public.investment_events add column if not exists allocation_status text not null default 'COMPLETED' check (allocation_status in ('PENDING','COMPLETED'));
create index if not exists investment_events_pending_allocation_idx on public.investment_events(household_id, event_type, allocation_status) where allocation_status = 'PENDING';
