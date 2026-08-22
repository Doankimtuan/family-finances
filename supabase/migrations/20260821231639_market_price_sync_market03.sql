-- MARKET 03: current prices for distinct active holdings only.
-- No price history, valuation snapshots, accounting, or holding mutation.

alter table public.market_instrument_prices enable row level security;
revoke all on table public.market_instrument_prices from anon, authenticated;
grant select on table public.market_instrument_prices to authenticated;
grant select, insert, update, delete on table public.market_instrument_prices to service_role;

alter table public.market_sync_runs
  add column if not exists sync_kind text not null default 'catalog',
  add column if not exists asset_class text,
  add column if not exists requested_count integer not null default 0,
  add column if not exists success_count integer not null default 0,
  add column if not exists status text not null default 'succeeded',
  add column if not exists run_key text,
  add column if not exists error_summary text;

alter table public.market_sync_runs
  add constraint market_sync_runs_sync_kind_check
  check (sync_kind in ('catalog', 'price'));
alter table public.market_sync_runs
  add constraint market_sync_runs_asset_class_check
  check (asset_class is null or asset_class in ('crypto', 'stock', 'fund', 'gold', 'bond'));
alter table public.market_sync_runs
  add constraint market_sync_runs_requested_count_check
  check (requested_count >= 0);
alter table public.market_sync_runs
  add constraint market_sync_runs_success_count_check
  check (success_count >= 0);
alter table public.market_sync_runs
  add constraint market_sync_runs_status_check
  check (status in ('running', 'succeeded', 'partial', 'failed', 'skipped'));

create table public.market_sync_locks (
  lock_key text primary key check (length(trim(lock_key)) between 1 and 120),
  owner_id uuid not null,
  acquired_at timestamptz not null,
  expires_at timestamptz not null
);

alter table public.market_sync_locks enable row level security;
revoke all on table public.market_sync_locks from anon, authenticated;
grant all on table public.market_sync_locks to service_role;

create or replace function public.try_acquire_market_price_sync_lock(
  p_lock_key text,
  p_owner_id uuid,
  p_expires_at timestamptz
)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  acquired boolean;
begin
  insert into public.market_sync_locks(lock_key, owner_id, acquired_at, expires_at)
  values (p_lock_key, p_owner_id, now(), p_expires_at)
  on conflict (lock_key) do update
    set owner_id = excluded.owner_id,
        acquired_at = excluded.acquired_at,
        expires_at = excluded.expires_at
    where public.market_sync_locks.expires_at <= now()
  returning true into acquired;
  return coalesce(acquired, false);
end;
$$;

create or replace function public.release_market_price_sync_lock(
  p_lock_key text,
  p_owner_id uuid
)
returns void
language sql
security invoker
set search_path = public
as $$
  delete from public.market_sync_locks
  where lock_key = p_lock_key and owner_id = p_owner_id;
$$;

revoke all on function public.try_acquire_market_price_sync_lock(text, uuid, timestamptz) from public;
revoke all on function public.release_market_price_sync_lock(text, uuid) from public;
grant execute on function public.try_acquire_market_price_sync_lock(text, uuid, timestamptz) to service_role;
grant execute on function public.release_market_price_sync_lock(text, uuid) to service_role;

create or replace function public.list_active_market_price_targets(
  p_asset_class text default null,
  p_provider text default null
)
returns table (
  instrument_id uuid,
  asset_class text,
  symbol text,
  currency text,
  pricing_mode text,
  provider text,
  provider_instrument_id text
)
language sql
security invoker
set search_path = public
as $$
  select distinct on (instrument.id)
    instrument.id,
    instrument.asset_class,
    instrument.symbol,
    instrument.currency,
    instrument.pricing_mode,
    source.provider,
    source.provider_instrument_id
  from public.investment_holdings holding
  join public.market_instruments instrument
    on instrument.id = holding.instrument_id
  join public.market_instrument_sources source
    on source.instrument_id = instrument.id
  where holding.lifecycle_status = 'active'
    and holding.instrument_id is not null
    and instrument.is_active = true
    and instrument.auto_price_supported = true
    and source.is_enabled = true
    and (p_asset_class is null or instrument.asset_class = p_asset_class)
    and (p_provider is null or source.provider = p_provider)
  order by instrument.id, source.priority asc, source.provider asc;
$$;

revoke all on function public.list_active_market_price_targets(text, text) from public;
grant execute on function public.list_active_market_price_targets(text, text) to service_role;

-- Supabase Cron evaluates schedules in UTC. These are explicit Asia/Ho_Chi_Minh
-- conversions: 11:00 -> 04:00 UTC, 15:30 -> 08:30 UTC, 18:00 -> 11:00 UTC.
do $$
begin
  begin
    create extension if not exists pg_cron with schema extensions;
  exception when others then
    raise notice 'pg_cron unavailable: %', sqlerrm;
  end;
  begin
    create extension if not exists pg_net with schema extensions;
  exception when others then
    raise notice 'pg_net unavailable: %', sqlerrm;
  end;

  if to_regnamespace('cron') is null
    or to_regnamespace('net') is null
    or to_regnamespace('vault') is null then
    raise notice 'Skipping MARKET 03 schedules: cron, net, or vault schema unavailable';
    return;
  end if;

  if (select count(*) from vault.decrypted_secrets
      where name in ('market_price_sync_app_url', 'market_price_sync_secret')) <> 2 then
    raise notice 'Skipping MARKET 03 schedules: Vault app URL and secret are not configured';
    return;
  end if;

  if exists (select 1 from cron.job where jobname = 'market_price_sync_crypto') then
    perform cron.unschedule((select jobid from cron.job where jobname = 'market_price_sync_crypto' limit 1));
  end if;
  if exists (select 1 from cron.job where jobname = 'market_price_sync_vnstock') then
    perform cron.unschedule((select jobid from cron.job where jobname = 'market_price_sync_vnstock' limit 1));
  end if;
  if exists (select 1 from cron.job where jobname = 'market_price_sync_fmarket') then
    perform cron.unschedule((select jobid from cron.job where jobname = 'market_price_sync_fmarket' limit 1));
  end if;

  perform cron.schedule(
    'market_price_sync_crypto',
    '0 4 * * *',
    $cron$
      select net.http_post(
        url := (select decrypted_secret from vault.decrypted_secrets where name = 'market_price_sync_app_url') || '/api/admin/market-price-sync',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'market_price_sync_secret')
        ),
        body := '{"assetClass":"crypto","provider":"COINGECKO"}'::jsonb,
        timeout_milliseconds := 10000
      )
    $cron$
  );
  perform cron.schedule(
    'market_price_sync_vnstock',
    '30 8 * * 1-5',
    $cron$
      select net.http_post(
        url := (select decrypted_secret from vault.decrypted_secrets where name = 'market_price_sync_app_url') || '/api/admin/market-price-sync',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'market_price_sync_secret')
        ),
        body := '{"provider":"VNSTOCK"}'::jsonb,
        timeout_milliseconds := 10000
      )
    $cron$
  );
  perform cron.schedule(
    'market_price_sync_fmarket',
    '0 11 * * 1-5',
    $cron$
      select net.http_post(
        url := (select decrypted_secret from vault.decrypted_secrets where name = 'market_price_sync_app_url') || '/api/admin/market-price-sync',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'market_price_sync_secret')
        ),
        body := '{"assetClass":"fund","provider":"FMARKET"}'::jsonb,
        timeout_milliseconds := 10000
      )
    $cron$
  );
exception when others then
  raise notice 'Skipping MARKET 03 schedules: %', sqlerrm;
end;
$$;
