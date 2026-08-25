-- Prompt 14E — ownership-aware creation boundaries.
--
-- Each replacement accepts only financial_scope from the trusted application
-- boundary. The owner is always derived from auth.uid() and the active
-- membership in this SECURITY DEFINER function. The old signatures are
-- removed so PostgREST cannot resolve an ambiguous overload.

do $$
declare
  definition text;
begin
  definition := pg_get_functiondef(
    'public.create_debt(text,text,text,text,numeric,date,date,text,uuid,text)'::regprocedure
  );
  definition := regexp_replace(
    definition,
    '(p_idempotency_key text)([^)]*)\)',
    '\1\2, p_financial_scope text default ''household''::text)',
    1, 1, 'i'
  );
  definition := replace(definition, '  v_idempotency_key text;',
    E'  v_idempotency_key text;\n  v_financial_scope text;\n  v_owner_membership_id uuid;');
  definition := replace(definition,
    E'  if v_household_id is null then\n    raise exception ''Not a household member'';\n  end if;',
    E'  if v_household_id is null then\n    raise exception ''Not a household member'';\n  end if;\n  v_financial_scope := lower(trim(coalesce(p_financial_scope, ''household'')));\n  if v_financial_scope not in (''household'', ''personal'') then\n    raise exception ''Invalid financial scope'';\n  end if;\n  select hm.id into v_owner_membership_id\n  from public.household_members hm\n  where hm.id = public.active_membership_id(v_household_id)\n    and hm.is_active = true;\n  if v_financial_scope = ''personal'' and v_owner_membership_id is null then\n    raise exception ''Active household membership required'';\n  end if;\n  if v_financial_scope = ''household'' then\n    v_owner_membership_id := null;\n  end if;');
  definition := replace(definition,
    E'    origin_transaction_id,\n    idempotency_key\n  )',
    E'    origin_transaction_id,\n    idempotency_key,\n    financial_scope,\n    owner_membership_id\n  )');
  definition := replace(definition,
    E'    v_transaction_id,\n    v_idempotency_key\n  )',
    E'    v_transaction_id,\n    v_idempotency_key,\n    v_financial_scope,\n    v_owner_membership_id\n  )');
  execute definition;
  drop function public.create_debt(text,text,text,text,numeric,date,date,text,uuid,text);
end $$;
grant execute on function public.create_debt(
  text,text,text,text,numeric,date,date,text,uuid,text,text
) to authenticated;
revoke all on function public.create_debt(
  text,text,text,text,numeric,date,date,text,uuid,text,text
) from public, anon;
do $$
declare
  definition text;
begin
  definition := pg_get_functiondef(
    'public.create_saving_with_transfer(uuid,numeric,uuid,text,jsonb,text,uuid,date,date,jsonb,jsonb,text)'::regprocedure
  );
  definition := regexp_replace(
    definition,
    '(p_idempotency_key text)([^)]*)\)',
    '\1\2, p_financial_scope text default ''household''::text)',
    1, 1, 'i'
  );
  definition := replace(definition, '  v_instruction jsonb;',
    E'  v_instruction jsonb;\n  v_financial_scope text;\n  v_owner_membership_id uuid;');
  definition := replace(definition,
    '  if v_household_id is null then raise exception ''Active household membership required''; end if;',
    E'  if v_household_id is null then raise exception ''Active household membership required''; end if;\n  v_financial_scope := lower(trim(coalesce(p_financial_scope, ''household'')));\n  if v_financial_scope not in (''household'', ''personal'') then raise exception ''Invalid financial scope''; end if;\n  select hm.id into v_owner_membership_id from public.household_members hm where hm.id = public.active_membership_id(v_household_id) and hm.is_active = true;\n  if v_financial_scope = ''personal'' and v_owner_membership_id is null then raise exception ''Active household membership required''; end if;\n  if v_financial_scope = ''household'' then v_owner_membership_id := null; end if;');
  definition := replace(definition,
    E'    product_name, product_snapshot, renewal_policy, renewal_config, maturity_instruction, created_by\n  )',
    E'    product_name, product_snapshot, renewal_policy, renewal_config, maturity_instruction, created_by, financial_scope, owner_membership_id\n  )');
  definition := replace(definition,
    E'    v_household_id, ''active'', p_funding_account_id, p_settlement_account_id, p_provider_id,\n    p_product_name, p_product_snapshot, v_policy, v_config, v_instruction, v_user_id\n  )',
    E'    v_household_id, ''active'', p_funding_account_id, p_settlement_account_id, p_provider_id,\n    p_product_name, p_product_snapshot, v_policy, v_config, v_instruction, v_user_id,\n    v_financial_scope, v_owner_membership_id\n  )');
  execute definition;
  drop function public.create_saving_with_transfer(
    uuid,numeric,uuid,text,jsonb,text,uuid,date,date,jsonb,jsonb,text
  );
