-- ============================================================================
-- 00047_jar_reporting_rpcs.sql
-- Phase 3 — RPC/query API layer for jar reporting.
-- ============================================================================

create or replace function public.rpc_jar_current_balances(
  p_household_id uuid default null
)
returns table (
  household_id uuid,
  jar_id uuid,
  jar_name text,
  jar_type text,
  color text,
  icon text,
  sort_order integer,
  total_inflow numeric,
  total_outflow numeric,
  current_balance numeric,
  held_in_cash numeric,
  held_in_savings numeric,
  held_in_investments numeric,
  held_in_assets numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
begin
  v_household_id := coalesce(p_household_id, public.get_primary_household_id());

  if v_household_id is null then
    raise exception 'No household available for current user';
  end if;

  if coalesce(auth.role(), '') not in ('service_role', 'supabase_admin')
     and not public.check_household_access(v_household_id) then
    raise exception 'Not authorized for household %', v_household_id;
  end if;

  return query
  select
    j.household_id,
    j.id as jar_id,
    j.name as jar_name,
    j.jar_type,
    j.color,
    j.icon,
    j.sort_order,
    coalesce(b.total_inflow, 0)::numeric as total_inflow,
    coalesce(b.total_outflow, 0)::numeric as total_outflow,
    coalesce(b.current_balance, 0)::numeric as current_balance,
    coalesce(b.held_in_cash, 0)::numeric as held_in_cash,
    coalesce(b.held_in_savings, 0)::numeric as held_in_savings,
    coalesce(b.held_in_investments, 0)::numeric as held_in_investments,
    coalesce(b.held_in_assets, 0)::numeric as held_in_assets
  from public.jars j
  left join public.jar_current_balances b
    on b.household_id = j.household_id
   and b.jar_id = j.id
  where j.household_id = v_household_id
    and j.is_archived = false
    and j.deleted_at is null
  order by j.sort_order asc, j.created_at asc;
end;
$$;

create or replace function public.rpc_jar_month_summary(
  p_household_id uuid default null,
  p_month date default date_trunc('month', now())::date
)
returns table (
  household_id uuid,
  jar_id uuid,
  jar_name text,
  month date,
  source_kind text,
  planned_amount numeric,
  allocated_amount numeric,
  spent_amount numeric,
  transfer_in_amount numeric,
  transfer_out_amount numeric,
  rollover_in_amount numeric,
  rollover_out_amount numeric,
  overspend_cover_in_amount numeric,
  overspend_cover_out_amount numeric,
  correction_amount numeric,
  closing_balance numeric,
  closed_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
  v_month date;
begin
  v_household_id := coalesce(p_household_id, public.get_primary_household_id());
  v_month := date_trunc('month', p_month)::date;

  if v_household_id is null then
    raise exception 'No household available for current user';
  end if;

  if coalesce(auth.role(), '') not in ('service_role', 'supabase_admin')
     and not public.check_household_access(v_household_id) then
    raise exception 'Not authorized for household %', v_household_id;
  end if;

  if exists (
    select 1
    from public.jar_month_close_runs r
    where r.household_id = v_household_id
      and r.month = v_month
      and r.status = 'approved'
  ) then
    return query
    select
      s.household_id,
      s.jar_id,
      j.name as jar_name,
      s.month,
      'snapshot'::text as source_kind,
      s.planned_amount::numeric,
      s.allocated_amount::numeric,
      s.spent_amount::numeric,
      s.transfer_in_amount::numeric,
      s.transfer_out_amount::numeric,
      s.rollover_in_amount::numeric,
      s.rollover_out_amount::numeric,
      s.overspend_cover_in_amount::numeric,
      s.overspend_cover_out_amount::numeric,
      s.correction_amount::numeric,
      s.closing_balance::numeric,
      s.closed_at
    from public.jar_monthly_snapshots s
    join public.jars j on j.id = s.jar_id
    where s.household_id = v_household_id
      and s.month = v_month
    order by j.sort_order asc, j.created_at asc;
  else
    return query
    select
      j.household_id,
      j.id as jar_id,
      j.name as jar_name,
      v_month as month,
      'live'::text as source_kind,
      coalesce(max(p.fixed_amount), 0)::numeric as planned_amount,
      coalesce(sum(case when m.movement_type in ('allocation_income', 'allocation_manual') and m.balance_delta = 1 then m.amount else 0 end), 0)::numeric as allocated_amount,
      coalesce(sum(case when m.movement_type = 'expense_spend' and m.balance_delta = -1 then m.amount else 0 end), 0)::numeric as spent_amount,
      coalesce(sum(case when m.movement_type = 'jar_transfer_in' then m.amount else 0 end), 0)::numeric as transfer_in_amount,
      coalesce(sum(case when m.movement_type = 'jar_transfer_out' then m.amount else 0 end), 0)::numeric as transfer_out_amount,
      coalesce(sum(case when m.movement_type in ('rollover_carry_forward', 'rollover_sweep_in') then m.amount else 0 end), 0)::numeric as rollover_in_amount,
      coalesce(sum(case when m.movement_type = 'rollover_sweep_out' then m.amount else 0 end), 0)::numeric as rollover_out_amount,
      coalesce(sum(case when m.movement_type = 'overspend_cover_in' then m.amount else 0 end), 0)::numeric as overspend_cover_in_amount,
      coalesce(sum(case when m.movement_type = 'overspend_cover_out' then m.amount else 0 end), 0)::numeric as overspend_cover_out_amount,
      coalesce(sum(case when m.movement_type = 'correction_in' then m.amount when m.movement_type = 'correction_out' then -m.amount else 0 end), 0)::numeric as correction_amount,
      coalesce(sum((m.amount * m.balance_delta)::numeric), 0)::numeric as closing_balance,
      null::timestamptz as closed_at
    from public.jars j
    left join public.jar_movements m
      on m.jar_id = j.id
     and m.household_id = j.household_id
     and m.month = v_month
    left join public.jar_month_plans p
      on p.jar_id = j.id
     and p.household_id = j.household_id
     and p.month = v_month
    where j.household_id = v_household_id
      and j.is_archived = false
      and j.deleted_at is null
    group by j.household_id, j.id, j.name, j.sort_order, j.created_at
    order by j.sort_order asc, j.created_at asc;
  end if;
end;
$$;

create or replace function public.rpc_jar_command_center(
  p_household_id uuid default null,
  p_month date default date_trunc('month', now())::date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
  v_month date;
  v_result jsonb;
begin
  v_household_id := coalesce(p_household_id, public.get_primary_household_id());
  v_month := date_trunc('month', p_month)::date;

  if v_household_id is null then
    raise exception 'No household available for current user';
  end if;

  if coalesce(auth.role(), '') not in ('service_role', 'supabase_admin')
     and not public.check_household_access(v_household_id) then
    raise exception 'Not authorized for household %', v_household_id;
  end if;

  select jsonb_build_object(
    'month', v_month,
    'balances', coalesce((
      select jsonb_agg(to_jsonb(b))
      from public.rpc_jar_current_balances(v_household_id) b
    ), '[]'::jsonb),
    'summary', coalesce((
      select jsonb_agg(to_jsonb(s))
      from public.rpc_jar_month_summary(v_household_id, v_month) s
    ), '[]'::jsonb),
    'pendingReviews', coalesce((
      select jsonb_agg(to_jsonb(r))
      from public.jar_review_queue r
      where r.household_id = v_household_id
        and r.status = 'pending'
      order by r.movement_date desc, r.created_at desc
    ), '[]'::jsonb),
    'activeCategoryRuleCount', (
      select count(*)
      from public.jar_category_rules cr
      where cr.household_id = v_household_id
        and cr.is_active = true
    )
  ) into v_result;

  return v_result;
end;
$$;

create or replace function public.rpc_jar_month_close_preview(
  p_household_id uuid default null,
  p_month date default date_trunc('month', now())::date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
  v_month date;
  v_existing jsonb;
begin
  v_household_id := coalesce(p_household_id, public.get_primary_household_id());
  v_month := date_trunc('month', p_month)::date;

  if v_household_id is null then
    raise exception 'No household available for current user';
  end if;

  if coalesce(auth.role(), '') not in ('service_role', 'supabase_admin')
     and not public.check_household_access(v_household_id) then
    raise exception 'Not authorized for household %', v_household_id;
  end if;

  select r.preview_json into v_existing
  from public.jar_month_close_runs r
  where r.household_id = v_household_id
    and r.month = v_month
  limit 1;

  if v_existing is not null then
    return v_existing;
  end if;

  return jsonb_build_object(
    'month', v_month,
    'jarBalances', coalesce((
      select jsonb_agg(to_jsonb(s))
      from public.rpc_jar_month_summary(v_household_id, v_month) s
    ), '[]'::jsonb),
    'overspendCoverage', '[]'::jsonb,
    'rollovers', '[]'::jsonb
  );
end;
$$;

grant execute on function public.rpc_jar_current_balances(uuid) to authenticated;
grant execute on function public.rpc_jar_month_summary(uuid, date) to authenticated;
grant execute on function public.rpc_jar_command_center(uuid, date) to authenticated;
grant execute on function public.rpc_jar_month_close_preview(uuid, date) to authenticated;
