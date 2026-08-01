-- Add composite indexes for common query patterns
-- These indexes improve performance for frequently used queries

-- Transactions pagination index
create index if not exists idx_transactions_household_date_created
on public.transactions(household_id, transaction_date desc, created_at desc);

-- Transactions category breakdown index
create index if not exists idx_transactions_household_category_date
on public.transactions(household_id, category_id, transaction_date);

-- Transactions account balance index
create index if not exists idx_transactions_household_account_date
on public.transactions(household_id, account_id, transaction_date);

-- Card billing items CC breakdown index
create index if not exists idx_card_billing_items_household_billing_month
on public.card_billing_items(household_id, billing_month_id);

-- Asset price history latest price lookup index
create index if not exists idx_asset_price_history_asset_date
on public.asset_price_history(asset_id, as_of_date desc);