end $$;
grant execute on function public.create_saving_with_transfer(
  uuid,numeric,uuid,text,jsonb,text,uuid,date,date,jsonb,jsonb,text,text
) to authenticated;
revoke all on function public.create_saving_with_transfer(
  uuid,numeric,uuid,text,jsonb,text,uuid,date,date,jsonb,jsonb,text,text
) from public, anon;
do $$
declare
  definition text;
begin
  definition := pg_get_functiondef(
    'public.create_loan_with_schedule(text,text,text,numeric,numeric,text,text,numeric,int,numeric,date,int,date,date,numeric,numeric,numeric,date,text,char,jsonb,jsonb)'::regprocedure
  );
  definition := regexp_replace(
    definition,
    '(p_rate_periods jsonb)([^)]*)\)',
    '\1\2, p_financial_scope text default ''household''::text)',
    1, 1, 'i'
  );
  definition := replace(definition, '  v_strategy text;',
    E'  v_strategy text;\n  v_financial_scope text;\n  v_owner_membership_id uuid;');
  definition := replace(definition,
    E'  if v_household_id is null then\n    raise exception ''Not a household member'';\n  end if;',
    E'  if v_household_id is null then\n    raise exception ''Not a household member'';\n  end if;\n  v_financial_scope := lower(trim(coalesce(p_financial_scope, ''household'')));\n  if v_financial_scope not in (''household'', ''personal'') then raise exception ''Invalid financial scope''; end if;\n  select hm.id into v_owner_membership_id from public.household_members hm where hm.id = public.active_membership_id(v_household_id) and hm.is_active = true;\n  if v_financial_scope = ''personal'' and v_owner_membership_id is null then raise exception ''Active household membership required''; end if;\n  if v_financial_scope = ''household'' then v_owner_membership_id := null; end if;');
  definition := replace(definition,
    E'    note,\n    created_by\n  )',
    E'    note,\n    created_by,\n    financial_scope,\n    owner_membership_id\n  )');
  definition := replace(definition,
    E'    nullif(trim(coalesce(p_note, '''')), ''''),\n    v_user_id\n  )',
    E'    nullif(trim(coalesce(p_note, '''')), ''''),\n    v_user_id,\n    v_financial_scope,\n    v_owner_membership_id\n  )');
  execute definition;
  drop function public.create_loan_with_schedule(
    text,text,text,numeric,numeric,text,text,numeric,int,numeric,date,int,date,date,numeric,numeric,numeric,date,text,char,jsonb,jsonb
  );
end $$;
grant execute on function public.create_loan_with_schedule(
  text,text,text,numeric,numeric,text,text,numeric,int,numeric,date,int,date,date,numeric,numeric,numeric,date,text,char,jsonb,jsonb,text
) to authenticated;
revoke all on function public.create_loan_with_schedule(
  text,text,text,numeric,numeric,text,text,numeric,int,numeric,date,int,date,date,numeric,numeric,numeric,date,text,char,jsonb,jsonb,text
) from public, anon;
do $$
declare
  definition text;
begin
  definition := pg_get_functiondef(
    'public.record_investment_opening_position(text,text,numeric,date,text,text,numeric,numeric,text,text,text)'::regprocedure
  );
  definition := regexp_replace(
    definition,
    '(p_idempotency_key text)([^)]*)\)',
    '\1\2, p_financial_scope text default ''household''::text)',
    1, 1, 'i'
  );
  definition := replace(definition, 'declare v_hh uuid; v_hid uuid; v_oid uuid; v_existing uuid; v_history text;',
    'declare v_hh uuid; v_hid uuid; v_oid uuid; v_existing uuid; v_history text; v_financial_scope text; v_owner_membership_id uuid;');
  definition := replace(definition,
    '  v_hh := public.investment_active_household();',
    E'  v_hh := public.investment_active_household();\n  v_financial_scope := lower(trim(coalesce(p_financial_scope, ''household'')));\n  if v_financial_scope not in (''household'', ''personal'') then raise exception ''Invalid financial scope''; end if;\n  select hm.id into v_owner_membership_id from public.household_members hm where hm.id = public.active_membership_id(v_hh) and hm.is_active = true;\n  if v_financial_scope = ''personal'' and v_owner_membership_id is null then raise exception ''Active household membership required''; end if;\n  if v_financial_scope = ''household'' then v_owner_membership_id := null; end if;');
  definition := replace(definition,
    'investment_holdings(household_id,name,symbol,asset_class,provider_custodian,visibility_context,lifecycle_status,history_status,quantity,remaining_total_cost_basis,notes,created_by)',
    'investment_holdings(household_id,name,symbol,asset_class,provider_custodian,visibility_context,lifecycle_status,history_status,quantity,remaining_total_cost_basis,notes,created_by,financial_scope,owner_membership_id)');
  definition := replace(definition,
    'nullif(trim(coalesce(p_notes,'')),''),auth.uid())',
    'nullif(trim(coalesce(p_notes,'')),''),auth.uid(),v_financial_scope,v_owner_membership_id)');
  execute definition;
  drop function public.record_investment_opening_position(
    text,text,numeric,date,text,text,numeric,numeric,text,text,text
  );
