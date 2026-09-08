-- Add the free Vang.today gold source without modifying the frozen V1 baseline.
alter table public.market_instrument_prices
  drop constraint market_instrument_prices_provider_check;
alter table public.market_instrument_prices
  add constraint market_instrument_prices_provider_check
  check (provider = any (array['MANUAL', 'COINGECKO', 'VNSTOCK', 'FMARKET', 'VANG_TODAY']));

alter table public.market_instrument_sources
  drop constraint market_instrument_sources_provider_check;
alter table public.market_instrument_sources
  add constraint market_instrument_sources_provider_check
  check (provider = any (array['MANUAL', 'COINGECKO', 'VNSTOCK', 'FMARKET', 'VANG_TODAY']));

alter table public.market_sync_runs
  drop constraint market_sync_runs_provider_check;
alter table public.market_sync_runs
  add constraint market_sync_runs_provider_check
  check (provider = any (array['COINGECKO', 'VNSTOCK', 'FMARKET', 'VANG_TODAY']));

-- Create these Vault secrets before applying this migration:
-- select vault.create_secret('https://your-app.example.com', 'market_sync_app_url');
-- select vault.create_secret('your-market-price-sync-secret', 'market_price_sync_secret');
do $$
begin
  if to_regclass('cron.job') is not null
    and to_regclass('vault.decrypted_secrets') is not null
    and exists (
      select 1 from vault.decrypted_secrets
      where name in ('market_sync_app_url', 'market_price_sync_secret')
      group by name
      having count(*) = 2
    )
  then
    if not exists (select 1 from cron.job where jobname = 'market_price_sync_coingecko_daily') then
      perform cron.schedule(
        'market_price_sync_coingecko_daily',
        '0 4 * * *',
        $job$select net.http_post(
          url := (select decrypted_secret from vault.decrypted_secrets where name = 'market_sync_app_url') || '/api/admin/market-price-sync',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'market_price_sync_secret')
          ),
          body := '{"provider":"COINGECKO"}'::jsonb
        )$job$
      );
    end if;
    if not exists (select 1 from cron.job where jobname = 'market_price_sync_vnstock_weekdays') then
      perform cron.schedule(
        'market_price_sync_vnstock_weekdays',
        '30 8 * * 1-5',
        $job$select net.http_post(
          url := (select decrypted_secret from vault.decrypted_secrets where name = 'market_sync_app_url') || '/api/admin/market-price-sync',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'market_price_sync_secret')
          ),
          body := '{"provider":"VNSTOCK"}'::jsonb
        )$job$
      );
    end if;
    if not exists (select 1 from cron.job where jobname = 'market_price_sync_fmarket_weekdays') then
      perform cron.schedule(
        'market_price_sync_fmarket_weekdays',
        '0 11 * * 1-5',
        $job$select net.http_post(
          url := (select decrypted_secret from vault.decrypted_secrets where name = 'market_sync_app_url') || '/api/admin/market-price-sync',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'market_price_sync_secret')
          ),
          body := '{"provider":"FMARKET"}'::jsonb
        )$job$
      );
    end if;
    if not exists (select 1 from cron.job where jobname = 'market_price_sync_vang_today_daily') then
      perform cron.schedule(
        'market_price_sync_vang_today_daily',
        '0 12 * * *',
        $job$select net.http_post(
          url := (select decrypted_secret from vault.decrypted_secrets where name = 'market_sync_app_url') || '/api/admin/market-price-sync',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'market_price_sync_secret')
          ),
          body := '{"provider":"VANG_TODAY"}'::jsonb
        )$job$
      );
    end if;
  else
    raise notice 'Market price cron skipped; configure pg_cron, Vault, and both market sync secrets first';
  end if;
exception when others then
  raise notice 'Market price cron unavailable; scheduled price refresh remains disabled';
end;
$$;
;
