-- Sprint 4 + 5 verification board required fixes:
-- S4-B1: service-safe autolock for all households + daily cron (01:00 UTC)
-- S4-B2: lock past due months without requiring unmapped inbox items
-- S4-B4: emergencies_acknowledged_at for mandatory ritual reflection
-- S5-B2: installment_plans.due_day for calendar projection

-- ---------------------------------------------------------------------------
-- Ritual emergency acknowledgment (REQ-RIT-02)
-- ---------------------------------------------------------------------------
alter table public.month_ritual_runs
  add column if not exists emergencies_acknowledged_at timestamptz;

comment on column public.month_ritual_runs.emergencies_acknowledged_at is
  'Set when household acknowledges Step 3 emergency reflection before approve.';

-- ---------------------------------------------------------------------------
-- Installment due day (BR-20 / calendar dates)
-- ---------------------------------------------------------------------------
alter table public.installment_plans
  add column if not exists due_day integer not null default 1;

alter table public.installment_plans
  drop constraint if exists installment_plans_due_day_range;

alter table public.installment_plans
  add constraint installment_plans_due_day_range
  check (due_day >= 1 and due_day <= 31);

comment on column public.installment_plans.due_day is
  'Day-of-month for remaining EMI payments on the Household Calendar.';

-- Allow BR-15 resolve during cron (auth.uid may be null)
create or replace function public.autolock_resolve_unmapped_for_period(
  p_household_id uuid,
  p_period_month date
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_jar_id uuid;
  v_period_start date;
  v_period_end date;
  v_count integer := 0;
  v_item record;
begin
  v_user_id := auth.uid();
  -- Membership required only for interactive callers
  if v_user_id is not null and not public.is_household_member(p_household_id) then
    raise exception 'Forbidden';
  end if;

  v_period_start := date_trunc('month', p_period_month)::date;
  v_period_end := (v_period_start + interval '1 month')::date;
  v_jar_id := public.ensure_miscellaneous_jar(p_household_id);

  for v_item in
    select i.id as inbox_item_id, i.source_id
    from public.inbox_items i
    join public.transactions t
      on t.id = i.source_id
     and t.household_id = i.household_id
    where i.household_id = p_household_id
      and i.status = 'pending'
      and i.kind = 'unmapped_expense'
      and i.source_type = 'transaction'
      and t.transaction_date >= v_period_start
      and t.transaction_date < v_period_end
    for update of i
  loop
    update public.transactions t
    set jar_id = v_jar_id,
        updated_at = now()
    where t.id = v_item.source_id
      and t.household_id = p_household_id;

    update public.inbox_items i
    set status = 'auto_resolved',
        auto_resolved = true,
        resolved_jar_id = v_jar_id,
        resolved_by = v_user_id,
        resolved_at = now(),
        updated_at = now(),
        context_json = coalesce(i.context_json, '{}'::jsonb)
          || jsonb_build_object(
            'auto_resolved_by', 'MonthRitualAutolockWorker',
            'miscellaneous_jar_id', v_jar_id,
            'period_month', v_period_start
          )
    where i.id = v_item.inbox_item_id;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.autolock_resolve_unmapped_for_period(uuid, date) from public;
grant execute on function public.autolock_resolve_unmapped_for_period(uuid, date) to authenticated;

-- ensure_miscellaneous_jar also needs cron-safe path
create or replace function public.ensure_miscellaneous_jar(p_household_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_jar_id uuid;
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is not null and not public.is_household_member(p_household_id) then
    raise exception 'Forbidden';
  end if;

  select j.id into v_jar_id
  from public.jars j
  where j.household_id = p_household_id
    and lower(j.name) = 'general'
    and j.is_archived = false
  order by j.sort_order asc, j.created_at asc
  limit 1;

  if v_jar_id is not null then
    return v_jar_id;
  end if;

  insert into public.jars (household_id, name, kind, sort_order, is_archived, is_paused)
  values (p_household_id, 'General', 'spending', 0, false, false)
  returning id into v_jar_id;

  insert into public.jar_plans (household_id, jar_id, plan_kind, percent_bps, fixed_amount)
  select p_household_id, v_jar_id, 'percent', 0, 0
  where not exists (
    select 1 from public.jar_plans jp where jp.jar_id = v_jar_id
  );

  return v_jar_id;
end;
$$;

revoke all on function public.ensure_miscellaneous_jar(uuid) from public;
grant execute on function public.ensure_miscellaneous_jar(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Autolock one household (shared body for user + cron workers)
-- ---------------------------------------------------------------------------
create or replace function public.run_month_ritual_autolock_for_household(
  p_household_id uuid,
  p_today date default (timezone('utc', now()))::date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_locked integer := 0;
  v_resolved integer := 0;
  v_period record;
  v_run_id uuid;
  v_batch integer;
begin
  -- Existing unapproved runs past deadline
  for v_period in
    select r.id, r.period_month
    from public.month_ritual_runs r
    where r.household_id = p_household_id
      and r.status in ('draft', 'previewed', 'corrected')
      and (
        (r.period_month + interval '1 month' - interval '1 day')::date + 30
      ) <= p_today
  loop
    v_batch := public.autolock_resolve_unmapped_for_period(
      p_household_id,
      v_period.period_month
    );
    v_resolved := v_resolved + v_batch;

    update public.month_ritual_runs r
    set status = 'pending_review',
        auto_locked_at = timezone('utc', now()),
        updated_at = timezone('utc', now())
    where r.id = v_period.id;

    v_locked := v_locked + 1;
  end loop;

  -- Past calendar months due for lock with no ritual row yet (BR-08)
  for v_period in
    select gs::date as period_month
    from generate_series(
      date_trunc('month', p_today) - interval '24 months',
      date_trunc('month', p_today) - interval '1 month',
      interval '1 month'
    ) as gs
    where (
      (gs::date + interval '1 month' - interval '1 day')::date + 30
    ) <= p_today
      and not exists (
        select 1
        from public.month_ritual_runs r
        where r.household_id = p_household_id
          and r.period_month = gs::date
      )
  loop
    v_batch := public.autolock_resolve_unmapped_for_period(
      p_household_id,
      v_period.period_month
    );
    v_resolved := v_resolved + v_batch;

    insert into public.month_ritual_runs (
      household_id,
      period_month,
      status,
      mode,
      preview_json,
      auto_locked_at
    ) values (
      p_household_id,
      v_period.period_month,
      'pending_review',
      'assisted',
      jsonb_build_object(
        'periodMonth', to_char(v_period.period_month, 'YYYY-MM-DD'),
        'autoLocked', true
      ),
      timezone('utc', now())
    )
    returning id into v_run_id;

    v_locked := v_locked + 1;
  end loop;

  if v_locked > 0 then
    update public.households h
    set consecutive_completed_rituals = 0
    where h.id = p_household_id
      and h.consecutive_completed_rituals > 0;
  end if;

  return jsonb_build_object(
    'household_id', p_household_id,
    'locked_count', v_locked,
    'unmapped_resolved_count', v_resolved
  );
end;
$$;

revoke all on function public.run_month_ritual_autolock_for_household(uuid, date) from public;
grant execute on function public.run_month_ritual_autolock_for_household(uuid, date) to authenticated;

-- User-scoped page-open fallback (auth required)
create or replace function public.run_month_ritual_autolock_worker()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_household_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id
  order by hm.created_at asc
  limit 1;

  if v_household_id is null then
    raise exception 'No household membership';
  end if;

  if not public.is_household_member(v_household_id) then
    raise exception 'Forbidden';
  end if;

  return public.run_month_ritual_autolock_for_household(v_household_id);
end;
$$;

revoke all on function public.run_month_ritual_autolock_worker() from public;
grant execute on function public.run_month_ritual_autolock_worker() to authenticated;

-- Cron / service-safe: all households (no auth.uid)
create or replace function public.run_month_ritual_autolock_worker_all()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household record;
  v_batch jsonb;
  v_locked integer := 0;
  v_resolved integer := 0;
  v_households integer := 0;
begin
  for v_household in
    select h.id
    from public.households h
  loop
    v_households := v_households + 1;
    v_batch := public.run_month_ritual_autolock_for_household(v_household.id);
    v_locked := v_locked + coalesce((v_batch->>'locked_count')::integer, 0);
    v_resolved := v_resolved + coalesce((v_batch->>'unmapped_resolved_count')::integer, 0);
  end loop;

  return jsonb_build_object(
    'households_scanned', v_households,
    'locked_count', v_locked,
    'unmapped_resolved_count', v_resolved
  );
end;
$$;

revoke all on function public.run_month_ritual_autolock_worker_all() from public;

-- ---------------------------------------------------------------------------
-- BR-11: enrich installment completion ReviewItem context
-- ---------------------------------------------------------------------------
create or replace function public.record_installment_payment(p_plan_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_row public.installment_plans%rowtype;
  v_paid int;
  v_item_id uuid;
  v_completed boolean := false;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select * into v_row
  from public.installment_plans p
  where p.id = p_plan_id
  for update;

  if not found then
    raise exception 'Installment plan not found';
  end if;

  if not public.is_household_member(v_row.household_id) then
    raise exception 'Not a household member';
  end if;

  if v_row.status = 'completed' then
    raise exception 'Installment already completed';
  end if;

  v_paid := v_row.paid_installments + 1;
  v_completed := v_paid >= v_row.num_installments;

  update public.installment_plans p
  set
    paid_installments = v_paid,
    status = case when v_completed then 'completed' else 'active' end,
    updated_at = timezone('utc', now())
  where p.id = p_plan_id;

  if v_completed then
    insert into public.inbox_items (
      household_id,
      kind,
      status,
      source_type,
      source_id,
      amount,
      currency,
      title,
      context_json
    )
    values (
      v_row.household_id,
      'emi_complete',
      'pending',
      'guided',
      p_plan_id,
      v_row.installment_amount,
      v_row.currency,
      v_row.name,
      jsonb_build_object(
        'flow', 'emi_complete',
        'review_item_type', 'InstallmentComplete',
        'num_installments', v_row.num_installments,
        'paid_installments', v_paid
      )
    )
    on conflict (household_id, source_type, source_id) do update
      set
        status = 'pending',
        updated_at = timezone('utc', now()),
        title = excluded.title,
        context_json = excluded.context_json
    returning id into v_item_id;

    if v_item_id is null then
      select i.id into v_item_id
      from public.inbox_items i
      where i.household_id = v_row.household_id
        and i.source_type = 'guided'
        and i.source_id = p_plan_id;
    end if;
  end if;

  return jsonb_build_object(
    'ok', true,
    'paidInstallments', v_paid,
    'completed', v_completed,
    'inboxItemId', v_item_id
  );
end;
$$;

revoke all on function public.record_installment_payment(uuid) from public;
grant execute on function public.record_installment_payment(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Daily 01:00 UTC autolock (Tech Spec §2.1) when pg_cron is available
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from pg_extension where extname = 'pg_cron'
  ) or exists (
    select 1 from pg_available_extensions where name = 'pg_cron'
  ) then
    begin
      create extension if not exists pg_cron with schema extensions;
    exception
      when others then
        raise notice 'pg_cron extension unavailable: %', sqlerrm;
    end;
  end if;

  if to_regnamespace('cron') is not null then
    if exists (
      select 1 from cron.job where jobname = 'month_ritual_autolock_daily'
    ) then
      perform cron.unschedule(
        (select jobid from cron.job where jobname = 'month_ritual_autolock_daily' limit 1)
      );
    end if;
    perform cron.schedule(
      'month_ritual_autolock_daily',
      '0 1 * * *',
      $cron$select public.run_month_ritual_autolock_worker_all()$cron$
    );
  else
    raise notice 'cron schema missing; month ritual autolock cron not scheduled';
  end if;
exception
  when others then
    raise notice 'Skipping autolock cron schedule: %', sqlerrm;
end $$;;
