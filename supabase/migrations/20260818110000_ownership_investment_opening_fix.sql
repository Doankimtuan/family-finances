-- Prompt 14E follow-up: keep investment_holdings ownership aligned in the
-- opening-position creation path.

create or replace function public.record_investment_opening_position(
  p_asset_name text,
  p_asset_class text,
  p_quantity numeric,
  p_as_of_date date,
  p_symbol text,
  p_provider_custodian text,
  p_remaining_total_cost_basis numeric,
  p_current_valuation numeric,
  p_notes text,
  p_visibility_context text,
  p_idempotency_key text,
  p_financial_scope text default 'household'
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hh uuid;
  v_hid uuid;
  v_oid uuid;
  v_existing uuid;
  v_history text;
  v_financial_scope text;
  v_owner_membership_id uuid;
begin
  v_hh := public.investment_active_household();
  v_financial_scope := lower(trim(coalesce(p_financial_scope, 'household')));
  if v_financial_scope not in ('household', 'personal') then
    raise exception 'Invalid financial scope';
  end if;
  select hm.id into v_owner_membership_id
  from public.household_members hm
  where hm.id = public.active_membership_id(v_hh)
    and hm.is_active = true;
  if v_financial_scope = 'personal' and v_owner_membership_id is null then
    raise exception 'Active household membership required';
  end if;
  if v_financial_scope = 'household' then
    v_owner_membership_id := null;
  end if;

  select id into v_existing
  from public.investment_operations
  where household_id = v_hh and idempotency_key = p_idempotency_key;
  if found then
    return public.investment_operation_receipt(v_existing, true);
  end if;
  if p_asset_class not in ('crypto','stock','fund','gold','bond')
    or p_quantity <= 0 or scale(p_quantity) > 18 or p_as_of_date is null
  then
    raise exception 'Invalid opening position';
  end if;
  if p_remaining_total_cost_basis is not null
    and (p_remaining_total_cost_basis < 0
      or p_remaining_total_cost_basis <> trunc(p_remaining_total_cost_basis))
  then
    raise exception 'Invalid basis';
  end if;

  v_history := case
    when p_remaining_total_cost_basis is null then 'cost_basis_unknown'
    else 'opening_position'
  end;
  insert into public.investment_holdings(
    household_id, name, symbol, asset_class, provider_custodian,
    visibility_context, lifecycle_status, history_status, quantity,
    remaining_total_cost_basis, notes, created_by, financial_scope,
    owner_membership_id
  )
  values (
    v_hh, trim(p_asset_name), nullif(trim(coalesce(p_symbol,'')), ''),
    p_asset_class, nullif(trim(coalesce(p_provider_custodian,'')), ''),
    coalesce(p_visibility_context,'household'), 'active', v_history,
    p_quantity, p_remaining_total_cost_basis,
    nullif(trim(coalesce(p_notes,'')), ''), auth.uid(), v_financial_scope,
    v_owner_membership_id
  )
  returning id into v_hid;

  insert into public.investment_operations(
    household_id, operation_type, destination_holding_id,
    destination_quantity, destination_basis_added, before_quantity,
    after_quantity, before_basis, after_basis, effective_date, notes,
    idempotency_key, created_by
  )
  values (
    v_hh, 'opening_position', v_hid, p_quantity,
    p_remaining_total_cost_basis, 0, p_quantity,
    case when p_remaining_total_cost_basis is null then null else 0 end,
    p_remaining_total_cost_basis, p_as_of_date,
    nullif(trim(coalesce(p_notes,'')), ''), p_idempotency_key, auth.uid()
  )
  returning id into v_oid;

  if p_current_valuation is not null then
    insert into public.investment_valuations(
      household_id, holding_id, value_vnd, valuation_date, source, notes,
      idempotency_key, created_by
    )
    values (
      v_hh, v_hid, p_current_valuation, p_as_of_date, 'manual',
      nullif(trim(coalesce(p_notes,'')), ''),
      p_idempotency_key || ':opening-valuation', auth.uid()
    );
  end if;
  return public.investment_operation_receipt(v_oid, false);
end $$;

revoke all on function public.record_investment_opening_position(
  text,text,numeric,date,text,text,numeric,numeric,text,text,text,text
) from public, anon;
grant execute on function public.record_investment_opening_position(
  text,text,numeric,date,text,text,numeric,numeric,text,text,text,text
) to authenticated;
