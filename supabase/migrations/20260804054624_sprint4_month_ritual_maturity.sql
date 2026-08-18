-- Implementation Planning Sprint 4 (Spec v2.1):
-- ST-E04-001 BR-08 PendingReview + 30-day auto-lock worker
-- ST-E04-002 Step 1 Category-Jar divergence gate support
-- ST-E04-003 BR-09 / BR-23 Quick Close eligibility + emergency reflection data

-- ---------------------------------------------------------------------------
-- Ritual statuses: pending_review (Spec PendingReview)
-- Ritual modes: quick_close (BR-23)
-- ---------------------------------------------------------------------------
alter table public.month_ritual_runs
  drop constraint if exists month_ritual_runs_status_check;

alter table public.month_ritual_runs
  add constraint month_ritual_runs_status_check
  check (status in (
    'draft',
    'previewed',
    'approved',
    'corrected',
    'pending_review'
  ));

alter table public.month_ritual_runs
  drop constraint if exists month_ritual_runs_mode_check;

alter table public.month_ritual_runs
  add constraint month_ritual_runs_mode_check
  check (mode in ('assisted', 'auto', 'manual', 'quick_close'));

alter table public.month_ritual_runs
  add column if not exists auto_locked_at timestamptz;

comment on column public.month_ritual_runs.auto_locked_at is
  'Set when BR-08 temporal worker transitions the run to pending_review.';

-- ---------------------------------------------------------------------------
-- Household Quick Close streak (BR-23)
-- ---------------------------------------------------------------------------
alter table public.households
  add column if not exists consecutive_completed_rituals integer not null default 0;

alter table public.households
  drop constraint if exists households_consecutive_rituals_nonneg;

alter table public.households
  add constraint households_consecutive_rituals_nonneg
  check (consecutive_completed_rituals >= 0);

comment on column public.households.consecutive_completed_rituals is
  'Consecutive Assisted ritual approvals; Quick Close unlocks at 6 (BR-23).';

-- Allow household month_close_mode to store quick_close once unlocked
do $$
begin
  if exists (
    select 1
    from information_schema.check_constraints
    where constraint_schema = 'public'
      and constraint_name like '%month_close_mode%'
  ) then
    -- Best-effort: drop known check names from onboard migrations
    alter table public.households drop constraint if exists households_month_close_mode_check;
  end if;
exception
  when undefined_object then null;
end $$;

alter table public.households
  drop constraint if exists households_month_close_mode_check;

alter table public.households
  add constraint households_month_close_mode_check
  check (month_close_mode in ('assisted', 'auto', 'manual', 'quick_close'));

-- ---------------------------------------------------------------------------
-- BR-08: approved OR pending_review locks plan mutations
-- ---------------------------------------------------------------------------
create or replace function public.is_month_ritual_locked(
  p_household_id uuid,
  p_period_month date default date_trunc('month', timezone('utc', now()))::date
)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.month_ritual_runs r
    where r.household_id = p_household_id
      and r.period_month = date_trunc('month', p_period_month)::date
      and r.status in ('approved', 'pending_review')
  );
$$;

revoke all on function public.is_month_ritual_locked(uuid, date) from public;
grant execute on function public.is_month_ritual_locked(uuid, date) to authenticated;

-- ---------------------------------------------------------------------------
-- Ensure Miscellaneous fallback jar exists (seeded name: General)
-- ---------------------------------------------------------------------------
create or replace function public.ensure_miscellaneous_jar(p_household_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_jar_id uuid;
begin
  if not public.is_household_member(p_household_id) then
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
-- Auto-resolve stale UnmappedExpense → Miscellaneous (General) jar for a period
-- ---------------------------------------------------------------------------
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
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_household_member(p_household_id) then
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

-- ---------------------------------------------------------------------------
-- ST-E04-001: 30-day temporal auto-lock worker (household-scoped, BR-08)
-- Eligible: draft | previewed | corrected with month_end + 30d <= today UTC
-- ---------------------------------------------------------------------------
create or replace function public.run_month_ritual_autolock_worker()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_household_id uuid;
  v_today date;
  v_locked integer := 0;
  v_resolved integer := 0;
  v_period record;
  v_run_id uuid;
  v_batch integer;
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

  v_today := (timezone('utc', now()))::date;

  -- Existing unapproved runs past deadline
  for v_period in
    select r.id, r.period_month
    from public.month_ritual_runs r
    where r.household_id = v_household_id
      and r.status in ('draft', 'previewed', 'corrected')
      and (
        (r.period_month + interval '1 month' - interval '1 day')::date + 30
      ) <= v_today
  loop
    v_batch := public.autolock_resolve_unmapped_for_period(
      v_household_id,
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

  -- Past calendar months with pending unmapped spend and no run row yet
  for v_period in
    select gs::date as period_month
    from generate_series(
      date_trunc('month', v_today) - interval '24 months',
      date_trunc('month', v_today) - interval '1 month',
      interval '1 month'
    ) as gs
    where (
      (gs::date + interval '1 month' - interval '1 day')::date + 30
    ) <= v_today
      and not exists (
        select 1
        from public.month_ritual_runs r
        where r.household_id = v_household_id
          and r.period_month = gs::date
      )
      and exists (
        select 1
        from public.inbox_items i
        join public.transactions t
          on t.id = i.source_id
         and t.household_id = i.household_id
        where i.household_id = v_household_id
          and i.status = 'pending'
          and i.kind = 'unmapped_expense'
          and i.source_type = 'transaction'
          and t.transaction_date >= gs::date
          and t.transaction_date < (gs::date + interval '1 month')::date
      )
  loop
    v_batch := public.autolock_resolve_unmapped_for_period(
      v_household_id,
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
      v_household_id,
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

  -- Auto-lock breaks Assisted consecutive streak (not a completed assisted ritual)
  if v_locked > 0 then
    update public.households h
    set consecutive_completed_rituals = 0
    where h.id = v_household_id
      and h.consecutive_completed_rituals > 0;
  end if;

  return jsonb_build_object(
    'household_id', v_household_id,
    'locked_count', v_locked,
    'unmapped_resolved_count', v_resolved
  );
end;
$$;

revoke all on function public.run_month_ritual_autolock_worker() from public;
grant execute on function public.run_month_ritual_autolock_worker() to authenticated;
