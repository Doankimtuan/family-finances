-- 15C: restore the still-required metadata-only legacy savings strangler.
-- One active legacy savings row remains in the configured dev project.
create or replace function public.backfill_legacy_savings_accounts(
  p_household_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
  v_manual_id uuid;
  v_package record;
  v_saving_id uuid;
  v_count int := 0;
  v_funding uuid;
  v_snapshot jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_household_member(p_household_id) then
    raise exception 'Forbidden';
  end if;

  select id into v_manual_id
  from public.saving_providers
  where provider_key = 'manual'
  limit 1;

  if v_manual_id is null then
    return jsonb_build_object('ok', false, 'error', 'manual_provider_missing');
  end if;

  select * into v_package
  from public.saving_packages
  where provider_id = v_manual_id
  order by duration_days
  limit 1;

  select a.id into v_funding
  from public.accounts a
  where a.household_id = p_household_id
    and a.is_archived = false
    and a.type <> 'credit_card'
    and a.type <> 'savings_product'
  order by a.created_at
  limit 1;

  if v_funding is null then
    return jsonb_build_object('ok', false, 'error', 'no_funding_account');
  end if;

  for v_row in
    select *
    from public.savings_accounts sa
    where sa.household_id = p_household_id
      and sa.status in ('active', 'matured')
      and not exists (
        select 1 from public.savings s
        where s.household_id = p_household_id
          and s.product_snapshot->>'legacySavingsAccountId' = sa.id::text
      )
  loop
    v_snapshot := jsonb_build_object(
      'providerId', v_manual_id,
      'productName', v_row.name,
      'packageName', coalesce(v_package.package_name, 'Legacy'),
      'depositTermDays', coalesce(v_package.duration_days, 30),
      'annualInterestRate', coalesce(v_package.annual_interest_rate, 0),
      'interestCalculationMethod', 'simple',
      'settlementRule', 'withdraw_everything',
      'renewalPreference', 'manual_review',
      'penaltyStrategy', 'no_interest',
      'providerRules', '{}'::jsonb,
      'legacyImport', true,
      'legacySavingsAccountId', v_row.id
    );

    insert into public.savings (
      household_id, status, funding_account_id, settlement_account_id,
      provider_id, product_name, product_snapshot, renewal_preference, created_by
    )
    values (
      p_household_id,
      case when v_row.status = 'matured' then 'matured' else 'active' end,
      v_funding,
      v_funding,
      v_manual_id,
      v_row.name,
      v_snapshot,
      'manual_review',
      v_row.created_by
    )
    returning id into v_saving_id;

    insert into public.saving_cycles (
      saving_id, cycle_number, start_date, end_date,
      principal, locked_rate, package_snapshot, accrued_interest, status
    )
    values (
      v_saving_id,
      1,
      coalesce(v_row.created_at::date, (timezone('utc', now()))::date),
      v_row.maturity_date,
      v_row.principal_amount,
      coalesce(v_package.annual_interest_rate, 0),
      jsonb_build_object(
        'packageName', coalesce(v_package.package_name, 'Legacy'),
        'durationDays', coalesce(v_package.duration_days, 30),
        'annualInterestRate', coalesce(v_package.annual_interest_rate, 0),
        'settlementRules', '["withdraw_everything"]'::jsonb,
        'penaltyRules', '[]'::jsonb,
        'renewableAvailable', true,
        'minAmount', null,
        'maxAmount', null
      ),
      0,
      case when v_row.status = 'matured' then 'matured' else 'active' end
    );

    update public.savings_accounts
    set status = 'closed', updated_at = timezone('utc', now())
    where id = v_row.id;

    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('ok', true, 'migratedCount', v_count);
end;
$$;

revoke all on function public.backfill_legacy_savings_accounts(uuid) from public;
grant execute on function public.backfill_legacy_savings_accounts(uuid) to authenticated;
