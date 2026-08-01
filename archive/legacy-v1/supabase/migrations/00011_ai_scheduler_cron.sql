-- ============================================================================
-- 00011_ai_scheduler_cron.sql
-- Supabase-first scheduler setup for cyclical AI insight generation.
-- ============================================================================

-- --------------------------------------------------------------------------
-- Optional extensions required for DB-scheduled HTTP invocation.
-- --------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron with schema extensions;
  else
    raise notice 'pg_cron extension is not available; AI cron jobs were not created.';
  end if;

  if exists (select 1 from pg_available_extensions where name = 'pg_net') then
    create extension if not exists pg_net with schema extensions;
  else
    raise notice 'pg_net extension is not available; AI cron jobs were not created.';
  end if;
end
$$;

-- --------------------------------------------------------------------------
-- Scheduler configuration singleton
-- --------------------------------------------------------------------------

create table if not exists public.ai_scheduler_config (
  id boolean primary key default true,
  edge_function_url text not null,
  worker_secret text not null,
  is_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_scheduler_config_singleton check (id = true),
  constraint ai_scheduler_config_url_not_blank check (length(trim(edge_function_url)) > 0),
  constraint ai_scheduler_config_secret_not_blank check (length(trim(worker_secret)) > 0)
);

comment on table public.ai_scheduler_config is 'Singleton config used by pg_cron to call the AI edge scheduler securely.';

drop trigger if exists trg_ai_scheduler_config_set_updated_at on public.ai_scheduler_config;
create trigger trg_ai_scheduler_config_set_updated_at
before update on public.ai_scheduler_config
for each row execute function public.set_updated_at();

-- Only service/admin should access scheduler secrets.
alter table public.ai_scheduler_config enable row level security;

drop policy if exists ai_scheduler_config_service_all on public.ai_scheduler_config;
create policy ai_scheduler_config_service_all
on public.ai_scheduler_config
for all
using (coalesce(auth.role(), '') in ('service_role', 'supabase_admin'))
with check (coalesce(auth.role(), '') in ('service_role', 'supabase_admin'));

insert into public.ai_scheduler_config (id, edge_function_url, worker_secret, is_enabled)
values (true, 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/ai-cycle-dispatch', 'SET_AI_WORKER_SECRET', false)
on conflict (id) do nothing;

-- --------------------------------------------------------------------------
-- DB function invoked by pg_cron jobs
-- --------------------------------------------------------------------------

create or replace function public.invoke_ai_cycle(p_function_type text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_config record;
  v_request_id bigint;
begin
  if p_function_type not in ('monthly_review', 'goal_risk_coach', 'spending_anomaly_explainer') then
    raise exception 'Invalid function type: %', p_function_type;
  end if;

  if to_regnamespace('net') is null then
    raise notice 'net schema missing; skipping invoke_ai_cycle';
    return;
  end if;

  select edge_function_url, worker_secret, is_enabled
  into v_config
  from public.ai_scheduler_config
  where id = true
  limit 1;

  if not found then
    raise notice 'ai_scheduler_config missing; skipping invoke_ai_cycle';
    return;
  end if;

  if v_config.is_enabled is distinct from true then
    raise notice 'AI scheduler disabled; skipping invoke_ai_cycle for %', p_function_type;
    return;
  end if;

  select net.http_post(
    url := v_config.edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_config.worker_secret
    ),
    body := jsonb_build_object(
      'functionType', p_function_type,
      'triggerSource', 'pg_cron'
    )
  )
  into v_request_id;

  raise notice 'invoke_ai_cycle request queued, id=%', v_request_id;
end;
$$;

grant execute on function public.invoke_ai_cycle(text) to service_role;

-- --------------------------------------------------------------------------
-- Cron jobs (Vietnam local schedule converted to UTC)
-- --------------------------------------------------------------------------
-- VN (Asia/Ho_Chi_Minh, UTC+7):
-- 1) Monthly review: 08:00 day 1 => 01:00 UTC day 1
-- 2) Weekly goal coach: Monday 08:00 => Monday 01:00 UTC
-- 3) Weekly anomaly: Wednesday 20:00 => Wednesday 13:00 UTC


do $$
declare
  v_job record;
begin
  if to_regnamespace('cron') is null then
    raise notice 'cron schema missing; skipping AI cron job creation';
    return;
  end if;

  for v_job in
    select jobid
    from cron.job
    where jobname in (
      'ai_monthly_review_v1',
      'ai_weekly_goal_risk_coach_v1',
      'ai_weekly_spending_anomaly_v1'
    )
  loop
    perform cron.unschedule(v_job.jobid);
  end loop;

  perform cron.schedule(
    'ai_monthly_review_v1',
    '0 1 1 * *',
    $cmd$select public.invoke_ai_cycle('monthly_review');$cmd$
  );

  perform cron.schedule(
    'ai_weekly_goal_risk_coach_v1',
    '0 1 * * 1',
    $cmd$select public.invoke_ai_cycle('goal_risk_coach');$cmd$
  );

  perform cron.schedule(
    'ai_weekly_spending_anomaly_v1',
    '0 13 * * 3',
    $cmd$select public.invoke_ai_cycle('spending_anomaly_explainer');$cmd$
  );
end;
$$;
