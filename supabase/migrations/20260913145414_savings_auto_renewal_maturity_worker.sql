create schema if not exists private;

revoke all on schema private from public, anon, authenticated, service_role;
grant usage on schema private to postgres;

create or replace function public.detect_matured_savings(p_household_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  c_active_cycle constant text := 'active';
  c_matured_cycle constant text := 'matured';
  c_auto_policy constant text := 'auto_renew_until_cancelled';
  c_fallback_ask_user constant text := 'ask_user';
  c_roll_principal_interest constant text := 'roll_principal_interest';
  c_roll_principal_only constant text := 'roll_principal_only';
  c_withdraw_everything constant text := 'withdraw_everything';
  c_suggestion_none constant text := 'none';
  c_suggestion_configured constant text := 'confirm_configured';
  c_saved_config_warning constant text := 'saved_renewal_config_unavailable';
  c_policy_applied constant text := 'policy_applied';
  v_cycle record;
  v_previous_rate numeric;
  v_accrued_interest numeric;
  v_provider_name text;
  v_currency text;
  v_configured_action text;
  v_configured_package_id uuid;
  v_settlement_account_id uuid;
  v_context_package_id uuid;
  v_context_settlement_account_id uuid;
  v_context_settlement_rule text;
  v_package record;
  v_config_valid boolean;
  v_fallback_required boolean;
  v_warnings jsonb;
  v_recommended_packages jsonb;
  v_suggested_action text;
  v_confidence numeric;
  v_context jsonb;
  v_rollover_result jsonb;
  v_next_cycle record;
  v_decision jsonb;
  v_processed_count integer := 0;
  v_auto_renewed_count integer := 0;
  v_fallback_count integer := 0;
  v_failed_count integer := 0;
  v_error_state text;
begin
  if not public.is_household_member(p_household_id) then
    raise exception 'Forbidden';
  end if;

  v_currency := public.household_base_currency(p_household_id);

  for v_cycle in
    select
      sc.*,
      s.provider_id,
      s.product_name,
      s.product_snapshot,
      s.renewal_policy,
      s.renewal_config,
      s.maturity_instruction,
      s.settlement_account_id,
      s.household_id,
      s.financial_scope,
      s.owner_membership_id
    from public.saving_cycles sc
    join public.savings s on s.id = sc.saving_id
    where s.household_id = p_household_id
      and s.status = 'active'
      and sc.status = c_active_cycle
      and sc.end_date <= timezone('utc', now())::date
      and public.can_mutate_financial_resource(
        s.household_id,
        s.financial_scope,
        s.owner_membership_id
      )
    order by sc.end_date, sc.saving_id, sc.cycle_number
    for update of sc, s
  loop
    begin
      v_accrued_interest := public.savings_calculate_interest(
        v_cycle.principal,
        v_cycle.locked_rate,
        v_cycle.start_date,
        v_cycle.end_date,
        coalesce(
          v_cycle.package_snapshot->>'interestCalculationMethod',
          v_cycle.product_snapshot->>'interestCalculationMethod',
          'simple'
        ),
        v_cycle.end_date
      );

      update public.saving_cycles
      set status = c_matured_cycle,
          accrued_interest = v_accrued_interest
      where id = v_cycle.id;

      update public.savings
      set status = c_matured_cycle,
          updated_at = timezone('utc', now())
      where id = v_cycle.saving_id;

      select previous_cycle.locked_rate into v_previous_rate
      from public.saving_cycles previous_cycle
      where previous_cycle.saving_id = v_cycle.saving_id
        and previous_cycle.cycle_number = v_cycle.cycle_number - 1
      limit 1;

      select provider.display_name into v_provider_name
      from public.saving_providers provider
      where provider.id = v_cycle.provider_id;

      v_config_valid := false;
      v_fallback_required := false;
      v_configured_action := null;
      v_configured_package_id := null;
      v_settlement_account_id := null;
      v_context_package_id := null;
      v_context_settlement_account_id := v_cycle.settlement_account_id;
      v_context_settlement_rule := null;
      v_warnings := '[]'::jsonb;
      v_recommended_packages := '[]'::jsonb;

      begin
        v_context_package_id := nullif(
          trim(v_cycle.renewal_config->>'preferredPackageId'),
          ''
        )::uuid;
      exception when invalid_text_representation then
        v_context_package_id := null;
      end;
      begin
        v_context_settlement_account_id := coalesce(
          nullif(trim(v_cycle.renewal_config->>'preferredSettlementAccountId'), '')::uuid,
          v_cycle.settlement_account_id
        );
      exception when invalid_text_representation then
        v_context_settlement_account_id := v_cycle.settlement_account_id;
      end;
      v_context_settlement_rule := nullif(
        trim(v_cycle.renewal_config->>'preferredSettlementRule'),
        ''
      );
      if v_context_settlement_rule not in (
        c_roll_principal_interest,
        c_roll_principal_only,
        c_withdraw_everything
      ) then
        v_context_settlement_rule := null;
      end if;

      if v_cycle.renewal_policy = c_auto_policy then
        begin
          v_configured_action := nullif(
            trim(v_cycle.renewal_config->>'preferredSettlementRule'),
            ''
          );
          v_configured_package_id := nullif(
            trim(v_cycle.renewal_config->>'preferredPackageId'),
            ''
          )::uuid;
          v_settlement_account_id := coalesce(
            nullif(trim(v_cycle.renewal_config->>'preferredSettlementAccountId'), '')::uuid,
            nullif(trim(v_cycle.maturity_instruction->>'payoutAccountId'), '')::uuid,
            v_cycle.settlement_account_id
          );
        exception when invalid_text_representation then
          v_configured_action := null;
          v_configured_package_id := null;
          v_settlement_account_id := null;
        end;

        v_config_valid := coalesce(
          v_configured_package_id is not null
          and v_configured_action in (
            c_roll_principal_interest,
            c_roll_principal_only
          )
          and coalesce(
            v_cycle.maturity_instruction->>'fallbackPolicy',
            c_fallback_ask_user
          ) = c_fallback_ask_user,
          false
        );
        if v_configured_action not in (
          c_roll_principal_interest,
          c_roll_principal_only
        ) then
          v_configured_action := null;
        end if;

        if v_config_valid then
          select
            target_package.id,
            target_package.provider_id,
            target_package.package_name,
            target_package.duration_days,
            target_package.annual_interest_rate,
            target_package.min_amount,
            target_package.max_amount,
            target_package.settlement_rules,
            target_package.renewable_available,
            target_package.is_active,
            target_package.term_amount,
            target_package.term_unit,
            target_package.currency,
            package_provider.display_name as provider_name,
            package_provider.is_active as provider_is_active
          into v_package
          from public.saving_packages target_package
          join public.saving_providers package_provider
            on package_provider.id = target_package.provider_id
          where target_package.id = v_configured_package_id
            and target_package.provider_id = v_cycle.provider_id
            and (
              package_provider.household_id is null
              or public.is_household_member(package_provider.household_id)
            )
          for share of target_package, package_provider;

          if not found then
            v_config_valid := false;
          else
            v_config_valid := coalesce(v_package.is_active
              and v_package.provider_is_active
              and v_package.renewable_available
              and upper(coalesce(
                v_package.currency,
                public.household_base_currency(p_household_id)
              )) = upper(public.household_base_currency(p_household_id))
              and (v_package.min_amount is null or v_cycle.principal >= v_package.min_amount)
              and (v_package.max_amount is null or v_cycle.principal <= v_package.max_amount)
              and v_package.settlement_rules @> jsonb_build_array(v_configured_action),
              false
            );
          end if;
        end if;

        if v_config_valid then
          if v_settlement_account_id is null
            and v_configured_action = c_roll_principal_only then
            v_config_valid := false;
          elsif v_settlement_account_id is not null then
            perform 1
            from public.accounts account
            where account.id = v_settlement_account_id
              and account.household_id = p_household_id
              and account.is_archived = false
            for share;

            v_config_valid := coalesce(found
              and public.savings_is_eligible_liquid_account(
                v_settlement_account_id,
                p_household_id
              ),
              false
            );
          end if;
        end if;

        v_fallback_required := not coalesce(v_config_valid, false);
        if v_fallback_required then
          v_warnings := jsonb_build_array(
            jsonb_build_object('code', c_saved_config_warning)
          );

          select coalesce(
            jsonb_agg(
              jsonb_build_object(
                'packageId', eligible.package_id,
                'packageName', eligible.package_name,
                'durationDays', eligible.duration_days,
                'annualRate', eligible.annual_interest_rate
              )
              order by eligible.package_name
            ),
            '[]'::jsonb
          )
          into v_recommended_packages
          from (
            select
              candidate_package.id as package_id,
              candidate_package.package_name,
              candidate_package.duration_days,
              candidate_package.annual_interest_rate
            from public.saving_packages candidate_package
            join public.saving_providers package_provider
              on package_provider.id = candidate_package.provider_id
            where candidate_package.provider_id = v_cycle.provider_id
              and (
                package_provider.household_id is null
                or public.is_household_member(package_provider.household_id)
              )
              and candidate_package.is_active = true
              and package_provider.is_active = true
              and candidate_package.renewable_available = true
              and upper(coalesce(
                candidate_package.currency,
                public.household_base_currency(p_household_id)
              )) = upper(public.household_base_currency(p_household_id))
              and (candidate_package.min_amount is null or v_cycle.principal >= candidate_package.min_amount)
              and (candidate_package.max_amount is null or v_cycle.principal <= candidate_package.max_amount)
              and candidate_package.settlement_rules @> jsonb_build_array(c_roll_principal_interest)
            order by candidate_package.package_name
          ) eligible;
        end if;
      end if;

      v_suggested_action := case v_cycle.renewal_policy
        when 'always_ask' then c_suggestion_none
        when 'use_saved_preference' then
          case when coalesce(
            v_cycle.renewal_config->>'preferredSettlementRule',
            ''
          ) = 'withdraw_everything'
          then 'withdraw'
          else c_suggestion_configured
          end
        when c_auto_policy then c_suggestion_configured
        when 'one_time_renewal' then c_suggestion_configured
        else c_suggestion_none
      end;

      v_confidence := case v_cycle.renewal_policy
        when 'always_ask' then 0
        when 'use_saved_preference' then 0.7
        when c_auto_policy then 0.9
        when 'one_time_renewal' then 0.85
        else 0
      end;

      v_context := jsonb_build_object(
        'flow', 'savings_maturity',
        'savingId', v_cycle.saving_id,
        'cycleId', v_cycle.id,
        'providerId', v_cycle.provider_id,
        'providerName', coalesce(v_provider_name, ''),
        'currentPackage', coalesce(
          v_cycle.package_snapshot->>'packageName',
          v_cycle.product_snapshot->>'packageName',
          v_cycle.product_name,
          ''
        ),
        'currentRate', v_cycle.locked_rate,
        'previousRate', v_previous_rate,
        'rateDifference', case
          when v_previous_rate is not null then v_cycle.locked_rate - v_previous_rate
          else 0
        end,
        'principal', v_cycle.principal,
        'accruedInterest', v_accrued_interest,
        'estimatedInterest', v_accrued_interest,
        'maturityDate', v_cycle.end_date,
        'configuredRenewalPreference', v_cycle.renewal_policy,
        'renewalPolicy', v_cycle.renewal_policy,
        'renewalConfig', jsonb_build_object(
          'preferredPackageId', coalesce(
            v_configured_package_id,
            v_context_package_id
          ),
          'preferredSettlementRule', coalesce(
            v_configured_action,
            v_context_settlement_rule,
            c_roll_principal_interest
          ),
          'preferredSettlementAccountId', coalesce(
            v_settlement_account_id,
            v_context_settlement_account_id
          )
        ),
        'settlementRule', coalesce(
          v_configured_action,
          v_context_settlement_rule,
          v_cycle.product_snapshot->>'settlementRule',
          c_roll_principal_interest
        ),
        'settlementAccountId', coalesce(v_settlement_account_id, v_context_settlement_account_id),
        'recommendedPackages', v_recommended_packages,
        'suggestedAction', v_suggested_action,
        'renewalConfidence', v_confidence,
        'warnings', v_warnings,
        'preselectedPackageId', coalesce(
          v_configured_package_id,
          v_context_package_id
        ),
        'preselectedSettlementRule', coalesce(
          v_configured_action,
          v_context_settlement_rule,
          c_roll_principal_interest
        ),
        'preselectedSettlementAccountId', coalesce(
          v_settlement_account_id,
          v_context_settlement_account_id
        ),
        'autoRenewalFallbackRequired', v_fallback_required
      );

      if v_cycle.renewal_policy = c_auto_policy and v_config_valid then
        v_rollover_result := public.rollover_saving_cycle(
          v_cycle.id,
          v_configured_action,
          v_configured_package_id,
          v_settlement_account_id,
          null,
          null,
          'savings-auto-renew:' || v_cycle.saving_id::text || ':' || v_cycle.id::text
        );

        v_decision := jsonb_build_object(
          'renewalPolicy', v_cycle.renewal_policy,
          'settlementRule', v_configured_action,
          'packageName', v_package.package_name,
          'lockedRate', v_package.annual_interest_rate,
          'decidedAt', timezone('utc', now()),
          'decisionSource', c_policy_applied,
          'action', v_configured_action,
          'policyApplied', c_auto_policy,
          'targetPackageId', v_configured_package_id,
          'rolloverResult', v_rollover_result
        );
        perform public.record_saving_renewal_decision(
          v_cycle.id,
          v_decision,
          false
        );

        select next_cycle.id,
               next_cycle.cycle_number,
               next_cycle.end_date
        into v_next_cycle
        from public.saving_cycles next_cycle
        where next_cycle.id = (v_rollover_result->>'cycleId')::uuid;

        if not found then
          raise exception 'Automatic renewal did not create a cycle';
        end if;

        v_context := v_context || jsonb_build_object(
          'suggestedAction', c_suggestion_none,
          'autoRenewalFallbackRequired', false,
          'autoRenewalOutcome', jsonb_build_object(
            'status', 'completed',
            'policyApplied', c_auto_policy,
            'previousCycleId', v_cycle.id,
            'nextCycleId', v_next_cycle.id,
            'previousCycleNumber', v_cycle.cycle_number,
            'nextCycleNumber', v_next_cycle.cycle_number,
            'packageId', v_configured_package_id,
            'packageName', v_package.package_name,
            'nextMaturityDate', v_next_cycle.end_date,
            'rolloverAmount', (v_rollover_result->>'principal')::numeric,
            'interestRecognized', coalesce(
              (v_rollover_result->>'grossInterest')::numeric,
              0
            ),
            'taxWithheld', coalesce((v_rollover_result->>'tax')::numeric, 0)
          )
        );

        perform public.produce_inbox_item(
          p_household_id => p_household_id,
          p_kind => 'savings_maturity',
          p_source_type => 'guided',
          p_source_id => v_cycle.saving_id,
          p_amount => (v_rollover_result->>'principal')::numeric,
          p_currency => v_currency,
          p_title => coalesce(v_cycle.product_name, 'Saving') || ' — Matured',
          p_context => v_context
        );

        v_auto_renewed_count := v_auto_renewed_count + 1;
      else
        perform public.produce_inbox_item(
          p_household_id => p_household_id,
          p_kind => 'savings_maturity',
          p_source_type => 'guided',
          p_source_id => v_cycle.saving_id,
          p_amount => v_cycle.principal + v_accrued_interest,
          p_currency => v_currency,
          p_title => coalesce(v_cycle.product_name, 'Saving') || ' — Matured',
          p_context => v_context
        );

        if v_fallback_required then
          v_fallback_count := v_fallback_count + 1;
        end if;
      end if;

      v_processed_count := v_processed_count + 1;
    exception when others then
      get stacked diagnostics v_error_state = returned_sqlstate;
      raise warning 'Savings maturity cycle % rolled back with SQLSTATE %',
        v_cycle.id,
        v_error_state;
      v_failed_count := v_failed_count + 1;
    end;
  end loop;

  return jsonb_build_object(
    'ok', true,
    'maturedCount', v_processed_count,
    'autoRenewedCount', v_auto_renewed_count,
    'fallbackCount', v_fallback_count,
    'failedCount', v_failed_count
  );
end;
$function$;

create or replace function private.run_savings_maturity_worker()
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $function$
declare
  v_member record;
  v_previous_subject text := current_setting('request.jwt.claim.sub', true);
  v_previous_claims text := current_setting('request.jwt.claims', true);
  v_as_of_date date := (timezone('utc', now()))::date;
  v_detection_result jsonb;
  v_processed_members integer := 0;
  v_processed_cycles integer := 0;
  v_auto_renewed_cycles integer := 0;
  v_fallback_cycles integer := 0;
  v_failed_cycles integer := 0;
  v_failed_members integer := 0;
  v_error_state text;
begin
  for v_member in
    select distinct member.household_id, member.user_id
    from public.household_members member
    where member.is_active = true
      and exists (
        select 1
        from public.savings saving
        join public.saving_cycles cycle on cycle.saving_id = saving.id
        where saving.household_id = member.household_id
          and cycle.status = 'active'
          and cycle.end_date <= v_as_of_date
      )
    order by member.household_id, member.user_id
  loop
    perform set_config(
      'request.jwt.claim.sub',
      v_member.user_id::text,
      true
    );
    perform set_config(
      'request.jwt.claims',
      jsonb_build_object(
        'sub', v_member.user_id,
        'role', 'authenticated'
      )::text,
      true
    );

    begin
      v_detection_result := public.detect_matured_savings(v_member.household_id);
      v_processed_members := v_processed_members + 1;
      v_processed_cycles := v_processed_cycles
        + coalesce((v_detection_result->>'maturedCount')::integer, 0);
      v_auto_renewed_cycles := v_auto_renewed_cycles
        + coalesce((v_detection_result->>'autoRenewedCount')::integer, 0);
      v_fallback_cycles := v_fallback_cycles
        + coalesce((v_detection_result->>'fallbackCount')::integer, 0);
      v_failed_cycles := v_failed_cycles
        + coalesce((v_detection_result->>'failedCount')::integer, 0);
    exception when others then
      get stacked diagnostics v_error_state = returned_sqlstate;
      raise warning 'Savings maturity worker failed for household % with SQLSTATE %',
        v_member.household_id,
        v_error_state;
      v_failed_members := v_failed_members + 1;
    end;

    perform set_config(
      'request.jwt.claim.sub',
      coalesce(v_previous_subject, ''),
      true
    );
    perform set_config(
      'request.jwt.claims',
      coalesce(v_previous_claims, ''),
      true
    );
  end loop;

  perform set_config(
    'request.jwt.claim.sub',
    coalesce(v_previous_subject, ''),
    true
  );
  perform set_config(
    'request.jwt.claims',
    coalesce(v_previous_claims, ''),
    true
  );

  return jsonb_build_object(
    'processedMemberships', v_processed_members,
    'processedCycles', v_processed_cycles,
    'autoRenewedCycles', v_auto_renewed_cycles,
    'fallbackCycles', v_fallback_cycles,
    'failedCycles', v_failed_cycles,
    'failedMemberships', v_failed_members,
    'asOfDate', v_as_of_date
  );
end;
$function$;

alter function private.run_savings_maturity_worker() owner to postgres;
revoke all on function private.run_savings_maturity_worker()
  from public, anon, authenticated, service_role;
grant execute on function private.run_savings_maturity_worker()
  to postgres;

do $schedule$
declare
  v_job_id bigint;
begin
  if to_regclass('cron.job') is null then
    raise exception 'pg_cron is required for the Savings maturity worker';
  end if;

  for v_job_id in
    select jobid
    from cron.job
    where jobname = 'savings_maturity_worker_daily'
  loop
    perform cron.unschedule(v_job_id);
  end loop;

  perform cron.schedule(
    'savings_maturity_worker_daily',
    '0 1 * * *',
    'select private.run_savings_maturity_worker()'
  );
end;
$schedule$;
