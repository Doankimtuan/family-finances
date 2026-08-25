-- Prerequisite for savings follow-on RPCs. The domain migration adds policies,
-- grants, seed rows, and runtime functions after these tables exist.
create table if not exists public.saving_providers (
  id uuid primary key default gen_random_uuid(),
  provider_key text not null unique,
  display_name text not null,
  saving_type text not null,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint saving_providers_type_check check (
    saving_type in ('bank_deposit', 'digital_saving', 'flexible_saving', 'manual_saving')
  )
);

create table if not exists public.saving_packages (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.saving_providers(id) on delete cascade,
  package_name text not null,
  duration_days int not null,
  annual_interest_rate numeric(10, 6) not null,
  min_amount numeric(18, 0),
  max_amount numeric(18, 0),
  settlement_rules jsonb not null default '["roll_principal_interest"]'::jsonb,
  penalty_rules jsonb not null default '[]'::jsonb,
  renewable_available boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint saving_packages_duration_positive check (duration_days > 0),
  constraint saving_packages_rate_nonneg check (annual_interest_rate >= 0)
);

create table if not exists public.savings (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  status text not null default 'active',
  funding_account_id uuid not null references public.accounts(id),
  settlement_account_id uuid not null references public.accounts(id),
  provider_id uuid not null references public.saving_providers(id),
  product_name text not null default '',
  product_snapshot jsonb not null,
  renewal_preference text not null default 'manual_review',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint savings_status_check check (
    status in ('active', 'matured', 'early_closed', 'closed')
  ),
  constraint savings_renewal_preference_check check (
    renewal_preference in ('manual_review', 'auto_renew_same_package', 'auto_renew_selected_package', 'withdraw_everything')
  )
);

create table if not exists public.saving_cycles (
  id uuid primary key default gen_random_uuid(),
  saving_id uuid not null references public.savings(id) on delete cascade,
  cycle_number int not null,
  start_date date not null,
  end_date date not null,
  principal numeric(18, 0) not null,
  locked_rate numeric(10, 6) not null,
  package_snapshot jsonb not null,
  accrued_interest numeric(18, 0) not null default 0,
  settlement_result jsonb,
  status text not null default 'active',
  funding_transaction_id uuid references public.transactions(id) on delete set null,
  settlement_transaction_id uuid references public.transactions(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint saving_cycles_principal_positive check (principal > 0),
  constraint saving_cycles_rate_nonneg check (locked_rate >= 0),
  constraint saving_cycles_status_check check (
    status in ('active', 'matured', 'early_closed', 'rolled')
  ),
  constraint saving_cycles_unique_number unique (saving_id, cycle_number)
);

create table if not exists public.early_withdrawals (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.saving_cycles(id),
  saving_id uuid not null references public.savings(id),
  requested_at timestamptz not null default now(),
  principal numeric(18, 0) not null,
  accrued_interest numeric(18, 0) not null,
  eligible_interest numeric(18, 0) not null,
  penalty_amount numeric(18, 0) not null,
  net_returned numeric(18, 0) not null,
  penalty_strategy text not null,
  settlement_transaction_id uuid references public.transactions(id) on delete set null,
  executed_by uuid references auth.users(id) on delete set null,
  constraint early_withdrawals_net_nonneg check (net_returned >= 0)
);
