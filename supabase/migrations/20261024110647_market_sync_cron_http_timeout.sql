do $$
begin
  if to_regclass('cron.job') is not null
    and to_regclass('vault.decrypted_secrets') is not null
    and (
      select count(distinct name) from vault.decrypted_secrets
      where name in (
        'market_sync_app_url',
        'market_catalog_sync_secret',
        'market_price_sync_secret'
      )
    ) = 3
  then
    -- Catalog took 13 seconds; wait for provider syncs before pg_net records a timeout.
    if exists (select 1 from cron.job where jobname = 'market_catalog_sync_daily') then
      perform cron.alter_job(
        job_id := (select jobid from cron.job where jobname = 'market_catalog_sync_daily'),
        command := $job$select net.http_post(
          url := (select decrypted_secret from vault.decrypted_secrets where name = 'market_sync_app_url') || '/api/admin/market-catalog-sync',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'market_catalog_sync_secret')
          ),
          body := '{}'::jsonb,
          timeout_milliseconds := 30000
        )$job$
      );
    end if;
    if exists (select 1 from cron.job where jobname = 'market_price_sync_coingecko_daily') then
      perform cron.alter_job(
        job_id := (select jobid from cron.job where jobname = 'market_price_sync_coingecko_daily'),
        command := $job$select net.http_post(
          url := (select decrypted_secret from vault.decrypted_secrets where name = 'market_sync_app_url') || '/api/admin/market-price-sync',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'market_price_sync_secret')
          ),
          body := '{"provider":"COINGECKO"}'::jsonb,
          timeout_milliseconds := 30000
        )$job$
      );
    end if;
    if exists (select 1 from cron.job where jobname = 'market_price_sync_vnstock_weekdays') then
      perform cron.alter_job(
        job_id := (select jobid from cron.job where jobname = 'market_price_sync_vnstock_weekdays'),
        command := $job$select net.http_post(
          url := (select decrypted_secret from vault.decrypted_secrets where name = 'market_sync_app_url') || '/api/admin/market-price-sync',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'market_price_sync_secret')
          ),
          body := '{"provider":"VNSTOCK"}'::jsonb,
          timeout_milliseconds := 30000
        )$job$
      );
    end if;
    if exists (select 1 from cron.job where jobname = 'market_price_sync_fmarket_weekdays') then
      perform cron.alter_job(
        job_id := (select jobid from cron.job where jobname = 'market_price_sync_fmarket_weekdays'),
        command := $job$select net.http_post(
          url := (select decrypted_secret from vault.decrypted_secrets where name = 'market_sync_app_url') || '/api/admin/market-price-sync',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'market_price_sync_secret')
          ),
          body := '{"provider":"FMARKET"}'::jsonb,
          timeout_milliseconds := 30000
        )$job$
      );
    end if;
    if exists (select 1 from cron.job where jobname = 'market_price_sync_vang_today_daily') then
      perform cron.alter_job(
        job_id := (select jobid from cron.job where jobname = 'market_price_sync_vang_today_daily'),
        command := $job$select net.http_post(
          url := (select decrypted_secret from vault.decrypted_secrets where name = 'market_sync_app_url') || '/api/admin/market-price-sync',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'market_price_sync_secret')
          ),
          body := '{"provider":"VANG_TODAY"}'::jsonb,
          timeout_milliseconds := 30000
        )$job$
      );
    end if;
  else
    raise notice 'Market sync cron timeout update skipped; configure pg_cron, Vault, and all market sync secrets first';
  end if;
exception when others then
  raise notice 'Market sync cron timeout update unavailable';
end;
$$;
