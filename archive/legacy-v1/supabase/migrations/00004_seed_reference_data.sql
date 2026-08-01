-- ============================================================================
-- 00004_seed_reference_data.sql
-- System reference data shared by all households.
-- ============================================================================

insert into public.categories (id, household_id, kind, name, is_system, is_active, is_essential, icon, color, sort_order)
values
  ('10000000-0000-0000-0000-000000000001', null, 'income',  'Salary',            true, true, false, 'wallet',         '#16a34a', 1),
  ('10000000-0000-0000-0000-000000000002', null, 'income',  'Bonus',             true, true, false, 'sparkles',       '#15803d', 2),
  ('10000000-0000-0000-0000-000000000003', null, 'income',  'Freelance',         true, true, false, 'briefcase',      '#0f766e', 3),
  ('10000000-0000-0000-0000-000000000004', null, 'income',  'Investment Income', true, true, false, 'line-chart',     '#0e7490', 4),
  ('10000000-0000-0000-0000-000000000005', null, 'income',  'Gift',              true, true, false, 'gift',           '#65a30d', 5),
  ('10000000-0000-0000-0000-000000000006', null, 'income',  'Rental Income',     true, true, false, 'home',           '#0f766e', 6),
  ('10000000-0000-0000-0000-000000000007', null, 'income',  'Other Income',      true, true, false, 'plus-circle',    '#334155', 7),
  ('20000000-0000-0000-0000-000000000001', null, 'expense', 'Groceries',         true, true, true,  'shopping-cart',  '#ef4444', 1),
  ('20000000-0000-0000-0000-000000000002', null, 'expense', 'Housing',           true, true, true,  'building-2',     '#f97316', 2),
  ('20000000-0000-0000-0000-000000000003', null, 'expense', 'Transportation',    true, true, true,  'car',            '#f59e0b', 3),
  ('20000000-0000-0000-0000-000000000004', null, 'expense', 'Utilities',         true, true, true,  'bolt',           '#eab308', 4),
  ('20000000-0000-0000-0000-000000000005', null, 'expense', 'Healthcare',        true, true, true,  'stethoscope',    '#84cc16', 5),
  ('20000000-0000-0000-0000-000000000006', null, 'expense', 'Education',         true, true, false, 'book-open',      '#0ea5e9', 6),
  ('20000000-0000-0000-0000-000000000007', null, 'expense', 'Entertainment',     true, true, false, 'film',           '#a855f7', 7),
  ('20000000-0000-0000-0000-000000000008', null, 'expense', 'Shopping',          true, true, false, 'shirt',          '#d946ef', 8),
  ('20000000-0000-0000-0000-000000000009', null, 'expense', 'Personal Care',     true, true, false, 'scissors',       '#ec4899', 9),
  ('20000000-0000-0000-0000-000000000010', null, 'expense', 'Family Support',    true, true, false, 'users',          '#f43f5e', 10),
  ('20000000-0000-0000-0000-000000000011', null, 'expense', 'Insurance',         true, true, true,  'shield-check',   '#64748b', 11),
  ('20000000-0000-0000-0000-000000000012', null, 'expense', 'Loan Payment',      true, true, true,  'landmark',       '#334155', 12),
  ('20000000-0000-0000-0000-000000000013', null, 'expense', 'Other Expense',     true, true, false, 'ellipsis',       '#94a3b8', 13)
on conflict (id) do nothing;
