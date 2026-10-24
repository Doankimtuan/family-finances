do $$
begin
  if to_regclass('cron.job') is not null
    and to_regclass('vault.decrypted_secrets') is not null
    and (
      select count(distinct name) from vault.decrypted_secrets
      where name in ('market_sync_app_url', 'market_catalog_sync_secret')
    ) = 2
  then
    if not exists (
      select 1 from cron.job where jobname = 'market_catalog_sync_daily'
    ) then
      perform cron.schedule(
        'market_catalog_sync_daily',
        '0 3 * * *',
        $job$select net.http_post(
          url := (select decrypted_secret from vault.decrypted_secrets where name = 'market_sync_app_url') || '/api/admin/market-catalog-sync',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'market_catalog_sync_secret')
          ),
          body := '{}'::jsonb
        )$job$
      );
    end if;
  else
    raise notice 'Market catalog cron skipped; configure pg_cron, Vault, and both catalog sync secrets first';
  end if;
exception when others then
  raise notice 'Market catalog cron unavailable; scheduled catalog refresh remains disabled';
end;
$$;
