-- PLAN 10: Goal lifecycle and whole-source reassignment.
-- These functions mutate Plan metadata/links only. They never create Money transactions.
alter table public.goals
  add column if not exists completed_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists paused_at timestamptz;

create or replace function public.reassign_goal_funding_source(
  p_link_id uuid,
  p_from_goal_id uuid,
  p_to_goal_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_link public.goal_funding_links%rowtype;
  v_from public.goals%rowtype;
  v_to public.goals%rowtype;
  v_new_link_id uuid;
  v_now timestamptz := pg_catalog.timezone('utc', pg_catalog.now());
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if p_from_goal_id = p_to_goal_id then
    raise exception 'Destination must differ';
  end if;

  select * into v_link
  from public.goal_funding_links
  where id = p_link_id
    and goal_id = p_from_goal_id
    and is_active = true
  for update;
  if not found then
    raise exception 'Funding source is no longer assigned';
  end if;

  select * into v_from
  from public.goals
  where id = p_from_goal_id
  for update;
  select * into v_to
  from public.goals
  where id = p_to_goal_id
  for update;
  if not found or not public.is_household_member(v_from.household_id) then
    raise exception 'Goal not found';
  end if;
  if v_to.id is null or v_from.household_id <> v_to.household_id then
    raise exception 'Destination must be in the same household';
  end if;
  if v_link.household_id <> v_from.household_id then
    raise exception 'Funding source belongs to another household';
  end if;
  if v_to.status not in ('active', 'ready') then
    raise exception 'Destination goal is not open';
  end if;
  if (v_to.goal_type = 'payoff' and v_link.source_kind not in ('loan', 'debt'))
     or (v_to.goal_type <> 'payoff' and v_link.source_kind in ('loan', 'debt')) then
    raise exception 'Funding source is incompatible with destination goal';
  end if;

  update public.goal_funding_links
  set is_active = false,
      unlinked_at = v_now,
      unlinked_by = v_user_id
  where id = v_link.id;

  insert into public.goal_funding_links (
    household_id,
    goal_id,
    source_kind,
    saving_id,
    account_id,
    holding_id,
    loan_id,
    debt_id,
    initial_principal_snapshot,
    is_active,
    created_by,
    linked_at,
    linked_by,
    created_at
  ) values (
    v_link.household_id,
    v_to.id,
    v_link.source_kind,
    v_link.saving_id,
    v_link.account_id,
    v_link.holding_id,
    v_link.loan_id,
    v_link.debt_id,
    v_link.initial_principal_snapshot,
    true,
    v_user_id,
    v_now,
    v_user_id,
    v_now
  ) returning id into v_new_link_id;

  return jsonb_build_object(
    'source_kind', v_link.source_kind,
    'from_goal_id', v_from.id,
    'to_goal_id', v_to.id,
    'new_link_id', v_new_link_id
  );
end;
$$;
revoke all on function public.reassign_goal_funding_source(uuid, uuid, uuid) from public;
grant execute on function public.reassign_goal_funding_source(uuid, uuid, uuid) to authenticated;

create or replace function public.change_goal_lifecycle(
  p_goal_id uuid,
  p_action text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_goal public.goals%rowtype;
  v_next_status text;
  v_now timestamptz := pg_catalog.timezone('utc', pg_catalog.now());
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if p_action not in ('pause', 'resume', 'complete', 'cancel') then
    raise exception 'Invalid lifecycle action';
  end if;

  select * into v_goal
  from public.goals
  where id = p_goal_id
  for update;
  if not found or not public.is_household_member(v_goal.household_id) then
    raise exception 'Goal not found';
  end if;

  if p_action = 'pause' then
    if v_goal.status not in ('active', 'ready') then
      raise exception 'Goal cannot be paused';
    end if;
    v_next_status := 'paused';
  elsif p_action = 'resume' then
    if v_goal.status <> 'paused' then
      raise exception 'Goal cannot be resumed';
    end if;
    -- Linked Goal readiness is derived by the application from current sources;
    -- never use legacy funded_amount as the lifecycle source of truth.
    v_next_status := 'active';
  elsif p_action = 'complete' then
    if v_goal.status not in ('active', 'paused', 'ready') then
      raise exception 'Goal cannot be completed';
    end if;
    v_next_status := 'completed';
  else
    if v_goal.status not in ('active', 'paused', 'ready') then
      raise exception 'Goal cannot be cancelled';
    end if;
    v_next_status := 'cancelled';
  end if;

  update public.goals
  set status = v_next_status,
      paused_at = case when p_action = 'pause' then v_now else paused_at end,
      completed_at = case when p_action = 'complete' then v_now else completed_at end,
      cancelled_at = case when p_action = 'cancel' then v_now else cancelled_at end,
      updated_at = v_now
  where id = v_goal.id;

  if p_action in ('complete', 'cancel') then
    update public.goal_funding_links
    set is_active = false,
        unlinked_at = v_now,
        unlinked_by = v_user_id
    where goal_id = v_goal.id
      and household_id = v_goal.household_id
      and is_active = true;
  end if;

  return jsonb_build_object('goal_id', v_goal.id, 'status', v_next_status);
end;
$$;
revoke all on function public.change_goal_lifecycle(uuid, text) from public;
grant execute on function public.change_goal_lifecycle(uuid, text) to authenticated;
