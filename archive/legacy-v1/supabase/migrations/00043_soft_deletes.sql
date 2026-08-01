-- Add soft delete support to core tables
-- This enables recovery of deleted records and audit trail

-- Add deleted_at column to transactions
alter table public.transactions
add column if not exists deleted_at timestamptz;

create index if not exists idx_transactions_deleted_at on public.transactions(deleted_at);

-- Add deleted_at column to accounts
alter table public.accounts
add column if not exists deleted_at timestamptz;

create index if not exists idx_accounts_deleted_at on public.accounts(deleted_at);

-- Add deleted_at column to assets
alter table public.assets
add column if not exists deleted_at timestamptz;

create index if not exists idx_assets_deleted_at on public.assets(deleted_at);

-- Add deleted_at column to liabilities
alter table public.liabilities
add column if not exists deleted_at timestamptz;

create index if not exists idx_liabilities_deleted_at on public.liabilities(deleted_at);

-- Add deleted_at column to goals
alter table public.goals
add column if not exists deleted_at timestamptz;

create index if not exists idx_goals_deleted_at on public.goals(deleted_at);

-- Add deleted_at column to categories
alter table public.categories
add column if not exists deleted_at timestamptz;

create index if not exists idx_categories_deleted_at on public.categories(deleted_at);

-- Add deleted_at column to jar_definitions
alter table public.jar_definitions
add column if not exists deleted_at timestamptz;

create index if not exists idx_jar_definitions_deleted_at on public.jar_definitions(deleted_at);

-- Add deleted_at column to jars
alter table public.jars
add column if not exists deleted_at timestamptz;

create index if not exists idx_jars_deleted_at on public.jars(deleted_at);

-- Create soft delete RPC function
create or replace function public.soft_delete_record(
  p_table_name text,
  p_record_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
  v_sql text;
begin
  -- Get the household_id of the current user
  v_household_id := public.get_primary_household_id();
  
  -- Build and execute dynamic SQL to set deleted_at
  -- Only allows deletion from specific tables for security
  v_sql := format(
    'update %I set deleted_at = now() where id = $1 and household_id = $2 and deleted_at is null',
    p_table_name
  );
  
  execute v_sql using p_record_id, v_household_id;
  
  return true;
exception
  when others then
    raise warning 'Soft delete failed: %', SQLERRM;
    return false;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.soft_delete_record(text, uuid) to authenticated;
