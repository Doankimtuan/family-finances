-- Preserve the legacy write/read contract used by later savings backfills.
alter table public.savings
  add column if not exists renewal_preference text default 'manual_review';

update public.savings
set renewal_preference = case renewal_policy
  when 'always_ask' then 'manual_review'
  when 'use_saved_preference' then 'withdraw_everything'
  when 'auto_renew_until_cancelled' then 'auto_renew_same_package'
  when 'one_time_renewal' then 'auto_renew_same_package'
  else 'manual_review'
end
where renewal_preference is null;
