-- ============================================================================
-- 00005_seed_demo_household.sql
-- Fictional Vietnamese household with 6 months of realistic history.
-- ============================================================================

-- Household IDs
-- Minh Nguyen: f7000000-0000-0000-0000-000000000101
-- Linh Tran:   f7000000-0000-0000-0000-000000000102
-- Household:   f7000000-0000-0000-0000-000000000001

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    'f7000000-0000-0000-0000-000000000101',
    'authenticated',
    'authenticated',
    'minh.nguyen.family@example.com',
    crypt('DemoPass#2026', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Minh Nguyen"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'f7000000-0000-0000-0000-000000000102',
    'authenticated',
    'authenticated',
    'linh.tran.family@example.com',
    crypt('DemoPass#2026', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Linh Tran"}',
    now(),
    now()
  )
on conflict (id) do nothing;

insert into public.profiles (user_id, full_name, email)
values
  ('f7000000-0000-0000-0000-000000000101', 'Minh Nguyen', 'minh.nguyen.family@example.com'),
  ('f7000000-0000-0000-0000-000000000102', 'Linh Tran', 'linh.tran.family@example.com')
on conflict (user_id)
do update set
  full_name = excluded.full_name,
  email = excluded.email,
  updated_at = now();

insert into public.households (id, name, base_currency, locale, timezone, created_by)
values (
  'f7000000-0000-0000-0000-000000000001',
  'Nguyen-Tran Household',
  'VND',
  'en-VN',
  'Asia/Ho_Chi_Minh',
  'f7000000-0000-0000-0000-000000000101'
)
on conflict (id) do nothing;

insert into public.household_members (id, household_id, user_id, role, is_active, joined_at, invited_by)
values
  (
    'f7000000-0000-0000-0000-000000000111',
    'f7000000-0000-0000-0000-000000000001',
    'f7000000-0000-0000-0000-000000000101',
    'partner',
    true,
    '2025-09-01 08:00:00+07',
    'f7000000-0000-0000-0000-000000000101'
  ),
  (
    'f7000000-0000-0000-0000-000000000112',
    'f7000000-0000-0000-0000-000000000001',
    'f7000000-0000-0000-0000-000000000102',
    'partner',
    true,
    '2025-09-01 08:30:00+07',
    'f7000000-0000-0000-0000-000000000101'
  )
on conflict (household_id, user_id) do nothing;

insert into public.household_invitations (id, household_id, email, token, status, expires_at, invited_by, accepted_by, created_at)
values
  (
    'f7000000-0000-0000-0000-000000000121',
    'f7000000-0000-0000-0000-000000000001',
    'linh.tran.family@example.com',
    'f7000000-0000-0000-0000-000000000122',
    'accepted',
    '2025-10-01 00:00:00+07',
    'f7000000-0000-0000-0000-000000000101',
    'f7000000-0000-0000-0000-000000000102',
    '2025-09-01 08:10:00+07'
  )
on conflict (id) do nothing;

insert into public.accounts (
  id,
  household_id,
  name,
  type,
  institution,
  opening_balance,
  opening_balance_date,
  include_in_net_worth,
  is_archived,
  created_by
)
values
  (
    'f7000000-0000-0000-0000-000000000201',
    'f7000000-0000-0000-0000-000000000001',
    'Vietcombank Main Checking',
    'checking',
    'Vietcombank',
    68000000,
    '2025-09-01',
    true,
    false,
    'f7000000-0000-0000-0000-000000000101'
  ),
  (
    'f7000000-0000-0000-0000-000000000202',
    'f7000000-0000-0000-0000-000000000001',
    'Techcombank Salary Account',
    'checking',
    'Techcombank',
    41000000,
    '2025-09-01',
    true,
    false,
    'f7000000-0000-0000-0000-000000000102'
  ),
  (
    'f7000000-0000-0000-0000-000000000203',
    'f7000000-0000-0000-0000-000000000001',
    'MoMo Wallet',
    'ewallet',
    'MoMo',
    6000000,
    '2025-09-01',
    true,
    false,
    'f7000000-0000-0000-0000-000000000102'
  )
on conflict (id) do nothing;

insert into public.assets (
  id,
  household_id,
  name,
  asset_class,
  subtype,
  unit_label,
  quantity,
  acquisition_cost,
  acquisition_date,
  is_liquid,
  include_in_net_worth,
  is_archived,
  notes,
  created_by
)
values
  (
    'f7000000-0000-0000-0000-000000000301',
    'f7000000-0000-0000-0000-000000000001',
    'SJC Gold Holding',
    'gold',
    'sjc_bar',
    'luong',
    4.200000,
    327600000,
    '2024-08-15',
    true,
    true,
    false,
    'Family safety reserve in physical gold',
    'f7000000-0000-0000-0000-000000000102'
  ),
  (
    'f7000000-0000-0000-0000-000000000302',
    'f7000000-0000-0000-0000-000000000001',
    'VinaCapital Equity Opportunity Fund',
    'mutual_fund',
    'ccq',
    'unit',
    6800.000000,
    101400000,
    '2025-03-01',
    true,
    true,
    false,
    'Regular monthly CCQ contributions',
    'f7000000-0000-0000-0000-000000000101'
  ),
  (
    'f7000000-0000-0000-0000-000000000303',
    'f7000000-0000-0000-0000-000000000001',
    'BIDV 12-Month Savings Deposit',
    'savings_deposit',
    'fixed_term',
    'contract',
    1.000000,
    250000000,
    '2025-06-01',
    true,
    true,
    false,
    'Down payment reserve for land plan',
    'f7000000-0000-0000-0000-000000000101'
  ),
  (
    'f7000000-0000-0000-0000-000000000304',
    'f7000000-0000-0000-0000-000000000001',
    'Thu Duc Land Plot (Estimated)',
    'real_estate',
    'land',
    'plot',
    1.000000,
    2450000000,
    '2024-05-20',
    false,
    true,
    false,
    'Tracked by monthly market estimate',
    'f7000000-0000-0000-0000-000000000101'
  ),
  (
    'f7000000-0000-0000-0000-000000000305',
    'f7000000-0000-0000-0000-000000000001',
    'Toyota Vios 2022',
    'vehicle',
    'car',
    'vehicle',
    1.000000,
    620000000,
    '2022-10-01',
    false,
    true,
    false,
    'Family car, depreciating asset',
    'f7000000-0000-0000-0000-000000000102'
  )
on conflict (id) do nothing;

insert into public.savings_deposit_terms (
  asset_id,
  principal_amount,
  annual_rate,
  compounding,
  start_date,
  maturity_date,
  payout_account_id
)
values
  (
    'f7000000-0000-0000-0000-000000000303',
    250000000,
    0.061000,
    'at_maturity',
    '2025-06-01',
    '2026-06-01',
    'f7000000-0000-0000-0000-000000000201'
  )
on conflict (asset_id) do nothing;

insert into public.asset_quantity_history (asset_id, household_id, as_of_date, quantity, source, created_by)
values
  ('f7000000-0000-0000-0000-000000000301', 'f7000000-0000-0000-0000-000000000001', '2025-09-01', 4.2, 'manual', 'f7000000-0000-0000-0000-000000000102'),
  ('f7000000-0000-0000-0000-000000000301', 'f7000000-0000-0000-0000-000000000001', '2025-10-01', 4.2, 'manual', 'f7000000-0000-0000-0000-000000000102'),
  ('f7000000-0000-0000-0000-000000000301', 'f7000000-0000-0000-0000-000000000001', '2025-11-01', 4.2, 'manual', 'f7000000-0000-0000-0000-000000000102'),
  ('f7000000-0000-0000-0000-000000000301', 'f7000000-0000-0000-0000-000000000001', '2025-12-01', 4.2, 'manual', 'f7000000-0000-0000-0000-000000000102'),
  ('f7000000-0000-0000-0000-000000000301', 'f7000000-0000-0000-0000-000000000001', '2026-01-01', 4.2, 'manual', 'f7000000-0000-0000-0000-000000000102'),
  ('f7000000-0000-0000-0000-000000000301', 'f7000000-0000-0000-0000-000000000001', '2026-02-01', 4.2, 'manual', 'f7000000-0000-0000-0000-000000000102'),
  ('f7000000-0000-0000-0000-000000000302', 'f7000000-0000-0000-0000-000000000001', '2025-09-01', 6200, 'manual', 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000302', 'f7000000-0000-0000-0000-000000000001', '2025-10-01', 6320, 'manual', 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000302', 'f7000000-0000-0000-0000-000000000001', '2025-11-01', 6440, 'manual', 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000302', 'f7000000-0000-0000-0000-000000000001', '2025-12-01', 6560, 'manual', 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000302', 'f7000000-0000-0000-0000-000000000001', '2026-01-01', 6680, 'manual', 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000302', 'f7000000-0000-0000-0000-000000000001', '2026-02-01', 6800, 'manual', 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000304', 'f7000000-0000-0000-0000-000000000001', '2025-09-01', 1, 'manual', 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000304', 'f7000000-0000-0000-0000-000000000001', '2025-10-01', 1, 'manual', 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000304', 'f7000000-0000-0000-0000-000000000001', '2025-11-01', 1, 'manual', 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000304', 'f7000000-0000-0000-0000-000000000001', '2025-12-01', 1, 'manual', 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000304', 'f7000000-0000-0000-0000-000000000001', '2026-01-01', 1, 'manual', 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000304', 'f7000000-0000-0000-0000-000000000001', '2026-02-01', 1, 'manual', 'f7000000-0000-0000-0000-000000000101')
on conflict (asset_id, as_of_date) do nothing;

insert into public.asset_price_history (asset_id, household_id, as_of_date, unit_price, price_currency, source, created_by)
values
  ('f7000000-0000-0000-0000-000000000301', 'f7000000-0000-0000-0000-000000000001', '2025-09-01', 82000000,  'VND', 'manual', 'f7000000-0000-0000-0000-000000000102'),
  ('f7000000-0000-0000-0000-000000000301', 'f7000000-0000-0000-0000-000000000001', '2025-10-01', 83500000,  'VND', 'manual', 'f7000000-0000-0000-0000-000000000102'),
  ('f7000000-0000-0000-0000-000000000301', 'f7000000-0000-0000-0000-000000000001', '2025-11-01', 85000000,  'VND', 'manual', 'f7000000-0000-0000-0000-000000000102'),
  ('f7000000-0000-0000-0000-000000000301', 'f7000000-0000-0000-0000-000000000001', '2025-12-01', 87000000,  'VND', 'manual', 'f7000000-0000-0000-0000-000000000102'),
  ('f7000000-0000-0000-0000-000000000301', 'f7000000-0000-0000-0000-000000000001', '2026-01-01', 89000000,  'VND', 'manual', 'f7000000-0000-0000-0000-000000000102'),
  ('f7000000-0000-0000-0000-000000000301', 'f7000000-0000-0000-0000-000000000001', '2026-02-01', 91000000,  'VND', 'manual', 'f7000000-0000-0000-0000-000000000102'),
  ('f7000000-0000-0000-0000-000000000302', 'f7000000-0000-0000-0000-000000000001', '2025-09-01', 15000,     'VND', 'manual', 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000302', 'f7000000-0000-0000-0000-000000000001', '2025-10-01', 15220,     'VND', 'manual', 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000302', 'f7000000-0000-0000-0000-000000000001', '2025-11-01', 15480,     'VND', 'manual', 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000302', 'f7000000-0000-0000-0000-000000000001', '2025-12-01', 15700,     'VND', 'manual', 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000302', 'f7000000-0000-0000-0000-000000000001', '2026-01-01', 15900,     'VND', 'manual', 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000302', 'f7000000-0000-0000-0000-000000000001', '2026-02-01', 16200,     'VND', 'manual', 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000303', 'f7000000-0000-0000-0000-000000000001', '2025-09-01', 250000000, 'VND', 'manual', 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000303', 'f7000000-0000-0000-0000-000000000001', '2025-10-01', 251200000, 'VND', 'manual', 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000303', 'f7000000-0000-0000-0000-000000000001', '2025-11-01', 252500000, 'VND', 'manual', 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000303', 'f7000000-0000-0000-0000-000000000001', '2025-12-01', 253800000, 'VND', 'manual', 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000303', 'f7000000-0000-0000-0000-000000000001', '2026-01-01', 255100000, 'VND', 'manual', 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000303', 'f7000000-0000-0000-0000-000000000001', '2026-02-01', 256400000, 'VND', 'manual', 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000304', 'f7000000-0000-0000-0000-000000000001', '2025-09-01', 2450000000, 'VND', 'manual', 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000304', 'f7000000-0000-0000-0000-000000000001', '2025-10-01', 2480000000, 'VND', 'manual', 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000304', 'f7000000-0000-0000-0000-000000000001', '2025-11-01', 2510000000, 'VND', 'manual', 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000304', 'f7000000-0000-0000-0000-000000000001', '2025-12-01', 2550000000, 'VND', 'manual', 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000304', 'f7000000-0000-0000-0000-000000000001', '2026-01-01', 2590000000, 'VND', 'manual', 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000304', 'f7000000-0000-0000-0000-000000000001', '2026-02-01', 2620000000, 'VND', 'manual', 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000305', 'f7000000-0000-0000-0000-000000000001', '2025-09-01', 590000000,  'VND', 'manual', 'f7000000-0000-0000-0000-000000000102'),
  ('f7000000-0000-0000-0000-000000000305', 'f7000000-0000-0000-0000-000000000001', '2025-10-01', 585000000,  'VND', 'manual', 'f7000000-0000-0000-0000-000000000102'),
  ('f7000000-0000-0000-0000-000000000305', 'f7000000-0000-0000-0000-000000000001', '2025-11-01', 580000000,  'VND', 'manual', 'f7000000-0000-0000-0000-000000000102'),
  ('f7000000-0000-0000-0000-000000000305', 'f7000000-0000-0000-0000-000000000001', '2025-12-01', 574000000,  'VND', 'manual', 'f7000000-0000-0000-0000-000000000102'),
  ('f7000000-0000-0000-0000-000000000305', 'f7000000-0000-0000-0000-000000000001', '2026-01-01', 568000000,  'VND', 'manual', 'f7000000-0000-0000-0000-000000000102'),
  ('f7000000-0000-0000-0000-000000000305', 'f7000000-0000-0000-0000-000000000001', '2026-02-01', 562000000,  'VND', 'manual', 'f7000000-0000-0000-0000-000000000102')
on conflict (asset_id, as_of_date) do nothing;

insert into public.asset_cashflows (asset_id, household_id, flow_date, flow_type, amount, note, created_by)
values
  ('f7000000-0000-0000-0000-000000000302', 'f7000000-0000-0000-0000-000000000001', '2025-09-28', 'contribution', 5000000, 'Monthly CCQ investment', 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000302', 'f7000000-0000-0000-0000-000000000001', '2025-10-28', 'contribution', 5000000, 'Monthly CCQ investment', 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000302', 'f7000000-0000-0000-0000-000000000001', '2025-11-28', 'contribution', 5000000, 'Monthly CCQ investment', 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000302', 'f7000000-0000-0000-0000-000000000001', '2025-12-28', 'contribution', 5000000, 'Monthly CCQ investment', 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000302', 'f7000000-0000-0000-0000-000000000001', '2026-01-28', 'contribution', 5000000, 'Monthly CCQ investment', 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000302', 'f7000000-0000-0000-0000-000000000001', '2026-02-28', 'contribution', 7000000, 'Bonus top-up CCQ investment', 'f7000000-0000-0000-0000-000000000101')
on conflict do nothing;

insert into public.liabilities (
  id,
  household_id,
  name,
  liability_type,
  lender_name,
  principal_original,
  start_date,
  term_months,
  repayment_method,
  current_principal_outstanding,
  promo_rate_annual,
  promo_months,
  floating_rate_margin,
  next_payment_date,
  include_in_net_worth,
  is_active,
  relationship_label,
  notes,
  created_by
)
values
  (
    'f7000000-0000-0000-0000-000000000401',
    'f7000000-0000-0000-0000-000000000001',
    'VPBank Apartment Mortgage',
    'mortgage',
    'VPBank',
    1600000000,
    '2024-09-01',
    240,
    'annuity',
    1478000000,
    0.075000,
    18,
    0.032000,
    '2026-03-06',
    true,
    true,
    null,
    'Promo 7.5% then floating reference + 3.2%',
    'f7000000-0000-0000-0000-000000000101'
  ),
  (
    'f7000000-0000-0000-0000-000000000402',
    'f7000000-0000-0000-0000-000000000001',
    'Family Loan from Parents',
    'family_loan',
    'Linh parents',
    240000000,
    '2024-06-01',
    null,
    'flexible',
    180000000,
    0,
    null,
    null,
    '2026-03-15',
    true,
    true,
    'parents',
    'Interest-free. Relationship trust is important.',
    'f7000000-0000-0000-0000-000000000102'
  )
on conflict (id) do nothing;

insert into public.liability_rate_periods (liability_id, household_id, period_start, period_end, annual_rate, is_promotional, created_by)
values
  ('f7000000-0000-0000-0000-000000000401', 'f7000000-0000-0000-0000-000000000001', '2024-09-01', '2026-02-28', 0.075000, true,  'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000401', 'f7000000-0000-0000-0000-000000000001', '2026-03-01', null,         0.112000, false, 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000402', 'f7000000-0000-0000-0000-000000000001', '2024-06-01', null,         0.000000, false, 'f7000000-0000-0000-0000-000000000102')
on conflict (liability_id, period_start) do nothing;

insert into public.liability_payments (
  liability_id,
  household_id,
  payment_date,
  scheduled_amount,
  actual_amount,
  principal_component,
  interest_component,
  fee_component,
  source_account_id,
  entered_by
)
values
  ('f7000000-0000-0000-0000-000000000401', 'f7000000-0000-0000-0000-000000000001', '2025-09-06', 12650000, 12650000, 3400000, 9250000, 0, 'f7000000-0000-0000-0000-000000000201', 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000401', 'f7000000-0000-0000-0000-000000000001', '2025-10-06', 12650000, 12650000, 3460000, 9190000, 0, 'f7000000-0000-0000-0000-000000000201', 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000401', 'f7000000-0000-0000-0000-000000000001', '2025-11-06', 12650000, 12650000, 3520000, 9130000, 0, 'f7000000-0000-0000-0000-000000000201', 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000401', 'f7000000-0000-0000-0000-000000000001', '2025-12-06', 12650000, 12650000, 3580000, 9070000, 0, 'f7000000-0000-0000-0000-000000000201', 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000401', 'f7000000-0000-0000-0000-000000000001', '2026-01-06', 12650000, 12650000, 3640000, 9010000, 0, 'f7000000-0000-0000-0000-000000000201', 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000401', 'f7000000-0000-0000-0000-000000000001', '2026-02-06', 12650000, 12650000, 3700000, 8950000, 0, 'f7000000-0000-0000-0000-000000000201', 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000402', 'f7000000-0000-0000-0000-000000000001', '2025-09-15', 10000000, 10000000, 10000000, 0, 0, 'f7000000-0000-0000-0000-000000000202', 'f7000000-0000-0000-0000-000000000102'),
  ('f7000000-0000-0000-0000-000000000402', 'f7000000-0000-0000-0000-000000000001', '2025-10-15', 10000000, 10000000, 10000000, 0, 0, 'f7000000-0000-0000-0000-000000000202', 'f7000000-0000-0000-0000-000000000102'),
  ('f7000000-0000-0000-0000-000000000402', 'f7000000-0000-0000-0000-000000000001', '2025-11-15', 10000000, 10000000, 10000000, 0, 0, 'f7000000-0000-0000-0000-000000000202', 'f7000000-0000-0000-0000-000000000102'),
  ('f7000000-0000-0000-0000-000000000402', 'f7000000-0000-0000-0000-000000000001', '2025-12-15', 10000000, 10000000, 10000000, 0, 0, 'f7000000-0000-0000-0000-000000000202', 'f7000000-0000-0000-0000-000000000102'),
  ('f7000000-0000-0000-0000-000000000402', 'f7000000-0000-0000-0000-000000000001', '2026-01-15', 10000000, 10000000, 10000000, 0, 0, 'f7000000-0000-0000-0000-000000000202', 'f7000000-0000-0000-0000-000000000102'),
  ('f7000000-0000-0000-0000-000000000402', 'f7000000-0000-0000-0000-000000000001', '2026-02-15', 10000000, 10000000, 10000000, 0, 0, 'f7000000-0000-0000-0000-000000000202', 'f7000000-0000-0000-0000-000000000102')
on conflict do nothing;

insert into public.goals (
  id,
  household_id,
  goal_type,
  name,
  target_amount,
  target_date,
  start_date,
  priority,
  status,
  notes,
  created_by
)
values
  (
    'f7000000-0000-0000-0000-000000000501',
    'f7000000-0000-0000-0000-000000000001',
    'emergency_fund',
    'Emergency Fund (6 months essentials)',
    240000000,
    '2026-10-01',
    '2025-09-01',
    1,
    'active',
    'Goal: maintain six months of essential expenses',
    'f7000000-0000-0000-0000-000000000101'
  ),
  (
    'f7000000-0000-0000-0000-000000000502',
    'f7000000-0000-0000-0000-000000000001',
    'property_purchase',
    'Land Purchase in Thu Duc',
    3500000000,
    '2029-12-31',
    '2025-09-01',
    2,
    'active',
    'Primary 3-year aspirational goal',
    'f7000000-0000-0000-0000-000000000101'
  ),
  (
    'f7000000-0000-0000-0000-000000000503',
    'f7000000-0000-0000-0000-000000000001',
    'vehicle',
    'Upgrade Family Car',
    420000000,
    '2027-06-30',
    '2025-12-01',
    3,
    'active',
    'Replace current vehicle without new debt',
    'f7000000-0000-0000-0000-000000000102'
  )
on conflict (id) do nothing;

insert into public.goal_contributions (goal_id, household_id, contribution_date, amount, source_account_id, member_id, note)
values
  ('f7000000-0000-0000-0000-000000000501', 'f7000000-0000-0000-0000-000000000001', '2025-09-28', 8000000,  'f7000000-0000-0000-0000-000000000201', 'f7000000-0000-0000-0000-000000000101', 'Monthly emergency fund contribution'),
  ('f7000000-0000-0000-0000-000000000501', 'f7000000-0000-0000-0000-000000000001', '2025-10-28', 8000000,  'f7000000-0000-0000-0000-000000000201', 'f7000000-0000-0000-0000-000000000101', 'Monthly emergency fund contribution'),
  ('f7000000-0000-0000-0000-000000000501', 'f7000000-0000-0000-0000-000000000001', '2025-11-28', 8000000,  'f7000000-0000-0000-0000-000000000201', 'f7000000-0000-0000-0000-000000000101', 'Monthly emergency fund contribution'),
  ('f7000000-0000-0000-0000-000000000501', 'f7000000-0000-0000-0000-000000000001', '2025-12-28', 8000000,  'f7000000-0000-0000-0000-000000000201', 'f7000000-0000-0000-0000-000000000101', 'Monthly emergency fund contribution'),
  ('f7000000-0000-0000-0000-000000000501', 'f7000000-0000-0000-0000-000000000001', '2026-01-28', 9000000,  'f7000000-0000-0000-0000-000000000201', 'f7000000-0000-0000-0000-000000000101', 'Raised contribution after budget review'),
  ('f7000000-0000-0000-0000-000000000501', 'f7000000-0000-0000-0000-000000000001', '2026-02-28', 10000000, 'f7000000-0000-0000-0000-000000000201', 'f7000000-0000-0000-0000-000000000101', 'Raised contribution after Tet bonus'),
  ('f7000000-0000-0000-0000-000000000502', 'f7000000-0000-0000-0000-000000000001', '2025-09-28', 18000000, 'f7000000-0000-0000-0000-000000000201', 'f7000000-0000-0000-0000-000000000101', 'Land fund allocation'),
  ('f7000000-0000-0000-0000-000000000502', 'f7000000-0000-0000-0000-000000000001', '2025-10-28', 18000000, 'f7000000-0000-0000-0000-000000000201', 'f7000000-0000-0000-0000-000000000101', 'Land fund allocation'),
  ('f7000000-0000-0000-0000-000000000502', 'f7000000-0000-0000-0000-000000000001', '2025-11-28', 18000000, 'f7000000-0000-0000-0000-000000000201', 'f7000000-0000-0000-0000-000000000101', 'Land fund allocation'),
  ('f7000000-0000-0000-0000-000000000502', 'f7000000-0000-0000-0000-000000000001', '2025-12-28', 20000000, 'f7000000-0000-0000-0000-000000000201', 'f7000000-0000-0000-0000-000000000101', 'Year-end bonus top-up'),
  ('f7000000-0000-0000-0000-000000000502', 'f7000000-0000-0000-0000-000000000001', '2026-01-28', 18000000, 'f7000000-0000-0000-0000-000000000201', 'f7000000-0000-0000-0000-000000000101', 'Land fund allocation'),
  ('f7000000-0000-0000-0000-000000000502', 'f7000000-0000-0000-0000-000000000001', '2026-02-28', 38000000, 'f7000000-0000-0000-0000-000000000201', 'f7000000-0000-0000-0000-000000000101', 'Tet bonus and monthly allocation'),
  ('f7000000-0000-0000-0000-000000000503', 'f7000000-0000-0000-0000-000000000001', '2025-12-28', 6000000,  'f7000000-0000-0000-0000-000000000202', 'f7000000-0000-0000-0000-000000000102', 'Car goal started'),
  ('f7000000-0000-0000-0000-000000000503', 'f7000000-0000-0000-0000-000000000001', '2026-01-28', 6000000,  'f7000000-0000-0000-0000-000000000202', 'f7000000-0000-0000-0000-000000000102', 'Monthly car goal contribution'),
  ('f7000000-0000-0000-0000-000000000503', 'f7000000-0000-0000-0000-000000000001', '2026-02-28', 7000000,  'f7000000-0000-0000-0000-000000000202', 'f7000000-0000-0000-0000-000000000102', 'Increased contribution')
on conflict do nothing;

insert into public.goal_snapshots (goal_id, household_id, snapshot_date, funded_amount, progress_ratio, required_monthly, eta_date, on_track)
values
  ('f7000000-0000-0000-0000-000000000501', 'f7000000-0000-0000-0000-000000000001', '2025-09-01', 128000000, 0.533333, 9333333,  '2026-10-15', true),
  ('f7000000-0000-0000-0000-000000000501', 'f7000000-0000-0000-0000-000000000001', '2025-10-01', 136000000, 0.566667, 9230769,  '2026-10-10', true),
  ('f7000000-0000-0000-0000-000000000501', 'f7000000-0000-0000-0000-000000000001', '2025-11-01', 144000000, 0.600000, 9142857,  '2026-10-05', true),
  ('f7000000-0000-0000-0000-000000000501', 'f7000000-0000-0000-0000-000000000001', '2025-12-01', 152000000, 0.633333, 9090909,  '2026-10-01', true),
  ('f7000000-0000-0000-0000-000000000501', 'f7000000-0000-0000-0000-000000000001', '2026-01-01', 161000000, 0.670833, 8777778,  '2026-09-20', true),
  ('f7000000-0000-0000-0000-000000000501', 'f7000000-0000-0000-0000-000000000001', '2026-02-01', 171000000, 0.712500, 8636364,  '2026-09-12', true),
  ('f7000000-0000-0000-0000-000000000502', 'f7000000-0000-0000-0000-000000000001', '2025-09-01', 360000000, 0.102857, 81666667, '2029-11-30', false),
  ('f7000000-0000-0000-0000-000000000502', 'f7000000-0000-0000-0000-000000000001', '2026-02-01', 470000000, 0.134286, 78000000, '2029-10-31', false)
on conflict (goal_id, snapshot_date) do nothing;

insert into public.recurring_rules (
  household_id,
  template_json,
  frequency,
  interval,
  day_of_month,
  start_date,
  next_run_date,
  is_active,
  created_by
)
values
  (
    'f7000000-0000-0000-0000-000000000001',
    '{"type":"income","category_id":"10000000-0000-0000-0000-000000000001","account_id":"f7000000-0000-0000-0000-000000000201","amount":34000000,"description":"Minh salary"}',
    'monthly',
    1,
    5,
    '2025-09-01',
    '2026-03-05',
    true,
    'f7000000-0000-0000-0000-000000000101'
  ),
  (
    'f7000000-0000-0000-0000-000000000001',
    '{"type":"expense","category_id":"20000000-0000-0000-0000-000000000002","account_id":"f7000000-0000-0000-0000-000000000201","amount":12000000,"description":"Housing payment"}',
    'monthly',
    1,
    2,
    '2025-09-01',
    '2026-03-02',
    true,
    'f7000000-0000-0000-0000-000000000102'
  )
on conflict do nothing;

insert into public.monthly_budgets (household_id, month, category_id, planned_amount, created_by)
values
  ('f7000000-0000-0000-0000-000000000001', '2026-02-01', '20000000-0000-0000-0000-000000000001', 9800000,  'f7000000-0000-0000-0000-000000000102'),
  ('f7000000-0000-0000-0000-000000000001', '2026-02-01', '20000000-0000-0000-0000-000000000002', 12000000, 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000001', '2026-02-01', '20000000-0000-0000-0000-000000000003', 2200000,  'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000001', '2026-02-01', '20000000-0000-0000-0000-000000000004', 2100000,  'f7000000-0000-0000-0000-000000000102'),
  ('f7000000-0000-0000-0000-000000000001', '2026-02-01', '20000000-0000-0000-0000-000000000012', 22650000, 'f7000000-0000-0000-0000-000000000101')
on conflict (household_id, month, category_id) do nothing;

-- 6 months of transaction history (Sep 2025 -> Feb 2026)
with months as (
  select
    gs::date as month_start,
    row_number() over (order by gs)::int as month_idx
  from generate_series(date '2025-09-01', date '2026-02-01', interval '1 month') gs
)
insert into public.transactions (
  household_id,
  account_id,
  type,
  amount,
  currency,
  transaction_date,
  description,
  category_id,
  paid_by_member_id,
  status,
  created_by
)
select
  'f7000000-0000-0000-0000-000000000001',
  'f7000000-0000-0000-0000-000000000201',
  'income',
  34000000 + ((month_idx - 1) * 300000),
  'VND',
  month_start + interval '4 days',
  'Minh salary',
  '10000000-0000-0000-0000-000000000001',
  'f7000000-0000-0000-0000-000000000101',
  'cleared',
  'f7000000-0000-0000-0000-000000000101'
from months;

with months as (
  select
    gs::date as month_start,
    row_number() over (order by gs)::int as month_idx
  from generate_series(date '2025-09-01', date '2026-02-01', interval '1 month') gs
)
insert into public.transactions (
  household_id,
  account_id,
  type,
  amount,
  currency,
  transaction_date,
  description,
  category_id,
  paid_by_member_id,
  status,
  created_by
)
select
  'f7000000-0000-0000-0000-000000000001',
  'f7000000-0000-0000-0000-000000000202',
  'income',
  26000000 + ((month_idx - 1) * 200000),
  'VND',
  month_start + interval '6 days',
  'Linh salary',
  '10000000-0000-0000-0000-000000000001',
  'f7000000-0000-0000-0000-000000000102',
  'cleared',
  'f7000000-0000-0000-0000-000000000102'
from months;

with months as (
  select
    gs::date as month_start,
    row_number() over (order by gs)::int as month_idx
  from generate_series(date '2025-09-01', date '2026-02-01', interval '1 month') gs
)
insert into public.transactions (
  household_id,
  account_id,
  type,
  amount,
  currency,
  transaction_date,
  description,
  category_id,
  paid_by_member_id,
  status,
  created_by
)
select
  'f7000000-0000-0000-0000-000000000001',
  'f7000000-0000-0000-0000-000000000201',
  'income',
  4500000 + (month_idx * 150000),
  'VND',
  month_start + interval '20 days',
  'Freelance project payout',
  '10000000-0000-0000-0000-000000000003',
  'f7000000-0000-0000-0000-000000000101',
  'cleared',
  'f7000000-0000-0000-0000-000000000101'
from months
where month_idx in (2, 4, 6);

insert into public.transactions (
  household_id,
  account_id,
  type,
  amount,
  currency,
  transaction_date,
  description,
  category_id,
  paid_by_member_id,
  status,
  created_by
)
values
  ('f7000000-0000-0000-0000-000000000001', 'f7000000-0000-0000-0000-000000000201', 'income', 12000000, 'VND', '2025-12-30', 'Year-end bonus', '10000000-0000-0000-0000-000000000002', 'f7000000-0000-0000-0000-000000000101', 'cleared', 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000001', 'f7000000-0000-0000-0000-000000000202', 'income', 15000000, 'VND', '2026-02-01', 'Tet bonus',      '10000000-0000-0000-0000-000000000002', 'f7000000-0000-0000-0000-000000000102', 'cleared', 'f7000000-0000-0000-0000-000000000102')
on conflict do nothing;

with months as (
  select gs::date as month_start
  from generate_series(date '2025-09-01', date '2026-02-01', interval '1 month') gs
)
insert into public.transactions (
  household_id, account_id, type, amount, currency, transaction_date, description, category_id, paid_by_member_id, status, created_by
)
select
  'f7000000-0000-0000-0000-000000000001',
  'f7000000-0000-0000-0000-000000000201',
  'expense',
  12000000,
  'VND',
  month_start + interval '1 day',
  'Housing payment',
  '20000000-0000-0000-0000-000000000002',
  'f7000000-0000-0000-0000-000000000102',
  'cleared',
  'f7000000-0000-0000-0000-000000000102'
from months;

with months as (
  select gs::date as month_start
  from generate_series(date '2025-09-01', date '2026-02-01', interval '1 month') gs
)
insert into public.transactions (
  household_id, account_id, type, amount, currency, transaction_date, description, category_id, paid_by_member_id, status, created_by
)
select
  'f7000000-0000-0000-0000-000000000001',
  'f7000000-0000-0000-0000-000000000201',
  'expense',
  22650000,
  'VND',
  month_start + interval '5 days',
  'Mortgage + family loan repayment pool',
  '20000000-0000-0000-0000-000000000012',
  'f7000000-0000-0000-0000-000000000101',
  'cleared',
  'f7000000-0000-0000-0000-000000000101'
from months;

with months as (
  select
    gs::date as month_start,
    row_number() over (order by gs)::int as month_idx
  from generate_series(date '2025-09-01', date '2026-02-01', interval '1 month') gs
)
insert into public.transactions (
  household_id, account_id, type, amount, currency, transaction_date, description, category_id, paid_by_member_id, status, created_by
)
select
  'f7000000-0000-0000-0000-000000000001',
  'f7000000-0000-0000-0000-000000000201',
  'expense',
  case month_idx
    when 1 then 1900000
    when 2 then 1850000
    when 3 then 2000000
    when 4 then 2400000
    when 5 then 2100000
    else 2000000
  end,
  'VND',
  month_start + interval '9 days',
  'Electricity, water, internet',
  '20000000-0000-0000-0000-000000000004',
  'f7000000-0000-0000-0000-000000000101',
  'cleared',
  'f7000000-0000-0000-0000-000000000101'
from months;

with months as (
  select
    gs::date as month_start,
    row_number() over (order by gs)::int as month_idx
  from generate_series(date '2025-09-01', date '2026-02-01', interval '1 month') gs
), weeks as (
  select generate_series(0, 3) as week_idx
)
insert into public.transactions (
  household_id, account_id, type, amount, currency, transaction_date, description, category_id, paid_by_member_id, status, created_by
)
select
  'f7000000-0000-0000-0000-000000000001',
  'f7000000-0000-0000-0000-000000000201',
  'expense',
  (2300000 + month_idx * 50000 + week_idx * 30000),
  'VND',
  month_start + (week_idx * interval '7 days') + interval '2 days',
  'Groceries and household supplies',
  '20000000-0000-0000-0000-000000000001',
  case when week_idx % 2 = 0 then 'f7000000-0000-0000-0000-000000000102'::uuid else 'f7000000-0000-0000-0000-000000000101'::uuid end,
  'cleared',
  case when week_idx % 2 = 0 then 'f7000000-0000-0000-0000-000000000102'::uuid else 'f7000000-0000-0000-0000-000000000101'::uuid end
from months
cross join weeks;

with months as (
  select
    gs::date as month_start,
    row_number() over (order by gs)::int as month_idx
  from generate_series(date '2025-09-01', date '2026-02-01', interval '1 month') gs
)
insert into public.transactions (
  household_id, account_id, type, amount, currency, transaction_date, description, category_id, paid_by_member_id, status, created_by
)
select
  'f7000000-0000-0000-0000-000000000001',
  'f7000000-0000-0000-0000-000000000203',
  'expense',
  1700000 + month_idx * 60000,
  'VND',
  month_start + interval '11 days',
  'Fuel, parking, ride-hailing',
  '20000000-0000-0000-0000-000000000003',
  'f7000000-0000-0000-0000-000000000101',
  'cleared',
  'f7000000-0000-0000-0000-000000000101'
from months;

with months as (
  select gs::date as month_start
  from generate_series(date '2025-09-01', date '2026-02-01', interval '1 month') gs
)
insert into public.transactions (
  household_id, account_id, type, amount, currency, transaction_date, description, category_id, paid_by_member_id, status, created_by
)
select
  'f7000000-0000-0000-0000-000000000001',
  'f7000000-0000-0000-0000-000000000202',
  'expense',
  3500000,
  'VND',
  month_start + interval '24 days',
  'Support for parents',
  '20000000-0000-0000-0000-000000000010',
  'f7000000-0000-0000-0000-000000000102',
  'cleared',
  'f7000000-0000-0000-0000-000000000102'
from months;

with months as (
  select
    gs::date as month_start,
    row_number() over (order by gs)::int as month_idx
  from generate_series(date '2025-09-01', date '2026-02-01', interval '1 month') gs
)
insert into public.transactions (
  household_id, account_id, type, amount, currency, transaction_date, description, category_id, paid_by_member_id, status, created_by
)
select
  'f7000000-0000-0000-0000-000000000001',
  'f7000000-0000-0000-0000-000000000203',
  'expense',
  case when month_idx in (4, 6) then 1800000 else 1200000 end,
  'VND',
  month_start + interval '17 days',
  'Entertainment and social activities',
  '20000000-0000-0000-0000-000000000007',
  'f7000000-0000-0000-0000-000000000102',
  'cleared',
  'f7000000-0000-0000-0000-000000000102'
from months;

with months as (
  select
    gs::date as month_start,
    row_number() over (order by gs)::int as month_idx
  from generate_series(date '2025-09-01', date '2026-02-01', interval '1 month') gs
)
insert into public.transactions (
  household_id, account_id, type, amount, currency, transaction_date, description, category_id, paid_by_member_id, status, created_by
)
select
  'f7000000-0000-0000-0000-000000000001',
  'f7000000-0000-0000-0000-000000000202',
  'expense',
  case month_idx
    when 4 then 3500000
    when 6 then 4200000
    else 1800000
  end,
  'VND',
  month_start + interval '21 days',
  'Shopping and household upgrades',
  '20000000-0000-0000-0000-000000000008',
  'f7000000-0000-0000-0000-000000000102',
  'cleared',
  'f7000000-0000-0000-0000-000000000102'
from months
where month_idx in (1, 3, 4, 6);

with months as (
  select gs::date as month_start, row_number() over (order by gs)::int as month_idx
  from generate_series(date '2025-09-01', date '2026-02-01', interval '1 month') gs
)
insert into public.transactions (
  household_id, account_id, type, amount, currency, transaction_date, description, category_id, paid_by_member_id, status, created_by
)
select
  'f7000000-0000-0000-0000-000000000001',
  'f7000000-0000-0000-0000-000000000201',
  'expense',
  case when month_idx = 3 then 1300000 else 900000 end,
  'VND',
  month_start + interval '13 days',
  'Healthcare and check-ups',
  '20000000-0000-0000-0000-000000000005',
  'f7000000-0000-0000-0000-000000000101',
  'cleared',
  'f7000000-0000-0000-0000-000000000101'
from months
where month_idx in (3, 5);

insert into public.transactions (
  household_id,
  account_id,
  type,
  amount,
  currency,
  transaction_date,
  description,
  category_id,
  paid_by_member_id,
  status,
  created_by
)
values
  ('f7000000-0000-0000-0000-000000000001', 'f7000000-0000-0000-0000-000000000201', 'expense', 1500000, 'VND', '2025-09-28', 'Quarterly insurance premium', '20000000-0000-0000-0000-000000000011', 'f7000000-0000-0000-0000-000000000101', 'cleared', 'f7000000-0000-0000-0000-000000000101'),
  ('f7000000-0000-0000-0000-000000000001', 'f7000000-0000-0000-0000-000000000201', 'expense', 1500000, 'VND', '2025-12-28', 'Quarterly insurance premium', '20000000-0000-0000-0000-000000000011', 'f7000000-0000-0000-0000-000000000101', 'cleared', 'f7000000-0000-0000-0000-000000000101')
on conflict do nothing;

insert into public.monthly_household_snapshots (
  household_id,
  month,
  total_assets,
  total_liabilities,
  net_worth,
  income,
  expense,
  savings,
  savings_rate,
  emergency_months,
  debt_service_ratio
)
values
  ('f7000000-0000-0000-0000-000000000001', '2025-09-01', 4002000000, 1738000000, 2264000000, 60300000, 55680000,  4620000, 0.076617, 3.10, 0.375621),
  ('f7000000-0000-0000-0000-000000000001', '2025-10-01', 4040000000, 1719000000, 2321000000, 60650000, 54850000,  5800000, 0.095630, 3.18, 0.373039),
  ('f7000000-0000-0000-0000-000000000001', '2025-11-01', 4088000000, 1700000000, 2388000000, 60900000, 56320000,  4580000, 0.075205, 3.25, 0.371100),
  ('f7000000-0000-0000-0000-000000000001', '2025-12-01', 4165000000, 1681000000, 2484000000, 73400000, 59850000, 13550000, 0.184605, 3.42, 0.343324),
  ('f7000000-0000-0000-0000-000000000001', '2026-01-01', 4219000000, 1662000000, 2557000000, 61800000, 57140000,  4660000, 0.075405, 3.55, 0.366181),
  ('f7000000-0000-0000-0000-000000000001', '2026-02-01', 4307000000, 1658000000, 2649000000, 79300000, 61380000, 17920000, 0.225977, 3.89, 0.285624)
on conflict (household_id, month) do nothing;

insert into public.health_score_snapshots (
  household_id,
  snapshot_month,
  overall_score,
  cashflow_score,
  emergency_score,
  debt_score,
  networth_score,
  goals_score,
  diversification_score,
  metrics_json,
  top_action
)
values
  (
    'f7000000-0000-0000-0000-000000000001',
    '2025-09-01',
    63,
    58,
    52,
    61,
    67,
    60,
    70,
    '{"savings_rate_3m":0.09,"dti":0.38,"emergency_months":3.1,"high_interest_debt_ratio":0.00}',
    'Reduce variable shopping by 1,500,000 VND and redirect to emergency fund.'
  ),
  (
    'f7000000-0000-0000-0000-000000000001',
    '2025-10-01',
    65,
    61,
    54,
    62,
    69,
    61,
    71,
    '{"savings_rate_3m":0.10,"dti":0.37,"emergency_months":3.2,"high_interest_debt_ratio":0.00}',
    'Maintain consistent savings transfers in the first week of each month.'
  ),
  (
    'f7000000-0000-0000-0000-000000000001',
    '2025-11-01',
    64,
    59,
    55,
    63,
    70,
    60,
    71,
    '{"savings_rate_3m":0.08,"dti":0.37,"emergency_months":3.3,"high_interest_debt_ratio":0.00}',
    'Keep healthcare spending planned by setting a monthly buffer budget.'
  ),
  (
    'f7000000-0000-0000-0000-000000000001',
    '2025-12-01',
    70,
    72,
    59,
    66,
    74,
    64,
    72,
    '{"savings_rate_3m":0.12,"dti":0.34,"emergency_months":3.4,"high_interest_debt_ratio":0.00}',
    'Allocate at least 30% of bonuses to long-term property goal.'
  ),
  (
    'f7000000-0000-0000-0000-000000000001',
    '2026-01-01',
    69,
    66,
    62,
    67,
    76,
    66,
    73,
    '{"savings_rate_3m":0.11,"dti":0.37,"emergency_months":3.6,"high_interest_debt_ratio":0.00}',
    'Increase emergency fund transfer by 1,000,000 VND this month.'
  ),
  (
    'f7000000-0000-0000-0000-000000000001',
    '2026-02-01',
    74,
    76,
    68,
    70,
    79,
    71,
    74,
    '{"savings_rate_3m":0.16,"dti":0.29,"emergency_months":3.9,"high_interest_debt_ratio":0.00}',
    'Lock in current momentum: automate 10,000,000 VND/month to emergency fund.'
  )
on conflict (household_id, snapshot_month) do nothing;

insert into public.insights (
  household_id,
  insight_type,
  severity,
  title,
  body,
  action_label,
  action_target,
  is_dismissed,
  generated_at,
  expires_at
)
values
  (
    'f7000000-0000-0000-0000-000000000001',
    'spending_anomaly',
    'warning',
    'Dining and social spending was 32% above your 6-month average in February.',
    'You spent more on social activities during Tet. If this repeats monthly, your emergency fund timeline slips by about 2 months.',
    'Set March dining cap',
    '/transactions?category=entertainment',
    false,
    '2026-02-26 09:00:00+07',
    '2026-03-31 23:59:59+07'
  ),
  (
    'f7000000-0000-0000-0000-000000000001',
    'savings_milestone',
    'info',
    'Emergency fund reached 71% of target.',
    'At your current 3-month contribution pace, you will fully fund the emergency goal in about 7 months.',
    'Review emergency goal',
    '/goals/f7000000-0000-0000-0000-000000000501',
    false,
    '2026-02-26 09:05:00+07',
    null
  ),
  (
    'f7000000-0000-0000-0000-000000000001',
    'debt_alert',
    'info',
    'Mortgage promotional period ends in 1 month.',
    'Your mortgage is modeled to move from 7.5% to about 11.2% in March 2026. Expected payment pressure will increase if rates rise further.',
    'Open debt scenario',
    '/decision-tools/new?type=loan',
    false,
    '2026-02-26 09:10:00+07',
    '2026-04-01 00:00:00+07'
  )
on conflict do nothing;

insert into public.scenarios (
  id,
  household_id,
  created_by,
  scenario_type,
  name,
  base_snapshot_date,
  assumptions_json,
  status
)
values
  (
    'f7000000-0000-0000-0000-000000000601',
    'f7000000-0000-0000-0000-000000000001',
    'f7000000-0000-0000-0000-000000000101',
    'loan',
    'Mortgage Repricing +2% Stress Test',
    '2026-02-01',
    '{"starting_balance":1478000000,"current_rate":0.112,"stress_rate":0.132,"term_remaining_months":222,"repayment_method":"annuity"}',
    'saved'
  )
on conflict (id) do nothing;

insert into public.scenario_results (scenario_id, household_id, computed_at, summary_json, timeseries_json, key_metrics_json)
values
  (
    'f7000000-0000-0000-0000-000000000601',
    'f7000000-0000-0000-0000-000000000001',
    '2026-02-26 09:15:00+07',
    '{"base_monthly_payment":15940000,"stress_monthly_payment":17880000,"delta":1940000}',
    '[{"month":"2026-03-01","base_cashflow":15300000,"stress_cashflow":13360000},{"month":"2026-12-01","base_cashflow":16100000,"stress_cashflow":14160000}]',
    '{"payment_increase_pct":12.17,"debt_service_ratio_base":0.31,"debt_service_ratio_stress":0.35}'
  )
on conflict do nothing;
