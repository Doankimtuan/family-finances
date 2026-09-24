-- Keep these allowed values aligned with EXPENSE_REMINDER_TIME_VALUES.
create table public.daily_expense_reminder_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  reminder_time time not null default time '20:00',
  constraint daily_expense_reminder_preferences_time_check check (
    reminder_time = any (array[
      time '18:00', time '18:30', time '19:00', time '19:30',
      time '20:00', time '20:30', time '21:00', time '21:30',
      time '22:00', time '22:30'
    ])
  )
);

create table public.daily_expense_reminder_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_secret text not null,
  last_sent_on date
);

create index daily_expense_reminder_subscriptions_user_id_idx
  on public.daily_expense_reminder_subscriptions(user_id);

alter table public.daily_expense_reminder_preferences enable row level security;
alter table public.daily_expense_reminder_subscriptions enable row level security;

revoke all on public.daily_expense_reminder_preferences from public, anon, authenticated;
revoke all on public.daily_expense_reminder_subscriptions from public, anon, authenticated;
grant select, insert, update, delete on public.daily_expense_reminder_preferences to authenticated;
grant select, insert, update, delete on public.daily_expense_reminder_subscriptions to authenticated;
grant all on public.daily_expense_reminder_preferences to service_role;
grant all on public.daily_expense_reminder_subscriptions to service_role;

create policy daily_expense_reminder_preferences_owner_all
  on public.daily_expense_reminder_preferences
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy daily_expense_reminder_subscriptions_owner_all
  on public.daily_expense_reminder_subscriptions
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Create these Vault secrets before applying this migration:
-- Their names and the cron job name match EXPENSE_REMINDER_CRON constants.
-- select vault.create_secret('https://your-app.example.com', 'daily_expense_reminder_app_url');
-- select vault.create_secret('the-same-value-as-DAILY_EXPENSE_REMINDER_CRON_SECRET', 'daily_expense_reminder_cron_secret');
do $$
begin
  if to_regclass('cron.job') is not null
    and to_regclass('vault.decrypted_secrets') is not null
    and exists (
      select 1 from vault.decrypted_secrets
      where name in ('daily_expense_reminder_app_url', 'daily_expense_reminder_cron_secret')
      group by name
      having count(*) = 2
    )
  then
    if not exists (
      select 1 from cron.job
      where jobname = 'daily_expense_reminder_dispatch'
    ) then
      -- Keep aligned with EXPENSE_REMINDER_CRON.SCHEDULE_UTC.
      -- URL suffix matches APP_API_PATH.EXPENSE_REMINDER_DISPATCH.
      perform cron.schedule(
        'daily_expense_reminder_dispatch',
        '0,30 11-15 * * *',
        $job$select net.http_post(
          url := (select decrypted_secret from vault.decrypted_secrets where name = 'daily_expense_reminder_app_url') || '/api/admin/daily-expense-reminder',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'daily_expense_reminder_cron_secret')
          ),
          body := '{}'::jsonb
        )$job$
      );
    end if;
  else
    raise notice 'Daily expense reminder cron skipped; configure pg_cron, Vault, and both reminder secrets before applying this migration';
  end if;
exception when others then
  raise notice 'Daily expense reminder cron unavailable; scheduled reminders remain disabled';
end;
$$;