end $$;
grant execute on function public.record_investment_opening_position(
  text,text,numeric,date,text,text,numeric,numeric,text,text,text,text
) to authenticated;
revoke all on function public.record_investment_opening_position(
  text,text,numeric,date,text,text,numeric,numeric,text,text,text,text
) from public, anon;
create or replace function public.record_investment_initial_purchase(
  p_asset_name text,
  p_asset_class text,
  p_quantity numeric,
  p_unit_price_vnd numeric,
  p_cash_account_id uuid,
  p_as_of_date date,
  p_symbol text,
  p_provider_custodian text,
  p_fees jsonb,
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
  v_existing uuid;
  v_receipt jsonb;
  v_financial_scope text;
  v_owner_membership_id uuid;
begin
  v_hh := public.investment_active_household();
  v_financial_scope := lower(trim(coalesce(p_financial_scope, 'household')));
  if v_financial_scope not in ('household', 'personal') then
    raise exception 'Invalid financial scope';
  end if;
  select hm.id
    into v_owner_membership_id
  from public.household_members hm
  where hm.id = public.active_membership_id(v_hh)
    and hm.is_active = true;
  if v_financial_scope = 'personal' and v_owner_membership_id is null then
    raise exception 'Active household membership required';
  end if;
  if v_financial_scope = 'household' then
    v_owner_membership_id := null;
  end if;

  select id
    into v_existing
  from public.investment_operations
  where household_id = v_hh
    and idempotency_key = p_idempotency_key;
  if found then
    return public.investment_operation_receipt(v_existing, true);
  end if;
  if p_asset_class not in ('crypto','stock','fund','gold','bond')
    or p_quantity <= 0
    or scale(p_quantity) > 18
    or p_unit_price_vnd <= 0
    or p_unit_price_vnd <> trunc(p_unit_price_vnd)
    or p_as_of_date is null
  then
    raise exception 'Invalid initial purchase';
  end if;
  perform 1
  from public.accounts
  where id = p_cash_account_id
    and household_id = v_hh
    and not is_archived
    and type not in ('credit_card','savings_product')
  for update;
  if not found then
    raise exception 'Cash account not found';
  end if;
  insert into public.investment_holdings(
    household_id, name, symbol, asset_class, provider_custodian,
    visibility_context, lifecycle_status, history_status, quantity,
    remaining_total_cost_basis, notes, created_by, financial_scope,
    owner_membership_id
  )
  values (
    v_hh, trim(p_asset_name), nullif(trim(coalesce(p_symbol,'')), ''),
    p_asset_class, nullif(trim(coalesce(p_provider_custodian,'')), ''),
    coalesce(p_visibility_context,'household'), 'active', 'full', 0, 0,
    nullif(trim(coalesce(p_notes,'')), ''), auth.uid(), v_financial_scope,
    v_owner_membership_id
  )
  returning id into v_hid;
  v_receipt := public.record_investment_buy(
    v_hid, p_cash_account_id, p_quantity,
    round(p_quantity * p_unit_price_vnd), null, p_as_of_date,
    coalesce(p_fees,'[]'::jsonb), p_notes, p_idempotency_key
  );
  return v_receipt;
end $$;
grant execute on function public.record_investment_initial_purchase(
  text,text,numeric,numeric,uuid,date,text,text,jsonb,text,text,text,text
) to authenticated;
revoke all on function public.record_investment_initial_purchase(
  text,text,numeric,numeric,uuid,date,text,text,jsonb,text,text,text,text
) from public, anon;
