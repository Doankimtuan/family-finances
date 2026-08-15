-- Compatibility migration for databases that applied the Savings domain
-- migration before the renewal-policy follow-up migration.
-- This is intentionally additive and preserves renewal_preference for legacy
-- readers while exposing the canonical renewal_policy/config fields.

alter table public.savings
  add column if not exists renewal_policy text;

update public.savings
set renewal_policy = case renewal_preference
  when 'manual_review' then 'always_ask'
  when 'auto_renew_same_package' then 'auto_renew_until_cancelled'
  when 'auto_renew_selected_package' then 'auto_renew_until_cancelled'
  when 'withdraw_everything' then 'use_saved_preference'
  when 'always_ask' then 'always_ask'
  when 'use_saved_preference' then 'use_saved_preference'
  when 'auto_renew_until_cancelled' then 'auto_renew_until_cancelled'
  when 'one_time_renewal' then 'one_time_renewal'
  else 'always_ask'
end
where renewal_policy is null;

alter table public.savings
  alter column renewal_policy set default 'always_ask',
  alter column renewal_policy set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'savings_renewal_policy_compat_check'
      and conrelid = 'public.savings'::regclass
  ) then
    alter table public.savings
      add constraint savings_renewal_policy_compat_check check (
        renewal_policy in (
          'always_ask',
          'use_saved_preference',
          'auto_renew_until_cancelled',
          'one_time_renewal'
        )
      );
  end if;
end
$$;

alter table public.savings
  add column if not exists renewal_config jsonb not null default '{}'::jsonb;

update public.savings
set renewal_config = jsonb_build_object(
  'preferredPackageId', null,
  'preferredSettlementRule', 'withdraw_everything',
  'preferredSettlementAccountId', settlement_account_id
)
where renewal_policy = 'use_saved_preference'
  and renewal_config = '{}'::jsonb;

alter table public.saving_cycles
  add column if not exists renewal_decision jsonb;
