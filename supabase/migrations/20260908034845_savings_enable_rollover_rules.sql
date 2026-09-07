update public.saving_packages as package
set settlement_rules = jsonb_build_array(
  'roll_principal_interest',
  'roll_principal_only',
  'withdraw_everything'
)
from public.saving_providers as provider
where package.provider_id = provider.id
  and provider.display_name = 'Tikop'
  and provider.family = 'PLATFORM'
  and package.is_active = true
  and package.renewable_available = true
  and package.settlement_rules = '["withdraw_everything"]'::jsonb;
