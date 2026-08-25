-- Canonical ViNha V1 schema baseline. Fresh-install schema only; reference data is bootstrapped separately.
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
do $$
begin
  begin
    create extension if not exists pg_net with schema extensions;
  exception when others then
    raise notice 'pg_net extension unavailable; market sync remains disabled';
  end;
  begin
    create extension if not exists pg_cron with schema extensions;
  exception when others then
    raise notice 'pg_cron extension unavailable; scheduled jobs remain disabled';
  end;
end;
$$;
create table "public"."accounts" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "name" text not null,
  "type" text default 'cash'::text not null,
  "opening_balance" numeric(18,0) default 0 not null,
  "is_archived" boolean default false not null,
  "created_by" uuid,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "financial_scope" text default 'household'::text not null,
  "owner_membership_id" uuid
);
create table "public"."ai_audit_logs" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "actor_user_id" uuid,
  "event_kind" text not null,
  "surface" text not null,
  "payload_json" jsonb default '{}'::jsonb not null,
  "created_at" timestamp with time zone default now() not null
);
create table "public"."card_billing_items" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "billing_month_id" uuid not null,
  "card_account_id" uuid not null,
  "transaction_id" uuid,
  "installment_plan_id" uuid,
  "installment_sequence" integer,
  "description" text,
  "amount" numeric(18,0) not null,
  "fee_amount" numeric(18,0) default 0 not null,
  "item_type" text default 'standard'::text not null,
  "is_paid" boolean default false not null,
  "is_converted_to_installment" boolean default false not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);
create table "public"."card_billing_months" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "card_account_id" uuid not null,
  "billing_month" date not null,
  "statement_amount" numeric(18,0) default 0 not null,
  "paid_amount" numeric(18,0) default 0 not null,
  "due_date" date not null,
  "status" text default 'open'::text not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);
create table "public"."card_payment_applications" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "card_payment_id" uuid not null,
  "billing_month_id" uuid not null,
  "applied_amount" numeric(18,0) not null,
  "created_at" timestamp with time zone default now() not null
);
create table "public"."card_payments" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "card_account_id" uuid not null,
  "source_account_id" uuid not null,
  "transaction_id" uuid not null,
  "amount" numeric(18,0) not null,
  "applied_amount" numeric(18,0) not null,
  "remaining_due_after" numeric(18,0) not null,
  "effective_date" date not null,
  "idempotency_key" text,
  "created_by" uuid,
  "created_at" timestamp with time zone default now() not null
);
create table "public"."categories" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid,
  "kind" text not null,
  "name" text not null,
  "is_system" boolean default false not null,
  "is_active" boolean default true not null,
  "sort_order" integer default 0 not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "jar_id" uuid
);
create table "public"."credit_card_installment_legacy_archive" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "legacy_installment_id" uuid not null,
  "legacy_payload" jsonb not null,
  "archived_reason" text not null,
  "archived_at" timestamp with time zone default now() not null
);
create table "public"."credit_card_installment_schedule" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "installment_id" uuid not null,
  "installment_number" integer not null,
  "expected_date" date not null,
  "principal_amount" numeric(18,0) not null,
  "conversion_fee_amount" numeric(18,0) default 0 not null,
  "interest_amount" numeric(18,0) default 0 not null,
  "total_amount" numeric(18,0) not null,
  "status" text default 'expected'::text not null,
  "confirmed_at" timestamp with time zone,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);
create table "public"."credit_card_installments" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "card_account_id" uuid not null,
  "description" text,
  "principal" numeric(18,0) not null,
  "term_count" integer not null,
  "status" text default 'active'::text not null,
  "note" text,
  "created_by" uuid,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "source_transaction_id" uuid not null,
  "origin" text not null,
  "first_expected_date" date not null,
  "program" text not null,
  "calculation_source" text not null,
  "conversion_fee_type" text not null,
  "conversion_fee_rate_bps" integer,
  "conversion_fee_amount" numeric(18,0) not null,
  "fee_timing" text not null,
  "flat_interest_rate_bps" integer,
  "total_interest_amount" numeric(18,0) default 0 not null,
  "quoted_total_repayment" numeric(18,0)
);
create table "public"."credit_card_settings" (
  "account_id" uuid not null,
  "household_id" uuid not null,
  "credit_limit" numeric(18,0) not null,
  "statement_day" integer default 25 not null,
  "due_day" integer default 15 not null,
  "linked_bank_account_id" uuid,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);
create table "public"."debt_payments" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "liability_id" uuid not null,
  "account_id" uuid not null,
  "transaction_id" uuid not null,
  "amount" numeric(18,0) not null,
  "payment_direction" text not null,
  "effective_date" date not null,
  "note" text,
  "idempotency_key" text,
  "created_by" uuid,
  "created_at" timestamp with time zone default now() not null
);
create table "public"."early_withdrawals" (
  "id" uuid default gen_random_uuid() not null,
  "cycle_id" uuid not null,
  "saving_id" uuid not null,
  "requested_at" timestamp with time zone default now() not null,
  "principal" numeric(18,0) not null,
  "accrued_interest" numeric(18,0) not null,
  "eligible_interest" numeric(18,0) not null,
  "penalty_amount" numeric(18,0) not null,
  "net_returned" numeric(18,0) not null,
  "penalty_strategy" text not null,
  "settlement_transaction_id" uuid,
  "executed_by" uuid
);
create table "public"."goal_contributions" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "goal_id" uuid not null,
  "direction" text default 'contribute'::text not null,
  "amount" numeric(18,0) not null,
  "note" text,
  "created_by" uuid,
  "created_at" timestamp with time zone default now() not null
);
create table "public"."goal_funding_links" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "goal_id" uuid not null,
  "source_kind" text not null,
  "saving_id" uuid,
  "account_id" uuid,
  "holding_id" uuid,
  "loan_id" uuid,
  "debt_id" uuid,
  "initial_principal_snapshot" numeric(18,0),
  "is_active" boolean default true not null,
  "created_by" uuid,
  "linked_at" timestamp with time zone default now() not null,
  "linked_by" uuid,
  "unlinked_at" timestamp with time zone,
  "unlinked_by" uuid,
  "created_at" timestamp with time zone default now() not null
);
create table "public"."goal_period_funded_snapshots" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "goal_id" uuid not null,
  "period_month" date not null,
  "funded_amount" numeric(18,0) default 0 not null,
  "created_at" timestamp with time zone default now() not null
);
create table "public"."goals" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "name" text not null,
  "target_amount" numeric(18,0) not null,
  "funded_amount" numeric(18,0) default 0 not null,
  "target_date" date,
  "status" text default 'active'::text not null,
  "created_by" uuid,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "goal_type" text default 'save_up'::text not null,
  "initial_principal_snapshot" numeric(18,0),
  "legacy_funded_amount" numeric(18,0),
  "completed_at" timestamp with time zone,
  "cancelled_at" timestamp with time zone,
  "paused_at" timestamp with time zone,
  "financial_scope" text default 'household'::text not null,
  "owner_membership_id" uuid
);
create table "public"."household_configuration_events" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "actor_user_id" uuid,
  "target_membership_id" uuid,
  "event_type" text not null,
  "payload" jsonb default '{}'::jsonb not null,
  "created_at" timestamp with time zone default now() not null
);
create table "public"."household_invitations" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "email" text not null,
  "token" uuid default gen_random_uuid() not null,
  "status" text default 'pending'::text not null,
  "expires_at" timestamp with time zone not null,
  "invited_by" uuid not null,
  "accepted_by" uuid,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);
create table "public"."household_members" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "user_id" uuid not null,
  "role" text default 'admin'::text not null,
  "is_active" boolean default true not null,
  "joined_at" timestamp with time zone default now() not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "email" text,
  "display_name" text,
  "left_at" timestamp with time zone,
  "removed_by" uuid
);
create table "public"."household_policy_events" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "actor_user_id" uuid,
  "event_type" text default 'policy.updated'::text not null,
  "payload" jsonb default '{}'::jsonb not null,
  "created_at" timestamp with time zone default now() not null
);
create table "public"."households" (
  "id" uuid default gen_random_uuid() not null,
  "name" text not null,
  "base_currency" character(3) default 'VND'::bpchar not null,
  "locale" text default 'en-VN'::text not null,
  "timezone" text default 'Asia/Ho_Chi_Minh'::text not null,
  "overspend_policy" text default 'warn'::text not null,
  "month_close_mode" text default 'assisted'::text not null,
  "income_allocate_mode" text default 'suggest'::text not null,
  "created_by" uuid,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "consecutive_completed_rituals" integer default 0 not null,
  "qualifying_monthly_income" numeric(18,0)
);
create table "public"."inbox_items" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "kind" text not null,
  "status" text default 'pending'::text not null,
  "source_type" text default 'transaction'::text not null,
  "source_id" uuid not null,
  "amount" numeric(18,0) not null,
  "currency" character(3) default 'VND'::bpchar not null,
  "title" text not null,
  "suggested_jar_id" uuid,
  "context_json" jsonb default '{}'::jsonb not null,
  "resolved_jar_id" uuid,
  "resolved_by" uuid,
  "resolved_at" timestamp with time zone,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "assigned_to_user_id" uuid,
  "expires_at" timestamp with time zone,
  "auto_resolved" boolean default false not null,
  "confidence_score" numeric(4,3),
  "suggested_category_id" uuid,
  "cascade_day_key" text generated always as (COALESCE((context_json ->> 'cascadeDay'::text), ''::text)) stored,
  "dedupe_key" text,
  "read_at" timestamp with time zone
);
create table "public"."investment_accounts" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "provider_id" uuid not null,
  "name" text not null,
  "account_kind" text not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);
create table "public"."investment_events" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "position_id" uuid not null,
  "provider_id" uuid,
  "instrument_id" uuid,
  "investment_account_id" uuid,
  "event_type" text not null,
  "executed_quantity" numeric(38,18),
  "unit_price" numeric(24,8),
  "nav_per_unit" numeric(24,8),
  "gross_amount" numeric(18,0),
  "fee_amount" numeric(18,0),
  "fee_currency" text,
  "tax_amount" numeric(18,0),
  "disposed_cost_basis" numeric(18,0),
  "realized_pnl" numeric(18,0),
  "source_cash_account_id" uuid,
  "destination_cash_account_id" uuid,
  "quote_asset" text,
  "effective_at" timestamp with time zone not null,
  "notes" text,
  "snapshot" jsonb default '{}'::jsonb not null,
  "created_by" uuid,
  "created_at" timestamp with time zone default now() not null,
  "requested_amount" numeric(18,0),
  "quantity_unit" text,
  "base_asset" text,
  "allocation_status" text default 'COMPLETED'::text not null,
  "legacy_operation_id" uuid
);
create table "public"."investment_fees" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "operation_id" uuid not null,
  "fee_source" text not null,
  "quantity" numeric(38,18),
  "amount_vnd" numeric(18,0),
  "fee_value_vnd" numeric(18,0) not null,
  "fee_holding_id" uuid,
  "cash_account_id" uuid,
  "transaction_id" uuid,
  "created_at" timestamp with time zone default now() not null,
  "fee_asset" text
);
create table "public"."investment_holdings" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "name" text not null,
  "symbol" text,
  "asset_class" text not null,
  "provider_custodian" text,
  "visibility_context" text default 'household'::text not null,
  "lifecycle_status" text default 'active'::text not null,
  "history_status" text not null,
  "quantity" numeric(38,18) not null,
  "remaining_total_cost_basis" numeric(18,0),
  "notes" text,
  "created_by" uuid,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "asset_type" text,
  "provider_id" uuid,
  "instrument_id" uuid,
  "investment_account_id" uuid,
  "accounting_method" text,
  "data_quality" text,
  "valuation_source" text,
  "type_metadata" jsonb default '{}'::jsonb not null,
  "financial_scope" text default 'household'::text not null,
  "owner_membership_id" uuid
);
create table "public"."investment_instruments" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "archetype" text not null,
  "name" text not null,
  "symbol" text,
  "quote_asset" text,
  "metadata" jsonb default '{}'::jsonb not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);
create table "public"."investment_lots" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "position_id" uuid not null,
  "source_event_id" uuid,
  "acquired_at" timestamp with time zone not null,
  "original_quantity" numeric(38,18) not null,
  "remaining_quantity" numeric(38,18) not null,
  "unit_cost" numeric(24,8) not null,
  "total_cost" numeric(18,0) not null,
  "created_at" timestamp with time zone default now() not null
);
create table "public"."investment_operations" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "operation_type" text not null,
  "source_holding_id" uuid,
  "destination_holding_id" uuid,
  "cash_account_id" uuid,
  "source_quantity" numeric(38,18),
  "destination_quantity" numeric(38,18),
  "executed_value_vnd" numeric(18,0),
  "quoted_value_vnd" numeric(18,0),
  "source_basis_consumed" numeric(18,0),
  "destination_basis_added" numeric(18,0),
  "realized_result_vnd" numeric(18,0),
  "income_kind" text,
  "before_quantity" numeric(38,18),
  "after_quantity" numeric(38,18),
  "before_basis" numeric(18,0),
  "after_basis" numeric(18,0),
  "cash_delta" numeric(18,0) default 0 not null,
  "transaction_id" uuid,
  "effective_date" date not null,
  "notes" text,
  "correlation_id" uuid default gen_random_uuid() not null,
  "idempotency_key" text not null,
  "created_by" uuid,
  "created_at" timestamp with time zone default now() not null,
  "unit_price_vnd" numeric(24,8)
);
create table "public"."investment_providers" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "name" text not null,
  "supported_archetypes" text[] default '{}'::text[] not null,
  "default_accounting_methods" jsonb default '{}'::jsonb not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);
create table "public"."investment_valuations" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "holding_id" uuid not null,
  "value_vnd" numeric(18,0) not null,
  "valuation_date" date not null,
  "source" text not null,
  "notes" text,
  "supersedes_valuation_id" uuid,
  "idempotency_key" text not null,
  "created_by" uuid,
  "created_at" timestamp with time zone default now() not null,
  "quantity" numeric(38,18),
  "unit_price_vnd" numeric(24,8)
);
create table "public"."jar_period_adjustments" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "jar_id" uuid not null,
  "period_month" date not null,
  "amount" numeric(18,0) not null,
  "plan_movement_id" uuid,
  "note" text,
  "created_by" uuid,
  "created_at" timestamp with time zone default now() not null
);
create table "public"."jar_period_rule_snapshots" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "jar_id" uuid not null,
  "period_month" date not null,
  "jar_name" text not null,
  "plan_kind" text not null,
  "percent_bps" integer default 0 not null,
  "fixed_amount" numeric(18,0) default 0 not null,
  "rollover_mode" text default 'reset'::text not null,
  "created_at" timestamp with time zone default now() not null,
  "qualifying_income" numeric(18,0) default 0 not null,
  "qualifying_income_source" text default 'none'::text not null,
  "rule_budget" numeric(18,0) default 0 not null,
  "rollover_credit" numeric(18,0) default 0 not null,
  "updated_at" timestamp with time zone default now() not null
);
create table "public"."jar_plans" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "jar_id" uuid not null,
  "plan_kind" text default 'percent'::text not null,
  "percent_bps" integer default 0 not null,
  "fixed_amount" numeric(18,0) default 0 not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);
create table "public"."jars" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "name" text not null,
  "kind" text default 'spending'::text not null,
  "sort_order" integer default 0 not null,
  "is_archived" boolean default false not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "is_paused" boolean default false not null,
  "capacity_delta" numeric(18,0) default 0 not null,
  "rollover_mode" text default 'reset'::text not null,
  "is_name_custom" boolean default false not null
);
create table "public"."liabilities" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "name" text not null,
  "creditor" text,
  "principal_amount" numeric(18,0) not null,
  "remaining_amount" numeric(18,0) not null,
  "currency" character(3) default 'VND'::bpchar not null,
  "due_day" integer,
  "note" text,
  "is_archived" boolean default false not null,
  "created_by" uuid,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "direction" text default 'borrowed'::text not null,
  "creation_mode" text default 'existing_balance'::text not null,
  "start_date" date default (timezone('utc'::text, now()))::date not null,
  "due_date" date,
  "status" text default 'active'::text not null,
  "origin_account_id" uuid,
  "origin_transaction_id" uuid,
  "idempotency_key" text,
  "financial_scope" text default 'household'::text not null,
  "owner_membership_id" uuid,
  "opening_paid_amount" numeric(18,0) default 0 not null
);
create table "public"."loan_interest_rate_periods" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "loan_id" uuid not null,
  "sequence" integer not null,
  "effective_from" date not null,
  "effective_to" date,
  "annual_rate" numeric(8,4) not null,
  "kind" text not null,
  "note" text,
  "created_by" uuid,
  "created_at" timestamp with time zone default now() not null
);
create table "public"."loan_payments" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "loan_id" uuid not null,
  "account_id" uuid not null,
  "transaction_id" uuid not null,
  "amount" numeric(18,0) not null,
  "principal_paid" numeric(18,0) not null,
  "interest_paid" numeric(18,0) default 0 not null,
  "paid_at" date default (timezone('utc'::text, now()))::date not null,
  "created_by" uuid,
  "created_at" timestamp with time zone default now() not null,
  "idempotency_key" text
);
create table "public"."loan_schedule_entries" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "loan_id" uuid not null,
  "sequence" integer not null,
  "due_date" date not null,
  "principal_due" numeric(18,0) not null,
  "interest_due" numeric(18,0) default 0 not null,
  "total_due" numeric(18,0) not null,
  "remaining_balance_after" numeric(18,0) not null,
  "status" text default 'upcoming'::text not null,
  "paid_at" date,
  "loan_payment_id" uuid,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);
create table "public"."loans" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "name" text not null,
  "lender" text,
  "principal" numeric(18,0) not null,
  "monthly_payment" numeric(18,0) not null,
  "currency" character(3) default 'VND'::bpchar not null,
  "status" text default 'active'::text not null,
  "note" text,
  "created_by" uuid,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "due_day" integer default 1 not null,
  "remaining_principal" numeric(18,0) not null,
  "loan_type" text default 'other'::text not null,
  "annual_interest_rate" numeric(8,4),
  "start_date" date not null,
  "expected_end_date" date,
  "repayment_frequency" text default 'monthly'::text not null,
  "next_payment_date" date,
  "first_payment_date" date,
  "repayment_method" text default 'fixed_monthly'::text not null,
  "term_months" integer,
  "total_interest" numeric(18,0) default 0 not null,
  "total_repayment" numeric(18,0) default 0 not null,
  "interest_strategy" text default 'fixed'::text not null,
  "promo_fixed_rate" numeric(8,4),
  "promo_fixed_months" integer,
  "promo_floating_rate" numeric(8,4),
  "promo_rate_effective_on" date,
  "financial_scope" text default 'household'::text not null,
  "owner_membership_id" uuid,
  "idempotency_key" text
);
create table "public"."market_currency_rates" (
  "base_currency" text not null,
  "quote_currency" text not null,
  "rate" numeric(24,8) not null,
  "rate_date" date not null,
  "fetched_at" timestamp with time zone not null,
  "provider" text not null,
  "updated_at" timestamp with time zone default now() not null
);
create table "public"."market_instrument_prices" (
  "instrument_id" uuid not null,
  "price" numeric(24,8) not null,
  "currency" text not null,
  "price_type" text not null,
  "price_date" date not null,
  "fetched_at" timestamp with time zone not null,
  "provider" text not null,
  "metadata" jsonb default '{}'::jsonb not null,
  "updated_at" timestamp with time zone default now() not null
);
create table "public"."market_instrument_sources" (
  "instrument_id" uuid not null,
  "provider" text not null,
  "provider_instrument_id" text not null,
  "priority" integer default 0 not null,
  "is_enabled" boolean default true not null,
  "metadata" jsonb default '{}'::jsonb not null
);
create table "public"."market_instruments" (
  "id" uuid default gen_random_uuid() not null,
  "asset_class" text not null,
  "symbol" text not null,
  "name" text not null,
  "exchange" text,
  "currency" text not null,
  "pricing_mode" text default 'MANUAL'::text not null,
  "auto_price_supported" boolean default false not null,
  "is_active" boolean default true not null,
  "metadata" jsonb default '{}'::jsonb not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);
create table "public"."market_sync_locks" (
  "lock_key" text not null,
  "owner_id" uuid not null,
  "acquired_at" timestamp with time zone not null,
  "expires_at" timestamp with time zone not null
);
create table "public"."market_sync_runs" (
  "id" uuid default gen_random_uuid() not null,
  "provider" text not null,
  "started_at" timestamp with time zone not null,
  "finished_at" timestamp with time zone,
  "fetched_count" integer default 0 not null,
  "inserted_count" integer default 0 not null,
  "updated_count" integer default 0 not null,
  "failed_count" integer default 0 not null,
  "error" text,
  "created_at" timestamp with time zone default now() not null,
  "sync_kind" text default 'catalog'::text not null,
  "asset_class" text,
  "requested_count" integer default 0 not null,
  "success_count" integer default 0 not null,
  "status" text default 'succeeded'::text not null,
  "run_key" text,
  "error_summary" text
);
create table "public"."month_ritual_runs" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "period_month" date not null,
  "status" text default 'draft'::text not null,
  "mode" text default 'assisted'::text not null,
  "preview_json" jsonb default '{}'::jsonb not null,
  "approved_by" uuid,
  "approved_at" timestamp with time zone,
  "correction_note" text,
  "corrected_by" uuid,
  "corrected_at" timestamp with time zone,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "auto_locked_at" timestamp with time zone,
  "emergencies_acknowledged_at" timestamp with time zone,
  "review_status" text default 'not_started'::text,
  "viewed_at" timestamp with time zone,
  "reviewed_at" timestamp with time zone,
  "review_snapshot" jsonb
);
create table "public"."plan_movements" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "source_jar_id" uuid not null,
  "target_jar_id" uuid not null,
  "amount" numeric(18,0) not null,
  "is_emergency" boolean default false not null,
  "intent_note" text,
  "executed_by_user_id" uuid not null,
  "ledger_impact" numeric(18,0) default 0 not null,
  "created_at" timestamp with time zone default now() not null,
  "period_month" date,
  "reason" text
);
create table "public"."recurring_rules" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "name" text not null,
  "direction" text not null,
  "amount" numeric(18,0) not null,
  "frequency" text default 'monthly'::text not null,
  "interval_count" integer default 1 not null,
  "day_of_month" integer,
  "day_of_week" integer,
  "start_date" date default (timezone('utc'::text, now()))::date not null,
  "next_run_date" date,
  "is_active" boolean default true not null,
  "created_by" uuid,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);
create table "public"."saving_cycles" (
  "id" uuid default gen_random_uuid() not null,
  "saving_id" uuid not null,
  "cycle_number" integer not null,
  "start_date" date not null,
  "end_date" date not null,
  "principal" numeric(18,0) not null,
  "locked_rate" numeric(10,6) not null,
  "package_snapshot" jsonb not null,
  "accrued_interest" numeric(18,0) default 0 not null,
  "settlement_result" jsonb,
  "status" text default 'active'::text not null,
  "funding_transaction_id" uuid,
  "settlement_transaction_id" uuid,
  "created_at" timestamp with time zone default now() not null,
  "renewal_decision" jsonb,
  "previous_cycle_id" uuid,
  "next_cycle_id" uuid
);
create table "public"."saving_packages" (
  "id" uuid default gen_random_uuid() not null,
  "provider_id" uuid not null,
  "package_name" text not null,
  "duration_days" integer not null,
  "annual_interest_rate" numeric(10,6) not null,
  "min_amount" numeric(18,0),
  "max_amount" numeric(18,0),
  "settlement_rules" jsonb default '["roll_principal_interest"]'::jsonb not null,
  "penalty_rules" jsonb default '[]'::jsonb not null,
  "renewable_available" boolean default true not null,
  "is_active" boolean default true not null,
  "created_at" timestamp with time zone default now() not null,
  "term_amount" integer not null,
  "term_unit" text default 'DAY'::text not null,
  "interest_calculation_method" text default 'simple'::text not null,
  "currency" character(3) default 'VND'::bpchar not null,
  "tax_rule" text default 'NONE'::text not null,
  "tax_rate_percent" numeric(7,4) default 0 not null,
  "early_settlement_rule" text default 'RETURN_PRINCIPAL_ONLY'::text not null,
  "supports_partial_settlement" boolean default false not null,
  "updated_at" timestamp with time zone default now() not null,
  "early_settlement_rate_percent" numeric(8,4)
);
create table "public"."saving_providers" (
  "id" uuid default gen_random_uuid() not null,
  "provider_key" text not null,
  "display_name" text not null,
  "saving_type" text not null,
  "is_active" boolean default true not null,
  "metadata" jsonb default '{}'::jsonb not null,
  "created_at" timestamp with time zone default now() not null,
  "household_id" uuid,
  "created_by" uuid,
  "family" text default 'PLATFORM'::text not null,
  "icon_key" text default 'bank'::text not null,
  "is_system" boolean default true not null,
  "updated_at" timestamp with time zone default now() not null
);
create table "public"."savings" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "status" text default 'active'::text not null,
  "funding_account_id" uuid,
  "settlement_account_id" uuid not null,
  "provider_id" uuid not null,
  "product_name" text default ''::text not null,
  "product_snapshot" jsonb not null,
  "renewal_policy" text default 'always_ask'::text not null,
  "created_by" uuid,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "renewal_config" jsonb default '{}'::jsonb not null,
  "renewal_preference" text default 'manual_review'::text,
  "maturity_instruction" jsonb default jsonb_build_object('strategy', 'withdraw_everything', 'targetMode', 'keep_current_package', 'targetPackageId', NULL::unknown, 'payoutAccountId', NULL::unknown, 'fallbackPolicy', 'ask_user') not null,
  "financial_scope" text default 'household'::text not null,
  "owner_membership_id" uuid
);
create table "public"."savings_accounts" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "name" text not null,
  "principal_amount" numeric(18,0) not null,
  "currency" character(3) default 'VND'::bpchar not null,
  "maturity_date" date not null,
  "status" text default 'active'::text not null,
  "note" text,
  "created_by" uuid,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);
create table "public"."transaction_tag_assignments" (
  "household_id" uuid not null,
  "transaction_id" uuid not null,
  "tag_id" uuid not null,
  "created_at" timestamp with time zone default now() not null
);
create table "public"."transaction_tags" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "name" text not null,
  "icon_key" text not null,
  "color_key" text,
  "archived_at" timestamp with time zone,
  "created_by" uuid,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);
create table "public"."transactions" (
  "id" uuid default gen_random_uuid() not null,
  "household_id" uuid not null,
  "account_id" uuid not null,
  "type" text not null,
  "amount" numeric(18,0) not null,
  "currency" character(3) default 'VND'::bpchar not null,
  "transaction_date" date default (timezone('utc'::text, now()))::date not null,
  "note" text,
  "category_id" uuid,
  "jar_id" uuid,
  "status" text default 'posted'::text not null,
  "idempotency_key" text,
  "created_by" uuid,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "reverses_transaction_id" uuid,
  "corrects_transaction_id" uuid,
  "is_reversal" boolean default false not null,
  "source" text default 'manual'::text not null,
  "pattern_id" uuid,
  "transfer_group_id" uuid,
  "savings_event_kind" text,
  "loan_payment_id" uuid
);
alter table "public"."accounts" add constraint "accounts_financial_scope_check" CHECK (financial_scope = ANY (ARRAY['household'::text, 'personal'::text]));
alter table "public"."accounts" add constraint "accounts_name_not_blank" CHECK (length(TRIM(BOTH FROM name)) > 0);
alter table "public"."accounts" add constraint "accounts_pkey" PRIMARY KEY (id);
alter table "public"."accounts" add constraint "accounts_scope_owner_pair_check" CHECK (financial_scope = 'household'::text AND owner_membership_id IS NULL OR financial_scope = 'personal'::text AND owner_membership_id IS NOT NULL);
alter table "public"."accounts" add constraint "accounts_type_check" CHECK (type = ANY (ARRAY['cash'::text, 'checking'::text, 'savings'::text, 'ewallet'::text, 'brokerage'::text, 'credit_card'::text, 'savings_product'::text, 'other'::text]));
alter table "public"."ai_audit_logs" add constraint "ai_audit_logs_kind_check" CHECK (event_kind = ANY (ARRAY['suggestion'::text, 'approval'::text, 'rejection'::text, 'policy_block'::text]));
alter table "public"."ai_audit_logs" add constraint "ai_audit_logs_pkey" PRIMARY KEY (id);
alter table "public"."card_billing_items" add constraint "card_billing_items_amount" CHECK (amount <> 0::numeric OR fee_amount <> 0::numeric);
alter table "public"."card_billing_items" add constraint "card_billing_items_pkey" PRIMARY KEY (id);
alter table "public"."card_billing_items" add constraint "card_billing_items_type_check" CHECK (item_type = ANY (ARRAY['standard'::text, 'installment'::text]));
alter table "public"."card_billing_months" add constraint "card_billing_months_amounts" CHECK (statement_amount >= 0::numeric AND paid_amount >= 0::numeric);
alter table "public"."card_billing_months" add constraint "card_billing_months_pkey" PRIMARY KEY (id);
alter table "public"."card_billing_months" add constraint "card_billing_months_status_check" CHECK (status = ANY (ARRAY['open'::text, 'partial'::text, 'settled'::text]));
alter table "public"."card_billing_months" add constraint "card_billing_months_unique" UNIQUE (card_account_id, billing_month);
alter table "public"."card_payment_applications" add constraint "card_payment_applications_amount_positive" CHECK (applied_amount > 0::numeric);
alter table "public"."card_payment_applications" add constraint "card_payment_applications_pkey" PRIMARY KEY (id);
alter table "public"."card_payment_applications" add constraint "card_payment_applications_unique" UNIQUE (card_payment_id, billing_month_id);
alter table "public"."card_payments" add constraint "card_payments_amount_positive" CHECK (amount > 0::numeric);
alter table "public"."card_payments" add constraint "card_payments_applied_le_amount" CHECK (applied_amount <= amount);
alter table "public"."card_payments" add constraint "card_payments_applied_nonneg" CHECK (applied_amount >= 0::numeric);
alter table "public"."card_payments" add constraint "card_payments_pkey" PRIMARY KEY (id);
alter table "public"."card_payments" add constraint "card_payments_remaining_nonneg" CHECK (remaining_due_after >= 0::numeric);
alter table "public"."card_payments" add constraint "card_payments_transaction_unique" UNIQUE (transaction_id);
alter table "public"."categories" add constraint "categories_jar_mapping_check" CHECK (is_system = true AND jar_id IS NULL OR is_system = false AND jar_id IS NOT NULL);
alter table "public"."categories" add constraint "categories_kind_check" CHECK (kind = ANY (ARRAY['income'::text, 'expense'::text]));
alter table "public"."categories" add constraint "categories_name_not_blank" CHECK (length(TRIM(BOTH FROM name)) > 0);
alter table "public"."categories" add constraint "categories_pkey" PRIMARY KEY (id);
alter table "public"."categories" add constraint "categories_system_household_null" CHECK (is_system = true AND household_id IS NULL OR is_system = false AND household_id IS NOT NULL);
alter table "public"."credit_card_installment_legacy_archive" add constraint "credit_card_installment_legacy_archiv_legacy_installment_id_key" UNIQUE (legacy_installment_id);
alter table "public"."credit_card_installment_legacy_archive" add constraint "credit_card_installment_legacy_archive_pkey" PRIMARY KEY (id);
alter table "public"."credit_card_installment_schedule" add constraint "credit_card_installment_schedule_confirmation_check" CHECK (status = 'expected'::text AND confirmed_at IS NULL OR status = 'confirmed'::text AND confirmed_at IS NOT NULL);
alter table "public"."credit_card_installment_schedule" add constraint "credit_card_installment_schedule_costs_nonnegative" CHECK (principal_amount >= 0::numeric AND conversion_fee_amount >= 0::numeric AND interest_amount >= 0::numeric AND total_amount = (principal_amount + conversion_fee_amount + interest_amount));
alter table "public"."credit_card_installment_schedule" add constraint "credit_card_installment_schedule_number_positive" CHECK (installment_number > 0);
alter table "public"."credit_card_installment_schedule" add constraint "credit_card_installment_schedule_pkey" PRIMARY KEY (id);
alter table "public"."credit_card_installment_schedule" add constraint "credit_card_installment_schedule_status_check" CHECK (status = ANY (ARRAY['expected'::text, 'confirmed'::text]));
alter table "public"."credit_card_installment_schedule" add constraint "credit_card_installment_schedule_unique" UNIQUE (installment_id, installment_number);
alter table "public"."credit_card_installments" add constraint "credit_card_installments_calculation_source_check" CHECK (calculation_source = ANY (ARRAY['derived'::text, 'bank_quoted'::text]));
alter table "public"."credit_card_installments" add constraint "credit_card_installments_cost_amounts_nonnegative" CHECK (conversion_fee_amount >= 0::numeric AND total_interest_amount >= 0::numeric AND (conversion_fee_rate_bps IS NULL OR conversion_fee_rate_bps >= 0) AND (flat_interest_rate_bps IS NULL OR flat_interest_rate_bps >= 0) AND (quoted_total_repayment IS NULL OR quoted_total_repayment >= principal));
alter table "public"."credit_card_installments" add constraint "credit_card_installments_fee_timing_check" CHECK (fee_timing = ANY (ARRAY['first_expected_period'::text, 'spread_across_periods'::text, 'included_in_bank_quote'::text]));
alter table "public"."credit_card_installments" add constraint "credit_card_installments_fee_type_check" CHECK (conversion_fee_type = ANY (ARRAY['none'::text, 'fixed'::text, 'percentage'::text]));
alter table "public"."credit_card_installments" add constraint "credit_card_installments_origin_check" CHECK (origin = ANY (ARRAY['post_purchase'::text, 'partner_merchant'::text, 'other'::text]));
alter table "public"."credit_card_installments" add constraint "credit_card_installments_pkey" PRIMARY KEY (id);
alter table "public"."credit_card_installments" add constraint "credit_card_installments_principal_positive" CHECK (principal > 0::numeric);
alter table "public"."credit_card_installments" add constraint "credit_card_installments_program_check" CHECK (program = ANY (ARRAY['zero_interest_zero_fee'::text, 'zero_interest_with_conversion_fee'::text, 'flat_interest_without_conversion_fee'::text, 'flat_interest_with_conversion_fee'::text, 'bank_quoted'::text]));
alter table "public"."credit_card_installments" add constraint "credit_card_installments_source_transaction_unique" UNIQUE (source_transaction_id);
alter table "public"."credit_card_installments" add constraint "credit_card_installments_status_check" CHECK (status = ANY (ARRAY['active'::text, 'stopped'::text, 'review_required'::text, 'completed'::text]));
alter table "public"."credit_card_installments" add constraint "credit_card_installments_term_positive" CHECK (term_count > 0);
alter table "public"."credit_card_settings" add constraint "credit_card_settings_due_day" CHECK (due_day >= 1 AND due_day <= 31);
alter table "public"."credit_card_settings" add constraint "credit_card_settings_limit_nonneg" CHECK (credit_limit >= 0::numeric);
alter table "public"."credit_card_settings" add constraint "credit_card_settings_pkey" PRIMARY KEY (account_id);
alter table "public"."credit_card_settings" add constraint "credit_card_settings_statement_day" CHECK (statement_day >= 1 AND statement_day <= 31);
alter table "public"."debt_payments" add constraint "debt_payments_amount_positive" CHECK (amount > 0::numeric);
alter table "public"."debt_payments" add constraint "debt_payments_direction_check" CHECK (payment_direction = ANY (ARRAY['repay_borrowed'::text, 'receive_lent'::text]));
alter table "public"."debt_payments" add constraint "debt_payments_pkey" PRIMARY KEY (id);
alter table "public"."debt_payments" add constraint "debt_payments_transaction_unique" UNIQUE (transaction_id);
alter table "public"."early_withdrawals" add constraint "early_withdrawals_net_nonneg" CHECK (net_returned >= 0::numeric);
alter table "public"."early_withdrawals" add constraint "early_withdrawals_pkey" PRIMARY KEY (id);
alter table "public"."goal_contributions" add constraint "goal_contributions_amount_positive" CHECK (amount > 0::numeric AND amount = trunc(amount));
alter table "public"."goal_contributions" add constraint "goal_contributions_direction_check" CHECK (direction = 'contribute'::text);
alter table "public"."goal_contributions" add constraint "goal_contributions_pkey" PRIMARY KEY (id);
alter table "public"."goal_funding_links" add constraint "goal_funding_links_initial_principal_nonnegative" CHECK (initial_principal_snapshot IS NULL OR initial_principal_snapshot >= 0::numeric);
alter table "public"."goal_funding_links" add constraint "goal_funding_links_pkey" PRIMARY KEY (id);
alter table "public"."goal_funding_links" add constraint "goal_funding_links_source_kind_check" CHECK (source_kind = ANY (ARRAY['saving'::text, 'savings_account'::text, 'holding'::text, 'loan'::text, 'debt'::text]));
alter table "public"."goal_funding_links" add constraint "goal_funding_links_source_shape_check" CHECK (source_kind = 'saving'::text AND saving_id IS NOT NULL AND account_id IS NULL AND holding_id IS NULL AND loan_id IS NULL AND debt_id IS NULL OR source_kind = 'savings_account'::text AND saving_id IS NULL AND account_id IS NOT NULL AND holding_id IS NULL AND loan_id IS NULL AND debt_id IS NULL OR source_kind = 'holding'::text AND saving_id IS NULL AND account_id IS NULL AND holding_id IS NOT NULL AND loan_id IS NULL AND debt_id IS NULL OR source_kind = 'loan'::text AND saving_id IS NULL AND account_id IS NULL AND holding_id IS NULL AND loan_id IS NOT NULL AND debt_id IS NULL OR source_kind = 'debt'::text AND saving_id IS NULL AND account_id IS NULL AND holding_id IS NULL AND loan_id IS NULL AND debt_id IS NOT NULL);
alter table "public"."goal_funding_links" add constraint "goal_funding_links_unlink_shape_check" CHECK (is_active OR unlinked_at IS NOT NULL);
alter table "public"."goal_period_funded_snapshots" add constraint "goal_period_funded_snapshots_pkey" PRIMARY KEY (id);
alter table "public"."goal_period_funded_snapshots" add constraint "goal_period_funded_snapshots_unique" UNIQUE (goal_id, period_month);
alter table "public"."goals" add constraint "goals_financial_scope_check" CHECK (financial_scope = ANY (ARRAY['household'::text, 'personal'::text]));
alter table "public"."goals" add constraint "goals_funded_amount_nonnegative" CHECK (funded_amount >= 0::numeric);
alter table "public"."goals" add constraint "goals_goal_type_check" CHECK (goal_type = ANY (ARRAY['save_up'::text, 'invest'::text, 'payoff'::text]));
alter table "public"."goals" add constraint "goals_initial_principal_snapshot_nonnegative" CHECK (initial_principal_snapshot IS NULL OR initial_principal_snapshot >= 0::numeric);
alter table "public"."goals" add constraint "goals_legacy_funded_amount_nonnegative" CHECK (legacy_funded_amount IS NULL OR legacy_funded_amount >= 0::numeric);
alter table "public"."goals" add constraint "goals_name_not_blank" CHECK (length(TRIM(BOTH FROM name)) > 0);
alter table "public"."goals" add constraint "goals_pkey" PRIMARY KEY (id);
alter table "public"."goals" add constraint "goals_scope_owner_pair_check" CHECK (financial_scope = 'household'::text AND owner_membership_id IS NULL OR financial_scope = 'personal'::text AND owner_membership_id IS NOT NULL);
alter table "public"."goals" add constraint "goals_status_check" CHECK (status = ANY (ARRAY['active'::text, 'paused'::text, 'ready'::text, 'completed'::text, 'cancelled'::text]));
alter table "public"."goals" add constraint "goals_target_amount_positive" CHECK (target_amount > 0::numeric);
alter table "public"."household_configuration_events" add constraint "household_configuration_events_pkey" PRIMARY KEY (id);
alter table "public"."household_configuration_events" add constraint "household_configuration_events_type_check" CHECK (event_type = ANY (ARRAY['preferences.updated'::text, 'role.changed'::text]));
alter table "public"."household_invitations" add constraint "household_invitations_email_not_blank" CHECK (length(TRIM(BOTH FROM email)) > 2);
alter table "public"."household_invitations" add constraint "household_invitations_pkey" PRIMARY KEY (id);
alter table "public"."household_invitations" add constraint "household_invitations_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'revoked'::text, 'expired'::text, 'declined'::text]));
alter table "public"."household_invitations" add constraint "household_invitations_token_key" UNIQUE (token);
alter table "public"."household_members" add constraint "household_members_household_id_id_key" UNIQUE (household_id, id);
alter table "public"."household_members" add constraint "household_members_pkey" PRIMARY KEY (id);
alter table "public"."household_members" add constraint "household_members_role_check" CHECK (role = ANY (ARRAY['partner'::text, 'admin'::text]));
alter table "public"."household_members" add constraint "household_members_unique" UNIQUE (household_id, user_id);
alter table "public"."household_policy_events" add constraint "household_policy_events_pkey" PRIMARY KEY (id);
alter table "public"."household_policy_events" add constraint "household_policy_events_type_check" CHECK (event_type = 'policy.updated'::text);
alter table "public"."households" add constraint "households_consecutive_rituals_nonneg" CHECK (consecutive_completed_rituals >= 0);
alter table "public"."households" add constraint "households_income_allocate_mode_check" CHECK (income_allocate_mode = ANY (ARRAY['off'::text, 'suggest'::text, 'auto'::text]));
alter table "public"."households" add constraint "households_month_close_mode_check" CHECK (month_close_mode = ANY (ARRAY['assisted'::text, 'auto'::text, 'manual'::text, 'quick_close'::text]));
alter table "public"."households" add constraint "households_name_not_blank" CHECK (length(TRIM(BOTH FROM name)) > 0);
alter table "public"."households" add constraint "households_overspend_policy_check" CHECK (overspend_policy = ANY (ARRAY['warn'::text, 'block'::text, 'allow_negative'::text]));
alter table "public"."households" add constraint "households_pkey" PRIMARY KEY (id);
alter table "public"."households" add constraint "households_qualifying_monthly_income_check" CHECK (qualifying_monthly_income IS NULL OR qualifying_monthly_income >= 0::numeric AND qualifying_monthly_income = trunc(qualifying_monthly_income));
alter table "public"."inbox_items" add constraint "inbox_items_amount_positive" CHECK (amount > 0::numeric);
alter table "public"."inbox_items" add constraint "inbox_items_confidence_score_check" CHECK (confidence_score IS NULL OR confidence_score >= 0::numeric AND confidence_score <= 1::numeric);
alter table "public"."inbox_items" add constraint "inbox_items_kind_check" CHECK (kind = ANY (ARRAY['unmapped_expense'::text, 'income_suggest'::text, 'savings_maturity'::text, 'early_withdrawal_confirmation'::text, 'emi_complete'::text, 'emergency_declaration'::text, 'loan_payment_attention'::text, 'debt_payment_attention'::text]));
alter table "public"."inbox_items" add constraint "inbox_items_pkey" PRIMARY KEY (id);
alter table "public"."inbox_items" add constraint "inbox_items_source_type_check" CHECK (source_type = ANY (ARRAY['transaction'::text, 'guided'::text, 'plan_movement'::text]));
alter table "public"."inbox_items" add constraint "inbox_items_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'resolved'::text, 'dismissed'::text, 'acknowledged'::text, 'auto_resolved'::text, 'expired'::text, 'archived'::text]));
alter table "public"."investment_accounts" add constraint "investment_accounts_account_kind_check" CHECK (account_kind = ANY (ARRAY['BROKERAGE'::text, 'FUND_PLATFORM'::text, 'SPOT_WALLET'::text, 'PERSONAL_CUSTODY'::text, 'OTHER'::text]));
alter table "public"."investment_accounts" add constraint "investment_accounts_household_id_provider_id_name_key" UNIQUE (household_id, provider_id, name);
alter table "public"."investment_accounts" add constraint "investment_accounts_name_check" CHECK (length(TRIM(BOTH FROM name)) >= 1 AND length(TRIM(BOTH FROM name)) <= 160);
alter table "public"."investment_accounts" add constraint "investment_accounts_pkey" PRIMARY KEY (id);
alter table "public"."investment_events" add constraint "investment_events_allocation_status_check" CHECK (allocation_status = ANY (ARRAY['PENDING'::text, 'COMPLETED'::text]));
alter table "public"."investment_events" add constraint "investment_events_disposed_cost_basis_check" CHECK (disposed_cost_basis IS NULL OR disposed_cost_basis >= 0::numeric);
alter table "public"."investment_events" add constraint "investment_events_event_type_check" CHECK (event_type = ANY (ARRAY['BUY'::text, 'SELL'::text, 'SUBSCRIBE'::text, 'ALLOCATE'::text, 'REDEEM'::text, 'DISTRIBUTION'::text, 'DIVIDEND'::text, 'VALUATION_UPDATE'::text, 'HISTORICAL_IMPORT'::text, 'ADJUSTMENT'::text]));
alter table "public"."investment_events" add constraint "investment_events_executed_quantity_check" CHECK (executed_quantity IS NULL OR executed_quantity > 0::numeric);
alter table "public"."investment_events" add constraint "investment_events_fee_amount_check" CHECK (fee_amount IS NULL OR fee_amount >= 0::numeric);
alter table "public"."investment_events" add constraint "investment_events_gross_amount_check" CHECK (gross_amount IS NULL OR gross_amount >= 0::numeric);
alter table "public"."investment_events" add constraint "investment_events_legacy_operation_id_key" UNIQUE (legacy_operation_id);
alter table "public"."investment_events" add constraint "investment_events_nav_per_unit_check" CHECK (nav_per_unit IS NULL OR nav_per_unit >= 0::numeric);
alter table "public"."investment_events" add constraint "investment_events_notes_check" CHECK (notes IS NULL OR length(notes) <= 500);
alter table "public"."investment_events" add constraint "investment_events_pkey" PRIMARY KEY (id);
alter table "public"."investment_events" add constraint "investment_events_quantity_unit_check" CHECK (quantity_unit IS NULL OR (quantity_unit = ANY (ARRAY['LUONG'::text, 'CHI'::text, 'GRAM'::text])));
alter table "public"."investment_events" add constraint "investment_events_requested_amount_check" CHECK (requested_amount IS NULL OR requested_amount >= 0::numeric);
alter table "public"."investment_events" add constraint "investment_events_tax_amount_check" CHECK (tax_amount IS NULL OR tax_amount >= 0::numeric);
alter table "public"."investment_events" add constraint "investment_events_unit_price_check" CHECK (unit_price IS NULL OR unit_price >= 0::numeric);
alter table "public"."investment_fees" add constraint "investment_fees_fee_asset_check" CHECK (fee_asset IS NULL OR length(TRIM(BOTH FROM fee_asset)) >= 1 AND length(TRIM(BOTH FROM fee_asset)) <= 40);
alter table "public"."investment_fees" add constraint "investment_fees_fee_source_check" CHECK (fee_source = ANY (ARRAY['cash'::text, 'source_asset'::text, 'destination_asset'::text, 'other_investment'::text]));
alter table "public"."investment_fees" add constraint "investment_fees_fee_value_vnd_check" CHECK (fee_value_vnd > 0::numeric);
alter table "public"."investment_fees" add constraint "investment_fees_pkey" PRIMARY KEY (id);
alter table "public"."investment_fees" add constraint "investment_fees_shape_check" CHECK (fee_source = 'cash'::text AND amount_vnd IS NOT NULL AND amount_vnd > 0::numeric AND quantity IS NULL AND fee_holding_id IS NULL AND cash_account_id IS NOT NULL OR fee_source <> 'cash'::text AND quantity IS NOT NULL AND quantity > 0::numeric AND amount_vnd IS NULL AND fee_holding_id IS NOT NULL AND cash_account_id IS NULL AND transaction_id IS NULL);
alter table "public"."investment_holdings" add constraint "investment_holdings_accounting_method_check" CHECK (accounting_method IS NULL OR (accounting_method = ANY (ARRAY['WEIGHTED_AVERAGE'::text, 'FIFO'::text])));
alter table "public"."investment_holdings" add constraint "investment_holdings_asset_class_check" CHECK (asset_class = ANY (ARRAY['crypto'::text, 'stock'::text, 'fund'::text, 'gold'::text, 'bond'::text]));
alter table "public"."investment_holdings" add constraint "investment_holdings_asset_type_check" CHECK (asset_type IS NULL OR (asset_type = ANY (ARRAY['SECURITY'::text, 'FUND'::text, 'CRYPTO'::text, 'GOLD'::text, 'MANUAL_ASSET'::text])));
alter table "public"."investment_holdings" add constraint "investment_holdings_data_quality_check" CHECK (data_quality IS NULL OR (data_quality = ANY (ARRAY['COMPLETE'::text, 'IMPORTED_AGGREGATE'::text, 'BASIS_UNKNOWN'::text])));
alter table "public"."investment_holdings" add constraint "investment_holdings_exit_shape" CHECK (quantity = 0::numeric AND lifecycle_status = 'exited'::text AND (remaining_total_cost_basis IS NULL OR remaining_total_cost_basis = 0::numeric) OR quantity > 0::numeric AND lifecycle_status <> 'exited'::text);
alter table "public"."investment_holdings" add constraint "investment_holdings_financial_scope_check" CHECK (financial_scope = ANY (ARRAY['household'::text, 'personal'::text]));
alter table "public"."investment_holdings" add constraint "investment_holdings_history_status_check" CHECK (history_status = ANY (ARRAY['full'::text, 'opening_position'::text, 'cost_basis_unknown'::text]));
alter table "public"."investment_holdings" add constraint "investment_holdings_lifecycle_status_check" CHECK (lifecycle_status = ANY (ARRAY['active'::text, 'exited'::text, 'under_review'::text]));
alter table "public"."investment_holdings" add constraint "investment_holdings_name_check" CHECK (length(TRIM(BOTH FROM name)) >= 1 AND length(TRIM(BOTH FROM name)) <= 160);
alter table "public"."investment_holdings" add constraint "investment_holdings_notes_check" CHECK (notes IS NULL OR length(notes) <= 500);
alter table "public"."investment_holdings" add constraint "investment_holdings_pkey" PRIMARY KEY (id);
alter table "public"."investment_holdings" add constraint "investment_holdings_provider_custodian_check" CHECK (provider_custodian IS NULL OR length(TRIM(BOTH FROM provider_custodian)) >= 1 AND length(TRIM(BOTH FROM provider_custodian)) <= 160);
alter table "public"."investment_holdings" add constraint "investment_holdings_quantity_check" CHECK (quantity >= 0::numeric);
alter table "public"."investment_holdings" add constraint "investment_holdings_remaining_total_cost_basis_check" CHECK (remaining_total_cost_basis IS NULL OR remaining_total_cost_basis >= 0::numeric);
alter table "public"."investment_holdings" add constraint "investment_holdings_scope_owner_pair_check" CHECK (financial_scope = 'household'::text AND owner_membership_id IS NULL OR financial_scope = 'personal'::text AND owner_membership_id IS NOT NULL);
alter table "public"."investment_holdings" add constraint "investment_holdings_symbol_check" CHECK (symbol IS NULL OR length(TRIM(BOTH FROM symbol)) >= 1 AND length(TRIM(BOTH FROM symbol)) <= 40);
alter table "public"."investment_holdings" add constraint "investment_holdings_valuation_source_check" CHECK (valuation_source IS NULL OR (valuation_source = ANY (ARRAY['MANUAL'::text, 'PROVIDER'::text, 'MARKET_FEED'::text])));
alter table "public"."investment_holdings" add constraint "investment_holdings_visibility_context_check" CHECK (visibility_context = ANY (ARRAY['household'::text, 'unclear'::text]));
alter table "public"."investment_instruments" add constraint "investment_instruments_archetype_check" CHECK (archetype = ANY (ARRAY['SECURITY'::text, 'FUND'::text, 'CRYPTO'::text, 'GOLD'::text, 'MANUAL_ASSET'::text]));
alter table "public"."investment_instruments" add constraint "investment_instruments_household_id_archetype_name_key" UNIQUE (household_id, archetype, name);
alter table "public"."investment_instruments" add constraint "investment_instruments_name_check" CHECK (length(TRIM(BOTH FROM name)) >= 1 AND length(TRIM(BOTH FROM name)) <= 200);
alter table "public"."investment_instruments" add constraint "investment_instruments_pkey" PRIMARY KEY (id);
alter table "public"."investment_lots" add constraint "investment_lots_check" CHECK (remaining_quantity >= 0::numeric AND remaining_quantity <= original_quantity);
alter table "public"."investment_lots" add constraint "investment_lots_original_quantity_check" CHECK (original_quantity > 0::numeric);
alter table "public"."investment_lots" add constraint "investment_lots_pkey" PRIMARY KEY (id);
alter table "public"."investment_lots" add constraint "investment_lots_total_cost_check" CHECK (total_cost >= 0::numeric);
alter table "public"."investment_lots" add constraint "investment_lots_unit_cost_check" CHECK (unit_cost >= 0::numeric);
alter table "public"."investment_operations" add constraint "investment_operations_idempotency_key_check" CHECK (length(TRIM(BOTH FROM idempotency_key)) >= 1 AND length(TRIM(BOTH FROM idempotency_key)) <= 200);
alter table "public"."investment_operations" add constraint "investment_operations_income_kind_check" CHECK (income_kind IS NULL OR (income_kind = ANY (ARRAY['dividend'::text, 'interest'::text, 'distribution'::text, 'other'::text])));
alter table "public"."investment_operations" add constraint "investment_operations_notes_check" CHECK (notes IS NULL OR length(notes) <= 500);
alter table "public"."investment_operations" add constraint "investment_operations_operation_type_check" CHECK (operation_type = ANY (ARRAY['opening_position'::text, 'buy'::text, 'sell'::text, 'asset_conversion'::text, 'investment_income'::text]));
alter table "public"."investment_operations" add constraint "investment_operations_pkey" PRIMARY KEY (id);
alter table "public"."investment_operations" add constraint "investment_operations_quantity_check" CHECK ((source_quantity IS NULL OR source_quantity > 0::numeric) AND (destination_quantity IS NULL OR destination_quantity > 0::numeric));
alter table "public"."investment_operations" add constraint "investment_operations_shape_check" CHECK (operation_type = 'opening_position'::text AND source_holding_id IS NULL AND destination_holding_id IS NOT NULL AND cash_account_id IS NULL AND transaction_id IS NULL OR operation_type = 'buy'::text AND source_holding_id IS NULL AND destination_holding_id IS NOT NULL AND cash_account_id IS NOT NULL AND transaction_id IS NOT NULL OR operation_type = 'sell'::text AND source_holding_id IS NOT NULL AND destination_holding_id IS NULL AND cash_account_id IS NOT NULL AND transaction_id IS NOT NULL OR operation_type = 'asset_conversion'::text AND source_holding_id IS NOT NULL AND destination_holding_id IS NOT NULL AND source_holding_id <> destination_holding_id AND transaction_id IS NULL OR operation_type = 'investment_income'::text AND source_holding_id IS NOT NULL AND destination_holding_id IS NULL AND cash_account_id IS NOT NULL AND transaction_id IS NOT NULL AND income_kind IS NOT NULL);
alter table "public"."investment_operations" add constraint "investment_operations_value_check" CHECK ((executed_value_vnd IS NULL OR executed_value_vnd >= 0::numeric) AND (quoted_value_vnd IS NULL OR quoted_value_vnd >= 0::numeric));
alter table "public"."investment_providers" add constraint "investment_providers_household_id_name_key" UNIQUE (household_id, name);
alter table "public"."investment_providers" add constraint "investment_providers_name_check" CHECK (length(TRIM(BOTH FROM name)) >= 1 AND length(TRIM(BOTH FROM name)) <= 160);
alter table "public"."investment_providers" add constraint "investment_providers_pkey" PRIMARY KEY (id);
alter table "public"."investment_valuations" add constraint "investment_valuations_idempotency_key_check" CHECK (length(TRIM(BOTH FROM idempotency_key)) >= 1 AND length(TRIM(BOTH FROM idempotency_key)) <= 200);
alter table "public"."investment_valuations" add constraint "investment_valuations_notes_check" CHECK (notes IS NULL OR length(notes) <= 500);
alter table "public"."investment_valuations" add constraint "investment_valuations_pkey" PRIMARY KEY (id);
alter table "public"."investment_valuations" add constraint "investment_valuations_source_check" CHECK (source = ANY (ARRAY['manual'::text, 'statement'::text, 'provider'::text]));
alter table "public"."investment_valuations" add constraint "investment_valuations_value_vnd_check" CHECK (value_vnd >= 0::numeric);
alter table "public"."jar_period_adjustments" add constraint "jar_period_adjustments_period_month_check" CHECK (period_month = date_trunc('month'::text, period_month::timestamp with time zone)::date);
alter table "public"."jar_period_adjustments" add constraint "jar_period_adjustments_pkey" PRIMARY KEY (id);
alter table "public"."jar_period_rule_snapshots" add constraint "jar_period_rule_snapshots_income_source_check" CHECK (qualifying_income_source = ANY (ARRAY['configured'::text, 'recurring_fallback'::text, 'posted_fallback'::text, 'none'::text]));
alter table "public"."jar_period_rule_snapshots" add constraint "jar_period_rule_snapshots_nonnegative_values_check" CHECK (percent_bps >= 0 AND percent_bps <= 10000 AND fixed_amount >= 0::numeric AND qualifying_income >= 0::numeric AND rule_budget >= 0::numeric AND rollover_credit >= 0::numeric);
alter table "public"."jar_period_rule_snapshots" add constraint "jar_period_rule_snapshots_pkey" PRIMARY KEY (id);
alter table "public"."jar_period_rule_snapshots" add constraint "jar_period_rule_snapshots_plan05_period_check" CHECK (period_month = date_trunc('month'::text, period_month::timestamp with time zone)::date);
alter table "public"."jar_period_rule_snapshots" add constraint "jar_period_rule_snapshots_plan05_unique" UNIQUE (jar_id, period_month);
alter table "public"."jar_plans" add constraint "jar_plans_fixed_amount_check" CHECK (fixed_amount >= 0::numeric);
alter table "public"."jar_plans" add constraint "jar_plans_jar_unique" UNIQUE (jar_id);
alter table "public"."jar_plans" add constraint "jar_plans_kind_check" CHECK (plan_kind = ANY (ARRAY['percent'::text, 'fixed'::text]));
alter table "public"."jar_plans" add constraint "jar_plans_percent_bps_check" CHECK (percent_bps >= 0 AND percent_bps <= 10000);
alter table "public"."jar_plans" add constraint "jar_plans_pkey" PRIMARY KEY (id);
alter table "public"."jars" add constraint "jars_kind_check" CHECK (kind = ANY (ARRAY['spending'::text, 'savings'::text, 'buffer'::text, 'income'::text]));
alter table "public"."jars" add constraint "jars_name_not_blank" CHECK (length(TRIM(BOTH FROM name)) > 0);
alter table "public"."jars" add constraint "jars_pkey" PRIMARY KEY (id);
alter table "public"."jars" add constraint "jars_rollover_mode_check" CHECK (rollover_mode = ANY (ARRAY['reset'::text, 'carry'::text]));
alter table "public"."liabilities" add constraint "liabilities_creation_mode_check" CHECK (creation_mode = ANY (ARRAY['existing_balance'::text, 'money_moved'::text]));
alter table "public"."liabilities" add constraint "liabilities_direction_check" CHECK (direction = ANY (ARRAY['borrowed'::text, 'lent'::text]));
alter table "public"."liabilities" add constraint "liabilities_due_day_range" CHECK (due_day IS NULL OR due_day >= 1 AND due_day <= 31);
alter table "public"."liabilities" add constraint "liabilities_financial_scope_check" CHECK (financial_scope = ANY (ARRAY['household'::text, 'personal'::text]));
alter table "public"."liabilities" add constraint "liabilities_name_not_blank" CHECK (length(TRIM(BOTH FROM name)) > 0);
alter table "public"."liabilities" add constraint "liabilities_opening_paid_amount_check" CHECK (opening_paid_amount >= 0::numeric AND opening_paid_amount <= principal_amount);
alter table "public"."liabilities" add constraint "liabilities_pkey" PRIMARY KEY (id);
alter table "public"."liabilities" add constraint "liabilities_principal_positive" CHECK (principal_amount > 0::numeric);
alter table "public"."liabilities" add constraint "liabilities_remaining_lte_principal" CHECK (remaining_amount <= principal_amount);
alter table "public"."liabilities" add constraint "liabilities_remaining_nonneg" CHECK (remaining_amount >= 0::numeric);
alter table "public"."liabilities" add constraint "liabilities_scope_owner_pair_check" CHECK (financial_scope = 'household'::text AND owner_membership_id IS NULL OR financial_scope = 'personal'::text AND owner_membership_id IS NOT NULL);
alter table "public"."liabilities" add constraint "liabilities_status_check" CHECK (status = ANY (ARRAY['active'::text, 'completed'::text, 'archived'::text]));
alter table "public"."loan_interest_rate_periods" add constraint "loan_interest_rate_periods_kind_check" CHECK (kind = ANY (ARRAY['fixed'::text, 'promotional'::text, 'floating'::text]));
alter table "public"."loan_interest_rate_periods" add constraint "loan_interest_rate_periods_loan_seq" UNIQUE (loan_id, sequence);
alter table "public"."loan_interest_rate_periods" add constraint "loan_interest_rate_periods_pkey" PRIMARY KEY (id);
alter table "public"."loan_interest_rate_periods" add constraint "loan_interest_rate_periods_range" CHECK (effective_to IS NULL OR effective_to > effective_from);
alter table "public"."loan_interest_rate_periods" add constraint "loan_interest_rate_periods_rate_nonneg" CHECK (annual_rate >= 0::numeric);
alter table "public"."loan_interest_rate_periods" add constraint "loan_interest_rate_periods_sequence_positive" CHECK (sequence > 0);
alter table "public"."loan_payments" add constraint "loan_payments_amounts_positive" CHECK (amount > 0::numeric AND principal_paid >= 0::numeric AND interest_paid >= 0::numeric);
alter table "public"."loan_payments" add constraint "loan_payments_pkey" PRIMARY KEY (id);
alter table "public"."loan_payments" add constraint "loan_payments_split" CHECK ((principal_paid + interest_paid) = amount);
alter table "public"."loan_schedule_entries" add constraint "loan_schedule_entries_amounts_nonnegative" CHECK (principal_due >= 0::numeric AND interest_due >= 0::numeric AND total_due >= 0::numeric AND remaining_balance_after >= 0::numeric);
alter table "public"."loan_schedule_entries" add constraint "loan_schedule_entries_pkey" PRIMARY KEY (id);
alter table "public"."loan_schedule_entries" add constraint "loan_schedule_entries_sequence_positive" CHECK (sequence > 0);
alter table "public"."loan_schedule_entries" add constraint "loan_schedule_entries_status_check" CHECK (status = ANY (ARRAY['upcoming'::text, 'paid'::text, 'partial'::text, 'waived'::text]));
alter table "public"."loan_schedule_entries" add constraint "loan_schedule_entries_unique_sequence" UNIQUE (loan_id, sequence);
alter table "public"."loans" add constraint "installment_plans_pkey" PRIMARY KEY (id);
alter table "public"."loans" add constraint "loans_amounts_positive" CHECK (principal > 0::numeric AND monthly_payment > 0::numeric);
alter table "public"."loans" add constraint "loans_due_day_range" CHECK (due_day IS NULL OR due_day >= 1 AND due_day <= 31);
alter table "public"."loans" add constraint "loans_financial_scope_check" CHECK (financial_scope = ANY (ARRAY['household'::text, 'personal'::text]));
alter table "public"."loans" add constraint "loans_frequency_check" CHECK (repayment_frequency = 'monthly'::text);
alter table "public"."loans" add constraint "loans_interest_nonneg" CHECK (annual_interest_rate IS NULL OR annual_interest_rate >= 0::numeric);
alter table "public"."loans" add constraint "loans_interest_strategy_check" CHECK (interest_strategy = ANY (ARRAY['fixed'::text, 'promo_fixed_to_floating'::text, 'floating'::text]));
alter table "public"."loans" add constraint "loans_loan_type_check" CHECK (loan_type = ANY (ARRAY['bank_loan'::text, 'personal_loan'::text, 'family_loan'::text, 'friend_loan'::text, 'store_financing'::text, 'bnpl'::text, 'tuition'::text, 'medical'::text, 'vehicle'::text, 'home'::text, 'other'::text]));
alter table "public"."loans" add constraint "loans_name_not_blank" CHECK (length(TRIM(BOTH FROM name)) > 0);
alter table "public"."loans" add constraint "loans_promo_months_positive" CHECK (promo_fixed_months IS NULL OR promo_fixed_months > 0);
alter table "public"."loans" add constraint "loans_remaining_range" CHECK (remaining_principal >= 0::numeric AND remaining_principal <= principal);
alter table "public"."loans" add constraint "loans_scope_owner_pair_check" CHECK (financial_scope = 'household'::text AND owner_membership_id IS NULL OR financial_scope = 'personal'::text AND owner_membership_id IS NOT NULL);
alter table "public"."loans" add constraint "loans_status_check" CHECK (status = ANY (ARRAY['active'::text, 'completed'::text]));
alter table "public"."market_currency_rates" add constraint "market_currency_rates_base_currency_check" CHECK (base_currency ~ '^[A-Z]{3}$'::text);
alter table "public"."market_currency_rates" add constraint "market_currency_rates_check" CHECK (base_currency <> quote_currency);
alter table "public"."market_currency_rates" add constraint "market_currency_rates_pkey" PRIMARY KEY (base_currency, quote_currency);
alter table "public"."market_currency_rates" add constraint "market_currency_rates_provider_check" CHECK (provider = 'FRANKFURTER'::text);
alter table "public"."market_currency_rates" add constraint "market_currency_rates_quote_currency_check" CHECK (quote_currency ~ '^[A-Z]{3}$'::text);
alter table "public"."market_currency_rates" add constraint "market_currency_rates_rate_check" CHECK (rate > 0::numeric);
alter table "public"."market_instrument_prices" add constraint "market_instrument_prices_currency_check" CHECK (currency ~ '^[A-Z]{3}$'::text);
alter table "public"."market_instrument_prices" add constraint "market_instrument_prices_pkey" PRIMARY KEY (instrument_id);
alter table "public"."market_instrument_prices" add constraint "market_instrument_prices_price_check" CHECK (price >= 0::numeric);
alter table "public"."market_instrument_prices" add constraint "market_instrument_prices_price_type_check" CHECK (price_type = ANY (ARRAY['LAST'::text, 'NAV'::text, 'BUYBACK'::text, 'TOTAL_VALUE'::text, 'MANUAL'::text]));
alter table "public"."market_instrument_prices" add constraint "market_instrument_prices_provider_check" CHECK (provider = ANY (ARRAY['MANUAL'::text, 'COINGECKO'::text, 'VNSTOCK'::text, 'FMARKET'::text]));
alter table "public"."market_instrument_sources" add constraint "market_instrument_sources_pkey" PRIMARY KEY (instrument_id, provider);
alter table "public"."market_instrument_sources" add constraint "market_instrument_sources_priority_check" CHECK (priority >= 0);
alter table "public"."market_instrument_sources" add constraint "market_instrument_sources_provider_check" CHECK (provider = ANY (ARRAY['MANUAL'::text, 'COINGECKO'::text, 'VNSTOCK'::text, 'FMARKET'::text]));
alter table "public"."market_instrument_sources" add constraint "market_instrument_sources_provider_instrument_id_check" CHECK (length(TRIM(BOTH FROM provider_instrument_id)) >= 1 AND length(TRIM(BOTH FROM provider_instrument_id)) <= 200);
alter table "public"."market_instrument_sources" add constraint "market_instrument_sources_provider_provider_instrument_id_key" UNIQUE (provider, provider_instrument_id);
alter table "public"."market_instruments" add constraint "market_instruments_asset_class_check" CHECK (asset_class = ANY (ARRAY['crypto'::text, 'stock'::text, 'fund'::text, 'gold'::text, 'bond'::text]));
alter table "public"."market_instruments" add constraint "market_instruments_currency_check" CHECK (currency ~ '^[A-Z]{3}$'::text);
alter table "public"."market_instruments" add constraint "market_instruments_exchange_check" CHECK (exchange IS NULL OR length(TRIM(BOTH FROM exchange)) >= 1 AND length(TRIM(BOTH FROM exchange)) <= 80);
alter table "public"."market_instruments" add constraint "market_instruments_name_check" CHECK (length(TRIM(BOTH FROM name)) >= 1 AND length(TRIM(BOTH FROM name)) <= 200);
alter table "public"."market_instruments" add constraint "market_instruments_pkey" PRIMARY KEY (id);
alter table "public"."market_instruments" add constraint "market_instruments_pricing_mode_check" CHECK (pricing_mode = ANY (ARRAY['UNIT_PRICE'::text, 'NAV_PER_UNIT'::text, 'BUYBACK_PRICE'::text, 'TOTAL_VALUE'::text, 'MANUAL'::text]));
alter table "public"."market_instruments" add constraint "market_instruments_symbol_check" CHECK (length(TRIM(BOTH FROM symbol)) >= 1 AND length(TRIM(BOTH FROM symbol)) <= 40);
alter table "public"."market_sync_locks" add constraint "market_sync_locks_lock_key_check" CHECK (length(TRIM(BOTH FROM lock_key)) >= 1 AND length(TRIM(BOTH FROM lock_key)) <= 120);
alter table "public"."market_sync_locks" add constraint "market_sync_locks_pkey" PRIMARY KEY (lock_key);
alter table "public"."market_sync_runs" add constraint "market_sync_runs_asset_class_check" CHECK (asset_class IS NULL OR (asset_class = ANY (ARRAY['crypto'::text, 'stock'::text, 'fund'::text, 'gold'::text, 'bond'::text])));
alter table "public"."market_sync_runs" add constraint "market_sync_runs_failed_count_check" CHECK (failed_count >= 0);
alter table "public"."market_sync_runs" add constraint "market_sync_runs_fetched_count_check" CHECK (fetched_count >= 0);
alter table "public"."market_sync_runs" add constraint "market_sync_runs_inserted_count_check" CHECK (inserted_count >= 0);
alter table "public"."market_sync_runs" add constraint "market_sync_runs_pkey" PRIMARY KEY (id);
alter table "public"."market_sync_runs" add constraint "market_sync_runs_provider_check" CHECK (provider = ANY (ARRAY['COINGECKO'::text, 'VNSTOCK'::text, 'FMARKET'::text]));
alter table "public"."market_sync_runs" add constraint "market_sync_runs_requested_count_check" CHECK (requested_count >= 0);
alter table "public"."market_sync_runs" add constraint "market_sync_runs_status_check" CHECK (status = ANY (ARRAY['running'::text, 'succeeded'::text, 'partial'::text, 'failed'::text, 'skipped'::text]));
alter table "public"."market_sync_runs" add constraint "market_sync_runs_success_count_check" CHECK (success_count >= 0);
alter table "public"."market_sync_runs" add constraint "market_sync_runs_sync_kind_check" CHECK (sync_kind = ANY (ARRAY['catalog'::text, 'price'::text]));
alter table "public"."market_sync_runs" add constraint "market_sync_runs_updated_count_check" CHECK (updated_count >= 0);
alter table "public"."month_ritual_runs" add constraint "month_ritual_runs_mode_check" CHECK (mode = ANY (ARRAY['assisted'::text, 'auto'::text, 'manual'::text, 'quick_close'::text]));
alter table "public"."month_ritual_runs" add constraint "month_ritual_runs_month_check" CHECK (period_month = date_trunc('month'::text, period_month::timestamp with time zone)::date);
alter table "public"."month_ritual_runs" add constraint "month_ritual_runs_pkey" PRIMARY KEY (id);
alter table "public"."month_ritual_runs" add constraint "month_ritual_runs_review_status_check" CHECK (review_status = ANY (ARRAY['not_started'::text, 'viewed'::text, 'marked_reviewed'::text]));
alter table "public"."month_ritual_runs" add constraint "month_ritual_runs_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'previewed'::text, 'approved'::text, 'corrected'::text, 'pending_review'::text]));
alter table "public"."month_ritual_runs" add constraint "month_ritual_runs_unique" UNIQUE (household_id, period_month);
alter table "public"."plan_movements" add constraint "plan_movements_amount_positive" CHECK (amount > 0::numeric);
alter table "public"."plan_movements" add constraint "plan_movements_distinct_jars" CHECK (source_jar_id <> target_jar_id);
alter table "public"."plan_movements" add constraint "plan_movements_emergency_note_check" CHECK (is_emergency = false OR intent_note IS NOT NULL AND length(TRIM(BOTH FROM intent_note)) > 0);
alter table "public"."plan_movements" add constraint "plan_movements_pkey" PRIMARY KEY (id);
alter table "public"."plan_movements" add constraint "plan_movements_zero_ledger_impact" CHECK (ledger_impact = 0::numeric);
alter table "public"."recurring_rules" add constraint "recurring_rules_amount_positive" CHECK (amount > 0::numeric AND amount = trunc(amount));
alter table "public"."recurring_rules" add constraint "recurring_rules_day_of_month_check" CHECK (day_of_month IS NULL OR day_of_month >= 1 AND day_of_month <= 31);
alter table "public"."recurring_rules" add constraint "recurring_rules_day_of_week_check" CHECK (day_of_week IS NULL OR day_of_week >= 0 AND day_of_week <= 6);
alter table "public"."recurring_rules" add constraint "recurring_rules_direction_check" CHECK (direction = ANY (ARRAY['income'::text, 'expense'::text]));
alter table "public"."recurring_rules" add constraint "recurring_rules_frequency_check" CHECK (frequency = ANY (ARRAY['weekly'::text, 'monthly'::text]));
alter table "public"."recurring_rules" add constraint "recurring_rules_interval_positive" CHECK (interval_count > 0);
alter table "public"."recurring_rules" add constraint "recurring_rules_name_not_blank" CHECK (length(TRIM(BOTH FROM name)) > 0);
alter table "public"."recurring_rules" add constraint "recurring_rules_pkey" PRIMARY KEY (id);
alter table "public"."saving_cycles" add constraint "saving_cycles_pkey" PRIMARY KEY (id);
alter table "public"."saving_cycles" add constraint "saving_cycles_principal_positive" CHECK (principal > 0::numeric);
alter table "public"."saving_cycles" add constraint "saving_cycles_rate_nonneg" CHECK (locked_rate >= 0::numeric);
alter table "public"."saving_cycles" add constraint "saving_cycles_status_check" CHECK (status = ANY (ARRAY['active'::text, 'matured'::text, 'early_closed'::text, 'rolled'::text]));
alter table "public"."saving_cycles" add constraint "saving_cycles_unique_number" UNIQUE (saving_id, cycle_number);
alter table "public"."saving_packages" add constraint "saving_packages_amount_range_check" CHECK (max_amount IS NULL OR min_amount IS NULL OR max_amount >= min_amount);
alter table "public"."saving_packages" add constraint "saving_packages_duration_positive" CHECK (duration_days > 0);
alter table "public"."saving_packages" add constraint "saving_packages_early_rate_check" CHECK (early_settlement_rate_percent IS NULL OR early_settlement_rate_percent >= 0::numeric AND early_settlement_rate_percent <= 100::numeric);
alter table "public"."saving_packages" add constraint "saving_packages_early_rule_check" CHECK (early_settlement_rule = ANY (ARRAY['NOT_ALLOWED'::text, 'RETURN_PRINCIPAL_ONLY'::text, 'CUSTOM_RATE'::text, 'PENALTY'::text, 'CUSTOM'::text]));
alter table "public"."saving_packages" add constraint "saving_packages_interest_method_check" CHECK (interest_calculation_method = ANY (ARRAY['simple'::text, 'compound_daily'::text, 'compound_monthly'::text]));
alter table "public"."saving_packages" add constraint "saving_packages_pkey" PRIMARY KEY (id);
alter table "public"."saving_packages" add constraint "saving_packages_rate_nonneg" CHECK (annual_interest_rate >= 0::numeric);
alter table "public"."saving_packages" add constraint "saving_packages_tax_rate_check" CHECK (tax_rate_percent >= 0::numeric AND tax_rate_percent <= 100::numeric);
alter table "public"."saving_packages" add constraint "saving_packages_tax_rule_check" CHECK (tax_rule = ANY (ARRAY['NONE'::text, 'PROFIT_PERCENTAGE'::text]));
alter table "public"."saving_packages" add constraint "saving_packages_term_unit_check" CHECK (term_unit = ANY (ARRAY['DAY'::text, 'MONTH'::text]));
alter table "public"."saving_providers" add constraint "saving_providers_family_check" CHECK (family = ANY (ARRAY['BANK'::text, 'PLATFORM'::text]));
alter table "public"."saving_providers" add constraint "saving_providers_pkey" PRIMARY KEY (id);
alter table "public"."saving_providers" add constraint "saving_providers_provider_key_key" UNIQUE (provider_key);
alter table "public"."saving_providers" add constraint "saving_providers_type_check" CHECK (saving_type = ANY (ARRAY['bank_deposit'::text, 'digital_saving'::text, 'flexible_saving'::text, 'manual_saving'::text]));
alter table "public"."savings" add constraint "savings_financial_scope_check" CHECK (financial_scope = ANY (ARRAY['household'::text, 'personal'::text]));
alter table "public"."savings" add constraint "savings_pkey" PRIMARY KEY (id);
alter table "public"."savings" add constraint "savings_renewal_policy_check" CHECK (renewal_policy = ANY (ARRAY['always_ask'::text, 'use_saved_preference'::text, 'auto_renew_until_cancelled'::text, 'one_time_renewal'::text]));
alter table "public"."savings" add constraint "savings_renewal_policy_compat_check" CHECK (renewal_policy = ANY (ARRAY['always_ask'::text, 'use_saved_preference'::text, 'auto_renew_until_cancelled'::text, 'one_time_renewal'::text]));
alter table "public"."savings" add constraint "savings_scope_owner_pair_check" CHECK (financial_scope = 'household'::text AND owner_membership_id IS NULL OR financial_scope = 'personal'::text AND owner_membership_id IS NOT NULL);
alter table "public"."savings" add constraint "savings_status_check" CHECK (status = ANY (ARRAY['active'::text, 'matured'::text, 'early_closed'::text, 'closed'::text]));
alter table "public"."savings_accounts" add constraint "savings_accounts_name_not_blank" CHECK (length(TRIM(BOTH FROM name)) > 0);
alter table "public"."savings_accounts" add constraint "savings_accounts_pkey" PRIMARY KEY (id);
alter table "public"."savings_accounts" add constraint "savings_accounts_principal_positive" CHECK (principal_amount > 0::numeric);
alter table "public"."savings_accounts" add constraint "savings_accounts_status_check" CHECK (status = ANY (ARRAY['active'::text, 'matured'::text, 'closed'::text]));
alter table "public"."transaction_tag_assignments" add constraint "transaction_tag_assignments_pkey" PRIMARY KEY (transaction_id, tag_id);
alter table "public"."transaction_tags" add constraint "transaction_tags_color_key_length" CHECK (color_key IS NULL OR char_length(color_key) <= 32);
alter table "public"."transaction_tags" add constraint "transaction_tags_icon_key_length" CHECK (char_length(icon_key) <= 64);
alter table "public"."transaction_tags" add constraint "transaction_tags_icon_key_nonempty" CHECK (length(TRIM(BOTH FROM icon_key)) > 0);
alter table "public"."transaction_tags" add constraint "transaction_tags_name_length" CHECK (char_length(name) <= 64);
alter table "public"."transaction_tags" add constraint "transaction_tags_name_nonempty" CHECK (length(TRIM(BOTH FROM name)) > 0);
alter table "public"."transaction_tags" add constraint "transaction_tags_pkey" PRIMARY KEY (id);
alter table "public"."transactions" add constraint "transactions_amount_positive" CHECK (amount > 0::numeric);
alter table "public"."transactions" add constraint "transactions_pkey" PRIMARY KEY (id);
alter table "public"."transactions" add constraint "transactions_savings_event_kind_check" CHECK (savings_event_kind IS NULL OR (savings_event_kind = ANY (ARRAY['SAVINGS_PRINCIPAL_PLACEMENT'::text, 'SAVINGS_PRINCIPAL_RETURN'::text, 'SAVINGS_INTEREST'::text, 'SAVINGS_TAX'::text, 'SAVINGS_FEE'::text])));
alter table "public"."transactions" add constraint "transactions_source_check" CHECK (source = ANY (ARRAY['manual'::text, 'bank_feed'::text, 'recurring_pattern'::text]));
alter table "public"."transactions" add constraint "transactions_status_check" CHECK (status = ANY (ARRAY['pending_mapping'::text, 'posted'::text, 'partially_refunded'::text, 'fully_refunded'::text, 'reversed'::text]));
alter table "public"."transactions" add constraint "transactions_transfer_shape_check" CHECK ((type = ANY (ARRAY['transfer_out'::text, 'transfer_in'::text])) AND transfer_group_id IS NOT NULL AND category_id IS NULL AND jar_id IS NULL OR (type <> ALL (ARRAY['transfer_out'::text, 'transfer_in'::text])) AND transfer_group_id IS NULL);
alter table "public"."transactions" add constraint "transactions_type_check" CHECK (type = ANY (ARRAY['income'::text, 'expense'::text, 'liability_payment'::text, 'loan_interest'::text, 'transfer_out'::text, 'transfer_in'::text, 'investment_buy'::text, 'investment_sell_proceeds'::text, 'investment_income'::text, 'investment_fee'::text, 'debt_borrowing'::text, 'debt_lending'::text, 'debt_receivable_payment'::text]));
alter table "public"."accounts" add constraint "accounts_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table "public"."accounts" add constraint "accounts_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."accounts" add constraint "accounts_owner_membership_fk" FOREIGN KEY (household_id, owner_membership_id) REFERENCES household_members(household_id, id);
alter table "public"."ai_audit_logs" add constraint "ai_audit_logs_actor_user_id_fkey" FOREIGN KEY (actor_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table "public"."ai_audit_logs" add constraint "ai_audit_logs_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."card_billing_items" add constraint "card_billing_items_billing_month_id_fkey" FOREIGN KEY (billing_month_id) REFERENCES card_billing_months(id) ON DELETE CASCADE;
alter table "public"."card_billing_items" add constraint "card_billing_items_card_account_id_fkey" FOREIGN KEY (card_account_id) REFERENCES accounts(id) ON DELETE CASCADE;
alter table "public"."card_billing_items" add constraint "card_billing_items_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."card_billing_items" add constraint "card_billing_items_installment_plan_id_fkey" FOREIGN KEY (installment_plan_id) REFERENCES loans(id) ON DELETE SET NULL;
alter table "public"."card_billing_items" add constraint "card_billing_items_transaction_id_fkey" FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL;
alter table "public"."card_billing_months" add constraint "card_billing_months_card_account_id_fkey" FOREIGN KEY (card_account_id) REFERENCES accounts(id) ON DELETE CASCADE;
alter table "public"."card_billing_months" add constraint "card_billing_months_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."card_payment_applications" add constraint "card_payment_applications_billing_month_id_fkey" FOREIGN KEY (billing_month_id) REFERENCES card_billing_months(id) ON DELETE RESTRICT;
alter table "public"."card_payment_applications" add constraint "card_payment_applications_card_payment_id_fkey" FOREIGN KEY (card_payment_id) REFERENCES card_payments(id) ON DELETE CASCADE;
alter table "public"."card_payment_applications" add constraint "card_payment_applications_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."card_payments" add constraint "card_payments_card_account_id_fkey" FOREIGN KEY (card_account_id) REFERENCES accounts(id) ON DELETE RESTRICT;
alter table "public"."card_payments" add constraint "card_payments_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table "public"."card_payments" add constraint "card_payments_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."card_payments" add constraint "card_payments_source_account_id_fkey" FOREIGN KEY (source_account_id) REFERENCES accounts(id) ON DELETE RESTRICT;
alter table "public"."card_payments" add constraint "card_payments_transaction_id_fkey" FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE RESTRICT;
alter table "public"."categories" add constraint "categories_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."categories" add constraint "categories_jar_id_fkey" FOREIGN KEY (jar_id) REFERENCES jars(id) ON DELETE RESTRICT;
alter table "public"."credit_card_installment_legacy_archive" add constraint "credit_card_installment_legacy_archive_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."credit_card_installment_schedule" add constraint "credit_card_installment_schedule_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."credit_card_installment_schedule" add constraint "credit_card_installment_schedule_installment_id_fkey" FOREIGN KEY (installment_id) REFERENCES credit_card_installments(id) ON DELETE CASCADE;
alter table "public"."credit_card_installments" add constraint "credit_card_installments_card_account_id_fkey" FOREIGN KEY (card_account_id) REFERENCES accounts(id) ON DELETE RESTRICT;
alter table "public"."credit_card_installments" add constraint "credit_card_installments_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table "public"."credit_card_installments" add constraint "credit_card_installments_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."credit_card_installments" add constraint "credit_card_installments_source_transaction_id_fkey" FOREIGN KEY (source_transaction_id) REFERENCES transactions(id) ON DELETE RESTRICT;
alter table "public"."credit_card_settings" add constraint "credit_card_settings_account_id_fkey" FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;
alter table "public"."credit_card_settings" add constraint "credit_card_settings_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."credit_card_settings" add constraint "credit_card_settings_linked_bank_account_id_fkey" FOREIGN KEY (linked_bank_account_id) REFERENCES accounts(id) ON DELETE SET NULL;
alter table "public"."debt_payments" add constraint "debt_payments_account_id_fkey" FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT;
alter table "public"."debt_payments" add constraint "debt_payments_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table "public"."debt_payments" add constraint "debt_payments_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."debt_payments" add constraint "debt_payments_liability_id_fkey" FOREIGN KEY (liability_id) REFERENCES liabilities(id) ON DELETE RESTRICT;
alter table "public"."debt_payments" add constraint "debt_payments_transaction_id_fkey" FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE RESTRICT;
alter table "public"."early_withdrawals" add constraint "early_withdrawals_cycle_id_fkey" FOREIGN KEY (cycle_id) REFERENCES saving_cycles(id);
alter table "public"."early_withdrawals" add constraint "early_withdrawals_executed_by_fkey" FOREIGN KEY (executed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table "public"."early_withdrawals" add constraint "early_withdrawals_saving_id_fkey" FOREIGN KEY (saving_id) REFERENCES savings(id);
alter table "public"."early_withdrawals" add constraint "early_withdrawals_settlement_transaction_id_fkey" FOREIGN KEY (settlement_transaction_id) REFERENCES transactions(id) ON DELETE SET NULL;
alter table "public"."goal_contributions" add constraint "goal_contributions_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table "public"."goal_contributions" add constraint "goal_contributions_goal_id_fkey" FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE;
alter table "public"."goal_contributions" add constraint "goal_contributions_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."goal_funding_links" add constraint "goal_funding_links_account_id_fkey" FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT;
alter table "public"."goal_funding_links" add constraint "goal_funding_links_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table "public"."goal_funding_links" add constraint "goal_funding_links_debt_id_fkey" FOREIGN KEY (debt_id) REFERENCES liabilities(id) ON DELETE RESTRICT;
alter table "public"."goal_funding_links" add constraint "goal_funding_links_goal_id_fkey" FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE;
alter table "public"."goal_funding_links" add constraint "goal_funding_links_holding_id_fkey" FOREIGN KEY (holding_id) REFERENCES investment_holdings(id) ON DELETE RESTRICT;
alter table "public"."goal_funding_links" add constraint "goal_funding_links_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."goal_funding_links" add constraint "goal_funding_links_linked_by_fkey" FOREIGN KEY (linked_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table "public"."goal_funding_links" add constraint "goal_funding_links_loan_id_fkey" FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE RESTRICT;
alter table "public"."goal_funding_links" add constraint "goal_funding_links_saving_id_fkey" FOREIGN KEY (saving_id) REFERENCES savings(id) ON DELETE RESTRICT;
alter table "public"."goal_funding_links" add constraint "goal_funding_links_unlinked_by_fkey" FOREIGN KEY (unlinked_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table "public"."goal_period_funded_snapshots" add constraint "goal_period_funded_snapshots_goal_id_fkey" FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE;
alter table "public"."goal_period_funded_snapshots" add constraint "goal_period_funded_snapshots_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."goals" add constraint "goals_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table "public"."goals" add constraint "goals_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."goals" add constraint "goals_owner_membership_fk" FOREIGN KEY (household_id, owner_membership_id) REFERENCES household_members(household_id, id);
alter table "public"."household_configuration_events" add constraint "household_configuration_events_actor_user_id_fkey" FOREIGN KEY (actor_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table "public"."household_configuration_events" add constraint "household_configuration_events_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."household_configuration_events" add constraint "household_configuration_events_target_membership_id_fkey" FOREIGN KEY (target_membership_id) REFERENCES household_members(id) ON DELETE SET NULL;
alter table "public"."household_invitations" add constraint "household_invitations_accepted_by_fkey" FOREIGN KEY (accepted_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table "public"."household_invitations" add constraint "household_invitations_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."household_invitations" add constraint "household_invitations_invited_by_fkey" FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table "public"."household_members" add constraint "household_members_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."household_members" add constraint "household_members_removed_by_fkey" FOREIGN KEY (removed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table "public"."household_members" add constraint "household_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table "public"."household_policy_events" add constraint "household_policy_events_actor_user_id_fkey" FOREIGN KEY (actor_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table "public"."household_policy_events" add constraint "household_policy_events_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."households" add constraint "households_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table "public"."inbox_items" add constraint "inbox_items_assigned_to_user_id_fkey" FOREIGN KEY (assigned_to_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table "public"."inbox_items" add constraint "inbox_items_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."inbox_items" add constraint "inbox_items_resolved_by_fkey" FOREIGN KEY (resolved_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table "public"."inbox_items" add constraint "inbox_items_resolved_jar_id_fkey" FOREIGN KEY (resolved_jar_id) REFERENCES jars(id) ON DELETE SET NULL;
alter table "public"."inbox_items" add constraint "inbox_items_suggested_category_id_fkey" FOREIGN KEY (suggested_category_id) REFERENCES categories(id) ON DELETE SET NULL;
alter table "public"."inbox_items" add constraint "inbox_items_suggested_jar_id_fkey" FOREIGN KEY (suggested_jar_id) REFERENCES jars(id) ON DELETE SET NULL;
alter table "public"."investment_accounts" add constraint "investment_accounts_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."investment_accounts" add constraint "investment_accounts_provider_id_fkey" FOREIGN KEY (provider_id) REFERENCES investment_providers(id) ON DELETE RESTRICT;
alter table "public"."investment_events" add constraint "investment_events_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table "public"."investment_events" add constraint "investment_events_destination_cash_account_id_fkey" FOREIGN KEY (destination_cash_account_id) REFERENCES accounts(id) ON DELETE RESTRICT;
alter table "public"."investment_events" add constraint "investment_events_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."investment_events" add constraint "investment_events_instrument_id_fkey" FOREIGN KEY (instrument_id) REFERENCES investment_instruments(id) ON DELETE RESTRICT;
alter table "public"."investment_events" add constraint "investment_events_investment_account_id_fkey" FOREIGN KEY (investment_account_id) REFERENCES investment_accounts(id) ON DELETE RESTRICT;
alter table "public"."investment_events" add constraint "investment_events_legacy_operation_id_fkey" FOREIGN KEY (legacy_operation_id) REFERENCES investment_operations(id) ON DELETE RESTRICT;
alter table "public"."investment_events" add constraint "investment_events_position_id_fkey" FOREIGN KEY (position_id) REFERENCES investment_holdings(id) ON DELETE RESTRICT;
alter table "public"."investment_events" add constraint "investment_events_provider_id_fkey" FOREIGN KEY (provider_id) REFERENCES investment_providers(id) ON DELETE RESTRICT;
alter table "public"."investment_events" add constraint "investment_events_source_cash_account_id_fkey" FOREIGN KEY (source_cash_account_id) REFERENCES accounts(id) ON DELETE RESTRICT;
alter table "public"."investment_fees" add constraint "investment_fees_cash_account_id_fkey" FOREIGN KEY (cash_account_id) REFERENCES accounts(id) ON DELETE RESTRICT;
alter table "public"."investment_fees" add constraint "investment_fees_fee_holding_id_fkey" FOREIGN KEY (fee_holding_id) REFERENCES investment_holdings(id) ON DELETE RESTRICT;
alter table "public"."investment_fees" add constraint "investment_fees_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."investment_fees" add constraint "investment_fees_operation_id_fkey" FOREIGN KEY (operation_id) REFERENCES investment_operations(id) ON DELETE RESTRICT;
alter table "public"."investment_fees" add constraint "investment_fees_transaction_id_fkey" FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE RESTRICT;
alter table "public"."investment_holdings" add constraint "investment_holdings_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table "public"."investment_holdings" add constraint "investment_holdings_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."investment_holdings" add constraint "investment_holdings_instrument_id_fkey" FOREIGN KEY (instrument_id) REFERENCES market_instruments(id) ON DELETE RESTRICT;
alter table "public"."investment_holdings" add constraint "investment_holdings_investment_account_id_fkey" FOREIGN KEY (investment_account_id) REFERENCES investment_accounts(id) ON DELETE RESTRICT;
alter table "public"."investment_holdings" add constraint "investment_holdings_owner_membership_fk" FOREIGN KEY (household_id, owner_membership_id) REFERENCES household_members(household_id, id);
alter table "public"."investment_holdings" add constraint "investment_holdings_provider_id_fkey" FOREIGN KEY (provider_id) REFERENCES investment_providers(id) ON DELETE RESTRICT;
alter table "public"."investment_instruments" add constraint "investment_instruments_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."investment_lots" add constraint "investment_lots_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."investment_lots" add constraint "investment_lots_position_id_fkey" FOREIGN KEY (position_id) REFERENCES investment_holdings(id) ON DELETE RESTRICT;
alter table "public"."investment_lots" add constraint "investment_lots_source_event_id_fkey" FOREIGN KEY (source_event_id) REFERENCES investment_events(id) ON DELETE RESTRICT;
alter table "public"."investment_operations" add constraint "investment_operations_cash_account_id_fkey" FOREIGN KEY (cash_account_id) REFERENCES accounts(id) ON DELETE RESTRICT;
alter table "public"."investment_operations" add constraint "investment_operations_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table "public"."investment_operations" add constraint "investment_operations_destination_holding_id_fkey" FOREIGN KEY (destination_holding_id) REFERENCES investment_holdings(id) ON DELETE RESTRICT;
alter table "public"."investment_operations" add constraint "investment_operations_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."investment_operations" add constraint "investment_operations_source_holding_id_fkey" FOREIGN KEY (source_holding_id) REFERENCES investment_holdings(id) ON DELETE RESTRICT;
alter table "public"."investment_operations" add constraint "investment_operations_transaction_id_fkey" FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE RESTRICT;
alter table "public"."investment_providers" add constraint "investment_providers_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."investment_valuations" add constraint "investment_valuations_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table "public"."investment_valuations" add constraint "investment_valuations_holding_id_fkey" FOREIGN KEY (holding_id) REFERENCES investment_holdings(id) ON DELETE RESTRICT;
alter table "public"."investment_valuations" add constraint "investment_valuations_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."investment_valuations" add constraint "investment_valuations_supersedes_valuation_id_fkey" FOREIGN KEY (supersedes_valuation_id) REFERENCES investment_valuations(id) ON DELETE RESTRICT;
alter table "public"."jar_period_adjustments" add constraint "jar_period_adjustments_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table "public"."jar_period_adjustments" add constraint "jar_period_adjustments_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."jar_period_adjustments" add constraint "jar_period_adjustments_jar_id_fkey" FOREIGN KEY (jar_id) REFERENCES jars(id) ON DELETE CASCADE;
alter table "public"."jar_period_adjustments" add constraint "jar_period_adjustments_plan_movement_id_fkey" FOREIGN KEY (plan_movement_id) REFERENCES plan_movements(id) ON DELETE SET NULL;
alter table "public"."jar_period_rule_snapshots" add constraint "jar_period_rule_snapshots_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."jar_period_rule_snapshots" add constraint "jar_period_rule_snapshots_jar_id_fkey" FOREIGN KEY (jar_id) REFERENCES jars(id) ON DELETE CASCADE;
alter table "public"."jar_plans" add constraint "jar_plans_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."jar_plans" add constraint "jar_plans_jar_id_fkey" FOREIGN KEY (jar_id) REFERENCES jars(id) ON DELETE CASCADE;
alter table "public"."jars" add constraint "jars_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."liabilities" add constraint "liabilities_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table "public"."liabilities" add constraint "liabilities_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."liabilities" add constraint "liabilities_origin_account_id_fkey" FOREIGN KEY (origin_account_id) REFERENCES accounts(id) ON DELETE RESTRICT;
alter table "public"."liabilities" add constraint "liabilities_origin_transaction_id_fkey" FOREIGN KEY (origin_transaction_id) REFERENCES transactions(id) ON DELETE RESTRICT;
alter table "public"."liabilities" add constraint "liabilities_owner_membership_fk" FOREIGN KEY (household_id, owner_membership_id) REFERENCES household_members(household_id, id);
alter table "public"."loan_interest_rate_periods" add constraint "loan_interest_rate_periods_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table "public"."loan_interest_rate_periods" add constraint "loan_interest_rate_periods_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."loan_interest_rate_periods" add constraint "loan_interest_rate_periods_loan_id_fkey" FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE;
alter table "public"."loan_payments" add constraint "loan_payments_account_id_fkey" FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT;
alter table "public"."loan_payments" add constraint "loan_payments_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table "public"."loan_payments" add constraint "loan_payments_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."loan_payments" add constraint "loan_payments_loan_id_fkey" FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE;
alter table "public"."loan_payments" add constraint "loan_payments_transaction_id_fkey" FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE RESTRICT;
alter table "public"."loan_schedule_entries" add constraint "loan_schedule_entries_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."loan_schedule_entries" add constraint "loan_schedule_entries_loan_id_fkey" FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE;
alter table "public"."loan_schedule_entries" add constraint "loan_schedule_entries_loan_payment_id_fkey" FOREIGN KEY (loan_payment_id) REFERENCES loan_payments(id) ON DELETE SET NULL;
alter table "public"."loans" add constraint "installment_plans_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table "public"."loans" add constraint "installment_plans_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."loans" add constraint "loans_owner_membership_fk" FOREIGN KEY (household_id, owner_membership_id) REFERENCES household_members(household_id, id);
alter table "public"."market_instrument_prices" add constraint "market_instrument_prices_instrument_id_fkey" FOREIGN KEY (instrument_id) REFERENCES market_instruments(id) ON DELETE CASCADE;
alter table "public"."market_instrument_sources" add constraint "market_instrument_sources_instrument_id_fkey" FOREIGN KEY (instrument_id) REFERENCES market_instruments(id) ON DELETE CASCADE;
alter table "public"."month_ritual_runs" add constraint "month_ritual_runs_approved_by_fkey" FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table "public"."month_ritual_runs" add constraint "month_ritual_runs_corrected_by_fkey" FOREIGN KEY (corrected_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table "public"."month_ritual_runs" add constraint "month_ritual_runs_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."plan_movements" add constraint "plan_movements_executed_by_user_id_fkey" FOREIGN KEY (executed_by_user_id) REFERENCES auth.users(id) ON DELETE RESTRICT;
alter table "public"."plan_movements" add constraint "plan_movements_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."plan_movements" add constraint "plan_movements_source_jar_id_fkey" FOREIGN KEY (source_jar_id) REFERENCES jars(id) ON DELETE RESTRICT;
alter table "public"."plan_movements" add constraint "plan_movements_target_jar_id_fkey" FOREIGN KEY (target_jar_id) REFERENCES jars(id) ON DELETE RESTRICT;
alter table "public"."recurring_rules" add constraint "recurring_rules_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table "public"."recurring_rules" add constraint "recurring_rules_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."saving_cycles" add constraint "saving_cycles_funding_transaction_id_fkey" FOREIGN KEY (funding_transaction_id) REFERENCES transactions(id) ON DELETE SET NULL;
alter table "public"."saving_cycles" add constraint "saving_cycles_next_cycle_id_fkey" FOREIGN KEY (next_cycle_id) REFERENCES saving_cycles(id);
alter table "public"."saving_cycles" add constraint "saving_cycles_previous_cycle_id_fkey" FOREIGN KEY (previous_cycle_id) REFERENCES saving_cycles(id);
alter table "public"."saving_cycles" add constraint "saving_cycles_saving_id_fkey" FOREIGN KEY (saving_id) REFERENCES savings(id) ON DELETE CASCADE;
alter table "public"."saving_cycles" add constraint "saving_cycles_settlement_transaction_id_fkey" FOREIGN KEY (settlement_transaction_id) REFERENCES transactions(id) ON DELETE SET NULL;
alter table "public"."saving_packages" add constraint "saving_packages_provider_id_fkey" FOREIGN KEY (provider_id) REFERENCES saving_providers(id) ON DELETE RESTRICT;
alter table "public"."saving_providers" add constraint "saving_providers_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table "public"."saving_providers" add constraint "saving_providers_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE RESTRICT;
alter table "public"."savings" add constraint "savings_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table "public"."savings" add constraint "savings_funding_account_id_fkey" FOREIGN KEY (funding_account_id) REFERENCES accounts(id);
alter table "public"."savings" add constraint "savings_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."savings" add constraint "savings_owner_membership_fk" FOREIGN KEY (household_id, owner_membership_id) REFERENCES household_members(household_id, id);
alter table "public"."savings" add constraint "savings_provider_id_fkey" FOREIGN KEY (provider_id) REFERENCES saving_providers(id);
alter table "public"."savings" add constraint "savings_settlement_account_id_fkey" FOREIGN KEY (settlement_account_id) REFERENCES accounts(id);
alter table "public"."savings_accounts" add constraint "savings_accounts_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table "public"."savings_accounts" add constraint "savings_accounts_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."transaction_tag_assignments" add constraint "transaction_tag_assignments_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."transaction_tag_assignments" add constraint "transaction_tag_assignments_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES transaction_tags(id) ON DELETE RESTRICT;
alter table "public"."transaction_tag_assignments" add constraint "transaction_tag_assignments_transaction_id_fkey" FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE RESTRICT;
alter table "public"."transaction_tags" add constraint "transaction_tags_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table "public"."transaction_tags" add constraint "transaction_tags_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."transactions" add constraint "transactions_account_id_fkey" FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT;
alter table "public"."transactions" add constraint "transactions_category_id_fkey" FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
alter table "public"."transactions" add constraint "transactions_corrects_transaction_id_fkey" FOREIGN KEY (corrects_transaction_id) REFERENCES transactions(id) ON DELETE RESTRICT;
alter table "public"."transactions" add constraint "transactions_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table "public"."transactions" add constraint "transactions_household_id_fkey" FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
alter table "public"."transactions" add constraint "transactions_jar_id_fkey" FOREIGN KEY (jar_id) REFERENCES jars(id) ON DELETE SET NULL;
alter table "public"."transactions" add constraint "transactions_loan_payment_id_fkey" FOREIGN KEY (loan_payment_id) REFERENCES loan_payments(id) ON DELETE RESTRICT;
alter table "public"."transactions" add constraint "transactions_reverses_transaction_id_fkey" FOREIGN KEY (reverses_transaction_id) REFERENCES transactions(id) ON DELETE RESTRICT;
CREATE INDEX idx_accounts_financial_scope_owner ON public.accounts USING btree (financial_scope, owner_membership_id) WHERE (owner_membership_id IS NOT NULL);
CREATE INDEX ai_audit_logs_household_created_idx ON public.ai_audit_logs USING btree (household_id, created_at DESC);
CREATE INDEX idx_card_billing_items_card ON public.card_billing_items USING btree (card_account_id, created_at DESC);
CREATE INDEX idx_card_billing_items_month ON public.card_billing_items USING btree (billing_month_id, created_at);
CREATE INDEX idx_card_billing_months_card ON public.card_billing_months USING btree (card_account_id, status, billing_month);
CREATE INDEX idx_card_payment_applications_month ON public.card_payment_applications USING btree (billing_month_id);
CREATE INDEX idx_card_payment_applications_payment ON public.card_payment_applications USING btree (card_payment_id);
CREATE UNIQUE INDEX card_payments_household_idempotency_unique ON public.card_payments USING btree (household_id, idempotency_key) WHERE (idempotency_key IS NOT NULL);
CREATE INDEX idx_card_payments_card ON public.card_payments USING btree (card_account_id, created_at DESC);
CREATE UNIQUE INDEX categories_household_unique_name_kind ON public.categories USING btree (household_id, kind, lower(name)) WHERE (household_id IS NOT NULL);
CREATE INDEX categories_jar_id_idx ON public.categories USING btree (jar_id) WHERE (jar_id IS NOT NULL);
CREATE UNIQUE INDEX categories_system_unique_name_kind ON public.categories USING btree (kind, lower(name)) WHERE (household_id IS NULL);
CREATE INDEX idx_credit_card_installment_schedule_installment ON public.credit_card_installment_schedule USING btree (installment_id, installment_number);
CREATE INDEX idx_credit_card_installments_card ON public.credit_card_installments USING btree (card_account_id);
CREATE INDEX idx_credit_card_installments_card_status_expected ON public.credit_card_installments USING btree (card_account_id, status, first_expected_date);
CREATE INDEX idx_credit_card_settings_account ON public.credit_card_settings USING btree (account_id);
CREATE INDEX idx_credit_card_settings_household ON public.credit_card_settings USING btree (household_id);
CREATE UNIQUE INDEX debt_payments_household_idempotency_unique ON public.debt_payments USING btree (household_id, idempotency_key) WHERE (idempotency_key IS NOT NULL);
CREATE INDEX idx_debt_payments_liability ON public.debt_payments USING btree (liability_id);
CREATE INDEX idx_debt_payments_liability_effective ON public.debt_payments USING btree (liability_id, effective_date DESC, created_at DESC);
CREATE INDEX idx_early_withdrawals_saving ON public.early_withdrawals USING btree (saving_id);
CREATE INDEX goal_contributions_goal_idx ON public.goal_contributions USING btree (goal_id, created_at DESC);
CREATE INDEX idx_goal_contributions_goal ON public.goal_contributions USING btree (goal_id);
CREATE UNIQUE INDEX goal_funding_links_active_account_unique ON public.goal_funding_links USING btree (account_id) WHERE ((is_active = true) AND (account_id IS NOT NULL));
CREATE UNIQUE INDEX goal_funding_links_active_debt_unique ON public.goal_funding_links USING btree (debt_id) WHERE ((is_active = true) AND (debt_id IS NOT NULL));
CREATE UNIQUE INDEX goal_funding_links_active_holding_unique ON public.goal_funding_links USING btree (holding_id) WHERE ((is_active = true) AND (holding_id IS NOT NULL));
CREATE UNIQUE INDEX goal_funding_links_active_loan_unique ON public.goal_funding_links USING btree (loan_id) WHERE ((is_active = true) AND (loan_id IS NOT NULL));
CREATE UNIQUE INDEX goal_funding_links_active_saving_unique ON public.goal_funding_links USING btree (saving_id) WHERE ((is_active = true) AND (saving_id IS NOT NULL));
CREATE INDEX goal_funding_links_goal_active_idx ON public.goal_funding_links USING btree (goal_id, created_at DESC) WHERE (is_active = true);
CREATE INDEX idx_goal_funding_links_goal ON public.goal_funding_links USING btree (goal_id);
CREATE INDEX goals_household_status_idx ON public.goals USING btree (household_id, status, created_at DESC);
CREATE INDEX idx_goals_financial_scope_owner ON public.goals USING btree (financial_scope, owner_membership_id) WHERE (owner_membership_id IS NOT NULL);
CREATE INDEX idx_household_configuration_events_household_created ON public.household_configuration_events USING btree (household_id, created_at DESC);
CREATE UNIQUE INDEX household_invitations_one_pending_email_per_household ON public.household_invitations USING btree (household_id, lower(email)) WHERE (status = 'pending'::text);
CREATE INDEX idx_household_invitations_email_lower ON public.household_invitations USING btree (lower(email));
CREATE INDEX idx_household_invitations_household_status ON public.household_invitations USING btree (household_id, status);
CREATE UNIQUE INDEX household_members_one_active_per_user ON public.household_members USING btree (user_id) WHERE (is_active = true);
CREATE INDEX idx_household_members_household_active ON public.household_members USING btree (household_id, is_active);
CREATE INDEX idx_household_policy_events_household_created ON public.household_policy_events USING btree (household_id, created_at DESC);
CREATE INDEX idx_inbox_items_household_status ON public.inbox_items USING btree (household_id, status, created_at DESC);
CREATE INDEX inbox_items_archived_idx ON public.inbox_items USING btree (household_id, status, created_at DESC) WHERE (status = ANY (ARRAY['expired'::text, 'auto_resolved'::text, 'archived'::text, 'resolved'::text, 'dismissed'::text, 'acknowledged'::text]));
CREATE INDEX inbox_items_assigned_pending_idx ON public.inbox_items USING btree (assigned_to_user_id, status, created_at DESC) WHERE (assigned_to_user_id IS NOT NULL);
CREATE UNIQUE INDEX inbox_items_dedupe_key_unique ON public.inbox_items USING btree (household_id, dedupe_key) WHERE (dedupe_key IS NOT NULL);
CREATE INDEX inbox_items_expires_pending_idx ON public.inbox_items USING btree (expires_at) WHERE ((status = 'pending'::text) AND (expires_at IS NOT NULL));
CREATE INDEX inbox_items_open_read_cursor_idx ON public.inbox_items USING btree (household_id, status, created_at DESC, id DESC) WHERE (status = 'pending'::text);
CREATE INDEX inbox_items_open_unread_idx ON public.inbox_items USING btree (household_id, status) WHERE ((status = 'pending'::text) AND (read_at IS NULL));
CREATE UNIQUE INDEX inbox_items_unique_source_assignee ON public.inbox_items USING btree (household_id, source_type, source_id, assigned_to_user_id) NULLS NOT DISTINCT;
CREATE INDEX investment_accounts_household_idx ON public.investment_accounts USING btree (household_id, provider_id, name);
CREATE INDEX idx_investment_events_holding ON public.investment_events USING btree (position_id);
CREATE INDEX investment_events_pending_allocation_idx ON public.investment_events USING btree (household_id, event_type, allocation_status) WHERE (allocation_status = 'PENDING'::text);
CREATE INDEX investment_events_position_date_idx ON public.investment_events USING btree (household_id, position_id, effective_at DESC);
CREATE INDEX idx_investment_fees_operation ON public.investment_fees USING btree (household_id, operation_id);
CREATE INDEX idx_investment_holdings_financial_scope_owner ON public.investment_holdings USING btree (financial_scope, owner_membership_id) WHERE (owner_membership_id IS NOT NULL);
CREATE INDEX idx_investment_holdings_household ON public.investment_holdings USING btree (household_id, lifecycle_status, created_at);
CREATE INDEX investment_holdings_domain_idx ON public.investment_holdings USING btree (household_id, asset_type, provider_id, instrument_id);
CREATE INDEX investment_holdings_instrument_lookup_idx ON public.investment_holdings USING btree (instrument_id) WHERE (instrument_id IS NOT NULL);
CREATE INDEX investment_instruments_household_idx ON public.investment_instruments USING btree (household_id, archetype, name);
CREATE INDEX idx_investment_lots_holding ON public.investment_lots USING btree (position_id);
CREATE INDEX investment_lots_position_date_idx ON public.investment_lots USING btree (household_id, position_id, acquired_at, id);
CREATE INDEX idx_investment_operations_correlation ON public.investment_operations USING btree (household_id, correlation_id);
CREATE INDEX idx_investment_operations_holding ON public.investment_operations USING btree (source_holding_id, destination_holding_id);
CREATE INDEX idx_investment_operations_holding_activity ON public.investment_operations USING btree (household_id, source_holding_id, destination_holding_id, effective_date DESC);
CREATE UNIQUE INDEX investment_operations_household_idempotency_unique ON public.investment_operations USING btree (household_id, idempotency_key);
CREATE INDEX investment_providers_household_idx ON public.investment_providers USING btree (household_id, name);
CREATE INDEX idx_investment_valuations_holding ON public.investment_valuations USING btree (holding_id);
CREATE INDEX idx_investment_valuations_latest ON public.investment_valuations USING btree (household_id, holding_id, valuation_date DESC, created_at DESC);
CREATE UNIQUE INDEX investment_valuations_household_idempotency_unique ON public.investment_valuations USING btree (household_id, idempotency_key);
CREATE INDEX jar_period_adjustments_jar_period_idx ON public.jar_period_adjustments USING btree (household_id, jar_id, period_month);
CREATE INDEX jar_period_adjustments_period_idx ON public.jar_period_adjustments USING btree (household_id, period_month);
CREATE INDEX jar_period_rule_snapshots_household_period_idx ON public.jar_period_rule_snapshots USING btree (household_id, period_month);
CREATE INDEX jar_plans_household_idx ON public.jar_plans USING btree (household_id);
CREATE INDEX jars_household_active_idx ON public.jars USING btree (household_id, sort_order) WHERE ((is_archived = false) AND (is_paused = false));
CREATE INDEX idx_liabilities_financial_scope_owner ON public.liabilities USING btree (financial_scope, owner_membership_id) WHERE (owner_membership_id IS NOT NULL);
CREATE INDEX idx_liabilities_household ON public.liabilities USING btree (household_id, is_archived, created_at DESC);
CREATE INDEX idx_liabilities_household_direction_status_due ON public.liabilities USING btree (household_id, direction, status, due_date);
CREATE UNIQUE INDEX liabilities_household_idempotency_unique ON public.liabilities USING btree (household_id, idempotency_key) WHERE (idempotency_key IS NOT NULL);
CREATE UNIQUE INDEX liabilities_origin_transaction_unique ON public.liabilities USING btree (origin_transaction_id) WHERE (origin_transaction_id IS NOT NULL);
CREATE INDEX idx_loan_interest_rate_periods_loan ON public.loan_interest_rate_periods USING btree (loan_id, sequence);
CREATE INDEX idx_loan_payments_household ON public.loan_payments USING btree (household_id, paid_at DESC);
CREATE INDEX idx_loan_payments_loan ON public.loan_payments USING btree (loan_id, paid_at DESC);
CREATE UNIQUE INDEX loan_payments_household_idempotency_unique ON public.loan_payments USING btree (household_id, idempotency_key) WHERE (idempotency_key IS NOT NULL);
CREATE INDEX idx_loan_schedule_entries_loan ON public.loan_schedule_entries USING btree (loan_id, sequence);
CREATE INDEX idx_loans_financial_scope_owner ON public.loans USING btree (financial_scope, owner_membership_id) WHERE (owner_membership_id IS NOT NULL);
CREATE INDEX idx_loans_household ON public.loans USING btree (household_id, status, created_at DESC);
CREATE UNIQUE INDEX loans_household_idempotency_unique ON public.loans USING btree (household_id, idempotency_key) WHERE (idempotency_key IS NOT NULL);
CREATE INDEX market_instrument_sources_lookup_idx ON public.market_instrument_sources USING btree (instrument_id, priority);
CREATE INDEX market_instruments_asset_class_active_idx ON public.market_instruments USING btree (asset_class, is_active);
CREATE INDEX market_instruments_symbol_search_idx ON public.market_instruments USING btree (lower(symbol));
CREATE INDEX month_ritual_runs_household_status_idx ON public.month_ritual_runs USING btree (household_id, status, period_month DESC);
CREATE INDEX month_ritual_runs_review_status_idx ON public.month_ritual_runs USING btree (household_id, period_month, review_status);
CREATE INDEX plan_movements_emergency_idx ON public.plan_movements USING btree (household_id, created_at DESC) WHERE (is_emergency = true);
CREATE INDEX plan_movements_household_created_idx ON public.plan_movements USING btree (household_id, created_at DESC);
CREATE INDEX plan_movements_household_period_idx ON public.plan_movements USING btree (household_id, period_month, created_at DESC);
CREATE INDEX recurring_rules_household_active_idx ON public.recurring_rules USING btree (household_id, is_active, next_run_date);
CREATE INDEX idx_saving_cycles_lineage ON public.saving_cycles USING btree (previous_cycle_id, next_cycle_id);
CREATE INDEX idx_saving_cycles_maturity ON public.saving_cycles USING btree (status, end_date) WHERE (status = 'active'::text);
CREATE INDEX idx_saving_cycles_saving ON public.saving_cycles USING btree (saving_id, cycle_number);
CREATE INDEX idx_savings_financial_scope_owner ON public.savings USING btree (financial_scope, owner_membership_id) WHERE (owner_membership_id IS NOT NULL);
CREATE INDEX idx_savings_household_status ON public.savings USING btree (household_id, status, created_at DESC);
CREATE INDEX idx_savings_accounts_household ON public.savings_accounts USING btree (household_id, status, maturity_date);
CREATE INDEX idx_transaction_tag_assignments_household_tag ON public.transaction_tag_assignments USING btree (household_id, tag_id, transaction_id);
CREATE INDEX idx_transaction_tag_assignments_household_transaction ON public.transaction_tag_assignments USING btree (household_id, transaction_id, tag_id);
CREATE INDEX idx_transaction_tags_household_active ON public.transaction_tags USING btree (household_id, created_at DESC) WHERE (archived_at IS NULL);
CREATE UNIQUE INDEX transaction_tags_household_name_unique ON public.transaction_tags USING btree (household_id, lower(name)) WHERE (archived_at IS NULL);
CREATE INDEX idx_transactions_account_created ON public.transactions USING btree (account_id, created_at DESC);
CREATE INDEX idx_transactions_household_created ON public.transactions USING btree (household_id, created_at DESC);
CREATE INDEX idx_transactions_savings_event_kind ON public.transactions USING btree (household_id, savings_event_kind) WHERE (savings_event_kind IS NOT NULL);
CREATE INDEX idx_transactions_transfer_group ON public.transactions USING btree (household_id, transfer_group_id) WHERE (transfer_group_id IS NOT NULL);
CREATE INDEX transactions_corrects_idx ON public.transactions USING btree (corrects_transaction_id) WHERE (corrects_transaction_id IS NOT NULL);
CREATE UNIQUE INDEX transactions_household_idempotency_unique ON public.transactions USING btree (household_id, idempotency_key) WHERE (idempotency_key IS NOT NULL);
CREATE INDEX transactions_is_reversal_idx ON public.transactions USING btree (household_id, is_reversal) WHERE (is_reversal = true);
CREATE INDEX transactions_reverses_idx ON public.transactions USING btree (reverses_transaction_id) WHERE (reverses_transaction_id IS NOT NULL);
CREATE OR REPLACE FUNCTION public._loan_insert_rate_periods(p_household_id uuid, p_loan_id uuid, p_periods jsonb, p_created_by uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_item jsonb;
begin
  delete from public.loan_interest_rate_periods where loan_id = p_loan_id;

  for v_item in select * from jsonb_array_elements(coalesce(p_periods, '[]'::jsonb))
  loop
    insert into public.loan_interest_rate_periods (
      household_id,
      loan_id,
      sequence,
      effective_from,
      effective_to,
      annual_rate,
      kind,
      note,
      created_by
    )
    values (
      p_household_id,
      p_loan_id,
      (v_item->>'sequence')::int,
      (v_item->>'effectiveFrom')::date,
      nullif(v_item->>'effectiveTo', '')::date,
      (v_item->>'annualRate')::numeric,
      coalesce(nullif(v_item->>'kind', ''), 'fixed'),
      nullif(v_item->>'note', ''),
      p_created_by
    );
  end loop;
end;
$function$;
CREATE OR REPLACE FUNCTION public._loan_replace_upcoming_schedule(p_loan_id uuid, p_household_id uuid, p_entries jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_item jsonb;
begin
  delete from public.loan_schedule_entries
  where loan_id = p_loan_id
    and status in ('upcoming', 'partial');

  for v_item in select * from jsonb_array_elements(coalesce(p_entries, '[]'::jsonb))
  loop
    insert into public.loan_schedule_entries (
      household_id,
      loan_id,
      sequence,
      due_date,
      principal_due,
      interest_due,
      total_due,
      remaining_balance_after,
      status
    )
    values (
      p_household_id,
      p_loan_id,
      (v_item->>'sequence')::int,
      (v_item->>'dueDate')::date,
      (v_item->>'principalDue')::numeric,
      (v_item->>'interestDue')::numeric,
      (v_item->>'totalDue')::numeric,
      (v_item->>'remainingBalanceAfter')::numeric,
      'upcoming'
    );
  end loop;
end;
$function$;
CREATE OR REPLACE FUNCTION public._record_debt_payment_unchecked_10b(p_debt_id uuid, p_account_id uuid, p_amount numeric, p_effective_date date DEFAULT NULL::date, p_note text DEFAULT NULL::text, p_idempotency_key text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_household_id uuid;
  v_currency char(3);
  v_debt public.liabilities%rowtype;
  v_account public.accounts%rowtype;
  v_existing public.debt_payments%rowtype;
  v_effective_date date;
  v_idempotency_key text;
  v_transaction_type text;
  v_payment_direction text;
  v_transaction_id uuid;
  v_payment_id uuid;
  v_remaining numeric;
  v_completed boolean;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount <> trunc(p_amount) then
    raise exception 'Payment must be a positive whole number';
  end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id
  limit 1;
  if v_household_id is null then
    raise exception 'Not a household member';
  end if;
  select coalesce(h.base_currency, 'VND') into v_currency
  from public.households h
  where h.id = v_household_id;

  v_idempotency_key := nullif(trim(coalesce(p_idempotency_key, '')), '');
  if v_idempotency_key is not null then
    select * into v_existing
    from public.debt_payments dp
    where dp.household_id = v_household_id
      and dp.idempotency_key = v_idempotency_key;
    if found then
      return jsonb_build_object(
        'ok', true,
        'debtId', v_existing.liability_id,
        'transactionId', v_existing.transaction_id,
        'paymentId', v_existing.id,
        'amount', v_existing.amount,
        'idempotentReplay', true
      );
    end if;
  end if;

  select * into v_debt
  from public.liabilities l
  where l.id = p_debt_id
    and l.household_id = v_household_id
  for update;
  if not found then
    raise exception 'Debt not found';
  end if;
  if v_debt.status <> 'active' or v_debt.is_archived or v_debt.remaining_amount <= 0 then
    raise exception 'Debt cannot receive a payment';
  end if;
  if p_amount > v_debt.remaining_amount then
    raise exception 'Amount exceeds remaining balance';
  end if;

  select * into v_account
  from public.accounts a
  where a.id = p_account_id
    and a.household_id = v_household_id
    and a.is_archived = false
    and a.type <> 'credit_card'
  for update;
  if not found then
    raise exception 'Account not found or not eligible';
  end if;

  v_effective_date := coalesce(p_effective_date, (timezone('utc', now()))::date);
  v_transaction_type := case
    when v_debt.direction = 'borrowed' then 'liability_payment'
    else 'debt_receivable_payment'
  end;
  v_payment_direction := case
    when v_debt.direction = 'borrowed' then 'repay_borrowed'
    else 'receive_lent'
  end;

  insert into public.transactions (
    household_id,
    account_id,
    type,
    amount,
    currency,
    transaction_date,
    note,
    category_id,
    jar_id,
    status,
    idempotency_key,
    created_by
  )
  values (
    v_household_id,
    v_account.id,
    v_transaction_type,
    p_amount,
    v_currency,
    v_effective_date,
    nullif(trim(coalesce(p_note, '')), ''),
    null,
    null,
    'posted',
    case when v_idempotency_key is null then null else v_idempotency_key || ':transaction' end,
    v_user_id
  )
  returning id into v_transaction_id;

  insert into public.debt_payments (
    household_id,
    liability_id,
    account_id,
    transaction_id,
    amount,
    payment_direction,
    effective_date,
    note,
    idempotency_key,
    created_by
  )
  values (
    v_household_id,
    v_debt.id,
    v_account.id,
    v_transaction_id,
    p_amount,
    v_payment_direction,
    v_effective_date,
    nullif(trim(coalesce(p_note, '')), ''),
    v_idempotency_key,
    v_user_id
  )
  returning id into v_payment_id;

  v_remaining := v_debt.remaining_amount - p_amount;
  v_completed := v_remaining = 0;
  update public.liabilities
  set
    remaining_amount = v_remaining,
    status = case when v_completed then 'completed' else 'active' end,
    is_archived = false,
    updated_at = timezone('utc', now())
  where id = v_debt.id;

  return jsonb_build_object(
    'ok', true,
    'debtId', v_debt.id,
    'transactionId', v_transaction_id,
    'paymentId', v_payment_id,
    'amount', p_amount,
    'remainingAmount', v_remaining,
    'completed', v_completed,
    'idempotentReplay', false
  );
end;
$function$;
CREATE OR REPLACE FUNCTION public.accept_household_invitation(p_token uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_household_id uuid;
  v_invite public.household_invitations%rowtype;
  v_existing public.household_members%rowtype;
  v_member_count int;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  select u.email into v_email from auth.users u where u.id = v_user_id;
  if v_email is null then
    raise exception 'Email required';
  end if;

  -- Lock the household before the invitation and membership rows. Every
  -- capacity-changing lifecycle path takes this lock in the same order.
  select i.household_id into v_household_id
  from public.household_invitations i
  where i.token = p_token;
  if not found then
    raise exception 'Invitation not found';
  end if;
  perform 1 from public.households h where h.id = v_household_id for update;
  select * into v_invite
  from public.household_invitations i
  where i.token = p_token
  for update;
  if not found then
    raise exception 'Invitation not found';
  end if;
  if v_invite.status <> 'pending' then
    raise exception 'Invitation not pending';
  end if;
  if v_invite.expires_at <= now() then
    update public.household_invitations
    set status = 'expired', updated_at = now()
    where id = v_invite.id;
    raise exception 'Invitation expired';
  end if;
  if lower(v_invite.email) <> lower(v_email) then
    raise exception 'Email mismatch';
  end if;
  if exists (
    select 1 from public.household_members hm
    where hm.user_id = v_user_id and hm.is_active = true
  ) then
    raise exception 'User already belongs to a household';
  end if;

  select count(*)::int into v_member_count
  from public.household_members hm
  where hm.household_id = v_invite.household_id and hm.is_active = true;
  if v_member_count >= 10 then
    raise exception 'Household is full';
  end if;

  select * into v_existing
  from public.household_members hm
  where hm.household_id = v_invite.household_id and hm.user_id = v_user_id
  for update;

  if found then
    update public.household_members
    set role = 'partner', is_active = true, joined_at = now(), left_at = null,
        removed_by = null, email = lower(v_email), updated_at = now()
    where id = v_existing.id;
  else
    insert into public.household_members (
      household_id, user_id, role, is_active, email
    ) values (
      v_invite.household_id, v_user_id, 'partner', true, lower(v_email)
    );
  end if;

  update public.household_invitations
  set status = 'accepted', accepted_by = v_user_id, updated_at = now()
  where id = v_invite.id;
  return v_invite.household_id;
end;
$function$;
CREATE OR REPLACE FUNCTION public.active_membership_id(p_household_id uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select hm.id
  from public.household_members hm
  where hm.household_id = p_household_id
    and hm.user_id = auth.uid()
    and hm.is_active = true
  limit 1;
$function$;
CREATE OR REPLACE FUNCTION public.can_admin_cleanup(p_household_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = p_household_id
      and hm.user_id = auth.uid()
      and hm.is_active = true
      and hm.role = 'admin'
  );
$function$;
CREATE OR REPLACE FUNCTION public.create_category(p_name text, p_kind text, p_jar_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_household_id uuid;
  v_id uuid;
  v_jar_ok boolean;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_kind not in ('income', 'expense') then
    raise exception 'Invalid category kind';
  end if;

  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'Category name required';
  end if;

  if p_jar_id is null then
    raise exception 'ERR_CATEGORY_UNMAPPED';
  end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id
    and hm.is_active = true
  limit 1;

  if v_household_id is null then
    raise exception 'Active household membership required';
  end if;

  select exists (
    select 1
    from public.jars j
    where j.id = p_jar_id
      and j.household_id = v_household_id
      and j.is_archived = false
      and j.is_paused = false
  ) into v_jar_ok;

  if not v_jar_ok then
    raise exception 'Invalid jar';
  end if;

  insert into public.categories (
    household_id, kind, name, is_system, is_active, sort_order, jar_id
  )
  values (
    v_household_id,
    p_kind,
    trim(p_name),
    false,
    true,
    100,
    p_jar_id
  )
  returning id into v_id;

  return jsonb_build_object('category_id', v_id);
exception
  when unique_violation then
    raise exception 'Category name already exists';
end;
$function$;
CREATE OR REPLACE FUNCTION public.create_household_with_essentials(p_name text, p_account_name text DEFAULT NULL::text, p_opening_balance numeric DEFAULT 0, p_plan_preset text DEFAULT NULL::text, p_base_currency character DEFAULT 'VND'::bpchar, p_locale text DEFAULT 'en-VN'::text, p_timezone text DEFAULT 'Asia/Ho_Chi_Minh'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_household_id uuid;
  v_account_name text;
  v_opening_balance numeric(18, 0);
  v_preset text;
  v_email text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if length(trim(coalesce(p_name, ''))) < 2 then
    raise exception 'Household name must be at least 2 characters';
  end if;

  if exists (
    select 1
    from public.household_members hm
    where hm.user_id = v_user_id
      and hm.is_active = true
  ) then
    raise exception 'User already belongs to a household';
  end if;

  if p_opening_balance is null then
    v_opening_balance := 0;
  elsif p_opening_balance < 0 or p_opening_balance <> trunc(p_opening_balance) then
    raise exception 'Opening balance must be a non-negative whole number';
  else
    v_opening_balance := p_opening_balance;
  end if;

  select u.email into v_email from auth.users u where u.id = v_user_id;

  v_account_name := nullif(trim(coalesce(p_account_name, '')), '');
  v_preset := nullif(lower(trim(coalesce(p_plan_preset, ''))), '');

  if v_preset is not null and v_preset not in ('balanced', 'simple') then
    raise exception 'Unsupported plan preset';
  end if;

  insert into public.households (
    name,
    base_currency,
    locale,
    timezone,
    overspend_policy,
    month_close_mode,
    income_allocate_mode,
    created_by
  ) values (
    trim(p_name),
    coalesce(p_base_currency, 'VND'),
    coalesce(nullif(trim(p_locale), ''), 'en-VN'),
    coalesce(nullif(trim(p_timezone), ''), 'Asia/Ho_Chi_Minh'),
    'warn',
    'assisted',
    'suggest',
    v_user_id
  )
  returning id into v_household_id;

  insert into public.household_members (
    household_id,
    user_id,
    role,
    is_active,
    email
  ) values (
    v_household_id,
    v_user_id,
    'admin',
    true,
    v_email
  );

  if v_account_name is not null then
    insert into public.accounts (
      household_id,
      name,
      type,
      opening_balance,
      created_by
    ) values (
      v_household_id,
      v_account_name,
      'cash',
      v_opening_balance,
      v_user_id
    );
  end if;

  if v_account_name is not null and v_preset = 'simple' then
    insert into public.jars (household_id, name, kind, sort_order) values
      (v_household_id, 'Needs', 'spending', 1),
      (v_household_id, 'Wants', 'spending', 2),
      (v_household_id, 'Savings', 'savings', 3);
  elsif v_account_name is not null and v_preset = 'balanced' then
    insert into public.jars (household_id, name, kind, sort_order) values
      (v_household_id, 'Essentials', 'spending', 1),
      (v_household_id, 'Lifestyle', 'spending', 2),
      (v_household_id, 'Buffer', 'buffer', 3),
      (v_household_id, 'Savings', 'savings', 4);
  end if;

  return v_household_id;
end;
$function$;
CREATE OR REPLACE FUNCTION public.decline_household_invitation(p_token uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_email text;
  v_invite public.household_invitations%rowtype;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select u.email into v_email from auth.users u where u.id = v_user_id;

  select * into v_invite
  from public.household_invitations i
  where i.token = p_token
  for update;

  if not found then
    raise exception 'Invitation not found';
  end if;

  if v_invite.status <> 'pending' then
    raise exception 'Invitation not pending';
  end if;

  if v_email is null or lower(v_invite.email) <> lower(v_email) then
    raise exception 'Email mismatch';
  end if;

  update public.household_invitations
  set status = 'declined',
      updated_at = now()
  where id = v_invite.id;

  return true;
end;
$function$;
CREATE OR REPLACE FUNCTION public.delete_transaction(p_transaction_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  raise exception 'Transactions are immutable';
end;
$function$;
CREATE OR REPLACE FUNCTION public.enforce_active_jar_on_transaction()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  if new.jar_id is null then
    return new;
  end if;

  if not exists (
    select 1
    from public.jars j
    where j.id = new.jar_id
      and j.household_id = new.household_id
      and j.is_archived = false
      and j.is_paused = false
  ) then
    raise exception 'Invalid jar';
  end if;

  return new;
end;
$function$;
CREATE OR REPLACE FUNCTION public.enforce_goal_funding_link_integrity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_goal_household uuid;
  v_goal_type text;
  v_source_household uuid;
begin
  select household_id, goal_type into v_goal_household, v_goal_type
  from public.goals where id = new.goal_id;
  if v_goal_household is null or v_goal_household <> new.household_id then
    raise exception 'Goal and funding source must belong to the same household';
  end if;
  if (v_goal_type = 'payoff' and new.source_kind not in ('loan', 'debt'))
     or (v_goal_type <> 'payoff' and new.source_kind in ('loan', 'debt')) then
    raise exception 'Funding source is incompatible with Goal type';
  end if;
  if new.source_kind = 'saving' then
    select household_id into v_source_household from public.savings where id = new.saving_id;
  elsif new.source_kind = 'savings_account' then
    select household_id into v_source_household from public.accounts where id = new.account_id;
  elsif new.source_kind = 'holding' then
    select household_id into v_source_household from public.investment_holdings where id = new.holding_id;
  elsif new.source_kind = 'loan' then
    select household_id into v_source_household from public.loans where id = new.loan_id;
  elsif new.source_kind = 'debt' then
    select household_id into v_source_household from public.liabilities where id = new.debt_id;
  end if;
  if v_source_household is null or v_source_household <> new.household_id then
    raise exception 'Funding source belongs to another household';
  end if;
  if not new.is_active and new.unlinked_at is null then new.unlinked_at := now(); end if;
  if new.is_active then new.unlinked_at := null; end if;
  return new;
end;
$function$;
CREATE OR REPLACE FUNCTION public.enqueue_payment_reminder(p_source_type text, p_source_id uuid, p_amount numeric, p_currency character, p_title text, p_due_at timestamp with time zone, p_context jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ declare v_user_id uuid; v_household_id uuid; v_id uuid; v_expires timestamptz; begin v_user_id := auth.uid(); if v_user_id is null then raise exception 'Authentication required'; end if; select hm.household_id into v_household_id from public.household_members hm where hm.user_id = v_user_id and hm.is_active = true limit 1; if v_household_id is null then raise exception 'Active household membership required'; end if; if p_due_at is null then raise exception 'Due date required'; end if; v_expires := p_due_at + interval '7 days'; insert into public.inbox_items (household_id, kind, status, source_type, source_id, amount, currency, title, expires_at, context_json) values (v_household_id, 'payment_reminder', 'pending', case when coalesce(nullif(trim(p_source_type), ''), 'guided') in ('transaction', 'guided', 'plan_movement') then coalesce(nullif(trim(p_source_type), ''), 'guided') else 'guided' end, p_source_id, p_amount, coalesce(p_currency, 'VND'), coalesce(nullif(trim(p_title), ''), 'Payment reminder'), v_expires, coalesce(p_context, '{}'::jsonb) || jsonb_build_object('event', 'PaymentReminderCreated', 'due_at', p_due_at, 'expires_at', v_expires)) returning id into v_id; return v_id; end; $function$;
CREATE OR REPLACE FUNCTION public.get_invitation_preview(p_token uuid)
 RETURNS TABLE(household_name text, invite_email text, status text, expires_at timestamp with time zone, is_expired boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  return query
  select
    h.name,
    i.email,
    i.status,
    i.expires_at,
    (i.expires_at <= now() or i.status = 'expired') as is_expired
  from public.household_invitations i
  join public.households h on h.id = i.household_id
  where i.token = p_token
  limit 1;
end;
$function$;
CREATE OR REPLACE FUNCTION public.get_or_create_savings_product_account(p_household_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_account_id uuid;
begin
  select a.id into v_account_id
  from public.accounts a
  where a.household_id = p_household_id
    and a.type = 'savings_product'
    and a.is_archived = false
  limit 1;

  if v_account_id is not null then
    return v_account_id;
  end if;

  insert into public.accounts (household_id, name, type, opening_balance)
  values (p_household_id, 'Savings Products', 'savings_product', 0)
  returning id into v_account_id;

  return v_account_id;
end;
$function$;
CREATE OR REPLACE FUNCTION public.guard_historical_jar_period_rule_snapshot()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_timezone text;
  v_current_period date;
begin
  select coalesce(h.timezone, 'Asia/Ho_Chi_Minh') into v_timezone
  from public.households h
  where h.id = old.household_id;
  v_current_period := to_char(timezone(v_timezone, now()), 'YYYY-MM-01')::date;
  if old.period_month < v_current_period and row_to_json(old)::text <> row_to_json(new)::text then
    raise exception 'Historical Jar period snapshots are immutable';
  end if;
  new.updated_at := timezone('utc', now());
  return new;
end;
$function$;
CREATE OR REPLACE FUNCTION public.guard_ownership_immutable()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.financial_scope is distinct from old.financial_scope
     or new.owner_membership_id is distinct from old.owner_membership_id then
    raise exception 'Ownership is immutable: financial_scope and owner_membership_id cannot be changed';
  end if;
  return new;
end;
$function$;
CREATE OR REPLACE FUNCTION public.household_base_currency(p_household_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce(
    (
      select upper(h.base_currency)
      from public.households h
      where h.id = p_household_id
    ),
    'VND'
  );
$function$;
CREATE OR REPLACE FUNCTION public.investment_active_household()
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_household_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select hm.household_id into v_household_id from public.household_members hm
  where hm.user_id = auth.uid() and hm.is_active = true limit 1;
  if v_household_id is null then raise exception 'Not a household member'; end if;
  return v_household_id;
end $function$;
CREATE OR REPLACE FUNCTION public.investment_operation_receipt(p_operation_id uuid, p_replay boolean)
 RETURNS jsonb
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select jsonb_build_object(
    'operationId', o.id, 'holdingId', coalesce(o.destination_holding_id, o.source_holding_id),
    'sourceHoldingId', o.source_holding_id, 'destinationHoldingId', o.destination_holding_id,
    'transactionIds', coalesce((select jsonb_agg(x.id) from (
      select o.transaction_id id where o.transaction_id is not null union all
      select f.transaction_id from public.investment_fees f where f.operation_id = o.id and f.transaction_id is not null
    ) x), '[]'::jsonb),
    'beforeQuantity', o.before_quantity, 'afterQuantity', o.after_quantity,
    'beforeBasis', o.before_basis, 'afterBasis', o.after_basis, 'cashDelta', o.cash_delta,
    'realizedResult', o.realized_result_vnd, 'correlationId', o.correlation_id,
    'feeEffects', coalesce((select jsonb_agg(jsonb_build_object('source', f.fee_source, 'feeValueVnd', f.fee_value_vnd, 'transactionId', f.transaction_id)) from public.investment_fees f where f.operation_id = o.id), '[]'::jsonb),
    'idempotentReplay', p_replay
  ) from public.investment_operations o where o.id = p_operation_id
$function$;
CREATE OR REPLACE FUNCTION public.is_debt_movement_account_type(p_type text)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  select p_type in (
    'cash',
    'checking',
    'savings',
    'ewallet',
    'brokerage',
    'other'
  );
$function$;
CREATE OR REPLACE FUNCTION public.is_household_admin(p_household_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = p_household_id
      and hm.user_id = auth.uid()
      and hm.is_active = true
      and hm.role = 'admin'
  );
$function$;
CREATE OR REPLACE FUNCTION public.is_household_member(p_household_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = p_household_id
      and hm.user_id = auth.uid()
      and hm.is_active = true
  );
$function$;
CREATE OR REPLACE FUNCTION public.is_month_ritual_locked(p_household_id uuid, p_period_month date DEFAULT (date_trunc('month'::text, timezone('utc'::text, now())))::date)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.month_ritual_runs r
    where r.household_id = p_household_id
      and r.period_month = date_trunc('month', p_period_month)::date
      and r.status in ('approved', 'pending_review')
  );
$function$;
CREATE OR REPLACE FUNCTION public.leave_household()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_member public.household_members%rowtype;
  v_household_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id and hm.is_active = true
  limit 1;
  if v_household_id is null then
    raise exception 'No active household';
  end if;

  perform 1 from public.households h where h.id = v_household_id for update;
  select * into v_member
  from public.household_members hm
  where hm.household_id = v_household_id and hm.user_id = v_user_id
    and hm.is_active = true
  for update;

  if v_member.role = 'admin' and not exists (
    select 1 from public.household_members hm
    where hm.household_id = v_household_id
      and hm.is_active = true
      and hm.role = 'admin'
      and hm.id <> v_member.id
  ) then
    raise exception 'Admin continuity required before leaving';
  end if;

  update public.household_members
  set is_active = false, left_at = now(), removed_by = null, updated_at = now()
  where id = v_member.id;

  update public.inbox_items
  set assigned_to_user_id = null, updated_at = now()
  where household_id = v_household_id and assigned_to_user_id = v_user_id;
  return true;
end;
$function$;
CREATE OR REPLACE FUNCTION public.list_active_market_price_targets(p_asset_class text DEFAULT NULL::text, p_provider text DEFAULT NULL::text)
 RETURNS TABLE(instrument_id uuid, asset_class text, symbol text, currency text, pricing_mode text, provider text, provider_instrument_id text)
 LANGUAGE sql
 SET search_path TO 'public'
AS $function$
  select distinct on (instrument.id)
    instrument.id,
    instrument.asset_class,
    instrument.symbol,
    instrument.currency,
    instrument.pricing_mode,
    source.provider,
    source.provider_instrument_id
  from public.investment_holdings holding
  join public.market_instruments instrument
    on instrument.id = holding.instrument_id
  join public.market_instrument_sources source
    on source.instrument_id = instrument.id
  where holding.lifecycle_status = 'active'
    and holding.instrument_id is not null
    and instrument.is_active = true
    and instrument.auto_price_supported = true
    and source.is_enabled = true
    and (p_asset_class is null or instrument.asset_class = p_asset_class)
    and (p_provider is null or source.provider = p_provider)
  order by instrument.id, source.priority asc, source.provider asc;
$function$;
CREATE OR REPLACE FUNCTION public.prevent_owned_membership_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if exists (select 1 from public.accounts where owner_membership_id = old.id)
    or exists (select 1 from public.savings where owner_membership_id = old.id)
    or exists (select 1 from public.investment_holdings where owner_membership_id = old.id)
    or exists (select 1 from public.loans where owner_membership_id = old.id)
    or exists (select 1 from public.liabilities where owner_membership_id = old.id)
    or exists (select 1 from public.goals where owner_membership_id = old.id)
  then
    raise exception 'Membership owns financial resources and cannot be deleted';
  end if;
  return old;
end;
$function$;
CREATE OR REPLACE FUNCTION public.project_investment_fee_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  update public.investment_events e
  set fee_amount = totals.amount
  from (select coalesce(sum(fee_value_vnd),0) amount from public.investment_fees where operation_id = new.operation_id) totals
  where e.legacy_operation_id = (select id from public.investment_operations where id = new.operation_id);
  return new;
end $function$;
CREATE OR REPLACE FUNCTION public.project_investment_operation_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_type text; v_position uuid; v_cash_source uuid; v_cash_destination uuid;
begin
  v_type := case new.operation_type
    when 'opening_position' then 'HISTORICAL_IMPORT'
    when 'buy' then 'BUY'
    when 'sell' then 'SELL'
    when 'investment_income' then case when new.income_kind = 'dividend' then 'DIVIDEND' else 'DISTRIBUTION' end
    else 'ADJUSTMENT'
  end;
  v_position := coalesce(new.destination_holding_id, new.source_holding_id);
  v_cash_source := case when new.operation_type = 'buy' then new.cash_account_id end;
  v_cash_destination := case when new.operation_type in ('sell','investment_income') then new.cash_account_id end;
  insert into public.investment_events(
    household_id, position_id, event_type, executed_quantity, gross_amount,
    disposed_cost_basis, realized_pnl, source_cash_account_id, destination_cash_account_id,
    effective_at, notes, snapshot, legacy_operation_id, created_by
  ) values (
    new.household_id, v_position, v_type,
    coalesce(new.destination_quantity, new.source_quantity), new.executed_value_vnd,
    new.source_basis_consumed, new.realized_result_vnd, v_cash_source, v_cash_destination,
    new.effective_date::timestamptz, new.notes,
    jsonb_build_object(
      'operationType', new.operation_type,
      'quotedValueVnd', new.quoted_value_vnd,
      'beforeQuantity', new.before_quantity,
      'afterQuantity', new.after_quantity,
      'beforeBasis', new.before_basis,
      'afterBasis', new.after_basis,
      'cashDelta', new.cash_delta,
      'transactionId', new.transaction_id,
      'correlationId', new.correlation_id,
      'sourceHoldingId', new.source_holding_id,
      'destinationHoldingId', new.destination_holding_id
    ),
    new.id, new.created_by
  ) on conflict (legacy_operation_id) do nothing;
  return new;
end $function$;
CREATE OR REPLACE FUNCTION public.record_owned_account_transfer(p_source_account_id uuid, p_destination_account_id uuid, p_amount numeric, p_transaction_date date DEFAULT NULL::date, p_note text DEFAULT NULL::text, p_idempotency_key text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_household_id uuid;
  v_currency char(3);
  v_effective date;
  v_source public.accounts%rowtype;
  v_destination public.accounts%rowtype;
  v_group_id uuid;
  v_source_tx_id uuid;
  v_destination_tx_id uuid;
  v_existing_out public.transactions%rowtype;
  v_existing_in public.transactions%rowtype;
  v_source_key text;
  v_destination_key text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_amount is null or p_amount <= 0 or p_amount <> trunc(p_amount) then
    raise exception 'Amount must be a positive whole number';
  end if;

  if p_source_account_id is null or p_destination_account_id is null then
    raise exception 'Invalid accounts';
  end if;

  if p_source_account_id = p_destination_account_id then
    raise exception 'Source and destination must differ';
  end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id
    and hm.is_active = true
  limit 1;

  if v_household_id is null then
    raise exception 'Not a household member';
  end if;

  select h.base_currency into v_currency
  from public.households h
  where h.id = v_household_id;

  v_currency := coalesce(v_currency, 'VND');
  v_effective := coalesce(p_transaction_date, (timezone('utc', now()))::date);

  if p_idempotency_key is not null then
    v_source_key := p_idempotency_key || ':out';
    v_destination_key := p_idempotency_key || ':in';

    select * into v_existing_out
    from public.transactions t
    where t.household_id = v_household_id
      and t.idempotency_key = v_source_key
      and t.type = 'transfer_out';

    if found then
      select * into v_existing_in
      from public.transactions t
      where t.household_id = v_household_id
        and t.transfer_group_id = v_existing_out.transfer_group_id
        and t.type = 'transfer_in';

      if not found then
        raise exception 'Transfer replay incomplete';
      end if;

      return jsonb_build_object(
        'ok', true,
        'transferGroupId', v_existing_out.transfer_group_id,
        'sourceTransactionId', v_existing_out.id,
        'destinationTransactionId', v_existing_in.id,
        'sourceDelta', -v_existing_out.amount,
        'destinationDelta', v_existing_in.amount,
        'idempotentReplay', true
      );
    end if;
  end if;

  select * into v_source
  from public.accounts a
  where a.id = p_source_account_id
    and a.household_id = v_household_id
    and a.is_archived = false
  for update;

  if not found then
    raise exception 'Source account not found';
  end if;

  if v_source.type = 'credit_card' then
    raise exception 'Source cannot be a credit card';
  end if;

  if v_source.type = 'savings_product' then
    raise exception 'Source cannot be a savings product account';
  end if;

  select * into v_destination
  from public.accounts a
  where a.id = p_destination_account_id
    and a.household_id = v_household_id
    and a.is_archived = false
  for update;

  if not found then
    raise exception 'Destination account not found';
  end if;

  if v_destination.type = 'credit_card' then
    raise exception 'Destination cannot be a credit card';
  end if;

  if v_destination.type = 'savings_product' then
    raise exception 'Destination cannot be a savings product account';
  end if;

  v_group_id := gen_random_uuid();

  insert into public.transactions (
    household_id,
    account_id,
    type,
    amount,
    currency,
    transaction_date,
    note,
    category_id,
    jar_id,
    status,
    idempotency_key,
    transfer_group_id,
    created_by,
    source
  )
  values (
    v_household_id,
    p_source_account_id,
    'transfer_out',
    p_amount,
    v_currency,
    v_effective,
    nullif(trim(coalesce(p_note, '')), ''),
    null,
    null,
    'posted',
    case when p_idempotency_key is null then null else p_idempotency_key || ':out' end,
    v_group_id,
    v_user_id,
    'manual'
  )
  returning id into v_source_tx_id;

  insert into public.transactions (
    household_id,
    account_id,
    type,
    amount,
    currency,
    transaction_date,
    note,
    category_id,
    jar_id,
    status,
    idempotency_key,
    transfer_group_id,
    created_by,
    source
  )
  values (
    v_household_id,
    p_destination_account_id,
    'transfer_in',
    p_amount,
    v_currency,
    v_effective,
    nullif(trim(coalesce(p_note, '')), ''),
    null,
    null,
    'posted',
    case when p_idempotency_key is null then null else p_idempotency_key || ':in' end,
    v_group_id,
    v_user_id,
    'manual'
  )
  returning id into v_destination_tx_id;

  return jsonb_build_object(
    'ok', true,
    'transferGroupId', v_group_id,
    'sourceTransactionId', v_source_tx_id,
    'destinationTransactionId', v_destination_tx_id,
    'sourceDelta', -p_amount,
    'destinationDelta', p_amount,
    'idempotentReplay', false
  );
end;
$function$;
CREATE OR REPLACE FUNCTION public.release_market_price_sync_lock(p_lock_key text, p_owner_id uuid)
 RETURNS void
 LANGUAGE sql
 SET search_path TO 'public'
AS $function$
  delete from public.market_sync_locks
  where lock_key = p_lock_key and owner_id = p_owner_id;
$function$;
CREATE OR REPLACE FUNCTION public.remove_household_member(p_membership_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_household_id uuid;
  v_actor public.household_members%rowtype;
  v_target public.household_members%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id and hm.is_active = true
  limit 1;
  if v_household_id is null then
    raise exception 'No active household';
  end if;

  perform 1 from public.households h where h.id = v_household_id for update;
  select * into v_actor
  from public.household_members hm
  where hm.household_id = v_household_id and hm.user_id = v_user_id
    and hm.is_active = true
  for update;
  if v_actor.role <> 'admin' then
    raise exception 'Admin role required';
  end if;

  select * into v_target
  from public.household_members hm
  where hm.id = p_membership_id and hm.household_id = v_household_id
    and hm.is_active = true
  for update;
  if not found or v_target.id = v_actor.id or v_target.role <> 'partner' then
    raise exception 'Member not found';
  end if;

  update public.household_members
  set is_active = false, left_at = now(), removed_by = v_user_id, updated_at = now()
  where id = v_target.id;

  update public.inbox_items
  set assigned_to_user_id = null, updated_at = now()
  where household_id = v_household_id and assigned_to_user_id = v_target.user_id;
  return true;
end;
$function$;
CREATE OR REPLACE FUNCTION public.run_inbox_staleness_worker()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_household_id uuid;
  v_expired_count integer := 0;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id
    and hm.is_active = true
  limit 1;

  if v_household_id is null then
    raise exception 'Active household membership required';
  end if;

  with expired as (
    update public.inbox_items i
    set status = 'expired',
        updated_at = now(),
        context_json = coalesce(i.context_json, '{}'::jsonb)
          || jsonb_build_object(
            'expired_by', 'InboxStalenessWorker',
            'expired_at', timezone('utc', now())
          )
    where i.household_id = v_household_id
      and i.status = 'pending'
      and i.expires_at is not null
      and i.expires_at <= timezone('utc', now())
    returning i.id
  )
  select count(*)::integer into v_expired_count from expired;

  return jsonb_build_object(
    'household_id', v_household_id,
    'expired_count', v_expired_count
  );
end;
$function$;
CREATE OR REPLACE FUNCTION public.savings_calculate_interest(p_principal numeric, p_annual_rate numeric, p_start_date date, p_end_date date, p_method text, p_as_of_date date DEFAULT NULL::date)
 RETURNS numeric
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
declare
  v_principal numeric := greatest(coalesce(p_principal, 0), 0);
  v_rate numeric := greatest(coalesce(p_annual_rate, 0), 0);
  v_days integer := greatest(coalesce(p_as_of_date, p_end_date) - p_start_date, 0);
  v_months integer;
  v_partial_days integer;
  v_amount numeric;
begin
  case lower(coalesce(p_method, ''))
    when 'simple' then
      return greatest(0, floor(v_principal * v_rate * v_days / 100 / 365));
    when 'compound_daily' then
      v_amount := v_principal * power(1 + v_rate / 100 / 365, v_days);
      return greatest(0, floor(v_amount - v_principal));
    when 'compound_monthly' then
      v_months := floor(v_days / 30);
      v_partial_days := mod(v_days, 30);
      v_amount := v_principal * power(1 + v_rate / 100 / 12, v_months);
      if v_partial_days > 0 then
        v_amount := v_amount * (1 + v_rate / 100 / 365 * v_partial_days);
      end if;
      return greatest(0, floor(v_amount - v_principal));
    else
      raise exception 'Unsupported Savings interest calculation method';
  end case;
end;
$function$;
CREATE OR REPLACE FUNCTION public.savings_simple_interest(p_principal numeric, p_annual_rate numeric, p_days integer)
 RETURNS numeric
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select greatest(
    0,
    floor(
      coalesce(p_principal, 0)
        * coalesce(p_annual_rate, 0)
        / 100
        * greatest(coalesce(p_days, 0), 0)
        / 365
    )
  );
$function$;
CREATE OR REPLACE FUNCTION public.savings_tax_for_interest(p_gross_interest numeric, p_tax_rule text, p_tax_rate numeric)
 RETURNS numeric
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  select case
    when upper(coalesce(p_tax_rule, 'NONE')) = 'PROFIT_PERCENTAGE'
      and greatest(coalesce(p_gross_interest, 0), 0) > 0
      and greatest(coalesce(p_tax_rate, 0), 0) > 0
    then floor(greatest(p_gross_interest, 0) * greatest(p_tax_rate, 0) / 100)
    else 0
  end;
$function$;
CREATE OR REPLACE FUNCTION public.set_transaction_tags(p_transaction_id uuid, p_tag_ids uuid[] DEFAULT ARRAY[]::uuid[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_household_id uuid;
  v_normalized_tag_ids uuid[];
  v_tag_count integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select household_id into v_household_id
  from public.household_members
  where user_id = v_user_id
  order by created_at asc
  limit 1;

  if v_household_id is null then
    raise exception 'Household membership required';
  end if;

  if not exists (
    select 1 from public.transactions
    where id = p_transaction_id and household_id = v_household_id
  ) then
    raise exception 'Transaction not found';
  end if;

  select coalesce(array_agg(distinct tag_id), array[]::uuid[])
  into v_normalized_tag_ids
  from unnest(coalesce(p_tag_ids, array[]::uuid[])) as tag_id;

  v_tag_count := coalesce(cardinality(v_normalized_tag_ids), 0);
  if v_tag_count > 10 then
    raise exception 'Too many transaction tags';
  end if;

  if v_tag_count <> (
    select count(*) from public.transaction_tags t
    where t.household_id = v_household_id
      and t.id = any(v_normalized_tag_ids)
      and (
        t.archived_at is null
        or exists (
          select 1
          from public.transaction_tag_assignments a
          where a.transaction_id = p_transaction_id
            and a.tag_id = t.id
        )
      )
  ) then
    raise exception 'Invalid transaction tags';
  end if;

  delete from public.transaction_tag_assignments
  where household_id = v_household_id
    and transaction_id = p_transaction_id;

  if v_tag_count > 0 then
    insert into public.transaction_tag_assignments (
      household_id,
      transaction_id,
      tag_id
    )
    select v_household_id, p_transaction_id, tag_id
    from unnest(v_normalized_tag_ids) as tag_id;
  end if;
end;
$function$;
CREATE OR REPLACE FUNCTION public.settle_card_payment(p_card_account_id uuid, p_source_account_id uuid, p_amount numeric, p_effective_date date DEFAULT NULL::date, p_idempotency_key text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_household_id uuid;
  v_currency char(3);
  v_effective date;
  v_existing public.card_payments%rowtype;
  v_card public.accounts%rowtype;
  v_source public.accounts%rowtype;
  v_settings public.credit_card_settings%rowtype;
  v_month record;
  v_outstanding numeric := 0;
  v_left numeric;
  v_applied_total numeric := 0;
  v_due numeric;
  v_apply numeric;
  v_new_paid numeric;
  v_new_status text;
  v_tx_id uuid;
  v_payment_id uuid;
  v_remaining_after numeric := 0;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_amount is null or p_amount <= 0 or p_amount <> trunc(p_amount) then
    raise exception 'Amount must be a positive whole number';
  end if;

  if p_card_account_id = p_source_account_id then
    raise exception 'Invalid accounts';
  end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id
  limit 1;

  if v_household_id is null then
    raise exception 'Not a household member';
  end if;

  select h.base_currency into v_currency
  from public.households h
  where h.id = v_household_id;

  v_currency := coalesce(v_currency, 'VND');
  v_effective := coalesce(p_effective_date, (timezone('utc', now()))::date);

  if p_idempotency_key is not null then
    select * into v_existing
    from public.card_payments cp
    where cp.household_id = v_household_id
      and cp.idempotency_key = p_idempotency_key;

    if found then
      return jsonb_build_object(
        'ok', true,
        'transactionId', v_existing.transaction_id,
        'paymentId', v_existing.id,
        'sourceDelta', -v_existing.amount,
        'appliedAmount', v_existing.applied_amount,
        'remainingDue', v_existing.remaining_due_after,
        'idempotentReplay', true
      );
    end if;
  end if;

  select * into v_card
  from public.accounts a
  where a.id = p_card_account_id
    and a.household_id = v_household_id
    and a.type = 'credit_card'
    and a.is_archived = false
  for update;

  if not found then
    raise exception 'Card not found';
  end if;

  select * into v_source
  from public.accounts a
  where a.id = p_source_account_id
    and a.household_id = v_household_id
    and a.is_archived = false
  for update;

  if not found then
    raise exception 'Source account not found';
  end if;

  if v_source.type = 'credit_card' then
    raise exception 'Source cannot be a credit card';
  end if;

  select * into v_settings
  from public.credit_card_settings s
  where s.account_id = p_card_account_id
    and s.household_id = v_household_id;

  if not found then
    raise exception 'Card settings not found';
  end if;

  select coalesce(sum(greatest(0, m.statement_amount - m.paid_amount)), 0)
    into v_outstanding
  from public.card_billing_months m
  where m.household_id = v_household_id
    and m.card_account_id = p_card_account_id
    and m.status in ('open', 'partial');

  if v_outstanding <= 0 then
    raise exception 'No remaining due';
  end if;

  -- Approved overpayment rule: payment cannot exceed remaining due.
  if p_amount > v_outstanding then
    raise exception 'Amount exceeds remaining due';
  end if;

  insert into public.transactions (
    household_id,
    account_id,
    type,
    amount,
    currency,
    transaction_date,
    note,
    category_id,
    jar_id,
    status,
    idempotency_key,
    created_by
  )
  values (
    v_household_id,
    p_source_account_id,
    'liability_payment',
    p_amount,
    v_currency,
    v_effective,
    null,
    null,
    null,
    'posted',
    null,
    v_user_id
  )
  returning id into v_tx_id;

  insert into public.card_payments (
    household_id,
    card_account_id,
    source_account_id,
    transaction_id,
    amount,
    applied_amount,
    remaining_due_after,
    effective_date,
    idempotency_key,
    created_by
  )
  values (
    v_household_id,
    p_card_account_id,
    p_source_account_id,
    v_tx_id,
    p_amount,
    0,
    v_outstanding,
    v_effective,
    p_idempotency_key,
    v_user_id
  )
  returning id into v_payment_id;

  v_left := p_amount;

  for v_month in
    select *
    from public.card_billing_months m
    where m.household_id = v_household_id
      and m.card_account_id = p_card_account_id
      and m.status in ('open', 'partial')
    order by m.billing_month asc
    for update
  loop
    exit when v_left <= 0;
    v_due := greatest(0, v_month.statement_amount - v_month.paid_amount);
    continue when v_due <= 0;

    v_apply := least(v_left, v_due);
    v_new_paid := v_month.paid_amount + v_apply;
    v_new_status := case
      when v_new_paid >= v_month.statement_amount then 'settled'
      when v_new_paid > 0 then 'partial'
      else 'open'
    end;

    update public.card_billing_months
    set
      paid_amount = v_new_paid,
      status = v_new_status,
      updated_at = timezone('utc', now())
    where id = v_month.id;

    insert into public.card_payment_applications (
      household_id,
      card_payment_id,
      billing_month_id,
      applied_amount
    )
    values (
      v_household_id,
      v_payment_id,
      v_month.id,
      v_apply
    );

    if v_new_status = 'settled' then
      update public.card_billing_items
      set
        is_paid = true,
        updated_at = timezone('utc', now())
      where billing_month_id = v_month.id
        and is_converted_to_installment = false;
    end if;

    v_left := v_left - v_apply;
    v_applied_total := v_applied_total + v_apply;
  end loop;

  select coalesce(sum(greatest(0, m.statement_amount - m.paid_amount)), 0)
    into v_remaining_after
  from public.card_billing_months m
  where m.household_id = v_household_id
    and m.card_account_id = p_card_account_id
    and m.status in ('open', 'partial');

  update public.card_payments
  set
    applied_amount = v_applied_total,
    remaining_due_after = v_remaining_after
  where id = v_payment_id;

  return jsonb_build_object(
    'ok', true,
    'transactionId', v_tx_id,
    'paymentId', v_payment_id,
    'sourceDelta', -p_amount,
    'appliedAmount', v_applied_total,
    'remainingDue', v_remaining_after,
    'idempotentReplay', false
  );
end;
$function$;
CREATE OR REPLACE FUNCTION public.transactions_set_is_reversal()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  if new.reverses_transaction_id is not null then
    new.is_reversal := true;
  end if;
  return new;
end;
$function$;
CREATE OR REPLACE FUNCTION public.try_acquire_market_price_sync_lock(p_lock_key text, p_owner_id uuid, p_expires_at timestamp with time zone)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  acquired boolean;
begin
  insert into public.market_sync_locks(lock_key, owner_id, acquired_at, expires_at)
  values (p_lock_key, p_owner_id, now(), p_expires_at)
  on conflict (lock_key) do update
    set owner_id = excluded.owner_id,
        acquired_at = excluded.acquired_at,
        expires_at = excluded.expires_at
    where public.market_sync_locks.expires_at <= now()
  returning true into acquired;
  return coalesce(acquired, false);
end;
$function$;
CREATE OR REPLACE FUNCTION public.update_transaction(p_transaction_id uuid, p_account_id uuid, p_type text, p_amount numeric, p_transaction_date date DEFAULT NULL::date, p_note text DEFAULT NULL::text, p_category_id uuid DEFAULT NULL::uuid, p_jar_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  raise exception 'Transactions are immutable';
end;
$function$;
CREATE OR REPLACE FUNCTION public.validate_credit_card_installment_source()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  v_source public.transactions%rowtype;
  v_card public.accounts%rowtype;
begin
  select * into v_source from public.transactions where id = new.source_transaction_id;
  if not found then
    raise exception 'Invalid credit card installment source transaction';
  end if;
  select * into v_card from public.accounts where id = new.card_account_id;
  if not found then
    raise exception 'Invalid credit card installment card account';
  end if;
  if v_source.household_id <> new.household_id
    or v_source.account_id <> new.card_account_id
    or v_source.type <> 'expense'
    or v_source.amount <= 0
    or v_source.reverses_transaction_id is not null
    or v_source.corrects_transaction_id is not null
    or v_card.household_id <> new.household_id
    or v_card.type <> 'credit_card'
    or v_card.is_archived then
    raise exception 'Invalid credit card installment source transaction';
  end if;
  return new;
end;
$function$;
CREATE OR REPLACE FUNCTION public.validate_transaction_tag_assignment()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  v_transaction_household uuid;
  v_tag_household uuid;
  v_tag_archived_at timestamptz;
begin
  select household_id into v_transaction_household
  from public.transactions
  where id = new.transaction_id;

  select household_id, archived_at into v_tag_household, v_tag_archived_at
  from public.transaction_tags
  where id = new.tag_id;

  if v_transaction_household is null
    or v_tag_household is null
    or v_tag_archived_at is not null
    or new.household_id <> v_transaction_household
    or new.household_id <> v_tag_household then
    raise exception 'Invalid transaction tag assignment';
  end if;

  return new;
end;
$function$;
CREATE OR REPLACE FUNCTION public._create_debt_unchecked_10b(p_name text, p_counterparty text, p_direction text, p_creation_mode text, p_principal_amount numeric, p_start_date date DEFAULT NULL::date, p_due_date date DEFAULT NULL::date, p_note text DEFAULT NULL::text, p_account_id uuid DEFAULT NULL::uuid, p_idempotency_key text DEFAULT NULL::text, p_financial_scope text DEFAULT 'household'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_household_id uuid;
  v_currency char(3);
  v_account public.accounts%rowtype;
  v_existing public.liabilities%rowtype;
  v_debt_id uuid;
  v_transaction_id uuid;
  v_effective_date date;
  v_transaction_type text;
  v_idempotency_key text;
  v_financial_scope text;
  v_owner_membership_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if nullif(trim(coalesce(p_name, '')), '') is null then
    raise exception 'Debt name is required';
  end if;
  if nullif(trim(coalesce(p_counterparty, '')), '') is null then
    raise exception 'Counterparty is required';
  end if;
  if p_direction not in ('borrowed', 'lent') then
    raise exception 'Invalid debt direction';
  end if;
  if p_creation_mode not in ('existing_balance', 'money_moved') then
    raise exception 'Invalid debt creation mode';
  end if;
  if p_principal_amount is null or p_principal_amount <= 0 or p_principal_amount <> trunc(p_principal_amount) then
    raise exception 'Principal must be a positive whole number';
  end if;
  if p_due_date is not null and p_start_date is not null and p_due_date < p_start_date then
    raise exception 'Due date must not precede start date';
  end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id
  limit 1;
  if v_household_id is null then
    raise exception 'Not a household member';
  end if;
  v_financial_scope := lower(trim(coalesce(p_financial_scope, 'household')));
  if v_financial_scope not in ('household', 'personal') then
    raise exception 'Invalid financial scope';
  end if;
  select hm.id into v_owner_membership_id
  from public.household_members hm
  where hm.id = public.active_membership_id(v_household_id)
    and hm.is_active = true;
  if v_financial_scope = 'personal' and v_owner_membership_id is null then
    raise exception 'Active household membership required';
  end if;
  if v_financial_scope = 'household' then
    v_owner_membership_id := null;
  end if;
  select coalesce(h.base_currency, 'VND') into v_currency
  from public.households h
  where h.id = v_household_id;

  v_idempotency_key := nullif(trim(coalesce(p_idempotency_key, '')), '');
  if v_idempotency_key is not null then
    select * into v_existing
    from public.liabilities l
    where l.household_id = v_household_id
      and l.idempotency_key = v_idempotency_key;
    if found then
      return jsonb_build_object(
        'ok', true,
        'debtId', v_existing.id,
        'transactionId', v_existing.origin_transaction_id,
        'idempotentReplay', true
      );
    end if;
  end if;

  v_effective_date := coalesce(p_start_date, (timezone('utc', now()))::date);
  if p_creation_mode = 'money_moved' then
    if p_account_id is null then
      raise exception 'Account is required when money moves';
    end if;
    select * into v_account
    from public.accounts a
    where a.id = p_account_id
      and a.household_id = v_household_id
      and a.is_archived = false
      and a.type <> 'credit_card'
    for update;
    if not found then
      raise exception 'Account not found or not eligible';
    end if;
    v_transaction_type := case
      when p_direction = 'borrowed' then 'debt_borrowing'
      else 'debt_lending'
    end;
    insert into public.transactions (
      household_id,
      account_id,
      type,
      amount,
      currency,
      transaction_date,
      note,
      category_id,
      jar_id,
      status,
      idempotency_key,
      created_by
    )
    values (
      v_household_id,
      v_account.id,
      v_transaction_type,
      p_principal_amount,
      v_currency,
      v_effective_date,
      nullif(trim(coalesce(p_note, '')), ''),
      null,
      null,
      'posted',
      case when v_idempotency_key is null then null else v_idempotency_key || ':transaction' end,
      v_user_id
    )
    returning id into v_transaction_id;
  end if;

  insert into public.liabilities (
    household_id,
    name,
    creditor,
    principal_amount,
    remaining_amount,
    currency,
    due_day,
    note,
    is_archived,
    created_by,
    direction,
    creation_mode,
    start_date,
    due_date,
    status,
    origin_account_id,
    origin_transaction_id,
    idempotency_key,
    financial_scope,
    owner_membership_id
  )
  values (
    v_household_id,
    trim(p_name),
    trim(p_counterparty),
    p_principal_amount,
    p_principal_amount,
    v_currency,
    null,
    nullif(trim(coalesce(p_note, '')), ''),
    false,
    v_user_id,
    p_direction,
    p_creation_mode,
    v_effective_date,
    p_due_date,
    'active',
    case when p_creation_mode = 'money_moved' then p_account_id else null end,
    v_transaction_id,
    v_idempotency_key,
    v_financial_scope,
    v_owner_membership_id
  )
  returning id into v_debt_id;

  return jsonb_build_object(
    'ok', true,
    'debtId', v_debt_id,
    'transactionId', v_transaction_id,
    'idempotentReplay', false
  );
end;
$function$;
CREATE OR REPLACE FUNCTION public._create_loan_with_schedule_unchecked_11b(p_name text, p_lender text, p_loan_type text, p_principal numeric, p_annual_interest_rate numeric, p_repayment_method text, p_interest_strategy text, p_promo_fixed_rate numeric, p_promo_fixed_months integer, p_promo_floating_rate numeric, p_promo_rate_effective_on date, p_term_months integer, p_start_date date, p_first_payment_date date, p_monthly_payment numeric, p_total_interest numeric, p_total_repayment numeric, p_expected_end_date date, p_note text, p_currency character, p_schedule jsonb, p_rate_periods jsonb, p_financial_scope text DEFAULT 'household'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_household_id uuid;
  v_loan_id uuid;
  v_due_day int;
  v_strategy text;
  v_financial_scope text;
  v_owner_membership_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id
  limit 1;

  if v_household_id is null then
    raise exception 'Not a household member';
  end if;
  v_financial_scope := lower(trim(coalesce(p_financial_scope, 'household')));
  if v_financial_scope not in ('household', 'personal') then raise exception 'Invalid financial scope'; end if;
  select hm.id into v_owner_membership_id from public.household_members hm where hm.id = public.active_membership_id(v_household_id) and hm.is_active = true;
  if v_financial_scope = 'personal' and v_owner_membership_id is null then raise exception 'Active household membership required'; end if;
  if v_financial_scope = 'household' then v_owner_membership_id := null; end if;

  if p_principal is null or p_principal <= 0 or p_term_months is null or p_term_months <= 0 then
    raise exception 'Invalid loan parameters';
  end if;

  if p_repayment_method not in ('fixed_monthly', 'reducing_balance') then
    raise exception 'Invalid repayment method';
  end if;

  v_strategy := coalesce(nullif(trim(p_interest_strategy), ''), 'fixed');
  if v_strategy not in ('fixed', 'promo_fixed_to_floating', 'floating') then
    raise exception 'Invalid interest strategy';
  end if;

  if v_strategy = 'promo_fixed_to_floating' and (
    p_promo_fixed_months is null or p_promo_fixed_months <= 0
  ) then
    raise exception 'Promo fixed months required';
  end if;

  v_due_day := least(
    31,
    greatest(1, extract(day from coalesce(p_first_payment_date, p_start_date))::int)
  );

  insert into public.loans (
    household_id,
    name,
    lender,
    loan_type,
    principal,
    remaining_principal,
    annual_interest_rate,
    interest_strategy,
    promo_fixed_rate,
    promo_fixed_months,
    promo_floating_rate,
    promo_rate_effective_on,
    start_date,
    expected_end_date,
    first_payment_date,
    repayment_frequency,
    repayment_method,
    term_months,
    monthly_payment,
    total_interest,
    total_repayment,
    next_payment_date,
    due_day,
    currency,
    status,
    note,
    created_by,
    financial_scope,
    owner_membership_id
  )
  values (
    v_household_id,
    trim(p_name),
    nullif(trim(coalesce(p_lender, '')), ''),
    coalesce(nullif(trim(p_loan_type), ''), 'other'),
    trunc(p_principal),
    trunc(p_principal),
    p_annual_interest_rate,
    v_strategy,
    p_promo_fixed_rate,
    p_promo_fixed_months,
    p_promo_floating_rate,
    p_promo_rate_effective_on,
    p_start_date,
    p_expected_end_date,
    coalesce(p_first_payment_date, p_start_date),
    'monthly',
    p_repayment_method,
    p_term_months,
    trunc(p_monthly_payment),
    trunc(coalesce(p_total_interest, 0)),
    trunc(coalesce(p_total_repayment, p_principal)),
    coalesce(p_first_payment_date, p_start_date),
    v_due_day,
    coalesce(p_currency, 'VND'),
    'active',
    nullif(trim(coalesce(p_note, '')), ''),
    v_user_id,
    v_financial_scope,
    v_owner_membership_id
  )
  returning id into v_loan_id;

  perform public._loan_insert_schedule_entries(
    v_household_id, v_loan_id, coalesce(p_schedule, '[]'::jsonb)
  );
  perform public._loan_insert_rate_periods(
    v_household_id, v_loan_id, coalesce(p_rate_periods, '[]'::jsonb), v_user_id
  );

  return jsonb_build_object('ok', true, 'loanId', v_loan_id);
end;
$function$;
CREATE OR REPLACE FUNCTION public.can_mutate_financial_resource(p_household_id uuid, p_financial_scope text, p_owner_membership_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    public.active_membership_id(p_household_id) is not null
    and (
      p_financial_scope = 'household'
      or (
        p_financial_scope = 'personal'
        and public.active_membership_id(p_household_id) = p_owner_membership_id
      )
    );
$function$;
CREATE OR REPLACE FUNCTION public.is_resource_owner(p_household_id uuid, p_owner_membership_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    p_owner_membership_id is not null
    and public.active_membership_id(p_household_id) = p_owner_membership_id;
$function$;
CREATE OR REPLACE FUNCTION public.admin_archive_financial_resource(p_resource_type text, p_resource_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_household_id uuid;
  v_row_found boolean := false;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return jsonb_build_object('ok', false, 'reason', 'auth_required');
  end if;

  if p_resource_type not in ('account', 'liability', 'loan', 'saving', 'goal') then
    return jsonb_build_object('ok', false, 'reason', 'unsupported_type');
  end if;

  if p_resource_type = 'account' then
    select household_id into v_household_id
    from public.accounts
    where id = p_resource_id and is_archived = false;
    v_row_found := found;
  elsif p_resource_type = 'liability' then
    select household_id into v_household_id
    from public.liabilities
    where id = p_resource_id and is_archived = false;
    v_row_found := found;
  elsif p_resource_type = 'loan' then
    select household_id into v_household_id
    from public.loans
    where id = p_resource_id and status <> 'archived';
    v_row_found := found;
  elsif p_resource_type = 'saving' then
    select household_id into v_household_id
    from public.savings
    where id = p_resource_id and status not in ('early_closed', 'closed');
    v_row_found := found;
  elsif p_resource_type = 'goal' then
    select household_id into v_household_id
    from public.goals
    where id = p_resource_id and status <> 'cancelled';
    v_row_found := found;
  end if;

  if not v_row_found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if not public.can_admin_cleanup(v_household_id) then
    return jsonb_build_object('ok', false, 'reason', 'not_allowed');
  end if;

  if p_resource_type = 'account' then
    update public.accounts set is_archived = true where id = p_resource_id;
  elsif p_resource_type = 'liability' then
    update public.liabilities set is_archived = true where id = p_resource_id;
  elsif p_resource_type = 'loan' then
    update public.loans set status = 'archived' where id = p_resource_id;
  elsif p_resource_type = 'saving' then
    update public.savings set status = 'closed' where id = p_resource_id;
  elsif p_resource_type = 'goal' then
    update public.goals set status = 'cancelled' where id = p_resource_id;
  end if;

  return jsonb_build_object('ok', true, 'resource_type', p_resource_type);
end;
$function$;
CREATE OR REPLACE FUNCTION public.get_investment_home_summary_inputs()
 RETURNS TABLE(holding_id uuid, asset_class text, instrument_id uuid, quantity numeric, remaining_total_cost_basis numeric, value_vnd numeric, valuation_date date, valuation_created_at timestamp with time zone, unit_price_vnd numeric, valuation_source text, realized_pnl numeric, investment_income numeric)
 LANGUAGE sql
 SET search_path TO 'public'
AS $function$
  select
    h.id,
    h.asset_class,
    h.instrument_id,
    h.quantity,
    h.remaining_total_cost_basis,
    latest.value_vnd,
    latest.valuation_date,
    latest.created_at,
    latest.unit_price_vnd,
    latest.source,
    coalesce(operations.realized_pnl, 0),
    coalesce(operations.investment_income, 0)
  from public.investment_holdings h
  left join lateral (
    select v.value_vnd, v.valuation_date, v.created_at, v.unit_price_vnd, v.source
    from public.investment_valuations v
    where v.household_id = h.household_id
      and v.holding_id = h.id
    order by v.valuation_date desc, v.created_at desc
    limit 1
  ) latest on true
  left join lateral (
    select
      sum(o.realized_result_vnd) as realized_pnl,
      sum(case when o.income_kind is not null then o.executed_value_vnd else 0 end)
        as investment_income
    from public.investment_operations o
    where o.household_id = h.household_id
  ) operations on true
  where h.household_id = public.investment_active_household()
    and h.lifecycle_status <> 'exited'
    and h.quantity > 0;
$function$;
CREATE OR REPLACE FUNCTION public.record_investment_income(p_holding_id uuid, p_cash_account_id uuid, p_amount_vnd numeric, p_income_kind text, p_effective_date date, p_notes text, p_idempotency_key text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_hh uuid; v_oid uuid; v_existing uuid; v_tx uuid;
begin
  v_hh:=public.investment_active_household(); select id into v_existing from public.investment_operations where household_id=v_hh and idempotency_key=p_idempotency_key;
  if found then return public.investment_operation_receipt(v_existing,true); end if;
  perform 1 from public.investment_holdings where id=p_holding_id and household_id=v_hh for update; if not found then raise exception 'Investment holding not found'; end if;
  perform 1 from public.accounts where id=p_cash_account_id and household_id=v_hh and not is_archived and type not in ('credit_card','savings_product') for update; if not found then raise exception 'Cash account not found'; end if;
  if p_amount_vnd<=0 or p_amount_vnd<>trunc(p_amount_vnd) or p_income_kind not in ('dividend','interest','distribution','other') then raise exception 'Invalid investment income'; end if;
  insert into public.transactions(household_id,account_id,type,amount,currency,transaction_date,note,category_id,jar_id,status,idempotency_key,created_by,source)
  values(v_hh,p_cash_account_id,'investment_income',p_amount_vnd,'VND',p_effective_date,nullif(trim(coalesce(p_notes,'')),''),null,null,'posted',p_idempotency_key||':cash',auth.uid(),'manual') returning id into v_tx;
  insert into public.investment_operations(household_id,operation_type,source_holding_id,cash_account_id,executed_value_vnd,income_kind,cash_delta,transaction_id,effective_date,notes,idempotency_key,created_by)
  values(v_hh,'investment_income',p_holding_id,p_cash_account_id,p_amount_vnd,p_income_kind,p_amount_vnd,v_tx,p_effective_date,nullif(trim(coalesce(p_notes,'')),''),p_idempotency_key,auth.uid()) returning id into v_oid;
  return public.investment_operation_receipt(v_oid,false);
end $function$;
CREATE OR REPLACE FUNCTION public.record_investment_opening_position(p_asset_name text, p_asset_class text, p_quantity numeric, p_as_of_date date, p_symbol text, p_provider_custodian text, p_remaining_total_cost_basis numeric, p_current_valuation numeric, p_notes text, p_visibility_context text, p_idempotency_key text, p_financial_scope text DEFAULT 'household'::text, p_instrument_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_hh uuid;
  v_hid uuid;
  v_oid uuid;
  v_existing uuid;
  v_history text;
  v_financial_scope text;
  v_owner_membership_id uuid;
begin
  v_hh := public.investment_active_household();
  v_financial_scope := lower(trim(coalesce(p_financial_scope, 'household')));
  if v_financial_scope not in ('household', 'personal') then
    raise exception 'Invalid financial scope';
  end if;

  select hm.id into v_owner_membership_id
  from public.household_members hm
  where hm.id = public.active_membership_id(v_hh)
    and hm.is_active = true;
  if v_financial_scope = 'personal' and v_owner_membership_id is null then
    raise exception 'Active household membership required';
  end if;
  if v_financial_scope = 'household' then
    v_owner_membership_id := null;
  end if;

  select id into v_existing
  from public.investment_operations
  where household_id = v_hh and idempotency_key = p_idempotency_key;
  if found then
    return public.investment_operation_receipt(v_existing, true);
  end if;

  if p_asset_class not in ('crypto','stock','fund','gold','bond')
    or p_quantity <= 0 or scale(p_quantity) > 18 or p_as_of_date is null
  then
    raise exception 'Invalid opening position';
  end if;
  if p_instrument_id is not null and not exists (
    select 1 from public.market_instruments
    where id = p_instrument_id and is_active = true and asset_class = p_asset_class
  ) then
    raise exception 'Invalid market instrument';
  end if;
  if p_remaining_total_cost_basis is not null
    and (p_remaining_total_cost_basis < 0
      or p_remaining_total_cost_basis <> trunc(p_remaining_total_cost_basis))
  then
    raise exception 'Invalid basis';
  end if;

  v_history := case
    when p_remaining_total_cost_basis is null then 'cost_basis_unknown'
    else 'opening_position'
  end;
  insert into public.investment_holdings(
    household_id, name, symbol, instrument_id, asset_class, provider_custodian,
    visibility_context, lifecycle_status, history_status, quantity,
    remaining_total_cost_basis, notes, created_by, financial_scope,
    owner_membership_id
  )
  values (
    v_hh, trim(p_asset_name), nullif(trim(coalesce(p_symbol,'')), ''),
    p_instrument_id, p_asset_class, nullif(trim(coalesce(p_provider_custodian,'')), ''),
    coalesce(p_visibility_context,'household'), 'active', v_history,
    p_quantity, p_remaining_total_cost_basis,
    nullif(trim(coalesce(p_notes,'')), ''), auth.uid(), v_financial_scope,
    v_owner_membership_id
  )
  returning id into v_hid;

  insert into public.investment_operations(
    household_id, operation_type, destination_holding_id,
    destination_quantity, destination_basis_added, before_quantity,
    after_quantity, before_basis, after_basis, effective_date, notes,
    idempotency_key, created_by
  )
  values (
    v_hh, 'opening_position', v_hid, p_quantity,
    p_remaining_total_cost_basis, 0, p_quantity,
    case when p_remaining_total_cost_basis is null then null else 0 end,
    p_remaining_total_cost_basis, p_as_of_date,
    nullif(trim(coalesce(p_notes,'')), ''), p_idempotency_key, auth.uid()
  )
  returning id into v_oid;

  if p_current_valuation is not null then
    insert into public.investment_valuations(
      household_id, holding_id, value_vnd, valuation_date, source, notes,
      idempotency_key, created_by
    )
    values (
      v_hh, v_hid, p_current_valuation, p_as_of_date, 'manual',
      nullif(trim(coalesce(p_notes,'')), ''),
      p_idempotency_key || ':opening-valuation', auth.uid()
    );
  end if;
  return public.investment_operation_receipt(v_oid, false);
end $function$;
CREATE OR REPLACE FUNCTION public.record_debt_payment(p_debt_id uuid, p_account_id uuid, p_amount numeric, p_effective_date date DEFAULT NULL::date, p_note text DEFAULT NULL::text, p_idempotency_key text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_household_id uuid;
  v_result jsonb;
  v_remaining_amount numeric;
  v_status text;
begin
  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = auth.uid()
  limit 1;

  if v_household_id is null then
    raise exception 'Not a household member';
  end if;

  if not exists (
    select 1
    from public.accounts a
    where a.id = p_account_id
      and a.household_id = v_household_id
      and a.is_archived = false
      and public.is_debt_movement_account_type(a.type)
  ) then
    raise exception 'Account not found or not eligible';
  end if;

  v_result := public._record_debt_payment_unchecked_10b(
    p_debt_id,
    p_account_id,
    p_amount,
    p_effective_date,
    p_note,
    p_idempotency_key
  );

  if coalesce((v_result->>'idempotentReplay')::boolean, false) then
    select l.remaining_amount, l.status
      into v_remaining_amount, v_status
    from public.liabilities l
    where l.id = (v_result->>'debtId')::uuid
      and l.household_id = v_household_id;
    v_result := v_result || jsonb_build_object(
      'remainingAmount', v_remaining_amount,
      'completed', v_status = 'completed'
    );
  end if;

  return v_result;
end;
$function$;
CREATE OR REPLACE FUNCTION public.change_household_member_role(p_membership_id uuid, p_role text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_household_id uuid;
  v_target public.household_members%rowtype;
  v_role text := lower(trim(coalesce(p_role, '')));
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id and hm.is_active = true
  limit 1;
  if v_household_id is null then
    raise exception 'No active household';
  end if;
  if not public.is_household_admin(v_household_id) then
    raise exception 'Admin role required';
  end if;
  if v_role not in ('partner', 'admin') then
    raise exception 'Invalid household role';
  end if;

  select * into v_target
  from public.household_members hm
  where hm.id = p_membership_id and hm.household_id = v_household_id
    and hm.is_active = true
  for update;
  if not found then
    raise exception 'Member not found';
  end if;
  if v_target.role = v_role then
    return true;
  end if;
  if v_target.role = 'admin' and v_role = 'partner' and not exists (
    select 1 from public.household_members hm
    where hm.household_id = v_household_id and hm.is_active = true
      and hm.role = 'admin' and hm.id <> v_target.id
  ) then
    raise exception 'Admin continuity required before changing role';
  end if;

  update public.household_members
  set role = v_role, updated_at = now()
  where id = v_target.id;

  insert into public.household_configuration_events (
    household_id, actor_user_id, target_membership_id, event_type, payload
  ) values (
    v_household_id, v_user_id, v_target.id, 'role.changed',
    jsonb_build_object(
      'before_role', v_target.role,
      'after_role', v_role
    )
  );
  return true;
end;
$function$;
CREATE OR REPLACE FUNCTION public.create_household_invitation(p_email text)
 RETURNS TABLE(invitation_id uuid, token uuid, expires_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_household_id uuid;
  v_email text := lower(trim(coalesce(p_email, '')));
  v_member_count int;
  v_expires timestamptz;
  v_id uuid;
  v_token uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Invalid email';
  end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id and hm.is_active = true
  limit 1;
  if v_household_id is null then
    raise exception 'No active household';
  end if;

  -- The household lock serializes capacity checks with concurrent accepts.
  perform 1 from public.households h where h.id = v_household_id for update;
  if not public.is_household_admin(v_household_id) then
    raise exception 'Admin role required';
  end if;

  select count(*)::int into v_member_count
  from public.household_members hm
  where hm.household_id = v_household_id and hm.is_active = true;
  if v_member_count >= 10 then
    raise exception 'Household is full';
  end if;

  if exists (
    select 1 from public.household_members hm
    where hm.household_id = v_household_id
      and hm.is_active = true
      and lower(coalesce(hm.email, '')) = v_email
  ) then
    raise exception 'Email already a member';
  end if;

  -- Expired rows are hidden from the pending list and must not block re-invite.
  update public.household_invitations i
  set status = 'expired', updated_at = now()
  where i.household_id = v_household_id
    and i.status = 'pending'
    and i.expires_at <= now()
    and lower(i.email) = v_email;

  if exists (
    select 1 from public.household_invitations i
    where i.household_id = v_household_id
      and i.status = 'pending'
      and i.expires_at > now()
      and lower(i.email) = v_email
  ) then
    raise exception 'Invite already pending';
  end if;

  v_expires := now() + interval '7 days';
  insert into public.household_invitations (
    household_id, email, invited_by, status, expires_at
  ) values (
    v_household_id, v_email, v_user_id, 'pending', v_expires
  )
  returning id, household_invitations.token, household_invitations.expires_at
  into v_id, v_token, v_expires;
  invitation_id := v_id;
  token := v_token;
  expires_at := v_expires;
  return next;
end;
$function$;
CREATE OR REPLACE FUNCTION public.revoke_household_invitation(p_invitation_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_household_id uuid;
  v_status text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = auth.uid() and hm.is_active = true
  limit 1;
  if v_household_id is null then
    raise exception 'No active household';
  end if;
  if not public.is_household_admin(v_household_id) then
    raise exception 'Admin role required';
  end if;

  perform 1 from public.households h where h.id = v_household_id for update;
  select i.status into v_status
  from public.household_invitations i
  where i.id = p_invitation_id and i.household_id = v_household_id
  for update;
  if not found then
    raise exception 'Invitation not found';
  end if;
  if v_status = 'revoked' then
    return true;
  end if;
  if v_status <> 'pending' then
    raise exception 'Invitation not pending';
  end if;

  update public.household_invitations
  set status = 'revoked', updated_at = now()
  where id = p_invitation_id;
  return true;
end;
$function$;
CREATE OR REPLACE FUNCTION public.update_household_policies(p_overspend_policy text, p_month_close_mode text, p_income_allocate_mode text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_household_id uuid;
  v_before record;
  v_overspend text;
  v_month_close text;
  v_income text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id
    and hm.is_active = true
  limit 1;

  if v_household_id is null then
    raise exception 'No active household';
  end if;

  if not public.is_household_admin(v_household_id) then
    raise exception 'Admin role required';
  end if;

  v_overspend := lower(trim(coalesce(p_overspend_policy, '')));
  v_month_close := lower(trim(coalesce(p_month_close_mode, '')));
  v_income := lower(trim(coalesce(p_income_allocate_mode, '')));

  if v_overspend not in ('warn', 'block', 'allow_negative') then
    raise exception 'Invalid overspend policy';
  end if;
  if v_month_close not in ('assisted', 'auto', 'manual') then
    raise exception 'Invalid month close mode';
  end if;
  if v_income not in ('off', 'suggest', 'auto') then
    raise exception 'Invalid income allocate mode';
  end if;

  select
    h.overspend_policy,
    h.month_close_mode,
    h.income_allocate_mode
  into v_before
  from public.households h
  where h.id = v_household_id
  for update;

  if not found then
    raise exception 'Household not found';
  end if;

  if v_before.overspend_policy = v_overspend
    and v_before.month_close_mode = v_month_close
    and v_before.income_allocate_mode = v_income then
    return v_household_id;
  end if;

  update public.households
  set
    overspend_policy = v_overspend,
    month_close_mode = v_month_close,
    income_allocate_mode = v_income,
    updated_at = now()
  where id = v_household_id;

  insert into public.household_policy_events (
    household_id,
    actor_user_id,
    event_type,
    payload
  ) values (
    v_household_id,
    v_user_id,
    'policy.updated',
    jsonb_build_object(
      'before', jsonb_build_object(
        'overspend_policy', v_before.overspend_policy,
        'month_close_mode', v_before.month_close_mode,
        'income_allocate_mode', v_before.income_allocate_mode
      ),
      'after', jsonb_build_object(
        'overspend_policy', v_overspend,
        'month_close_mode', v_month_close,
        'income_allocate_mode', v_income
      )
    )
  );

  return v_household_id;
end;
$function$;
CREATE OR REPLACE FUNCTION public.update_household_preferences(p_locale text, p_timezone text, p_base_currency text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_household_id uuid;
  v_before record;
  v_locale text := trim(coalesce(p_locale, ''));
  v_timezone text := trim(coalesce(p_timezone, ''));
  v_currency text := upper(trim(coalesce(p_base_currency, '')));
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id
    and hm.is_active = true
  limit 1;

  if v_household_id is null then
    raise exception 'No active household';
  end if;
  if not public.is_household_admin(v_household_id) then
    raise exception 'Admin role required';
  end if;
  if v_locale not in ('en-VN', 'vi-VN') then
    raise exception 'Invalid locale';
  end if;
  if v_timezone <> 'Asia/Ho_Chi_Minh' then
    raise exception 'Invalid timezone';
  end if;
  if v_currency <> 'VND' then
    raise exception 'Invalid base currency';
  end if;

  select h.locale, h.timezone, h.base_currency
  into v_before
  from public.households h
  where h.id = v_household_id
  for update;

  if not found then
    raise exception 'Household not found';
  end if;

  if v_before.locale = v_locale
    and v_before.timezone = v_timezone
    and v_before.base_currency = v_currency then
    return v_household_id;
  end if;

  update public.households
  set locale = v_locale,
      timezone = v_timezone,
      base_currency = v_currency,
      updated_at = now()
  where id = v_household_id;

  insert into public.household_configuration_events (
    household_id,
    actor_user_id,
    event_type,
    payload
  ) values (
    v_household_id,
    v_user_id,
    'preferences.updated',
    jsonb_build_object(
      'before', jsonb_build_object(
        'locale', v_before.locale,
        'timezone', v_before.timezone,
        'base_currency', v_before.base_currency
      ),
      'after', jsonb_build_object(
        'locale', v_locale,
        'timezone', v_timezone,
        'base_currency', v_currency
      )
    )
  );

  return v_household_id;
end;
$function$;
CREATE OR REPLACE FUNCTION public.acknowledge_inbox_item(p_inbox_item_id uuid, p_action text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_item public.inbox_items%rowtype;
  v_action text;
  v_cancelled integer := 0;
  v_saving_id uuid;
  v_new_status text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  v_action := lower(trim(coalesce(p_action, '')));

  select * into v_item
  from public.inbox_items i
  where i.id = p_inbox_item_id
  for update;

  if not found then
    raise exception 'Inbox item not found';
  end if;

  if not public.is_household_member(v_item.household_id) then
    raise exception 'Forbidden';
  end if;

  if v_item.status <> 'pending' then
    return jsonb_build_object('inbox_item_id', v_item.id, 'status', v_item.status);
  end if;

  if v_item.kind = 'savings_maturity' then
    if v_action not in (
      'renew',
      'switch',
      'withdraw',
      'confirm_configured',
      'choose_package',
      'change_settlement',
      'remind_tomorrow',
      'dismiss'
    ) then
      raise exception 'Invalid maturity action';
    end if;
  elsif v_item.kind = 'early_withdrawal_confirmation' then
    if v_action not in ('confirm', 'cancel', 'dismiss') then
      raise exception 'Invalid early withdrawal action';
    end if;
  elsif v_item.kind = 'emi_complete' then
    if v_action not in ('celebrate', 'later') then
      raise exception 'Invalid EMI action';
    end if;
  else
    raise exception 'Item cannot be acknowledged';
  end if;

  v_new_status := case
    when v_action in ('dismiss', 'cancel') then 'dismissed'
    when v_action = 'remind_tomorrow' then 'pending'
    else 'acknowledged'
  end;

  update public.inbox_items i
  set status = v_new_status,
      resolved_by = case
        when v_action = 'remind_tomorrow' then null
        else v_user_id
      end,
      resolved_at = case
        when v_action = 'remind_tomorrow' then null
        else now()
      end,
      context_json = coalesce(i.context_json, '{}'::jsonb)
        || jsonb_build_object('ack_action', v_action),
      updated_at = now()
  where i.id = v_item.id;

  -- BR-21: cancel sibling cascade reminders for the same saving.
  if v_item.kind = 'savings_maturity' and v_action <> 'remind_tomorrow' then
    v_saving_id := coalesce(
      (v_item.context_json->>'savingId')::uuid,
      v_item.source_id
    );

    with cancelled as (
      update public.inbox_items i
      set status = 'archived',
          updated_at = now(),
          context_json = coalesce(i.context_json, '{}'::jsonb)
            || jsonb_build_object(
              'cascade_cancelled', true,
              'cancelled_by_inbox_item_id', v_item.id,
              'cancelled_at', timezone('utc', now())
            )
      where i.household_id = v_item.household_id
        and i.id <> v_item.id
        and i.kind = 'savings_maturity'
        and i.status = 'pending'
        and i.source_type = v_item.source_type
        and (
          i.source_id = v_item.source_id
          or i.source_id = v_saving_id
          or (i.context_json->>'savingId')::uuid = v_saving_id
        )
      returning i.id
    )
    select count(*)::integer into v_cancelled from cancelled;
  end if;

  return jsonb_build_object(
    'inbox_item_id', v_item.id,
    'status', v_new_status,
    'action', v_action,
    'cascade_cancelled_count', v_cancelled
  );
end;
$function$;
CREATE OR REPLACE FUNCTION public.backfill_legacy_savings_accounts(p_household_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;
CREATE OR REPLACE FUNCTION public.change_goal_lifecycle(p_goal_id uuid, p_action text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_goal public.goals%rowtype;
  v_next_status text;
  v_now timestamptz := pg_catalog.timezone('utc', pg_catalog.now());
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if p_action not in ('pause', 'resume', 'complete', 'cancel') then
    raise exception 'Invalid lifecycle action';
  end if;

  select * into v_goal
  from public.goals
  where id = p_goal_id
  for update;
  if not found or not public.is_household_member(v_goal.household_id) then
    raise exception 'Goal not found';
  end if;

  if p_action = 'pause' then
    if v_goal.status not in ('active', 'ready') then
      raise exception 'Goal cannot be paused';
    end if;
    v_next_status := 'paused';
  elsif p_action = 'resume' then
    if v_goal.status <> 'paused' then
      raise exception 'Goal cannot be resumed';
    end if;
    -- Linked Goal readiness is derived by the application from current sources;
    -- never use legacy funded_amount as the lifecycle source of truth.
    v_next_status := 'active';
  elsif p_action = 'complete' then
    if v_goal.status not in ('active', 'paused', 'ready') then
      raise exception 'Goal cannot be completed';
    end if;
    v_next_status := 'completed';
  else
    if v_goal.status not in ('active', 'paused', 'ready') then
      raise exception 'Goal cannot be cancelled';
    end if;
    v_next_status := 'cancelled';
  end if;

  update public.goals
  set status = v_next_status,
      paused_at = case when p_action = 'pause' then v_now else paused_at end,
      completed_at = case when p_action = 'complete' then v_now else completed_at end,
      cancelled_at = case when p_action = 'cancel' then v_now else cancelled_at end,
      updated_at = v_now
  where id = v_goal.id;

  if p_action in ('complete', 'cancel') then
    update public.goal_funding_links
    set is_active = false,
        unlinked_at = v_now,
        unlinked_by = v_user_id
    where goal_id = v_goal.id
      and household_id = v_goal.household_id
      and is_active = true;
  end if;

  return jsonb_build_object('goal_id', v_goal.id, 'status', v_next_status);
end;
$function$;
CREATE OR REPLACE FUNCTION public.contribute_to_goal(p_goal_id uuid, p_amount numeric, p_note text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_goal public.goals%rowtype;
  v_contrib_id uuid;
  v_new_funded numeric(18, 0);
begin
  v_user_id := auth.uid();
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_amount is null or p_amount <= 0 or p_amount <> trunc(p_amount) then
    raise exception 'Amount must be a positive whole number';
  end if;
  select * into v_goal from public.goals g where g.id = p_goal_id for update;
  if not found then raise exception 'Goal not found'; end if;
  if not public.is_household_member(v_goal.household_id) then raise exception 'Forbidden'; end if;
  if exists (select 1 from public.goal_funding_links l where l.goal_id = v_goal.id and l.is_active) then
    raise exception 'Linked goals derive progress from Money sources';
  end if;
  if v_goal.status not in ('active', 'paused', 'ready') then
    raise exception 'Goal is not open for contributions';
  end if;
  v_new_funded := v_goal.funded_amount + p_amount;
  insert into public.goal_contributions (household_id, goal_id, direction, amount, note, created_by)
  values (v_goal.household_id, v_goal.id, 'contribute', p_amount, nullif(trim(coalesce(p_note, '')), ''), v_user_id)
  returning id into v_contrib_id;
  update public.goals
  set funded_amount = v_new_funded,
      legacy_funded_amount = v_new_funded,
      status = case when v_new_funded >= target_amount then 'ready' when status = 'ready' then 'active' else status end,
      updated_at = now()
  where id = v_goal.id;
  return jsonb_build_object('contribution_id', v_contrib_id, 'goal_id', v_goal.id, 'funded_amount', v_new_funded);
end;
$function$;
CREATE OR REPLACE FUNCTION public.correct_transaction(p_original_transaction_id uuid, p_amount numeric, p_type text, p_account_id uuid DEFAULT NULL::uuid, p_category_id uuid DEFAULT NULL::uuid, p_jar_id uuid DEFAULT NULL::uuid, p_note text DEFAULT NULL::text, p_transaction_date date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_original public.transactions%rowtype;
  v_reversal_id uuid;
  v_correction_id uuid;
  v_account_id uuid;
  v_category_id uuid;
  v_jar_id uuid;
  v_reversal_type text;
  v_date date;
begin
  v_user_id := auth.uid();
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_type not in ('income', 'expense') then raise exception 'Invalid transaction type'; end if;
  if p_amount is null or p_amount <= 0 or p_amount <> trunc(p_amount) then
    raise exception 'Amount must be a positive whole number';
  end if;
  select * into v_original from public.transactions t
  where t.id = p_original_transaction_id for update;
  if not found then raise exception 'Transaction not found'; end if;
  if not public.is_household_member(v_original.household_id) then raise exception 'Forbidden'; end if;
  if v_original.type not in ('income', 'expense')
     or v_original.savings_event_kind is not null
     or exists (select 1 from public.accounts a where a.id = v_original.account_id and a.type = 'credit_card')
  then
    raise exception 'Transaction is not correctable';
  end if;
  if v_original.status not in ('posted', 'pending_mapping') then raise exception 'Transaction is not correctable'; end if;
  if v_original.reverses_transaction_id is not null or v_original.corrects_transaction_id is not null then
    raise exception 'Transaction is not correctable';
  end if;
  v_account_id := coalesce(p_account_id, v_original.account_id);
  v_category_id := coalesce(p_category_id, v_original.category_id);
  v_jar_id := coalesce(p_jar_id, v_original.jar_id);
  v_date := coalesce(p_transaction_date, v_original.transaction_date);
  if not exists (
    select 1 from public.accounts a
    where a.id = v_account_id and a.household_id = v_original.household_id and a.is_archived = false
  ) then raise exception 'Account not found'; end if;
  if v_category_id is not null and not exists (
    select 1 from public.categories c
    where c.id = v_category_id and c.is_active = true and c.kind = p_type
      and (c.household_id is null or c.household_id = v_original.household_id)
  ) then raise exception 'Invalid category tag'; end if;
  if v_jar_id is not null and not exists (
    select 1 from public.jars j
    where j.id = v_jar_id and j.household_id = v_original.household_id and j.is_archived = false
  ) then raise exception 'Invalid jar'; end if;
  v_reversal_type := case when v_original.type = 'expense' then 'income' else 'expense' end;
  update public.transactions set status = 'reversed', updated_at = timezone('utc', now()) where id = v_original.id;
  insert into public.transactions (
    household_id, account_id, type, amount, currency, transaction_date, note,
    category_id, jar_id, status, reverses_transaction_id, created_by
  ) values (
    v_original.household_id, v_original.account_id, v_reversal_type, v_original.amount,
    v_original.currency, v_date, 'Reversal', v_original.category_id, v_original.jar_id,
    'posted', v_original.id, v_user_id
  ) returning id into v_reversal_id;
  insert into public.transactions (
    household_id, account_id, type, amount, currency, transaction_date, note,
    category_id, jar_id, status, corrects_transaction_id, created_by
  ) values (
    v_original.household_id, v_account_id, p_type, p_amount, v_original.currency, v_date,
    coalesce(nullif(trim(coalesce(p_note, '')), ''), v_original.note), v_category_id, v_jar_id,
    'posted', v_original.id, v_user_id
  ) returning id into v_correction_id;
  return jsonb_build_object(
    'original_transaction_id', v_original.id,
    'reversal_transaction_id', v_reversal_id,
    'correction_transaction_id', v_correction_id
  );
end;
$function$;
CREATE OR REPLACE FUNCTION public.dismiss_inbox_item(p_inbox_item_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_item public.inbox_items%rowtype;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select * into v_item
  from public.inbox_items i
  where i.id = p_inbox_item_id
  for update;

  if not found then
    raise exception 'Inbox item not found';
  end if;

  if not public.is_household_member(v_item.household_id) then
    raise exception 'Forbidden';
  end if;

  if v_item.status <> 'pending' then
    return jsonb_build_object('inbox_item_id', v_item.id, 'status', v_item.status);
  end if;

  update public.inbox_items i
  set status = 'dismissed',
      resolved_by = v_user_id,
      resolved_at = now(),
      context_json = coalesce(i.context_json, '{}'::jsonb) || jsonb_build_object('dismissed', true),
      updated_at = now()
  where i.id = v_item.id;

  return jsonb_build_object(
    'inbox_item_id', v_item.id,
    'status', 'dismissed'
  );
end;
$function$;
CREATE OR REPLACE FUNCTION public.enqueue_savings_maturity(p_savings_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_row public.savings_accounts%rowtype;
  v_item_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select * into v_row
  from public.savings_accounts s
  where s.id = p_savings_id
  for update;

  if not found then
    raise exception 'Savings not found';
  end if;

  if not public.is_household_member(v_row.household_id) then
    raise exception 'Not a household member';
  end if;

  if v_row.status = 'closed' then
    raise exception 'Savings closed';
  end if;

  update public.savings_accounts s
  set
    status = 'matured',
    updated_at = timezone('utc', now())
  where s.id = p_savings_id
    and s.status = 'active';

  insert into public.inbox_items (
    household_id,
    kind,
    status,
    source_type,
    source_id,
    amount,
    currency,
    title,
    context_json
  )
  values (
    v_row.household_id,
    'savings_maturity',
    'pending',
    'guided',
    p_savings_id,
    v_row.principal_amount,
    v_row.currency,
    v_row.name,
    jsonb_build_object(
      'flow', 'savings_maturity',
      'maturity_date', v_row.maturity_date
    )
  )
  on conflict (household_id, source_type, source_id) do update
    set
      status = 'pending',
      updated_at = timezone('utc', now()),
      title = excluded.title,
      amount = excluded.amount
  returning id into v_item_id;

  if v_item_id is null then
    select i.id into v_item_id
    from public.inbox_items i
    where i.household_id = v_row.household_id
      and i.source_type = 'guided'
      and i.source_id = p_savings_id;
  end if;

  return jsonb_build_object('ok', true, 'inboxItemId', v_item_id);
end;
$function$;
CREATE OR REPLACE FUNCTION public.ensure_miscellaneous_jar(p_household_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_jar_id uuid;
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is not null and not public.is_household_member(p_household_id) then
    raise exception 'Forbidden';
  end if;

  select j.id into v_jar_id
  from public.jars j
  where j.household_id = p_household_id
    and lower(j.name) = 'general'
    and j.is_archived = false
  order by j.sort_order asc, j.created_at asc
  limit 1;

  if v_jar_id is not null then
    return v_jar_id;
  end if;

  insert into public.jars (household_id, name, kind, sort_order, is_archived, is_paused)
  values (p_household_id, 'General', 'spending', 0, false, false)
  returning id into v_jar_id;

  insert into public.jar_plans (household_id, jar_id, plan_kind, percent_bps, fixed_amount)
  select p_household_id, v_jar_id, 'percent', 0, 0
  where not exists (
    select 1 from public.jar_plans jp where jp.jar_id = v_jar_id
  );

  return v_jar_id;
end;
$function$;
CREATE OR REPLACE FUNCTION public.produce_inbox_item(p_household_id uuid, p_kind text, p_source_type text, p_source_id uuid, p_amount numeric, p_currency text, p_title text, p_context jsonb DEFAULT '{}'::jsonb, p_assigned_to_user_id uuid DEFAULT NULL::uuid, p_expires_at timestamp with time zone DEFAULT NULL::timestamp with time zone, p_suggested_jar_id uuid DEFAULT NULL::uuid, p_suggested_category_id uuid DEFAULT NULL::uuid, p_dedupe_extra text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_kind text[] := array[
    'unmapped_expense', 'income_suggest', 'savings_maturity',
    'early_withdrawal_confirmation', 'emi_complete',
    'emergency_declaration', 'loan_payment_attention',
    'debt_payment_attention'
  ];
  v_removed text[] := array[
    'savings_matured', 'renewal_required', 'penalty_warning',
    'rate_changed_suggestion', 'package_expired', 'payment_reminder'
  ];
  v_dedupe_key text;
  v_cycle_key text := 'none';
  v_item_id uuid;
  v_context jsonb;
  v_currency text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not public.is_household_member(p_household_id) then
    raise exception 'Forbidden';
  end if;
  if not p_kind = any(v_kind) then
    if p_kind = any(v_removed) then
      raise exception 'Removed Inbox kind cannot be produced';
    end if;
    raise exception 'Unknown Inbox kind';
  end if;
  if p_source_type is null or p_source_type not in ('transaction', 'guided', 'plan_movement') then
    raise exception 'Invalid Inbox source type';
  end if;
  if p_kind in ('unmapped_expense', 'income_suggest')
     and (p_source_type <> 'transaction' or p_source_id is null or p_amount is null) then
    raise exception 'Missing required source context';
  end if;
  if p_kind in ('savings_maturity', 'early_withdrawal_confirmation')
     and (p_source_type <> 'guided' or p_context->>'savingId' is null or p_context->>'cycleId' is null) then
    raise exception 'Missing savings context';
  end if;
  if p_kind in ('loan_payment_attention', 'debt_payment_attention')
     and (p_source_type <> 'guided' or p_source_id is null or p_amount is null
       or nullif(p_context->>'dueState', '') is null
       or nullif(p_context->>'dueDate', '') is null) then
    raise exception 'Missing due attention context';
  end if;
  if p_kind = 'emi_complete' and p_context is not null
     and p_context->>'installmentPlanId' is null
     and p_context->>'debtId' is null
     and p_context->>'loanId' is null then
    raise exception 'Missing installment/debt context';
  end if;
  if p_kind = 'emergency_declaration'
     and (p_source_type <> 'plan_movement' or nullif(trim(p_context->>'intentNote'), '') is null) then
    raise exception 'Emergency intent note required';
  end if;
  if p_kind not in ('emergency_declaration') and p_assigned_to_user_id is not null then
    raise exception 'Assignment is only valid for emergency declarations';
  end if;
  if p_kind = 'savings_maturity' and p_expires_at is null then
    p_expires_at := timezone('utc', now()) + interval '31 days';
  end if;
  if p_assigned_to_user_id is not null and not exists (
    select 1 from public.household_members hm
    where hm.household_id = p_household_id
      and hm.user_id = p_assigned_to_user_id
      and hm.is_active = true
  ) then
    raise exception 'Invalid assignee';
  end if;
  if p_kind in ('savings_maturity', 'early_withdrawal_confirmation') then
    v_cycle_key := coalesce(p_context->>'cycleId', 'none');
  end if;

  v_currency := upper(coalesce(nullif(trim(p_currency), ''), 'VND'));
  v_dedupe_key := concat_ws(
    '|', p_kind, p_source_type, p_source_id::text,
    coalesce(nullif(p_context->>'cascadeDay', ''), 'none'),
    v_cycle_key, coalesce(p_assigned_to_user_id::text, 'none'),
    coalesce(p_dedupe_extra, '')
  );
  v_context := jsonb_build_object(
    'version', 1, 'kind', p_kind, 'data', coalesce(p_context, '{}'::jsonb)
  );

  insert into public.inbox_items (
    household_id, kind, status, source_type, source_id, amount, currency,
    title, context_json, assigned_to_user_id, expires_at,
    suggested_jar_id, suggested_category_id, dedupe_key
  ) values (
    p_household_id, p_kind, 'pending', p_source_type, p_source_id,
    p_amount, v_currency, coalesce(nullif(trim(p_title), ''), p_kind),
    v_context, p_assigned_to_user_id, p_expires_at,
    p_suggested_jar_id, p_suggested_category_id, v_dedupe_key
  )
  on conflict (household_id, dedupe_key) where dedupe_key is not null
  do update set
    status = 'pending', updated_at = timezone('utc', now()),
    title = excluded.title, amount = excluded.amount,
    currency = excluded.currency, context_json = excluded.context_json,
    expires_at = excluded.expires_at,
    suggested_jar_id = excluded.suggested_jar_id,
    suggested_category_id = excluded.suggested_category_id
  where public.inbox_items.status = 'pending'
     or (p_kind = 'savings_maturity' and public.inbox_items.status = 'expired')
  returning id into v_item_id;

  if v_item_id is null then
    select id into v_item_id from public.inbox_items
    where household_id = p_household_id and dedupe_key = v_dedupe_key;
  end if;
  return jsonb_build_object('inbox_item_id', v_item_id, 'idempotent', v_item_id is not null);
end;
$function$;
CREATE OR REPLACE FUNCTION public.reassign_goal_funding_source(p_link_id uuid, p_from_goal_id uuid, p_to_goal_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_link public.goal_funding_links%rowtype;
  v_from public.goals%rowtype;
  v_to public.goals%rowtype;
  v_new_link_id uuid;
  v_now timestamptz := pg_catalog.timezone('utc', pg_catalog.now());
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if p_from_goal_id = p_to_goal_id then
    raise exception 'Destination must differ';
  end if;

  select * into v_link
  from public.goal_funding_links
  where id = p_link_id
    and goal_id = p_from_goal_id
    and is_active = true
  for update;
  if not found then
    raise exception 'Funding source is no longer assigned';
  end if;

  select * into v_from
  from public.goals
  where id = p_from_goal_id
  for update;
  select * into v_to
  from public.goals
  where id = p_to_goal_id
  for update;
  if not found or not public.is_household_member(v_from.household_id) then
    raise exception 'Goal not found';
  end if;
  if v_to.id is null or v_from.household_id <> v_to.household_id then
    raise exception 'Destination must be in the same household';
  end if;
  if v_link.household_id <> v_from.household_id then
    raise exception 'Funding source belongs to another household';
  end if;
  if v_to.status not in ('active', 'ready') then
    raise exception 'Destination goal is not open';
  end if;
  if (v_to.goal_type = 'payoff' and v_link.source_kind not in ('loan', 'debt'))
     or (v_to.goal_type <> 'payoff' and v_link.source_kind in ('loan', 'debt')) then
    raise exception 'Funding source is incompatible with destination goal';
  end if;

  update public.goal_funding_links
  set is_active = false,
      unlinked_at = v_now,
      unlinked_by = v_user_id
  where id = v_link.id;

  insert into public.goal_funding_links (
    household_id,
    goal_id,
    source_kind,
    saving_id,
    account_id,
    holding_id,
    loan_id,
    debt_id,
    initial_principal_snapshot,
    is_active,
    created_by,
    linked_at,
    linked_by,
    created_at
  ) values (
    v_link.household_id,
    v_to.id,
    v_link.source_kind,
    v_link.saving_id,
    v_link.account_id,
    v_link.holding_id,
    v_link.loan_id,
    v_link.debt_id,
    v_link.initial_principal_snapshot,
    true,
    v_user_id,
    v_now,
    v_user_id,
    v_now
  ) returning id into v_new_link_id;

  return jsonb_build_object(
    'source_kind', v_link.source_kind,
    'from_goal_id', v_from.id,
    'to_goal_id', v_to.id,
    'new_link_id', v_new_link_id
  );
end;
$function$;
CREATE OR REPLACE FUNCTION public.record_liability_payment(p_liability_id uuid, p_amount numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_row public.liabilities%rowtype;
  v_pay numeric;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Invalid payment amount';
  end if;

  select * into v_row
  from public.liabilities l
  where l.id = p_liability_id
  for update;

  if not found then
    raise exception 'Liability not found';
  end if;

  if not public.is_household_member(v_row.household_id) then
    raise exception 'Not a household member';
  end if;

  if v_row.is_archived then
    raise exception 'Liability archived';
  end if;

  v_pay := least(p_amount, v_row.remaining_amount);

  update public.liabilities l
  set
    remaining_amount = v_row.remaining_amount - v_pay,
    updated_at = timezone('utc', now()),
    is_archived = case
      when v_row.remaining_amount - v_pay = 0 then true
      else l.is_archived
    end
  where l.id = p_liability_id;

  return jsonb_build_object(
    'ok', true,
    'paid', v_pay,
    'remaining', v_row.remaining_amount - v_pay
  );
end;
$function$;
CREATE OR REPLACE FUNCTION public.record_saving_renewal_decision(p_cycle_id uuid, p_renewal_decision jsonb, p_revert_one_time boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_cycle public.saving_cycles%rowtype;
  v_saving public.savings%rowtype;
begin
  select * into v_cycle from public.saving_cycles where id = p_cycle_id;
  if not found then
    raise exception 'Cycle not found';
  end if;

  select * into v_saving from public.savings where id = v_cycle.saving_id;
  if not public.is_household_member(v_saving.household_id) then
    raise exception 'Forbidden';
  end if;

  update public.saving_cycles
  set renewal_decision = p_renewal_decision
  where id = p_cycle_id
    and renewal_decision is null;

  if p_revert_one_time and v_saving.renewal_policy = 'one_time_renewal' then
    update public.savings
    set
      renewal_policy = 'always_ask',
      renewal_config = '{}'::jsonb,
      updated_at = timezone('utc', now())
    where id = v_saving.id;
  end if;

  return jsonb_build_object('ok', true);
end;
$function$;
CREATE OR REPLACE FUNCTION public.refund_transaction(p_original_transaction_id uuid, p_amount numeric, p_account_id uuid DEFAULT NULL::uuid, p_note text DEFAULT NULL::text, p_transaction_date date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_original public.transactions%rowtype;
  v_prior numeric;
  v_refund_id uuid;
  v_account_id uuid;
  v_status text;
  v_note text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_amount is null or p_amount <= 0 or p_amount <> trunc(p_amount) then
    raise exception 'Amount must be a positive whole number';
  end if;
  select * into v_original from public.transactions t
  where t.id = p_original_transaction_id for update;
  if not found then raise exception 'Transaction not found'; end if;
  if not public.is_household_member(v_original.household_id) then raise exception 'Forbidden'; end if;
  if v_original.type <> 'expense'
     or v_original.savings_event_kind is not null
     or exists (select 1 from public.accounts a where a.id = v_original.account_id and a.type = 'credit_card')
  then
    raise exception 'Transaction is not refundable';
  end if;
  if v_original.status not in ('posted', 'partially_refunded') then
    raise exception 'Transaction is not refundable';
  end if;
  if v_original.reverses_transaction_id is not null or v_original.corrects_transaction_id is not null then
    raise exception 'Transaction is not refundable';
  end if;
  select coalesce(sum(r.amount), 0) into v_prior
  from public.transactions r
  where r.reverses_transaction_id = v_original.id and r.status = 'posted';
  if v_prior + p_amount > v_original.amount then raise exception 'Refund exceeds original amount'; end if;
  v_account_id := coalesce(p_account_id, v_original.account_id);
  if not exists (
    select 1 from public.accounts a
    where a.id = v_account_id and a.household_id = v_original.household_id and a.is_archived = false
  ) then raise exception 'Account not found'; end if;
  v_status := case when v_prior + p_amount >= v_original.amount then 'fully_refunded' else 'partially_refunded' end;
  v_note := nullif(trim(coalesce(p_note, '')), '');
  insert into public.transactions (
    household_id, account_id, type, amount, currency, transaction_date, note,
    category_id, jar_id, status, reverses_transaction_id, created_by
  ) values (
    v_original.household_id, v_account_id, 'income', p_amount, v_original.currency,
    coalesce(p_transaction_date, timezone('Asia/Ho_Chi_Minh', now())::date),
    coalesce(v_note, 'Refund'), v_original.category_id, v_original.jar_id,
    'posted', v_original.id, v_user_id
  ) returning id into v_refund_id;
  update public.transactions set status = v_status, updated_at = timezone('utc', now()) where id = v_original.id;
  return jsonb_build_object(
    'refund_transaction_id', v_refund_id,
    'original_transaction_id', v_original.id,
    'original_status', v_status,
    'jar_id', v_original.jar_id,
    'capacity_restored', p_amount
  );
end;
$function$;
CREATE OR REPLACE FUNCTION public.renew_saving_cycle(p_cycle_id uuid, p_action text, p_package_snapshot jsonb, p_locked_rate numeric, p_cycle_start_date date, p_cycle_end_date date, p_settlement_account_id uuid DEFAULT NULL::uuid, p_product_snapshot jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_cycle public.saving_cycles%rowtype;
  v_saving public.savings%rowtype;
  v_product_account_id uuid;
  v_settlement_id uuid;
  v_interest numeric;
  v_new_principal numeric;
  v_action text;
  v_interest_tx uuid;
  v_out_tx uuid;
  v_in_tx uuid;
  v_new_cycle_id uuid;
  v_currency text;
  v_today date;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  v_action := lower(trim(coalesce(p_action, '')));
  if v_action not in ('roll_principal_interest', 'roll_principal_only') then
    raise exception 'Invalid renew action';
  end if;

  select * into v_cycle
  from public.saving_cycles
  where id = p_cycle_id
  for update;

  if not found then
    raise exception 'Cycle not found';
  end if;

  if v_cycle.status <> 'matured' then
    raise exception 'Cycle must be matured to renew';
  end if;

  select * into v_saving
  from public.savings
  where id = v_cycle.saving_id
  for update;

  if not public.is_household_member(v_saving.household_id) then
    raise exception 'Forbidden';
  end if;

  if p_package_snapshot is null or p_locked_rate is null then
    raise exception 'Package snapshot and locked rate required';
  end if;

  v_settlement_id := coalesce(p_settlement_account_id, v_saving.settlement_account_id);
  v_product_account_id := public.get_or_create_savings_product_account(v_saving.household_id);
  v_currency := public.household_base_currency(v_saving.household_id);
  v_today := (timezone('utc', now()))::date;
  v_interest := coalesce(v_cycle.accrued_interest, 0);

  if v_interest > 0 then
    insert into public.transactions (
      household_id, account_id, type, amount, currency,
      transaction_date, note, status, created_by, source
    )
    values (
      v_saving.household_id, v_product_account_id, 'income', v_interest, v_currency,
      v_today, 'Interest: ' || v_saving.product_name, 'posted', v_user_id, 'manual'
    )
    returning id into v_interest_tx;
  end if;

  if v_action = 'roll_principal_interest' then
    v_new_principal := v_cycle.principal + v_interest;

    update public.saving_cycles
    set
      status = 'rolled',
      settlement_result = jsonb_build_object(
        'action', 'roll_principal_interest',
        'principalReturned', 0,
        'interestReturned', 0,
        'penaltyApplied', 0,
        'netAmount', 0,
        'settledAt', timezone('utc', now()),
        'settledToAccountId', v_settlement_id
      )
    where id = v_cycle.id;
  else
    -- roll principal only: pay interest out to settlement
    v_new_principal := v_cycle.principal;

    if v_interest > 0 then
      if not exists (
        select 1 from public.accounts a
        where a.id = v_settlement_id
          and a.household_id = v_saving.household_id
          and a.is_archived = false
      ) then
        raise exception 'Invalid settlement account';
      end if;

      insert into public.transactions (
        household_id, account_id, type, amount, currency,
        transaction_date, note, status, created_by, source
      )
      values (
        v_saving.household_id, v_product_account_id, 'expense', v_interest, v_currency,
        v_today, 'Interest payout: ' || v_saving.product_name, 'posted', v_user_id, 'manual'
      )
      returning id into v_out_tx;

      insert into public.transactions (
        household_id, account_id, type, amount, currency,
        transaction_date, note, status, created_by, source
      )
      values (
        v_saving.household_id, v_settlement_id, 'income', v_interest, v_currency,
        v_today, 'Interest from saving: ' || v_saving.product_name, 'posted', v_user_id, 'manual'
      )
      returning id into v_in_tx;
    end if;

    update public.saving_cycles
    set
      status = 'rolled',
      settlement_transaction_id = v_in_tx,
      settlement_result = jsonb_build_object(
        'action', 'roll_principal_only',
        'principalReturned', 0,
        'interestReturned', v_interest,
        'penaltyApplied', 0,
        'netAmount', v_interest,
        'settledAt', timezone('utc', now()),
        'settledToAccountId', v_settlement_id
      )
    where id = v_cycle.id;
  end if;

  insert into public.saving_cycles (
    saving_id, cycle_number, start_date, end_date,
    principal, locked_rate, package_snapshot,
    status
  )
  values (
    v_saving.id,
    v_cycle.cycle_number + 1,
    p_cycle_start_date,
    p_cycle_end_date,
    v_new_principal,
    p_locked_rate,
    p_package_snapshot,
    'active'
  )
  returning id into v_new_cycle_id;

  update public.savings
  set
    status = 'active',
    product_snapshot = coalesce(p_product_snapshot, product_snapshot),
    updated_at = timezone('utc', now())
  where id = v_saving.id;

  return jsonb_build_object(
    'ok', true,
    'savingId', v_saving.id,
    'previousCycleId', v_cycle.id,
    'cycleId', v_new_cycle_id,
    'principal', v_new_principal,
    'action', v_action
  );
end;
$function$;
CREATE OR REPLACE FUNCTION public.resolve_inbox_item_to_jar(p_inbox_item_id uuid, p_jar_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_item public.inbox_items%rowtype;
  v_jar_ok boolean;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select * into v_item
  from public.inbox_items i
  where i.id = p_inbox_item_id
  for update;

  if not found then
    raise exception 'Inbox item not found';
  end if;

  if not public.is_household_member(v_item.household_id) then
    raise exception 'Forbidden';
  end if;

  if v_item.status <> 'pending' then
    return jsonb_build_object('inbox_item_id', v_item.id, 'status', v_item.status);
  end if;

  if v_item.kind not in ('unmapped_expense', 'income_suggest') then
    raise exception 'Item cannot be resolved to a jar';
  end if;

  if v_item.source_type <> 'transaction' then
    raise exception 'Item has no ledger source';
  end if;

  select exists (
    select 1
    from public.jars j
    where j.id = p_jar_id
      and j.household_id = v_item.household_id
      and j.is_archived = false
      and coalesce(j.is_paused, false) = false
  ) into v_jar_ok;

  if not v_jar_ok then
    raise exception 'Invalid jar';
  end if;

  update public.transactions t
  set jar_id = p_jar_id,
      updated_at = now()
  where t.id = v_item.source_id
    and t.household_id = v_item.household_id;

  update public.inbox_items i
  set status = 'resolved',
      resolved_jar_id = p_jar_id,
      resolved_by = v_user_id,
      resolved_at = now(),
      updated_at = now()
  where i.id = v_item.id;

  return jsonb_build_object(
    'inbox_item_id', v_item.id,
    'status', 'resolved',
    'jar_id', p_jar_id
  );
end;
$function$;
CREATE OR REPLACE FUNCTION public.update_loan_interest_rate(p_loan_id uuid, p_new_annual_rate numeric, p_effective_from date, p_note text DEFAULT NULL::text, p_upcoming_schedule jsonb DEFAULT '[]'::jsonb, p_monthly_payment numeric DEFAULT NULL::numeric, p_total_interest numeric DEFAULT NULL::numeric, p_total_repayment numeric DEFAULT NULL::numeric, p_expected_end_date date DEFAULT NULL::date, p_next_payment_date date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_loan public.loans%rowtype;
  v_seq int;
  v_today date;
  v_paid_on_or_after int;
  v_unpaid_on_or_after int;
  v_before_count int;
  v_after_count int;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  v_today := (timezone('utc', now()))::date;

  select * into v_loan from public.loans where id = p_loan_id for update;
  if not found then
    raise exception 'Loan not found';
  end if;
  if not public.is_household_member(v_loan.household_id) then
    raise exception 'Not a household member';
  end if;
  if v_loan.status <> 'active' then
    raise exception 'Loan is not active';
  end if;

  if v_loan.interest_strategy = 'fixed' then
    raise exception 'Fixed interest loans cannot change rate';
  end if;

  if v_loan.interest_strategy = 'promo_fixed_to_floating'
     and v_loan.promo_rate_effective_on is not null
     and v_today < v_loan.promo_rate_effective_on then
    raise exception 'Promo period has not ended';
  end if;

  if p_new_annual_rate is null or p_new_annual_rate < 0 then
    raise exception 'Invalid interest rate';
  end if;

  if p_effective_from is null then
    raise exception 'Effective from required';
  end if;

  -- Strictly future effective boundary.
  if p_effective_from <= v_today then
    raise exception 'Effective date must be in the future';
  end if;

  select count(*) into v_paid_on_or_after
  from public.loan_schedule_entries e
  where e.loan_id = p_loan_id
    and e.status in ('paid', 'waived')
    and e.due_date >= p_effective_from;

  if v_paid_on_or_after > 0 then
    raise exception 'Effective date would rewrite historical periods';
  end if;

  select count(*) into v_unpaid_on_or_after
  from public.loan_schedule_entries e
  where e.loan_id = p_loan_id
    and e.status in ('upcoming', 'partial')
    and e.due_date >= p_effective_from;

  if v_unpaid_on_or_after = 0 then
    raise exception 'Effective date must align to an unpaid period';
  end if;

  select count(*) into v_before_count
  from public.loan_schedule_entries e
  where e.loan_id = p_loan_id
    and e.status in ('upcoming', 'partial');

  update public.loan_interest_rate_periods
  set effective_to = p_effective_from
  where loan_id = p_loan_id
    and effective_to is null;

  select coalesce(max(sequence), 0) + 1 into v_seq
  from public.loan_interest_rate_periods
  where loan_id = p_loan_id;

  insert into public.loan_interest_rate_periods (
    household_id,
    loan_id,
    sequence,
    effective_from,
    effective_to,
    annual_rate,
    kind,
    note,
    created_by
  )
  values (
    v_loan.household_id,
    p_loan_id,
    v_seq,
    p_effective_from,
    null,
    p_new_annual_rate,
    'floating',
    nullif(trim(coalesce(p_note, '')), ''),
    v_user_id
  );

  -- Rebuild only unpaid entries (paid/waived preserved by helper).
  perform public._loan_replace_upcoming_schedule(
    p_loan_id, v_loan.household_id, coalesce(p_upcoming_schedule, '[]'::jsonb)
  );

  select count(*) into v_after_count
  from public.loan_schedule_entries e
  where e.loan_id = p_loan_id
    and e.status in ('upcoming', 'partial');

  update public.loans
  set
    annual_interest_rate = p_new_annual_rate,
    monthly_payment = coalesce(p_monthly_payment, monthly_payment),
    total_interest = coalesce(p_total_interest, total_interest),
    total_repayment = coalesce(p_total_repayment, total_repayment),
    expected_end_date = coalesce(p_expected_end_date, expected_end_date),
    next_payment_date = coalesce(p_next_payment_date, next_payment_date),
    updated_at = timezone('utc', now())
  where id = p_loan_id;

  return jsonb_build_object(
    'ok', true,
    'loanId', p_loan_id,
    'effectiveFrom', p_effective_from,
    'newRate', p_new_annual_rate,
    'futureEntriesBefore', v_before_count,
    'futureEntriesAfter', v_after_count,
    'historicalUnchanged', true
  );
end;
$function$;
CREATE OR REPLACE FUNCTION public.savings_early_withdrawal_breakdown(p_cycle_id uuid, p_as_of_date date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_cycle public.saving_cycles%rowtype;
  v_saving public.savings%rowtype;
  v_package jsonb;
  v_method text;
  v_rule text;
  v_strategy text;
  v_rate numeric;
  v_demand_rate numeric;
  v_fixed_amount numeric;
  v_gross_interest numeric;
  v_eligible_interest numeric := 0;
  v_penalty numeric := 0;
  v_tax numeric := 0;
  v_tax_rule text;
  v_tax_rate numeric := 0;
  v_days integer;
  v_total_days integer;
begin
  select * into v_cycle
  from public.saving_cycles
  where id = p_cycle_id;
  if not found then raise exception 'Cycle not found'; end if;

  select * into v_saving
  from public.savings
  where id = v_cycle.saving_id;
  if not found or not public.is_household_member(v_saving.household_id) then
    raise exception 'Forbidden';
  end if;

  v_package := coalesce(v_cycle.package_snapshot, '{}'::jsonb);
  v_method := coalesce(
    v_package->>'interestCalculationMethod',
    v_saving.product_snapshot->>'interestCalculationMethod',
    'simple'
  );
  v_days := greatest(coalesce(p_as_of_date, timezone('utc', now())::date) - v_cycle.start_date, 0);
  v_total_days := greatest(v_cycle.end_date - v_cycle.start_date, 0);
  v_gross_interest := public.savings_calculate_interest(
    v_cycle.principal,
    v_cycle.locked_rate,
    v_cycle.start_date,
    v_cycle.end_date,
    v_method,
    coalesce(p_as_of_date, timezone('utc', now())::date)
  );

  v_rule := upper(coalesce(
    v_package->>'earlySettlementRule',
    v_saving.product_snapshot->>'earlySettlementRule',
    'RETURN_PRINCIPAL_ONLY'
  ));

  if v_rule = 'NOT_ALLOWED' then
    raise exception 'Early settlement is not allowed';
  elsif v_rule = 'CUSTOM_RATE' then
    v_rate := nullif(coalesce(
      v_package->>'earlySettlementRatePercent',
      v_saving.product_snapshot->>'earlySettlementRatePercent'
    ), '')::numeric;
    if v_rate is null then
      raise exception 'Early settlement rate unavailable';
    end if;
    v_eligible_interest := floor(v_cycle.principal * v_rate * v_days / 100 / 365);
    v_penalty := greatest(v_gross_interest - v_eligible_interest, 0);
    v_strategy := 'custom_rate';
  elsif v_rule in ('RETURN_PRINCIPAL_ONLY', 'PENALTY', 'CUSTOM') then
    v_strategy := lower(coalesce(
      v_package->'penaltyRules'->0->>'strategy',
      'no_interest'
    ));
    case v_strategy
      when 'no_interest' then
        v_eligible_interest := 0;
        v_penalty := v_gross_interest;
      when 'demand_interest' then
        v_demand_rate := nullif(v_package->'penaltyRules'->0->>'demandRate', '')::numeric;
        if v_demand_rate is null then
          raise exception 'Early settlement demand rate unavailable';
        end if;
        v_eligible_interest := floor(v_cycle.principal * v_demand_rate * v_days / 100 / 365);
        v_penalty := greatest(v_gross_interest - v_eligible_interest, 0);
      when 'fixed_penalty' then
        v_fixed_amount := nullif(v_package->'penaltyRules'->0->>'fixedAmount', '')::numeric;
        if v_fixed_amount is null then
          raise exception 'Early settlement penalty unavailable';
        end if;
        v_penalty := least(greatest(v_fixed_amount, 0), v_gross_interest);
        v_eligible_interest := greatest(v_gross_interest - v_penalty, 0);
      when 'provider_formula', 'provider_custom' then
        raise exception 'Provider early settlement quote required';
      else
        raise exception 'Early settlement penalty rule unavailable';
    end case;
  else
    raise exception 'Early settlement rule unavailable';
  end if;

  v_tax_rule := coalesce(
    v_package->>'taxRule',
    v_saving.product_snapshot->>'taxRule',
    'NONE'
  );
  v_tax_rate := greatest(coalesce(
    nullif(v_package->>'taxRatePercent', '')::numeric,
    nullif(v_saving.product_snapshot->>'taxRatePercent', '')::numeric,
    0
  ), 0);
  -- Tax is assessed on the realized gross interest; forfeited interest is
  -- represented separately as an actual Savings fee/penalty.
  v_tax := public.savings_tax_for_interest(v_gross_interest, v_tax_rule, v_tax_rate);

  return jsonb_build_object(
    'principal', v_cycle.principal,
    'grossInterest', v_gross_interest,
    'accruedInterest', v_gross_interest,
    'eligibleInterest', greatest(v_eligible_interest, 0),
    'tax', v_tax,
    'penalty', greatest(v_penalty, 0),
    'fee', greatest(v_penalty, 0),
    'netInterest', greatest(v_gross_interest - v_tax - v_penalty, 0),
    'netPayout', greatest(v_cycle.principal + v_gross_interest - v_tax - v_penalty, 0),
    'netReturned', greatest(v_cycle.principal + v_gross_interest - v_tax - v_penalty, 0),
    'penaltyAmount', greatest(v_penalty, 0),
    'penaltyStrategy', v_strategy,
    'earlySettlementRatePercent', v_rate,
    'daysHeld', v_days,
    'totalTermDays', v_total_days,
    'quoteReady', true,
    'taxRule', v_tax_rule,
    'taxRatePercent', v_tax_rate
  );
end;
$function$;
CREATE OR REPLACE FUNCTION public.create_debt(p_name text, p_counterparty text, p_direction text, p_creation_mode text, p_principal_amount numeric, p_start_date date DEFAULT NULL::date, p_due_date date DEFAULT NULL::date, p_note text DEFAULT NULL::text, p_account_id uuid DEFAULT NULL::uuid, p_idempotency_key text DEFAULT NULL::text, p_financial_scope text DEFAULT 'household'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_household_id uuid;
begin
  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = auth.uid()
  limit 1;

  if v_household_id is null then
    raise exception 'Not a household member';
  end if;

  if p_creation_mode = 'money_moved' and not exists (
    select 1
    from public.accounts a
    where a.id = p_account_id
      and a.household_id = v_household_id
      and a.is_archived = false
      and public.is_debt_movement_account_type(a.type)
  ) then
    raise exception 'Account not found or not eligible';
  end if;

  return public._create_debt_unchecked_10b(
    p_name,
    p_counterparty,
    p_direction,
    p_creation_mode,
    p_principal_amount,
    p_start_date,
    p_due_date,
    p_note,
    p_account_id,
    p_idempotency_key,
    p_financial_scope
  );
end;
$function$;
CREATE OR REPLACE FUNCTION public.create_loan_with_schedule(p_name text, p_lender text, p_loan_type text, p_principal numeric, p_annual_interest_rate numeric, p_repayment_method text, p_interest_strategy text, p_promo_fixed_rate numeric, p_promo_fixed_months integer, p_promo_floating_rate numeric, p_promo_rate_effective_on date, p_term_months integer, p_start_date date, p_first_payment_date date, p_monthly_payment numeric, p_total_interest numeric, p_total_repayment numeric, p_expected_end_date date, p_note text, p_currency character, p_schedule jsonb, p_rate_periods jsonb, p_financial_scope text DEFAULT 'household'::text, p_idempotency_key text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_household_id uuid;
  v_existing public.loans%rowtype;
  v_result jsonb;
  v_key text;
begin
  select hm.household_id
    into v_household_id
  from public.household_members hm
  where hm.user_id = auth.uid()
    and hm.is_active = true
  limit 1;
  if v_household_id is null then
    raise exception 'Not a household member';
  end if;

  v_key := nullif(trim(coalesce(p_idempotency_key, '')), '');
  if v_key is null then
    raise exception 'Idempotency key required';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(v_household_id::text || ':loan:create:' || v_key, 0)
  );

  select * into v_existing
  from public.loans l
  where l.household_id = v_household_id
    and l.idempotency_key = v_key;
  if found then
    return jsonb_build_object(
      'ok', true,
      'loanId', v_existing.id,
      'idempotentReplay', true
    );
  end if;

  v_result := public._create_loan_with_schedule_unchecked_11b(
    p_name, p_lender, p_loan_type, p_principal, p_annual_interest_rate,
    p_repayment_method, p_interest_strategy, p_promo_fixed_rate,
    p_promo_fixed_months, p_promo_floating_rate, p_promo_rate_effective_on,
    p_term_months, p_start_date, p_first_payment_date, p_monthly_payment,
    p_total_interest, p_total_repayment, p_expected_end_date, p_note,
    p_currency, p_schedule, p_rate_periods, p_financial_scope
  );

  update public.loans
  set idempotency_key = v_key
  where id = (v_result->>'loanId')::uuid
    and household_id = v_household_id;

  return v_result || jsonb_build_object('idempotentReplay', false);
end;
$function$;
CREATE OR REPLACE FUNCTION public.assert_financial_mutation(p_household_id uuid, p_financial_scope text, p_owner_membership_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if auth.uid() is not null
     and not public.can_mutate_financial_resource(
       p_household_id, p_financial_scope, p_owner_membership_id
     ) then
    raise exception 'not_allowed';
  end if;
end;
$function$;
CREATE OR REPLACE FUNCTION public.savings_is_eligible_liquid_account(p_account_id uuid, p_household_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.accounts a
    where a.id = p_account_id
      and a.household_id = p_household_id
      and a.is_archived = false
      and a.type in ('cash', 'checking', 'savings', 'ewallet', 'other')
      and public.can_mutate_financial_resource(
        a.household_id,
        a.financial_scope,
        a.owner_membership_id
      )
  );
$function$;
CREATE OR REPLACE FUNCTION public.autolock_resolve_unmapped_for_period(p_household_id uuid, p_period_month date)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_jar_id uuid;
  v_period_start date;
  v_period_end date;
  v_count integer := 0;
  v_item record;
begin
  v_user_id := auth.uid();
  -- Membership required only for interactive callers
  if v_user_id is not null and not public.is_household_member(p_household_id) then
    raise exception 'Forbidden';
  end if;

  v_period_start := date_trunc('month', p_period_month)::date;
  v_period_end := (v_period_start + interval '1 month')::date;
  v_jar_id := public.ensure_miscellaneous_jar(p_household_id);

  for v_item in
    select i.id as inbox_item_id, i.source_id
    from public.inbox_items i
    join public.transactions t
      on t.id = i.source_id
     and t.household_id = i.household_id
    where i.household_id = p_household_id
      and i.status = 'pending'
      and i.kind = 'unmapped_expense'
      and i.source_type = 'transaction'
      and t.transaction_date >= v_period_start
      and t.transaction_date < v_period_end
    for update of i
  loop
    update public.transactions t
    set jar_id = v_jar_id,
        updated_at = now()
    where t.id = v_item.source_id
      and t.household_id = p_household_id;

    update public.inbox_items i
    set status = 'auto_resolved',
        auto_resolved = true,
        resolved_jar_id = v_jar_id,
        resolved_by = v_user_id,
        resolved_at = now(),
        updated_at = now(),
        context_json = coalesce(i.context_json, '{}'::jsonb)
          || jsonb_build_object(
            'auto_resolved_by', 'MonthRitualAutolockWorker',
            'miscellaneous_jar_id', v_jar_id,
            'period_month', v_period_start
          )
    where i.id = v_item.inbox_item_id;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$function$;
CREATE OR REPLACE FUNCTION public._record_loan_payment_unchecked_11b(p_loan_id uuid, p_account_id uuid, p_mode text DEFAULT 'scheduled'::text, p_paid_at date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_loan public.loans%rowtype;
  v_account public.accounts%rowtype;
  v_entry public.loan_schedule_entries%rowtype;
  v_amount numeric;
  v_principal numeric;
  v_interest numeric;
  v_paid_at date;
  v_tx_id uuid;
  v_interest_tx_id uuid;
  v_payment_id uuid;
  v_item_id uuid;
  v_completed boolean := false;
  v_remaining numeric;
  v_next date;
begin
  v_user_id := auth.uid();
  if v_user_id is null then raise exception 'Authentication required'; end if;
  v_paid_at := coalesce(p_paid_at, timezone('Asia/Ho_Chi_Minh', now())::date);
  if coalesce(p_mode, 'scheduled') <> 'scheduled' then raise exception 'Only scheduled loan payment is allowed'; end if;
  select * into v_loan from public.loans l where l.id = p_loan_id for update;
  if not found then raise exception 'Loan not found'; end if;
  if not public.is_household_member(v_loan.household_id) then raise exception 'Not a household member'; end if;
  if v_loan.status <> 'active' or v_loan.remaining_principal <= 0 then raise exception 'Loan already completed'; end if;
  select * into v_account from public.accounts a
  where a.id = p_account_id and a.household_id = v_loan.household_id and a.is_archived = false for update;
  if not found then raise exception 'Account not found'; end if;
  if v_account.type = 'credit_card' then raise exception 'Loan payment cannot use a credit card account'; end if;
  select * into v_entry from public.loan_schedule_entries e
  where e.loan_id = p_loan_id and e.status in ('upcoming', 'partial')
  order by e.sequence limit 1 for update;
  if not found then raise exception 'No upcoming schedule entry'; end if;
  v_principal := least(v_entry.principal_due, v_loan.remaining_principal);
  v_interest := v_entry.interest_due;
  v_amount := v_principal + v_interest;
  if v_amount <= 0 then raise exception 'Invalid payment amount'; end if;

  if v_principal > 0 then
    insert into public.transactions (
      household_id, account_id, type, amount, currency, transaction_date, status, created_by
    ) values (
      v_loan.household_id, p_account_id, 'liability_payment', v_principal,
      v_loan.currency, v_paid_at, 'posted', v_user_id
    ) returning id into v_tx_id;
  end if;
  if v_interest > 0 then
    insert into public.transactions (
      household_id, account_id, type, amount, currency, transaction_date, status, created_by
    ) values (
      v_loan.household_id, p_account_id, 'loan_interest', v_interest,
      v_loan.currency, v_paid_at, 'posted', v_user_id
    ) returning id into v_interest_tx_id;
  end if;
  v_tx_id := coalesce(v_tx_id, v_interest_tx_id);

  insert into public.loan_payments (
    household_id, loan_id, account_id, transaction_id, amount,
    principal_paid, interest_paid, paid_at, created_by
  ) values (
    v_loan.household_id, p_loan_id, p_account_id, v_tx_id, v_amount,
    v_principal, v_interest, v_paid_at, v_user_id
  ) returning id into v_payment_id;
  update public.transactions set loan_payment_id = v_payment_id
  where id in (v_tx_id, v_interest_tx_id);

  v_remaining := greatest(0, v_loan.remaining_principal - v_principal);
  v_completed := v_remaining <= 0;
  update public.loan_schedule_entries
  set status = 'paid', paid_at = v_paid_at, loan_payment_id = v_payment_id, updated_at = timezone('utc', now())
  where id = v_entry.id;
  select e.due_date into v_next from public.loan_schedule_entries e
  where e.loan_id = p_loan_id and e.status = 'upcoming' order by e.sequence limit 1;
  update public.loans
  set remaining_principal = v_remaining,
      status = case when v_completed then 'completed' else 'active' end,
      next_payment_date = case when v_completed then null else v_next end,
      updated_at = timezone('utc', now())
  where id = p_loan_id;
  if v_completed then
    v_item_id := (
      select (public.produce_inbox_item(
        p_household_id => v_loan.household_id,
        p_kind => 'emi_complete',
        p_source_type => 'guided',
        p_source_id => p_loan_id,
        p_amount => v_loan.monthly_payment,
        p_currency => v_loan.currency,
        p_title => v_loan.name,
        p_context => jsonb_build_object('flow', 'loan_complete', 'loanId', p_loan_id, 'principal', v_loan.principal)
      ))->>'inbox_item_id'
    )::uuid;
  end if;
  return jsonb_build_object(
    'ok', true, 'paymentId', v_payment_id, 'transactionId', v_tx_id,
    'interestTransactionId', v_interest_tx_id, 'remainingPrincipal', v_remaining,
    'completed', v_completed, 'inboxItemId', v_item_id, 'amount', v_amount,
    'principalPaid', v_principal, 'interestPaid', v_interest, 'feePaid', 0,
    'sourceDelta', -v_amount, 'scheduleEntryId', v_entry.id
  );
end;
$function$;
CREATE OR REPLACE FUNCTION public.detect_matured_savings(p_household_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_cycle record;
  v_days int;
  v_accrued numeric;
  v_prev_rate numeric;
  v_provider_name text;
  v_item_id uuid;
  v_count int := 0;
  v_currency text;
  v_suggested text;
  v_confidence numeric;
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
      s.settlement_account_id,
      s.household_id
    from public.saving_cycles sc
    join public.savings s on s.id = sc.saving_id
    where s.household_id = p_household_id
      and sc.status = 'active'
      and sc.end_date <= (timezone('utc', now()))::date
    for update of sc
  loop
    v_days := greatest((v_cycle.end_date - v_cycle.start_date), 0);
    v_accrued := public.savings_calculate_interest(v_cycle.principal, v_cycle.locked_rate, v_cycle.start_date, v_cycle.end_date, coalesce(v_cycle.package_snapshot->>'interestCalculationMethod', v_cycle.product_snapshot->>'interestCalculationMethod', 'simple'), v_cycle.end_date);

    update public.saving_cycles
    set status = 'matured', accrued_interest = v_accrued
    where id = v_cycle.id;

    update public.savings
    set status = 'matured', updated_at = timezone('utc', now())
    where id = v_cycle.saving_id;

    select sc2.locked_rate into v_prev_rate
    from public.saving_cycles sc2
    where sc2.saving_id = v_cycle.saving_id
      and sc2.cycle_number = v_cycle.cycle_number - 1
    limit 1;

    select sp.display_name into v_provider_name
    from public.saving_providers sp
    where sp.id = v_cycle.provider_id;

    v_suggested := case v_cycle.renewal_policy
      when 'always_ask' then 'none'
      when 'use_saved_preference' then
        case when coalesce(v_cycle.renewal_config->>'preferredSettlementRule', '') = 'withdraw_everything'
          then 'withdraw'
          else 'confirm_configured'
        end
      when 'auto_renew_until_cancelled' then 'confirm_configured'
      when 'one_time_renewal' then 'confirm_configured'
      else 'none'
    end;

    v_confidence := case v_cycle.renewal_policy
      when 'always_ask' then 0
      when 'use_saved_preference' then 0.7
      when 'auto_renew_until_cancelled' then 0.9
      when 'one_time_renewal' then 0.85
      else 0
    end;

    perform public.produce_inbox_item(
      p_household_id => p_household_id,
      p_kind => 'savings_maturity',
      p_source_type => 'guided',
      p_source_id => v_cycle.saving_id,
      p_amount => v_cycle.principal + v_accrued,
      p_currency => v_currency,
      p_title => coalesce(v_cycle.product_name, 'Saving') || ' — Matured',
      p_context => jsonb_build_object(
        'flow', 'savings_maturity',
        'savingId', v_cycle.saving_id,
        'cycleId', v_cycle.id,
        'providerId', v_cycle.provider_id,
        'providerName', coalesce(v_provider_name, ''),
        'currentPackage', v_cycle.package_snapshot->>'packageName',
        'currentRate', v_cycle.locked_rate,
        'previousRate', v_prev_rate,
        'rateDifference', case
          when v_prev_rate is not null then v_cycle.locked_rate - v_prev_rate
          else 0
        end,
        'principal', v_cycle.principal,
        'accruedInterest', v_accrued,
        'estimatedInterest', v_accrued,
        'maturityDate', v_cycle.end_date,
        'configuredRenewalPreference', v_cycle.renewal_policy,
        'renewalPolicy', v_cycle.renewal_policy,
        'renewalConfig', coalesce(v_cycle.renewal_config, '{}'::jsonb),
        'settlementRule', coalesce(
          v_cycle.renewal_config->>'preferredSettlementRule',
          v_cycle.product_snapshot->>'settlementRule'
        ),
        'settlementAccountId', coalesce(
          nullif(v_cycle.renewal_config->>'preferredSettlementAccountId', ''),
          v_cycle.settlement_account_id::text
        ),
        'recommendedPackages', '[]'::jsonb,
        'suggestedAction', v_suggested,
        'renewalConfidence', v_confidence,
        'warnings', '[]'::jsonb,
        'preselectedPackageId', v_cycle.renewal_config->>'preferredPackageId',
        'preselectedSettlementRule', coalesce(
          v_cycle.renewal_config->>'preferredSettlementRule',
          v_cycle.product_snapshot->>'settlementRule'
        ),
        'preselectedSettlementAccountId', coalesce(
          nullif(v_cycle.renewal_config->>'preferredSettlementAccountId', ''),
          v_cycle.settlement_account_id::text
        )
      )
    );

    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('ok', true, 'maturedCount', v_count);
end;
$function$;
CREATE OR REPLACE FUNCTION public.enqueue_savings_maturity_cascade(p_household_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_cycle record;
  v_days_left int;
  v_cascade_day int;
  v_currency text;
  v_count int := 0;
  v_provider_name text;
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
      s.settlement_account_id
    from public.saving_cycles sc
    join public.savings s on s.id = sc.saving_id
    where s.household_id = p_household_id
      and sc.status = 'active'
      and sc.end_date > (timezone('utc', now()))::date
  loop
    v_days_left := (v_cycle.end_date - (timezone('utc', now()))::date);

    if v_days_left in (30, 14, 7, 3, 1) then
      v_cascade_day := v_days_left;
    else
      continue;
    end if;

    select sp.display_name into v_provider_name
    from public.saving_providers sp
    where sp.id = v_cycle.provider_id;

    perform public.produce_inbox_item(
      p_household_id => p_household_id,
      p_kind => 'savings_maturity',
      p_source_type => 'guided',
      p_source_id => v_cycle.saving_id,
      p_amount => v_cycle.principal,
      p_currency => v_currency,
      p_title => coalesce(v_cycle.product_name, 'Saving')
        || ' — Matures in '
        || v_cascade_day
        || ' days',
      p_context => jsonb_build_object(
        'flow', 'savings_maturity_cascade',
        'savingId', v_cycle.saving_id,
        'cycleId', v_cycle.id,
        'cascadeDay', v_cascade_day,
        'providerName', coalesce(v_provider_name, ''),
        'currentPackage', v_cycle.package_snapshot->>'packageName',
        'currentRate', v_cycle.locked_rate,
        'previousRate', null,
        'rateDifference', 0,
        'principal', v_cycle.principal,
        'accruedInterest', coalesce(v_cycle.accrued_interest, 0),
        'estimatedInterest', coalesce(v_cycle.accrued_interest, 0),
        'maturityDate', v_cycle.end_date,
        'configuredRenewalPreference', v_cycle.renewal_policy,
        'renewalPolicy', v_cycle.renewal_policy,
        'renewalConfig', coalesce(v_cycle.renewal_config, '{}'::jsonb),
        'settlementRule', v_cycle.product_snapshot->>'settlementRule',
        'settlementAccountId', v_cycle.settlement_account_id,
        'recommendedPackages', '[]'::jsonb,
        'suggestedAction', 'none',
        'renewalConfidence', 0,
        'warnings', '[]'::jsonb
      )
    );

    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('ok', true, 'cascadeCount', v_count);
end;
$function$;
CREATE OR REPLACE FUNCTION public.reallocate_jar_capacity(p_source_jar_id uuid, p_target_jar_id uuid, p_amount numeric, p_is_emergency boolean DEFAULT false, p_intent_note text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_household_id uuid;
  v_period date;
  v_timezone text;
  v_source_snapshot public.jar_period_rule_snapshots%rowtype;
  v_target_snapshot public.jar_period_rule_snapshots%rowtype;
  v_source_adjustment numeric := 0;
  v_source_spent numeric := 0;
  v_source_remaining numeric := 0;
  v_movement_id uuid;
  v_note text := nullif(trim(coalesce(p_intent_note, '')), '');
  v_is_emergency boolean := coalesce(p_is_emergency, false);
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_amount is null or p_amount <= 0 or p_amount <> trunc(p_amount) then
    raise exception 'Amount must be a positive whole number';
  end if;
  if p_source_jar_id is null or p_target_jar_id is null or p_source_jar_id = p_target_jar_id then
    raise exception 'Distinct source and target jars required';
  end if;
  if v_is_emergency and v_note is null then
    raise exception 'Emergency intent note required';
  end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id and hm.is_active = true
  order by hm.household_id
  limit 1;
  if v_household_id is null then raise exception 'Active household membership required'; end if;

  select coalesce(h.timezone, 'Asia/Ho_Chi_Minh') into v_timezone
  from public.households h where h.id = v_household_id;
  v_period := to_char(timezone(v_timezone, now()), 'YYYY-MM-01')::date;

  if p_source_jar_id < p_target_jar_id then
    perform 1 from public.jars where id = p_source_jar_id and household_id = v_household_id for update;
    perform 1 from public.jars where id = p_target_jar_id and household_id = v_household_id for update;
  else
    perform 1 from public.jars where id = p_target_jar_id and household_id = v_household_id for update;
    perform 1 from public.jars where id = p_source_jar_id and household_id = v_household_id for update;
  end if;

  if not exists (
    select 1 from public.jars
    where id = p_source_jar_id and household_id = v_household_id
      and is_archived = false and coalesce(is_paused, false) = false
  ) then raise exception 'Invalid source jar'; end if;
  if not exists (
    select 1 from public.jars
    where id = p_target_jar_id and household_id = v_household_id
      and is_archived = false and coalesce(is_paused, false) = false
  ) then raise exception 'Invalid target jar'; end if;

  select * into v_source_snapshot
  from public.jar_period_rule_snapshots
  where household_id = v_household_id and jar_id = p_source_jar_id and period_month = v_period
  for update;
  select * into v_target_snapshot
  from public.jar_period_rule_snapshots
  where household_id = v_household_id and jar_id = p_target_jar_id and period_month = v_period
  for update;
  if not found or v_source_snapshot.id is null or v_target_snapshot.id is null then
    raise exception 'Jar budget snapshot required';
  end if;

  select coalesce(sum(a.amount), 0) into v_source_adjustment
  from public.jar_period_adjustments a
  where a.household_id = v_household_id and a.jar_id = p_source_jar_id and a.period_month = v_period;

  select coalesce(sum(case
    when t.status = 'reversed' then 0
    when coalesce(t.is_reversal, false) or t.reverses_transaction_id is not null then
      case when t.type in ('income', 'expense', 'investment_buy', 'investment_fee', 'liability_payment') then -t.amount else 0 end
    when t.type in ('expense', 'investment_buy', 'investment_fee') then t.amount
    when t.type = 'liability_payment' and exists (
      select 1 from public.loan_payments lp where lp.transaction_id = t.id
    ) then t.amount
    when t.type in ('transfer_out', 'transfer_in')
      and upper(coalesce(t.savings_event_kind, '')) like '%PLACEMENT%' then t.amount
    else 0
  end), 0) into v_source_spent
  from public.transactions t
  where t.household_id = v_household_id and t.jar_id = p_source_jar_id
    and t.transaction_date >= v_period
    and t.transaction_date < (v_period + interval '1 month')::date;

  v_source_remaining := greatest(0,
    v_source_snapshot.rule_budget
    + v_source_snapshot.rollover_credit
    + v_source_adjustment
    - v_source_spent
  );
  if p_amount > v_source_remaining then
    raise exception 'ERR_INSUFFICIENT_REALLOCATABLE_BUDGET';
  end if;

  insert into public.plan_movements (
    household_id, source_jar_id, target_jar_id, amount, is_emergency,
    intent_note, executed_by_user_id, ledger_impact, period_month, reason
  ) values (
    v_household_id, p_source_jar_id, p_target_jar_id, p_amount, v_is_emergency,
    v_note, v_user_id, 0, v_period, v_note
  ) returning id into v_movement_id;

  insert into public.jar_period_adjustments (
    household_id, jar_id, period_month, amount, plan_movement_id, note, created_by
  ) values
    (v_household_id, p_source_jar_id, v_period, -p_amount, v_movement_id, 'reallocate_out', v_user_id),
    (v_household_id, p_target_jar_id, v_period, p_amount, v_movement_id, 'reallocate_in', v_user_id);

  -- BR-13: partner-visible emergency attention via the Inbox gateway.
  -- One item per active partner (other than the declarer); a solo household
  -- keeps one declarer-visible audit item.
  if v_is_emergency then
    declare
      v_partner record;
      v_partner_count int := 0;
      v_emergency_id uuid;
    begin
      for v_partner in
        select hm.user_id
        from public.household_members hm
        where hm.household_id = v_household_id
          and hm.is_active = true
          and hm.user_id <> v_user_id
      loop
        select (public.produce_inbox_item(
          p_household_id => v_household_id,
          p_kind => 'emergency_declaration',
          p_source_type => 'plan_movement',
          p_source_id => v_movement_id,
          p_amount => p_amount,
          p_currency => (select base_currency from public.households where id = v_household_id),
          p_title => 'Emergency reallocation declared',
          p_assigned_to_user_id => v_partner.user_id,
          p_context => jsonb_build_object(
            'event', 'EmergencyDeclaredEvent',
            'intentNote', v_note,
            'sourceJarId', p_source_jar_id,
            'targetJarId', p_target_jar_id,
            'executedByUserId', v_user_id,
            'priority', 'high'
          )
        ))->>'inbox_item_id' into v_emergency_id;
        v_partner_count := v_partner_count + 1;
      end loop;

      if v_partner_count = 0 then
        select (public.produce_inbox_item(
          p_household_id => v_household_id,
          p_kind => 'emergency_declaration',
          p_source_type => 'plan_movement',
          p_source_id => v_movement_id,
          p_amount => p_amount,
          p_currency => (select base_currency from public.households where id = v_household_id),
          p_title => 'Emergency reallocation declared',
          p_assigned_to_user_id => v_user_id,
          p_context => jsonb_build_object(
            'event', 'EmergencyDeclaredEvent',
            'intentNote', v_note,
            'sourceJarId', p_source_jar_id,
            'targetJarId', p_target_jar_id,
            'executedByUserId', v_user_id,
            'priority', 'high',
            'soloAudit', true
          )
        ))->>'inbox_item_id' into v_emergency_id;
      end if;
    end;
  end if;

  return jsonb_build_object(
    'plan_movement_id', v_movement_id,
    'source_jar_id', p_source_jar_id,
    'target_jar_id', p_target_jar_id,
    'amount', p_amount,
    'period_month', v_period,
    'is_emergency', v_is_emergency,
    'inbox_item_id', v_movement_id,
    'ledger_transactions_created', 0,
    'ledger_impact', 0
  );
end;
$function$;
CREATE OR REPLACE FUNCTION public.record_transaction(p_account_id uuid, p_type text, p_amount numeric, p_transaction_date date DEFAULT (timezone('utc'::text, now()))::date, p_note text DEFAULT NULL::text, p_category_id uuid DEFAULT NULL::uuid, p_jar_id uuid DEFAULT NULL::uuid, p_idempotency_key text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_household_id uuid;
  v_currency char(3);
  v_income_mode text;
  v_existing_id uuid;
  v_tx_id uuid;
  v_inbox_id uuid;
  v_jar_ok boolean;
  v_category_ok boolean;
  v_title text;
  v_jar_id uuid;
  v_category_jar uuid;
  v_status text;
  v_category_name text;
  v_account_name text;
  v_note text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_type not in ('income', 'expense') then
    raise exception 'Invalid transaction type';
  end if;

  if p_amount is null or p_amount <= 0 or p_amount <> trunc(p_amount) then
    raise exception 'Amount must be a positive whole number';
  end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id
    and hm.is_active = true
  limit 1;

  if v_household_id is null then
    raise exception 'Active household membership required';
  end if;

  if p_idempotency_key is not null and length(trim(p_idempotency_key)) > 0 then
    select t.id into v_existing_id
    from public.transactions t
    where t.household_id = v_household_id
      and t.idempotency_key = trim(p_idempotency_key)
    limit 1;

    if v_existing_id is not null then
      select i.id into v_inbox_id
      from public.inbox_items i
      where i.household_id = v_household_id
        and i.source_type = 'transaction'
        and i.source_id = v_existing_id
        and i.status = 'pending'
      limit 1;

      return jsonb_build_object(
        'transaction_id', v_existing_id,
        'inbox_item_id', v_inbox_id,
        'idempotent', true
      );
    end if;
  end if;

  select a.name into v_account_name
  from public.accounts a
  where a.id = p_account_id
    and a.household_id = v_household_id
    and a.is_archived = false;

  if v_account_name is null then
    raise exception 'Account not found';
  end if;

  select h.base_currency, h.income_allocate_mode
  into v_currency, v_income_mode
  from public.households h
  where h.id = v_household_id;

  v_jar_id := p_jar_id;
  v_category_jar := null;
  v_category_name := null;
  v_note := nullif(trim(coalesce(p_note, '')), '');

  if p_category_id is not null then
    select exists (
      select 1
      from public.categories c
      where c.id = p_category_id
        and c.is_active = true
        and c.kind = p_type
        and (c.household_id is null or c.household_id = v_household_id)
    ) into v_category_ok;

    if not v_category_ok then
      raise exception 'Invalid category tag';
    end if;

    select c.jar_id, c.name into v_category_jar, v_category_name
    from public.categories c
    where c.id = p_category_id;

    if v_jar_id is null and v_category_jar is not null then
      v_jar_id := v_category_jar;
    end if;
  end if;

  if v_jar_id is not null then
    select exists (
      select 1
      from public.jars j
      where j.id = v_jar_id
        and j.household_id = v_household_id
        and j.is_archived = false
    ) into v_jar_ok;

    if not v_jar_ok then
      raise exception 'Invalid jar';
    end if;
  end if;

  v_status := case
    when p_type = 'expense' and v_jar_id is null then 'pending_mapping'
    else 'posted'
  end;

  insert into public.transactions (
    household_id,
    account_id,
    type,
    amount,
    currency,
    transaction_date,
    note,
    category_id,
    jar_id,
    status,
    created_by,
    idempotency_key
  )
  values (
    v_household_id,
    p_account_id,
    p_type,
    p_amount,
    coalesce(v_currency, 'VND'),
    coalesce(p_transaction_date, (timezone('utc', now()))::date),
    v_note,
    p_category_id,
    v_jar_id,
    v_status,
    v_user_id,
    nullif(trim(coalesce(p_idempotency_key, '')), '')
  )
  returning id into v_tx_id;

  if p_type = 'expense' and v_jar_id is null then
    v_title := coalesce(v_note, nullif(trim(coalesce(v_category_name, '')), ''), 'Unmapped expense');
    v_inbox_id := (
      select (public.produce_inbox_item(
        p_household_id => v_household_id,
        p_kind => 'unmapped_expense',
        p_source_type => 'transaction',
        p_source_id => v_tx_id,
        p_amount => p_amount,
        p_currency => coalesce(v_currency, 'VND'),
        p_title => v_title,
        p_suggested_category_id => p_category_id,
        p_context => jsonb_build_object(
          'reason', 'unmapped_expense',
          'category_id', p_category_id,
          'category_name', v_category_name,
          'account_id', p_account_id,
          'account_name', v_account_name,
          'note', v_note
        )
      ))->>'inbox_item_id'
    )::uuid;
  end if;

  if p_type = 'income'
     and v_jar_id is null
     and coalesce(v_income_mode, 'suggest') in ('suggest', 'auto')
  then
    v_title := coalesce(v_note, nullif(trim(coalesce(v_category_name, '')), ''), 'Place income');
    v_inbox_id := (
      select (public.produce_inbox_item(
        p_household_id => v_household_id,
        p_kind => 'income_suggest',
        p_source_type => 'transaction',
        p_source_id => v_tx_id,
        p_amount => p_amount,
        p_currency => coalesce(v_currency, 'VND'),
        p_title => v_title,
        p_suggested_category_id => p_category_id,
        p_context => jsonb_build_object(
          'reason', 'income_suggest',
          'income_allocate_mode', v_income_mode,
          'category_id', p_category_id,
          'category_name', v_category_name,
          'account_id', p_account_id,
          'account_name', v_account_name,
          'note', v_note
        )
      ))->>'inbox_item_id'
    )::uuid;
  end if;

  return jsonb_build_object(
    'transaction_id', v_tx_id,
    'inbox_item_id', v_inbox_id,
    'idempotent', false
  );
end;
$function$;
CREATE OR REPLACE FUNCTION public.sync_loan_debt_attention_inbox()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_household_id uuid;
  v_today date := (timezone('utc', now()))::date;
  v_days integer;
  v_state text;
  v_refreshed integer := 0;
  v_archived integer := 0;
  r record;
begin
  select household_id into v_household_id
  from public.household_members
  where user_id = auth.uid() and is_active = true
  limit 1;
  if v_household_id is null then raise exception 'Active household membership required'; end if;

  for r in
    select id, monthly_payment as amount,
           currency, next_payment_date
    from public.loans
    where household_id = v_household_id
      and status = 'active'
      and remaining_principal > 0
      and next_payment_date is not null
      and next_payment_date <= v_today + 7
  loop
    v_days := r.next_payment_date - v_today;
    v_state := case when v_days < 0 then 'overdue'
      when v_days = 0 then 'due_today' else 'due_soon' end;
    perform public.produce_inbox_item(
      v_household_id, 'loan_payment_attention', 'guided', r.id, r.amount,
      r.currency, 'Loan payment attention',
      jsonb_build_object('loanId', r.id, 'dueState', v_state, 'dueDate', r.next_payment_date),
      null, null, null, null, 'loan-payment-attention'
    );
    v_refreshed := v_refreshed + 1;
  end loop;

  for r in
    select id, remaining_amount as amount, currency, due_date
    from public.liabilities
    where household_id = v_household_id
      and status = 'active'
      and remaining_amount > 0
      and due_date is not null
      and due_date <= v_today + 7
  loop
    v_days := r.due_date - v_today;
    v_state := case when v_days < 0 then 'overdue'
      when v_days = 0 then 'due_today' else 'due_soon' end;
    perform public.produce_inbox_item(
      v_household_id, 'debt_payment_attention', 'guided', r.id, r.amount,
      r.currency, 'Debt payment attention',
      jsonb_build_object('debtId', r.id, 'dueState', v_state, 'dueDate', r.due_date),
      null, null, null, null, 'debt-payment-attention'
    );
    v_refreshed := v_refreshed + 1;
  end loop;

  update public.inbox_items i
  set status = 'archived', updated_at = timezone('utc', now()),
      context_json = coalesce(i.context_json, '{}'::jsonb)
        || jsonb_build_object('resolved_by_source_condition', true)
  where i.household_id = v_household_id
    and i.status = 'pending'
    and i.kind in ('loan_payment_attention', 'debt_payment_attention')
    and not exists (
      select 1 from public.loans l
      where i.kind = 'loan_payment_attention' and l.id = i.source_id
        and l.household_id = v_household_id and l.status = 'active'
        and l.remaining_principal > 0 and l.next_payment_date is not null
        and l.next_payment_date <= v_today + 7
    )
    and not exists (
      select 1 from public.liabilities d
      where i.kind = 'debt_payment_attention' and d.id = i.source_id
        and d.household_id = v_household_id and d.status = 'active'
        and d.remaining_amount > 0 and d.due_date is not null
        and d.due_date <= v_today + 7
    );
  get diagnostics v_archived = row_count;
  return jsonb_build_object('refreshed_count', v_refreshed, 'archived_count', v_archived);
end;
$function$;
CREATE OR REPLACE FUNCTION public.auto_resolve_inbox_item(p_inbox_item_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_item public.inbox_items%rowtype;
  v_jar_id uuid;
  v_threshold numeric := 0.900;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select * into v_item
  from public.inbox_items i
  where i.id = p_inbox_item_id
  for update;

  if not found then
    raise exception 'Inbox item not found';
  end if;

  if not public.is_household_member(v_item.household_id) then
    raise exception 'Forbidden';
  end if;

  if v_item.status <> 'pending' then
    return jsonb_build_object(
      'inbox_item_id', v_item.id,
      'status', v_item.status,
      'auto_resolved', v_item.auto_resolved
    );
  end if;

  if v_item.kind not in ('unmapped_expense', 'income_suggest') then
    raise exception 'Item kind cannot be auto-resolved';
  end if;

  if v_item.confidence_score is null or v_item.confidence_score < v_threshold then
    raise exception 'Confidence below auto-resolve threshold';
  end if;

  v_jar_id := v_item.suggested_jar_id;
  if v_jar_id is null then
    raise exception 'Suggested jar required for auto-resolve';
  end if;

  perform public.resolve_inbox_item_to_jar(p_inbox_item_id, v_jar_id);

  update public.inbox_items i
  set status = 'auto_resolved',
      auto_resolved = true,
      updated_at = now()
  where i.id = v_item.id;

  return jsonb_build_object(
    'inbox_item_id', v_item.id,
    'status', 'auto_resolved',
    'auto_resolved', true,
    'jar_id', v_jar_id,
    'confidence_score', v_item.confidence_score
  );
end;
$function$;
CREATE OR REPLACE FUNCTION public.preview_early_withdraw_saving(p_cycle_id uuid, p_as_of_date date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  return public.savings_early_withdrawal_breakdown(p_cycle_id, p_as_of_date);
end;
$function$;
CREATE OR REPLACE FUNCTION public.guard_cross_resource_mutation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_row jsonb := to_jsonb(coalesce(new, old));
  v_household_id uuid;
  v_scope text;
  v_owner uuid;
  v_id uuid;
begin
  if auth.uid() is null then
    return coalesce(new, old);
  end if;

  if tg_table_name in ('loan_payments', 'loan_schedule_entries', 'loan_interest_rate_periods') then
    select household_id, financial_scope, owner_membership_id into v_household_id, v_scope, v_owner
    from public.loans where id = (v_row->>'loan_id')::uuid for update;
    if not found then raise exception 'resource_not_found'; end if;
    perform public.assert_financial_mutation(v_household_id, v_scope, v_owner);
    if tg_table_name = 'loan_payments' then
      select household_id, financial_scope, owner_membership_id into v_household_id, v_scope, v_owner
      from public.accounts where id = (v_row->>'account_id')::uuid for update;
      if not found then raise exception 'resource_not_found'; end if;
      perform public.assert_financial_mutation(v_household_id, v_scope, v_owner);
    end if;
  elsif tg_table_name = 'debt_payments' then
    select household_id, financial_scope, owner_membership_id into v_household_id, v_scope, v_owner
    from public.liabilities where id = (v_row->>'liability_id')::uuid for update;
    if not found then raise exception 'resource_not_found'; end if;
    perform public.assert_financial_mutation(v_household_id, v_scope, v_owner);
    select household_id, financial_scope, owner_membership_id into v_household_id, v_scope, v_owner
    from public.accounts where id = (v_row->>'account_id')::uuid for update;
    if not found then raise exception 'resource_not_found'; end if;
    perform public.assert_financial_mutation(v_household_id, v_scope, v_owner);
  elsif tg_table_name = 'card_payments' then
    select household_id, financial_scope, owner_membership_id into v_household_id, v_scope, v_owner
    from public.accounts where id = (v_row->>'card_account_id')::uuid for update;
    if not found then raise exception 'resource_not_found'; end if;
    perform public.assert_financial_mutation(v_household_id, v_scope, v_owner);
  elsif tg_table_name in ('card_billing_months', 'card_billing_items', 'credit_card_settings') then
    v_id := coalesce((v_row->>'card_account_id')::uuid, (v_row->>'account_id')::uuid);
    select household_id, financial_scope, owner_membership_id into v_household_id, v_scope, v_owner
    from public.accounts where id = v_id for update;
    if not found then raise exception 'resource_not_found'; end if;
    perform public.assert_financial_mutation(v_household_id, v_scope, v_owner);
  elsif tg_table_name = 'transaction_tag_assignments' then
    select a.household_id, a.financial_scope, a.owner_membership_id into v_household_id, v_scope, v_owner
    from public.transactions t join public.accounts a on a.id = t.account_id
    where t.id = (v_row->>'transaction_id')::uuid for update;
    if not found then raise exception 'resource_not_found'; end if;
    perform public.assert_financial_mutation(v_household_id, v_scope, v_owner);
  elsif tg_table_name in ('investment_valuations', 'investment_operations', 'investment_fees') then
    v_id := coalesce((v_row->>'holding_id')::uuid, (v_row->>'source_holding_id')::uuid, (v_row->>'fee_holding_id')::uuid);
    if v_id is not null then
      select household_id, financial_scope, owner_membership_id into v_household_id, v_scope, v_owner
      from public.investment_holdings where id = v_id for update;
      if not found then raise exception 'resource_not_found'; end if;
      perform public.assert_financial_mutation(v_household_id, v_scope, v_owner);
    end if;
    if tg_table_name = 'investment_fees' and v_id is null then
      select o.source_holding_id into v_id from public.investment_operations o
      where o.id = (v_row->>'operation_id')::uuid;
      if v_id is not null then
        select household_id, financial_scope, owner_membership_id into v_household_id, v_scope, v_owner
        from public.investment_holdings where id = v_id for update;
        if not found then raise exception 'resource_not_found'; end if;
        perform public.assert_financial_mutation(v_household_id, v_scope, v_owner);
      end if;
    end if;
    if tg_table_name in ('investment_operations', 'investment_fees') then
      select household_id, financial_scope, owner_membership_id into v_household_id, v_scope, v_owner
      from public.accounts where id = (v_row->>'cash_account_id')::uuid for update;
      if found then perform public.assert_financial_mutation(v_household_id, v_scope, v_owner); end if;
    end if;
    if tg_table_name = 'investment_operations' and (v_row->>'destination_holding_id') is not null then
      select household_id, financial_scope, owner_membership_id into v_household_id, v_scope, v_owner
      from public.investment_holdings where id = (v_row->>'destination_holding_id')::uuid for update;
      if not found then raise exception 'resource_not_found'; end if;
      perform public.assert_financial_mutation(v_household_id, v_scope, v_owner);
    end if;
  elsif tg_table_name in ('goal_contributions', 'goal_period_funded_snapshots') then
    select household_id, financial_scope, owner_membership_id into v_household_id, v_scope, v_owner
    from public.goals where id = (v_row->>'goal_id')::uuid for update;
    if not found then raise exception 'resource_not_found'; end if;
    perform public.assert_financial_mutation(v_household_id, v_scope, v_owner);
  elsif tg_table_name = 'saving_cycles' or tg_table_name = 'early_withdrawals' then
    v_id := coalesce((v_row->>'saving_id')::uuid, (v_row->>'saving_id')::uuid);
    select household_id, financial_scope, owner_membership_id into v_household_id, v_scope, v_owner
    from public.savings where id = v_id for update;
    if not found then raise exception 'resource_not_found'; end if;
    perform public.assert_financial_mutation(v_household_id, v_scope, v_owner);
  end if;
  return coalesce(new, old);
end;
$function$;
CREATE OR REPLACE FUNCTION public.guard_financial_root_mutation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_old jsonb := to_jsonb(old);
  v_new jsonb := to_jsonb(new);
  v_cleanup boolean := false;
begin
  if auth.uid() is null then
    return coalesce(new, old);
  end if;

  if tg_op = 'INSERT' then
    perform public.assert_financial_mutation(
      new.household_id, new.financial_scope, new.owner_membership_id
    );
    return new;
  end if;

  if tg_table_name = 'accounts' then
    v_cleanup := coalesce((v_old->>'is_archived')::boolean, false) = false
      and coalesce((v_new->>'is_archived')::boolean, false) = true;
  elsif tg_table_name = 'liabilities' then
    v_cleanup := coalesce((v_old->>'is_archived')::boolean, false) = false
      and coalesce((v_new->>'is_archived')::boolean, false) = true;
  elsif tg_table_name = 'loans' then
    v_cleanup := (v_old->>'status') <> 'archived'
      and (v_new->>'status') = 'archived';
  elsif tg_table_name = 'savings' then
    v_cleanup := (v_old->>'status') not in ('early_closed', 'closed')
      and (v_new->>'status') in ('early_closed', 'closed');
  elsif tg_table_name = 'goals' then
    v_cleanup := (v_old->>'status') <> 'cancelled'
      and (v_new->>'status') = 'cancelled';
  end if;

  if v_cleanup and public.can_admin_cleanup(old.household_id) then
    return new;
  end if;

  perform public.assert_financial_mutation(
    old.household_id, old.financial_scope, old.owner_membership_id
  );
  return new;
end;
$function$;
CREATE OR REPLACE FUNCTION public.guard_goal_funding_link_mutation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  r record;
  v jsonb := to_jsonb(coalesce(new, old));
begin
  if auth.uid() is null then return coalesce(new, old); end if;
  select g.household_id, g.financial_scope, g.owner_membership_id into r
  from public.goals g where g.id = (v->>'goal_id')::uuid for update;
  if not found then raise exception 'resource_not_found'; end if;
  perform public.assert_financial_mutation(r.household_id, r.financial_scope, r.owner_membership_id);

  if (v->>'account_id') is not null then
    select a.household_id, a.financial_scope, a.owner_membership_id into r
    from public.accounts a where a.id = (v->>'account_id')::uuid for update;
  elsif (v->>'saving_id') is not null then
    select s.household_id, s.financial_scope, s.owner_membership_id into r
    from public.savings s where s.id = (v->>'saving_id')::uuid for update;
  elsif (v->>'holding_id') is not null then
    select h.household_id, h.financial_scope, h.owner_membership_id into r
    from public.investment_holdings h where h.id = (v->>'holding_id')::uuid for update;
  elsif (v->>'loan_id') is not null then
    select l.household_id, l.financial_scope, l.owner_membership_id into r
    from public.loans l where l.id = (v->>'loan_id')::uuid for update;
  elsif (v->>'debt_id') is not null then
    select d.household_id, d.financial_scope, d.owner_membership_id into r
    from public.liabilities d where d.id = (v->>'debt_id')::uuid for update;
  end if;
  if found then
    perform public.assert_financial_mutation(r.household_id, r.financial_scope, r.owner_membership_id);
    if r.financial_scope <> (select g.financial_scope from public.goals g where g.id = (v->>'goal_id')::uuid) then
      raise exception 'cross_scope_not_allowed';
    end if;
    if r.financial_scope = 'personal'
       and r.owner_membership_id <> (select g.owner_membership_id from public.goals g where g.id = (v->>'goal_id')::uuid) then
      raise exception 'cross_owner_transfer_not_allowed';
    end if;
  end if;
  return coalesce(new, old);
end;
$function$;
CREATE OR REPLACE FUNCTION public.guard_inbox_source_mutation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v jsonb := to_jsonb(coalesce(new, old));
  v_id uuid;
  r record;
begin
  if auth.uid() is null then return coalesce(new, old); end if;
  if tg_op = 'INSERT' then return new; end if;
  if (v->>'kind') in ('unmapped_expense', 'income_suggest') and (v->>'source_type') = 'transaction' then
    select a.household_id, a.financial_scope, a.owner_membership_id into r
    from public.transactions t join public.accounts a on a.id = t.account_id
    where t.id = (v->>'source_id')::uuid for update;
  elsif (v->>'kind') in ('savings_maturity', 'early_withdrawal_confirmation') then
    v_id := coalesce((v->'context_json'->>'savingId')::uuid, (v->>'source_id')::uuid);
    select household_id, financial_scope, owner_membership_id into r
    from public.savings where id = v_id for update;
  else
    return coalesce(new, old);
  end if;
  if not found then raise exception 'resource_not_found'; end if;
  perform public.assert_financial_mutation(r.household_id, r.financial_scope, r.owner_membership_id);
  return coalesce(new, old);
end;
$function$;
CREATE OR REPLACE FUNCTION public.guard_loan_payment_account_eligibility()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_account public.accounts%rowtype;
begin
  if auth.uid() is null then
    return new;
  end if;

  select * into v_account
  from public.accounts
  where id = new.account_id
    and household_id = new.household_id
    and is_archived = false
  for update;

  if not found then
    raise exception 'account_not_found';
  end if;

  if v_account.type not in ('cash', 'checking', 'savings', 'ewallet', 'other') then
    raise exception 'loan_payment_account_not_eligible';
  end if;

  perform public.assert_financial_mutation(
    v_account.household_id,
    v_account.financial_scope,
    v_account.owner_membership_id
  );
  return new;
end;
$function$;
CREATE OR REPLACE FUNCTION public.guard_transaction_mutation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_account public.accounts%rowtype;
begin
  if auth.uid() is null then
    return coalesce(new, old);
  end if;

  if tg_op <> 'INSERT' then
    select * into v_account from public.accounts where id = old.account_id for update;
    if not found then raise exception 'resource_not_found'; end if;
    perform public.assert_financial_mutation(
      v_account.household_id, v_account.financial_scope, v_account.owner_membership_id
    );
  end if;

  if tg_op <> 'DELETE' then
    select * into v_account from public.accounts where id = new.account_id for update;
    if not found then raise exception 'resource_not_found'; end if;
    perform public.assert_financial_mutation(
      v_account.household_id, v_account.financial_scope, v_account.owner_membership_id
    );
  end if;
  return coalesce(new, old);
end;
$function$;
CREATE OR REPLACE FUNCTION public.investment_add_holding(p_household_id uuid, p_holding_id uuid, p_quantity numeric, p_basis numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare h public.investment_holdings%rowtype; after_b numeric;
begin
  if p_quantity is null or p_quantity <= 0 or scale(p_quantity)>18 then raise exception 'Invalid quantity'; end if;
  select * into h from public.investment_holdings where id=p_holding_id and household_id=p_household_id for update;
  if not found then raise exception 'Investment holding not found'; end if;
  perform public.assert_financial_mutation(h.household_id,h.financial_scope,h.owner_membership_id);
  after_b := case when h.remaining_total_cost_basis is null then null else h.remaining_total_cost_basis+coalesce(p_basis,0) end;
  update public.investment_holdings set quantity=quantity+p_quantity,remaining_total_cost_basis=after_b,lifecycle_status='active',updated_at=now() where id=h.id;
  return jsonb_build_object('beforeQuantity',h.quantity,'afterQuantity',h.quantity+p_quantity,'beforeBasis',h.remaining_total_cost_basis,'afterBasis',after_b);
end $function$;
CREATE OR REPLACE FUNCTION public.investment_assert_account_12b(p_account_id uuid, p_household_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare a record;
begin
  select household_id, financial_scope, owner_membership_id into a
  from public.accounts where id = p_account_id and household_id = p_household_id
    and not is_archived and type not in ('credit_card','savings_product') for update;
  if not found then raise exception 'Cash account not found'; end if;
  perform public.assert_financial_mutation(a.household_id, a.financial_scope, a.owner_membership_id);
end $function$;
CREATE OR REPLACE FUNCTION public.investment_assert_holding_12b(p_holding_id uuid, p_household_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare h record;
begin
  select household_id, financial_scope, owner_membership_id into h
  from public.investment_holdings where id = p_holding_id and household_id = p_household_id for update;
  if not found then raise exception 'Investment holding not found'; end if;
  perform public.assert_financial_mutation(h.household_id, h.financial_scope, h.owner_membership_id);
end $function$;
CREATE OR REPLACE FUNCTION public.investment_consume_holding(p_household_id uuid, p_holding_id uuid, p_quantity numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare h public.investment_holdings%rowtype; l record; take numeric; consumed numeric := 0;
  after_q numeric; after_b numeric; method text;
begin
  if p_quantity is null or p_quantity <= 0 or scale(p_quantity) > 18 then raise exception 'Invalid quantity'; end if;
  select * into h from public.investment_holdings where id=p_holding_id and household_id=p_household_id for update;
  if not found then raise exception 'Investment holding not found'; end if;
  perform public.assert_financial_mutation(h.household_id,h.financial_scope,h.owner_membership_id);
  if p_quantity > h.quantity then raise exception 'Insufficient quantity'; end if;
  method := coalesce(h.accounting_method, case when h.asset_class='fund' then 'FIFO' else 'WEIGHTED_AVERAGE' end);
  if method='FIFO' and h.asset_class='fund' and h.remaining_total_cost_basis is not null then
    for l in select * from public.investment_lots where position_id=p_holding_id and remaining_quantity>0 order by acquired_at,id for update loop
      exit when consumed >= p_quantity;
      take := least(l.remaining_quantity,p_quantity-consumed);
      consumed := consumed + take;
      after_b := coalesce(after_b,0) + round(take*l.unit_cost,0);
      update public.investment_lots set remaining_quantity=remaining_quantity-take where id=l.id;
    end loop;
    if consumed < p_quantity then raise exception 'Insufficient FIFO lots'; end if;
  else
    after_b := case when h.remaining_total_cost_basis is null then null
      when p_quantity=h.quantity then h.remaining_total_cost_basis
      else round(h.remaining_total_cost_basis*p_quantity/h.quantity,0) end;
  end if;
  after_q := h.quantity-p_quantity;
  update public.investment_holdings set quantity=after_q,
    remaining_total_cost_basis=case when h.remaining_total_cost_basis is null then null else h.remaining_total_cost_basis-after_b end,
    lifecycle_status=case when after_q=0 then 'exited' else lifecycle_status end, updated_at=now() where id=h.id;
  return jsonb_build_object('beforeQuantity',h.quantity,'afterQuantity',after_q,'beforeBasis',h.remaining_total_cost_basis,
    'afterBasis',case when h.remaining_total_cost_basis is null then null else h.remaining_total_cost_basis-after_b end,
    'consumedBasis',after_b);
end $function$;
CREATE OR REPLACE FUNCTION public.record_investment_valuation(p_holding_id uuid, p_unit_price_vnd numeric, p_total_value_vnd numeric, p_valuation_date date, p_source text, p_notes text, p_idempotency_key text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare hh uuid; h public.investment_holdings%rowtype; existing uuid; v numeric; v_id uuid;
begin
  hh:=public.investment_active_household();
  select iv.id into existing from public.investment_valuations iv where iv.household_id=hh and iv.idempotency_key=p_idempotency_key;
  if found then return jsonb_build_object('operationId',existing,'holdingId',p_holding_id,'cashDelta',0,'transactionIds','[]'::jsonb,'idempotentReplay',true); end if;
  select * into h from public.investment_holdings where id=p_holding_id and household_id=hh;
  if not found then raise exception 'Investment holding not found'; end if;
  perform public.assert_financial_mutation(h.household_id,h.financial_scope,h.owner_membership_id);
  if h.asset_class='bond' then
    v:=p_total_value_vnd;
    if v is null or p_unit_price_vnd is not null then raise exception 'Invalid valuation price'; end if;
  else
    v:=round(h.quantity*p_unit_price_vnd,0);
    if p_unit_price_vnd is null or p_total_value_vnd is not null then raise exception 'Invalid valuation unit price'; end if;
  end if;
  insert into public.investment_valuations(household_id,holding_id,value_vnd,quantity,unit_price_vnd,valuation_date,source,notes,idempotency_key,created_by)
  values(hh,p_holding_id,v,h.quantity,p_unit_price_vnd,p_valuation_date,p_source,p_notes,p_idempotency_key,auth.uid())
  returning investment_valuations.id into v_id;
  return jsonb_build_object('operationId',v_id,'holdingId',p_holding_id,'cashDelta',0,'transactionIds','[]'::jsonb,'idempotentReplay',false);
end $function$;
CREATE OR REPLACE FUNCTION public.create_saving_with_transfer(p_funding_account_id uuid, p_principal numeric, p_provider_id uuid, p_product_name text, p_product_snapshot jsonb, p_renewal_preference text, p_settlement_account_id uuid, p_cycle_start_date date, p_cycle_end_date date, p_package_snapshot jsonb, p_renewal_config jsonb, p_idempotency_key text, p_financial_scope text DEFAULT 'household'::text, p_creation_mode text DEFAULT 'LIVE_DEPOSIT'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_household_id uuid;
  v_owner_membership_id uuid;
  v_saving_id uuid;
  v_cycle_id uuid;
  v_funding_tx_id uuid;
  v_receiving_tx_id uuid;
  v_transfer_group_id uuid := gen_random_uuid();
  v_currency text;
  v_policy text;
  v_existing_saving_id uuid;
  v_existing_cycle_id uuid;
  v_provider_family text;
  v_product_currency text;
  v_config jsonb := coalesce(p_renewal_config, '{}'::jsonb);
  v_instruction jsonb;
  v_scope text := lower(trim(coalesce(p_financial_scope, 'household')));
  v_mode text := upper(trim(coalesce(p_creation_mode, 'LIVE_DEPOSIT')));
  v_snapshot jsonb := coalesce(p_product_snapshot, '{}'::jsonb);
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if v_mode not in ('LIVE_DEPOSIT', 'HISTORICAL_OPENING') then
    raise exception 'Invalid Savings creation mode';
  end if;
  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id and hm.is_active = true
  limit 1;
  if v_household_id is null then raise exception 'Active household membership required'; end if;
  if v_scope not in ('household', 'personal') then raise exception 'Invalid financial scope'; end if;
  select public.active_membership_id(v_household_id) into v_owner_membership_id;
  if v_scope = 'personal' and v_owner_membership_id is null then
    raise exception 'Active household membership required';
  end if;
  if v_scope = 'household' then v_owner_membership_id := null; end if;
  if p_principal is null or p_principal <= 0 then raise exception 'Principal must be positive'; end if;
  if p_cycle_start_date is null or p_cycle_end_date is null or p_cycle_end_date <= p_cycle_start_date then
    raise exception 'Invalid Savings cycle dates';
  end if;
  if nullif(trim(p_product_name), '') is null
    or nullif(trim(v_snapshot->>'providerId'), '') is null
    or v_snapshot->>'providerId' <> p_provider_id::text
    or nullif(trim(v_snapshot->>'packageId'), '') is null
    or nullif(trim(coalesce(p_package_snapshot->>'packageId', '')), '') is null
    or nullif(trim(v_snapshot->>'interestCalculationMethod'), '') is null
  then
    raise exception 'Invalid Savings product snapshot';
  end if;
  if v_snapshot->>'interestCalculationMethod' not in ('simple', 'compound_daily', 'compound_monthly') then
    raise exception 'Invalid Savings interest method';
  end if;

  if nullif(trim(p_idempotency_key), '') is not null then
    perform pg_advisory_xact_lock(hashtextextended(
      'savings:create:' || v_household_id::text || ':' || trim(p_idempotency_key), 0
    ));
    select sc.saving_id, sc.id into v_existing_saving_id, v_existing_cycle_id
    from public.saving_cycles sc
    join public.transactions tx on tx.id = sc.funding_transaction_id
    where tx.idempotency_key = trim(p_idempotency_key) || ':out'
    limit 1;
    if v_existing_saving_id is null then
      select s.id, sc.id into v_existing_saving_id, v_existing_cycle_id
      from public.savings s
      join public.saving_cycles sc on sc.saving_id = s.id and sc.cycle_number = 1
      where s.household_id = v_household_id
        and s.product_snapshot->>'creationIdempotencyKey' = trim(p_idempotency_key)
      limit 1;
    end if;
    if v_existing_saving_id is not null then
      return jsonb_build_object('ok', true, 'savingId', v_existing_saving_id,
        'cycleId', v_existing_cycle_id, 'idempotentReplay', true);
    end if;
  end if;

  select p.family into v_provider_family
  from public.saving_providers p
  where p.id = p_provider_id and p.is_active = true
    and (p.household_id is null or public.is_household_member(p.household_id));
  if v_provider_family is null then raise exception 'Invalid or archived Savings provider'; end if;

  v_currency := public.household_base_currency(v_household_id);
  v_product_currency := coalesce(v_snapshot->>'currency', v_currency);
  if upper(v_product_currency) <> upper(v_currency) then raise exception 'Currency mismatch'; end if;
  if not public.savings_is_eligible_liquid_account(p_settlement_account_id, v_household_id) then
    raise exception 'Invalid settlement account';
  end if;

  if v_mode = 'LIVE_DEPOSIT' then
    if p_funding_account_id is null then raise exception 'Funding account is required'; end if;
    if p_funding_account_id = p_settlement_account_id then raise exception 'Funding and settlement accounts must differ'; end if;
    if not public.savings_is_eligible_liquid_account(p_funding_account_id, v_household_id) then
      raise exception 'Invalid funding account';
    end if;
  elsif p_funding_account_id is not null then
    raise exception 'Historical opening does not accept a funding account';
  end if;

  v_policy := case p_renewal_preference
    when 'manual_review' then 'always_ask'
    when 'auto_renew_same_package' then 'auto_renew_until_cancelled'
    when 'auto_renew_selected_package' then 'auto_renew_until_cancelled'
    when 'withdraw_everything' then 'use_saved_preference'
    when 'always_ask' then 'always_ask'
    when 'use_saved_preference' then 'use_saved_preference'
    when 'auto_renew_until_cancelled' then 'auto_renew_until_cancelled'
    when 'one_time_renewal' then 'one_time_renewal'
    else 'always_ask'
  end;
  v_instruction := jsonb_build_object(
    'strategy', coalesce(v_config->>'strategy', v_config->>'preferredSettlementRule', v_snapshot->>'settlementRule', 'withdraw_everything'),
    'targetMode', coalesce(v_config->>'targetMode', case when nullif(v_config->>'preferredPackageId', '') is null then 'keep_current_package' else 'select_package' end),
    'targetPackageId', coalesce(nullif(v_config->>'targetPackageId', ''), nullif(v_config->>'preferredPackageId', '')),
    'payoutAccountId', coalesce(nullif(v_config->>'payoutAccountId', ''), nullif(v_config->>'preferredSettlementAccountId', '')),
    'fallbackPolicy', coalesce(v_config->>'fallbackPolicy', 'ask_user')
  );
  v_snapshot := v_snapshot || jsonb_build_object('creationMode', v_mode,
    'creationIdempotencyKey', nullif(trim(p_idempotency_key), ''));

  if v_mode = 'LIVE_DEPOSIT' then
    insert into public.transactions (
      household_id, account_id, type, amount, currency, transaction_date, note,
      status, transfer_group_id, idempotency_key, created_by, source, savings_event_kind
    ) values (
      v_household_id, p_funding_account_id, 'transfer_out', p_principal, v_currency,
      p_cycle_start_date, 'Gửi tiết kiệm: ' || p_product_name, 'posted', v_transfer_group_id,
      nullif(trim(p_idempotency_key) || ':out', ':out'), v_user_id, 'manual', 'SAVINGS_PRINCIPAL_PLACEMENT'
    ) returning id into v_funding_tx_id;
    insert into public.transactions (
      household_id, account_id, type, amount, currency, transaction_date, note,
      status, transfer_group_id, idempotency_key, created_by, source, savings_event_kind
    ) values (
      v_household_id, public.get_or_create_savings_product_account(v_household_id), 'transfer_in', p_principal, v_currency,
      p_cycle_start_date, 'Tiền gửi tiết kiệm: ' || p_product_name, 'posted', v_transfer_group_id,
      nullif(trim(p_idempotency_key) || ':in', ':in'), v_user_id, 'manual', 'SAVINGS_PRINCIPAL_PLACEMENT'
    ) returning id into v_receiving_tx_id;
  end if;

  insert into public.savings (
    household_id, status, funding_account_id, settlement_account_id, provider_id,
    product_name, product_snapshot, renewal_policy, renewal_config, maturity_instruction,
    created_by, financial_scope, owner_membership_id
  ) values (
    v_household_id, 'active', p_funding_account_id, p_settlement_account_id, p_provider_id,
    p_product_name, v_snapshot, v_policy, v_config, v_instruction,
    v_user_id, v_scope, v_owner_membership_id
  ) returning id into v_saving_id;
  insert into public.saving_cycles (
    saving_id, cycle_number, start_date, end_date, principal, locked_rate,
    package_snapshot, status, funding_transaction_id
  ) values (
    v_saving_id, 1, p_cycle_start_date, p_cycle_end_date, p_principal,
    coalesce((v_snapshot->>'annualInterestRate')::numeric, 0),
    p_package_snapshot || jsonb_build_object('providerFamily', v_provider_family),
    'active', v_funding_tx_id
  ) returning id into v_cycle_id;
  return jsonb_build_object('ok', true, 'savingId', v_saving_id, 'cycleId', v_cycle_id,
    'fundingTransactionId', v_funding_tx_id, 'receivingTransactionId', v_receiving_tx_id,
    'transferGroupId', case when v_mode = 'LIVE_DEPOSIT' then v_transfer_group_id else null end,
    'creationMode', v_mode, 'idempotentReplay', false);
end;
$function$;
CREATE OR REPLACE FUNCTION public.create_saving_with_transfer(p_funding_account_id uuid, p_principal numeric, p_provider_id uuid, p_product_name text, p_product_snapshot jsonb, p_renewal_preference text, p_settlement_account_id uuid, p_cycle_start_date date, p_cycle_end_date date, p_package_snapshot jsonb, p_renewal_config jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select public.create_saving_with_transfer(
    p_funding_account_id, p_principal, p_provider_id, p_product_name,
    p_product_snapshot, p_renewal_preference, p_settlement_account_id,
    p_cycle_start_date, p_cycle_end_date, p_package_snapshot,
    p_renewal_config, null
  );
$function$;
CREATE OR REPLACE FUNCTION public.create_saving_with_transfer(p_funding_account_id uuid, p_principal numeric, p_provider_id uuid, p_product_name text, p_product_snapshot jsonb, p_renewal_preference text, p_settlement_account_id uuid, p_cycle_start_date date, p_cycle_end_date date, p_package_snapshot jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_household_id uuid;
  v_product_account_id uuid;
  v_saving_id uuid;
  v_cycle_id uuid;
  v_funding_tx_id uuid;
  v_receiving_tx_id uuid;
  v_today date;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id
    and hm.is_active = true
  limit 1;

  if v_household_id is null then
    raise exception 'Active household membership required';
  end if;

  if p_principal is null or p_principal <= 0 then
    raise exception 'Principal must be positive';
  end if;

  -- Verify funding account belongs to household
  if not exists (
    select 1 from public.accounts a
    where a.id = p_funding_account_id
      and a.household_id = v_household_id
      and a.is_archived = false
  ) then
    raise exception 'Invalid funding account';
  end if;

  -- Get or create internal savings_product account
  v_product_account_id := public.get_or_create_savings_product_account(v_household_id);

  v_today := (timezone('utc', now()))::date;

  -- Ledger: funding account -principal
  insert into public.transactions (
    household_id, account_id, type, amount, currency,
    transaction_date, note, status, created_by, source
  )
  values (
    v_household_id, p_funding_account_id, 'expense', p_principal, 'VND',
    v_today, 'Fund saving: ' || p_product_name, 'posted', v_user_id, 'manual'
  )
  returning id into v_funding_tx_id;

  -- Ledger: savings_product account +principal
  insert into public.transactions (
    household_id, account_id, type, amount, currency,
    transaction_date, note, status, created_by, source
  )
  values (
    v_household_id, v_product_account_id, 'income', p_principal, 'VND',
    v_today, 'Saving funded: ' || p_product_name, 'posted', v_user_id, 'manual'
  )
  returning id into v_receiving_tx_id;

  -- Create saving
  insert into public.savings (
    household_id, status, funding_account_id, settlement_account_id,
    provider_id, product_name, product_snapshot, renewal_preference, created_by
  )
  values (
    v_household_id, 'active', p_funding_account_id, p_settlement_account_id,
    p_provider_id, p_product_name, p_product_snapshot, p_renewal_preference, v_user_id
  )
  returning id into v_saving_id;

  -- Create cycle 1
  insert into public.saving_cycles (
    saving_id, cycle_number, start_date, end_date,
    principal, locked_rate, package_snapshot,
    status, funding_transaction_id
  )
  values (
    v_saving_id, 1, p_cycle_start_date, p_cycle_end_date,
    p_principal, (p_product_snapshot->>'annualInterestRate')::numeric,
    p_package_snapshot,
    'active', v_funding_tx_id
  )
  returning id into v_cycle_id;

  return jsonb_build_object(
    'ok', true,
    'savingId', v_saving_id,
    'cycleId', v_cycle_id,
    'fundingTransactionId', v_funding_tx_id
  );
end;
$function$;
CREATE OR REPLACE FUNCTION public.early_withdraw_saving(p_cycle_id uuid, p_settlement_account_id uuid DEFAULT NULL::uuid, p_idempotency_key text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_cycle public.saving_cycles%rowtype;
  v_saving public.savings%rowtype;
  v_breakdown jsonb;
  v_settlement_id uuid;
  v_product_account_id uuid;
  v_currency text;
  v_group_id uuid := gen_random_uuid();
  v_gross_interest numeric;
  v_eligible_interest numeric;
  v_tax numeric;
  v_penalty numeric;
  v_net_interest numeric;
  v_net numeric;
  v_interest_tx uuid;
  v_tax_tx uuid;
  v_fee_tx uuid;
  v_out_tx uuid;
  v_in_tx uuid;
  v_ew_id uuid;
  v_key text := nullif(trim(p_idempotency_key), '');
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  select * into v_cycle from public.saving_cycles where id = p_cycle_id for update;
  if not found then raise exception 'Cycle not found'; end if;
  if v_cycle.status <> 'active' then
    if v_cycle.status = 'early_closed' and v_cycle.settlement_result is not null and v_cycle.settlement_transaction_id is not null then
      return jsonb_build_object('ok', true, 'savingId', v_cycle.saving_id, 'cycleId', v_cycle.id,
        'netReturned', coalesce((v_cycle.settlement_result->>'netPayout')::numeric, 0),
        'settlementTransactionId', v_cycle.settlement_transaction_id, 'idempotentReplay', true);
    end if;
    raise exception 'Only active cycles can be withdrawn early';
  end if;
  select * into v_saving from public.savings where id = v_cycle.saving_id for update;
  if not found or not public.can_mutate_financial_resource(v_saving.household_id, v_saving.financial_scope, v_saving.owner_membership_id) then raise exception 'Forbidden'; end if;
  v_settlement_id := p_settlement_account_id;
  if not public.savings_is_eligible_liquid_account(v_settlement_id, v_saving.household_id) then raise exception 'Invalid settlement account'; end if;

  v_breakdown := public.savings_early_withdrawal_breakdown(v_cycle.id, timezone('utc', now())::date);
  v_gross_interest := (v_breakdown->>'grossInterest')::numeric;
  v_eligible_interest := (v_breakdown->>'eligibleInterest')::numeric;
  v_tax := (v_breakdown->>'tax')::numeric;
  v_penalty := (v_breakdown->>'penalty')::numeric;
  v_net_interest := (v_breakdown->>'netInterest')::numeric;
  v_net := (v_breakdown->>'netPayout')::numeric;
  v_product_account_id := public.get_or_create_savings_product_account(v_saving.household_id);
  v_currency := public.household_base_currency(v_saving.household_id);

  if v_gross_interest > 0 then
    insert into public.transactions (household_id, account_id, type, amount, currency, transaction_date, note, status, idempotency_key, created_by, source, savings_event_kind)
    values (v_saving.household_id, v_product_account_id, 'income', v_gross_interest, v_currency, timezone('utc', now())::date, 'Lãi rút trước hạn: ' || v_saving.product_name, 'posted', nullif(v_key || ':interest', ':interest'), v_user_id, 'manual', 'SAVINGS_INTEREST') returning id into v_interest_tx;
  end if;
  if v_tax > 0 then
    insert into public.transactions (household_id, account_id, type, amount, currency, transaction_date, note, status, idempotency_key, created_by, source, savings_event_kind)
    values (v_saving.household_id, v_product_account_id, 'expense', v_tax, v_currency, timezone('utc', now())::date, 'Thuế lãi rút trước hạn: ' || v_saving.product_name, 'posted', nullif(v_key || ':tax', ':tax'), v_user_id, 'manual', 'SAVINGS_TAX') returning id into v_tax_tx;
  end if;
  if v_penalty > 0 then
    insert into public.transactions (household_id, account_id, type, amount, currency, transaction_date, note, status, idempotency_key, created_by, source, savings_event_kind)
    values (v_saving.household_id, v_product_account_id, 'expense', v_penalty, v_currency, timezone('utc', now())::date, 'Phí/phạt rút trước hạn: ' || v_saving.product_name, 'posted', nullif(v_key || ':fee', ':fee'), v_user_id, 'manual', 'SAVINGS_FEE') returning id into v_fee_tx;
  end if;
  insert into public.transactions (household_id, account_id, type, amount, currency, transaction_date, note, status, transfer_group_id, idempotency_key, created_by, source, savings_event_kind)
  values (v_saving.household_id, v_product_account_id, 'transfer_out', v_net, v_currency, timezone('utc', now())::date, 'Rút trước hạn: ' || v_saving.product_name, 'posted', v_group_id, nullif(v_key || ':out', ':out'), v_user_id, 'manual', 'SAVINGS_PRINCIPAL_RETURN') returning id into v_out_tx;
  insert into public.transactions (household_id, account_id, type, amount, currency, transaction_date, note, status, transfer_group_id, idempotency_key, created_by, source, savings_event_kind)
  values (v_saving.household_id, v_settlement_id, 'transfer_in', v_net, v_currency, timezone('utc', now())::date, 'Nhận tiền rút trước hạn: ' || v_saving.product_name, 'posted', v_group_id, nullif(v_key || ':in', ':in'), v_user_id, 'manual', 'SAVINGS_PRINCIPAL_RETURN') returning id into v_in_tx;
  update public.saving_cycles set status = 'early_closed', accrued_interest = v_gross_interest, settlement_transaction_id = v_in_tx,
    settlement_result = v_breakdown || jsonb_build_object('action', 'withdraw', 'settledAt', timezone('utc', now()),
      'settledToAccountId', v_settlement_id, 'transferGroupId', v_group_id, 'interestTransactionId', v_interest_tx,
      'taxTransactionId', v_tax_tx, 'feeTransactionId', v_fee_tx)
  where id = v_cycle.id;
  update public.savings set status = 'early_closed', updated_at = timezone('utc', now()) where id = v_saving.id;
  insert into public.early_withdrawals (cycle_id, saving_id, principal, accrued_interest, eligible_interest, penalty_amount, net_returned, penalty_strategy, settlement_transaction_id, executed_by)
  values (v_cycle.id, v_saving.id, v_cycle.principal, v_gross_interest, v_eligible_interest, v_penalty, v_net,
    coalesce(v_breakdown->>'penaltyStrategy', 'no_interest'), v_in_tx, v_user_id)
  returning id into v_ew_id;
  return v_breakdown || jsonb_build_object('ok', true, 'savingId', v_saving.id, 'cycleId', v_cycle.id,
    'earlyWithdrawalId', v_ew_id, 'settlementTransactionId', v_in_tx, 'transferGroupId', v_group_id,
    'idempotentReplay', false);
end;
$function$;
CREATE OR REPLACE FUNCTION public.rollover_saving_cycle(p_cycle_id uuid, p_action text, p_target_package_id uuid, p_settlement_account_id uuid DEFAULT NULL::uuid, p_cycle_start_date date DEFAULT NULL::date, p_cycle_end_date date DEFAULT NULL::date, p_idempotency_key text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_cycle public.saving_cycles%rowtype;
  v_saving public.savings%rowtype;
  v_package record;
  v_product_account_id uuid;
  v_settlement_id uuid;
  v_new_cycle_id uuid;
  v_currency text;
  v_today date := timezone('utc', now())::date;
  v_start date := coalesce(p_cycle_start_date, v_today);
  v_end date;
  v_interest numeric;
  v_tax numeric;
  v_penalty numeric := 0;
  v_net_interest numeric;
  v_new_principal numeric;
  v_tax_rule text;
  v_tax_rate numeric;
  v_interest_tx uuid;
  v_tax_tx uuid;
  v_out_tx uuid;
  v_in_tx uuid;
  v_group_id uuid := gen_random_uuid();
  v_action text := lower(trim(coalesce(p_action, '')));
  v_key text := nullif(trim(p_idempotency_key), '');
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if v_action not in ('roll_principal_interest', 'roll_principal_only') then raise exception 'Invalid rollover action'; end if;
  select * into v_cycle from public.saving_cycles where id = p_cycle_id for update;
  if not found then raise exception 'Cycle not found'; end if;
  select * into v_saving from public.savings where id = v_cycle.saving_id for update;
  if not found or not public.can_mutate_financial_resource(v_saving.household_id, v_saving.financial_scope, v_saving.owner_membership_id) then raise exception 'Forbidden'; end if;
  if v_cycle.next_cycle_id is not null then
    return jsonb_build_object('ok', true, 'savingId', v_saving.id, 'previousCycleId', v_cycle.id, 'cycleId', v_cycle.next_cycle_id, 'idempotentReplay', true);
  end if;
  if v_cycle.status <> 'matured' then raise exception 'Cycle must be matured to rollover'; end if;
  if p_target_package_id is null then raise exception 'Target package is required'; end if;

  select sp.id, sp.provider_id, sp.package_name, sp.duration_days, sp.annual_interest_rate,
    sp.min_amount, sp.max_amount, sp.settlement_rules, sp.penalty_rules, sp.renewable_available,
    sp.is_active, sp.term_amount, sp.term_unit, sp.interest_calculation_method, sp.currency,
    sp.tax_rule, sp.tax_rate_percent, sp.early_settlement_rule, sp.early_settlement_rate_percent,
    sp.supports_partial_settlement, sv.display_name, sv.provider_key, sv.family
  into v_package
  from public.saving_packages sp
  join public.saving_providers sv on sv.id = sp.provider_id
  where sp.id = p_target_package_id and sp.provider_id = v_saving.provider_id
    and sp.is_active = true and sp.renewable_available = true and sv.is_active = true
    and (sv.household_id is null or public.is_household_member(sv.household_id));
  if not found then raise exception 'Target package is unavailable'; end if;
  if upper(coalesce(v_package.currency, public.household_base_currency(v_saving.household_id))) <> upper(public.household_base_currency(v_saving.household_id)) then raise exception 'Target package currency mismatch'; end if;
  if v_package.min_amount is not null and v_cycle.principal < v_package.min_amount then raise exception 'Target package minimum amount not met'; end if;
  if v_package.max_amount is not null and v_cycle.principal > v_package.max_amount then raise exception 'Target package maximum amount exceeded'; end if;
  if not (v_package.settlement_rules @> jsonb_build_array(v_action)) then raise exception 'Target package does not support this rollover'; end if;
  if v_action = 'roll_principal_only' then
    v_settlement_id := coalesce(p_settlement_account_id, nullif(v_saving.maturity_instruction->>'payoutAccountId', '')::uuid, v_saving.settlement_account_id);
    if not public.savings_is_eligible_liquid_account(v_settlement_id, v_saving.household_id) then raise exception 'Invalid settlement account'; end if;
  end if;

  v_interest := public.savings_calculate_interest(v_cycle.principal, v_cycle.locked_rate, v_cycle.start_date, v_cycle.end_date,
    coalesce(v_cycle.package_snapshot->>'interestCalculationMethod', v_saving.product_snapshot->>'interestCalculationMethod', 'simple'), v_cycle.end_date);
  v_tax_rule := coalesce(v_cycle.package_snapshot->>'taxRule', v_saving.product_snapshot->>'taxRule', 'NONE');
  v_tax_rate := greatest(coalesce(nullif(v_cycle.package_snapshot->>'taxRatePercent', '')::numeric, nullif(v_saving.product_snapshot->>'taxRatePercent', '')::numeric, 0), 0);
  v_tax := public.savings_tax_for_interest(v_interest, v_tax_rule, v_tax_rate);
  v_net_interest := greatest(v_interest - v_tax - v_penalty, 0);
  v_new_principal := case when v_action = 'roll_principal_interest' then v_cycle.principal + v_net_interest else v_cycle.principal end;
  v_end := coalesce(p_cycle_end_date, case when v_package.term_unit = 'MONTH' then (v_start + (v_package.term_amount || ' months')::interval)::date else v_start + v_package.term_amount end);
  v_product_account_id := public.get_or_create_savings_product_account(v_saving.household_id);
  v_currency := public.household_base_currency(v_saving.household_id);

  if v_interest > 0 then
    insert into public.transactions (household_id, account_id, type, amount, currency, transaction_date, note, status, idempotency_key, created_by, source, savings_event_kind)
    values (v_saving.household_id, v_product_account_id, 'income', v_interest, v_currency, v_today, 'Lãi tiết kiệm: ' || v_saving.product_name, 'posted', nullif(v_key || ':interest', ':interest'), v_user_id, 'manual', 'SAVINGS_INTEREST') returning id into v_interest_tx;
  end if;
  if v_tax > 0 then
    insert into public.transactions (household_id, account_id, type, amount, currency, transaction_date, note, status, idempotency_key, created_by, source, savings_event_kind)
    values (v_saving.household_id, v_product_account_id, 'expense', v_tax, v_currency, v_today, 'Thuế lãi tiết kiệm: ' || v_saving.product_name, 'posted', nullif(v_key || ':tax', ':tax'), v_user_id, 'manual', 'SAVINGS_TAX') returning id into v_tax_tx;
  end if;
  if v_action = 'roll_principal_only' and v_net_interest > 0 then
    insert into public.transactions (household_id, account_id, type, amount, currency, transaction_date, note, status, transfer_group_id, idempotency_key, created_by, source, savings_event_kind)
    values (v_saving.household_id, v_product_account_id, 'transfer_out', v_net_interest, v_currency, v_today, 'Nhận lãi tiết kiệm: ' || v_saving.product_name, 'posted', v_group_id, nullif(v_key || ':out', ':out'), v_user_id, 'manual', 'SAVINGS_INTEREST') returning id into v_out_tx;
    insert into public.transactions (household_id, account_id, type, amount, currency, transaction_date, note, status, transfer_group_id, idempotency_key, created_by, source, savings_event_kind)
    values (v_saving.household_id, v_settlement_id, 'transfer_in', v_net_interest, v_currency, v_today, 'Lãi tiết kiệm: ' || v_saving.product_name, 'posted', v_group_id, nullif(v_key || ':in', ':in'), v_user_id, 'manual', 'SAVINGS_INTEREST') returning id into v_in_tx;
  end if;

  insert into public.saving_cycles (saving_id, cycle_number, start_date, end_date, principal, locked_rate, package_snapshot, status, previous_cycle_id)
  values (v_saving.id, v_cycle.cycle_number + 1, v_start, v_end, v_new_principal, v_package.annual_interest_rate,
    jsonb_build_object('packageId', v_package.id, 'packageName', v_package.package_name, 'durationDays', v_package.duration_days,
      'annualInterestRate', v_package.annual_interest_rate, 'settlementRules', v_package.settlement_rules, 'penaltyRules', v_package.penalty_rules,
      'renewableAvailable', v_package.renewable_available, 'minAmount', v_package.min_amount, 'maxAmount', v_package.max_amount,
      'termAmount', v_package.term_amount, 'termUnit', v_package.term_unit, 'interestCalculationMethod', v_package.interest_calculation_method,
      'currency', v_package.currency, 'taxRule', v_package.tax_rule, 'taxRatePercent', v_package.tax_rate_percent,
      'earlySettlementRule', v_package.early_settlement_rule, 'earlySettlementRatePercent', v_package.early_settlement_rate_percent,
      'supportsPartialSettlement', v_package.supports_partial_settlement, 'providerId', v_package.provider_id, 'providerFamily', v_package.family),
    'active', v_cycle.id)
  returning id into v_new_cycle_id;

  update public.saving_cycles set status = 'rolled', next_cycle_id = v_new_cycle_id, settlement_transaction_id = v_in_tx,
    accrued_interest = v_interest,
    settlement_result = jsonb_build_object('action', v_action, 'principal', v_cycle.principal, 'principalReturned', 0,
      'grossInterest', v_interest, 'interestReturned', case when v_action = 'roll_principal_only' then v_net_interest else 0 end,
      'tax', v_tax, 'penalty', v_penalty, 'fee', v_penalty, 'netInterest', v_net_interest,
      'netPayout', case when v_action = 'roll_principal_only' then v_net_interest else 0 end,
      'netAmount', case when v_action = 'roll_principal_only' then v_net_interest else 0 end,
      'totalCashReceived', case when v_action = 'roll_principal_only' then v_net_interest else 0 end,
      'settledAt', timezone('utc', now()), 'settledToAccountId', v_settlement_id, 'interestTransactionId', v_interest_tx,
      'taxTransactionId', v_tax_tx, 'transferGroupId', v_group_id)
  where id = v_cycle.id;
  update public.savings set status = 'active', product_snapshot = v_saving.product_snapshot || jsonb_build_object(
    'packageId', v_package.id, 'packageName', v_package.package_name, 'depositTermDays', v_package.duration_days,
    'annualInterestRate', v_package.annual_interest_rate, 'providerId', v_package.provider_id,
    'providerNameSnapshot', v_package.display_name, 'providerKey', v_package.provider_key, 'currency', v_package.currency,
    'taxRule', v_package.tax_rule, 'taxRatePercent', v_package.tax_rate_percent,
    'settlementRules', v_package.settlement_rules, 'interestCalculationMethod', v_package.interest_calculation_method,
    'earlySettlementRule', v_package.early_settlement_rule, 'earlySettlementRatePercent', v_package.early_settlement_rate_percent),
    updated_at = timezone('utc', now()) where id = v_saving.id;
  return jsonb_build_object('ok', true, 'savingId', v_saving.id, 'previousCycleId', v_cycle.id, 'cycleId', v_new_cycle_id,
    'principal', v_new_principal, 'grossInterest', v_interest, 'netInterest', v_net_interest, 'tax', v_tax,
    'penalty', v_penalty, 'action', v_action, 'idempotentReplay', false);
end;
$function$;
CREATE OR REPLACE FUNCTION public.settle_saving_cycle(p_cycle_id uuid, p_settlement_account_id uuid DEFAULT NULL::uuid, p_idempotency_key text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_cycle public.saving_cycles%rowtype;
  v_saving public.savings%rowtype;
  v_settlement_id uuid;
  v_product_account_id uuid;
  v_currency text;
  v_group_id uuid := gen_random_uuid();
  v_gross_interest numeric;
  v_tax numeric;
  v_penalty numeric := 0;
  v_net_interest numeric;
  v_total numeric;
  v_tax_rule text;
  v_tax_rate numeric;
  v_out_tx uuid;
  v_in_tx uuid;
  v_interest_tx uuid;
  v_tax_tx uuid;
  v_key text := nullif(trim(p_idempotency_key), '');
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  select * into v_cycle from public.saving_cycles where id = p_cycle_id for update;
  if not found then raise exception 'Cycle not found'; end if;
  select * into v_saving from public.savings where id = v_cycle.saving_id for update;
  if not found or not public.can_mutate_financial_resource(v_saving.household_id, v_saving.financial_scope, v_saving.owner_membership_id) then raise exception 'Forbidden'; end if;
  if v_cycle.status <> 'matured' then
    if v_cycle.settlement_result is not null and v_cycle.settlement_transaction_id is not null then
      return jsonb_build_object('ok', true, 'savingId', v_saving.id, 'cycleId', v_cycle.id,
        'netAmount', coalesce((v_cycle.settlement_result->>'netPayout')::numeric, (v_cycle.settlement_result->>'netAmount')::numeric, 0),
        'settlementTransactionId', v_cycle.settlement_transaction_id, 'idempotentReplay', true);
    end if;
    raise exception 'Cycle must be matured to settle';
  end if;
  v_settlement_id := coalesce(p_settlement_account_id, v_saving.settlement_account_id);
  if not public.savings_is_eligible_liquid_account(v_settlement_id, v_saving.household_id) then raise exception 'Invalid settlement account'; end if;
  v_product_account_id := public.get_or_create_savings_product_account(v_saving.household_id);
  v_currency := public.household_base_currency(v_saving.household_id);
  v_gross_interest := public.savings_calculate_interest(
    v_cycle.principal, v_cycle.locked_rate, v_cycle.start_date, v_cycle.end_date,
    coalesce(v_cycle.package_snapshot->>'interestCalculationMethod', v_saving.product_snapshot->>'interestCalculationMethod', 'simple'),
    v_cycle.end_date
  );
  v_tax_rule := coalesce(v_cycle.package_snapshot->>'taxRule', v_saving.product_snapshot->>'taxRule', 'NONE');
  v_tax_rate := greatest(coalesce(nullif(v_cycle.package_snapshot->>'taxRatePercent', '')::numeric, nullif(v_saving.product_snapshot->>'taxRatePercent', '')::numeric, 0), 0);
  v_tax := public.savings_tax_for_interest(v_gross_interest, v_tax_rule, v_tax_rate);
  v_net_interest := greatest(v_gross_interest - v_tax - v_penalty, 0);
  v_total := v_cycle.principal + v_net_interest;

  if v_gross_interest > 0 then
    insert into public.transactions (household_id, account_id, type, amount, currency, transaction_date, note, status, idempotency_key, created_by, source, savings_event_kind)
    values (v_saving.household_id, v_product_account_id, 'income', v_gross_interest, v_currency, timezone('utc', now())::date, 'Lãi tiết kiệm: ' || v_saving.product_name, 'posted', nullif(v_key || ':interest', ':interest'), v_user_id, 'manual', 'SAVINGS_INTEREST') returning id into v_interest_tx;
  end if;
  if v_tax > 0 then
    insert into public.transactions (household_id, account_id, type, amount, currency, transaction_date, note, status, idempotency_key, created_by, source, savings_event_kind)
    values (v_saving.household_id, v_product_account_id, 'expense', v_tax, v_currency, timezone('utc', now())::date, 'Thuế lãi tiết kiệm: ' || v_saving.product_name, 'posted', nullif(v_key || ':tax', ':tax'), v_user_id, 'manual', 'SAVINGS_TAX') returning id into v_tax_tx;
  end if;
  insert into public.transactions (household_id, account_id, type, amount, currency, transaction_date, note, status, transfer_group_id, idempotency_key, created_by, source, savings_event_kind)
  values (v_saving.household_id, v_product_account_id, 'transfer_out', v_total, v_currency, timezone('utc', now())::date, 'Tất toán tiết kiệm: ' || v_saving.product_name, 'posted', v_group_id, nullif(v_key || ':out', ':out'), v_user_id, 'manual', 'SAVINGS_PRINCIPAL_RETURN') returning id into v_out_tx;
  insert into public.transactions (household_id, account_id, type, amount, currency, transaction_date, note, status, transfer_group_id, idempotency_key, created_by, source, savings_event_kind)
  values (v_saving.household_id, v_settlement_id, 'transfer_in', v_total, v_currency, timezone('utc', now())::date, 'Nhận tiền tiết kiệm: ' || v_saving.product_name, 'posted', v_group_id, nullif(v_key || ':in', ':in'), v_user_id, 'manual', 'SAVINGS_PRINCIPAL_RETURN') returning id into v_in_tx;
  update public.saving_cycles set status = 'rolled', accrued_interest = v_gross_interest, settlement_transaction_id = v_in_tx,
    settlement_result = jsonb_build_object('action', 'withdraw', 'principal', v_cycle.principal, 'principalReturned', v_cycle.principal,
      'grossInterest', v_gross_interest, 'interestReturned', v_gross_interest, 'tax', v_tax, 'penalty', v_penalty, 'fee', v_penalty,
      'netInterest', v_net_interest, 'netPayout', v_total, 'netAmount', v_total, 'totalCashReceived', v_total,
      'settledAt', timezone('utc', now()), 'settledToAccountId', v_settlement_id, 'transferGroupId', v_group_id,
      'interestTransactionId', v_interest_tx, 'taxTransactionId', v_tax_tx)
  where id = v_cycle.id;
  update public.savings set status = 'closed', updated_at = timezone('utc', now()) where id = v_saving.id;
  return jsonb_build_object('ok', true, 'savingId', v_saving.id, 'cycleId', v_cycle.id, 'netAmount', v_total,
    'netPayout', v_total, 'principal', v_cycle.principal, 'grossInterest', v_gross_interest, 'tax', v_tax,
    'penalty', v_penalty, 'fee', v_penalty, 'netInterest', v_net_interest, 'settlementTransactionId', v_in_tx,
    'transferGroupId', v_group_id, 'idempotentReplay', false);
end;
$function$;
CREATE OR REPLACE FUNCTION public.run_month_ritual_autolock_for_household(p_household_id uuid, p_today date DEFAULT (timezone('utc'::text, now()))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_locked integer := 0;
  v_resolved integer := 0;
  v_period record;
  v_run_id uuid;
  v_batch integer;
begin
  -- Existing unapproved runs past deadline
  for v_period in
    select r.id, r.period_month
    from public.month_ritual_runs r
    where r.household_id = p_household_id
      and r.status in ('draft', 'previewed', 'corrected')
      and (
        (r.period_month + interval '1 month' - interval '1 day')::date + 30
      ) <= p_today
  loop
    v_batch := public.autolock_resolve_unmapped_for_period(
      p_household_id,
      v_period.period_month
    );
    v_resolved := v_resolved + v_batch;

    update public.month_ritual_runs r
    set status = 'pending_review',
        auto_locked_at = timezone('utc', now()),
        updated_at = timezone('utc', now())
    where r.id = v_period.id;

    v_locked := v_locked + 1;
  end loop;

  -- Past calendar months due for lock with no ritual row yet (BR-08)
  for v_period in
    select gs::date as period_month
    from generate_series(
      date_trunc('month', p_today) - interval '24 months',
      date_trunc('month', p_today) - interval '1 month',
      interval '1 month'
    ) as gs
    where (
      (gs::date + interval '1 month' - interval '1 day')::date + 30
    ) <= p_today
      and not exists (
        select 1
        from public.month_ritual_runs r
        where r.household_id = p_household_id
          and r.period_month = gs::date
      )
  loop
    v_batch := public.autolock_resolve_unmapped_for_period(
      p_household_id,
      v_period.period_month
    );
    v_resolved := v_resolved + v_batch;

    insert into public.month_ritual_runs (
      household_id,
      period_month,
      status,
      mode,
      preview_json,
      auto_locked_at
    ) values (
      p_household_id,
      v_period.period_month,
      'pending_review',
      'assisted',
      jsonb_build_object(
        'periodMonth', to_char(v_period.period_month, 'YYYY-MM-DD'),
        'autoLocked', true
      ),
      timezone('utc', now())
    )
    returning id into v_run_id;

    v_locked := v_locked + 1;
  end loop;

  if v_locked > 0 then
    update public.households h
    set consecutive_completed_rituals = 0
    where h.id = p_household_id
      and h.consecutive_completed_rituals > 0;
  end if;

  return jsonb_build_object(
    'household_id', p_household_id,
    'locked_count', v_locked,
    'unmapped_resolved_count', v_resolved
  );
end;
$function$;
CREATE OR REPLACE FUNCTION public.record_loan_payment(p_loan_id uuid, p_account_id uuid, p_amount numeric, p_interest_paid numeric DEFAULT 0, p_paid_at date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_loan public.loans%rowtype;
  v_account public.accounts%rowtype;
  v_amount numeric;
  v_interest numeric;
  v_principal numeric;
  v_paid_at date;
  v_tx_id uuid;
  v_payment_id uuid;
  v_item_id uuid;
  v_completed boolean := false;
  v_remaining numeric;
  v_next date;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  v_amount := trunc(p_amount);
  v_interest := trunc(coalesce(p_interest_paid, 0));
  v_paid_at := coalesce(p_paid_at, (timezone('utc', now()))::date);

  if v_amount is null or v_amount <= 0 then
    raise exception 'Invalid payment amount';
  end if;

  if v_interest < 0 or v_interest > v_amount then
    raise exception 'Invalid interest portion';
  end if;

  select * into v_loan
  from public.loans l
  where l.id = p_loan_id
  for update;

  if not found then
    raise exception 'Loan not found';
  end if;

  if not public.is_household_member(v_loan.household_id) then
    raise exception 'Not a household member';
  end if;

  if v_loan.status = 'completed' or v_loan.remaining_principal <= 0 then
    raise exception 'Loan already completed';
  end if;

  select * into v_account
  from public.accounts a
  where a.id = p_account_id
    and a.household_id = v_loan.household_id
    and a.is_archived = false
  for update;

  if not found then
    raise exception 'Account not found';
  end if;

  -- Credit cards are payment instruments for Card BC — Loan payments debit liquid accounts
  if v_account.type = 'credit_card' then
    raise exception 'Loan payment cannot use a credit card account';
  end if;

  v_principal := v_amount - v_interest;
  if v_principal > v_loan.remaining_principal then
    raise exception 'Principal portion exceeds remaining principal';
  end if;

  insert into public.transactions (
    household_id,
    account_id,
    type,
    amount,
    currency,
    transaction_date,
    note,
    category_id,
    jar_id,
    status,
    created_by
  )
  values (
    v_loan.household_id,
    p_account_id,
    'expense',
    v_amount,
    v_loan.currency,
    v_paid_at,
    'Loan payment: ' || v_loan.name,
    null,
    null,
    'posted',
    v_user_id
  )
  returning id into v_tx_id;

  insert into public.loan_payments (
    household_id,
    loan_id,
    account_id,
    transaction_id,
    amount,
    principal_paid,
    interest_paid,
    paid_at,
    created_by
  )
  values (
    v_loan.household_id,
    p_loan_id,
    p_account_id,
    v_tx_id,
    v_amount,
    v_principal,
    v_interest,
    v_paid_at,
    v_user_id
  )
  returning id into v_payment_id;

  v_remaining := v_loan.remaining_principal - v_principal;
  v_completed := v_remaining <= 0;

  if v_completed then
    v_next := null;
  elsif v_loan.repayment_frequency = 'monthly' then
    v_next := (coalesce(v_loan.next_payment_date, v_paid_at) + interval '1 month')::date;
  else
    v_next := (coalesce(v_loan.next_payment_date, v_paid_at) + interval '1 month')::date;
  end if;

  update public.loans l
  set
    remaining_principal = greatest(0, v_remaining),
    status = case when v_completed then 'completed' else 'active' end,
    next_payment_date = v_next,
    updated_at = timezone('utc', now())
  where l.id = p_loan_id;

  if v_completed then
    insert into public.inbox_items (
      household_id,
      kind,
      status,
      source_type,
      source_id,
      amount,
      currency,
      title,
      context_json
    )
    values (
      v_loan.household_id,
      'emi_complete',
      'pending',
      'guided',
      p_loan_id,
      v_loan.monthly_payment,
      v_loan.currency,
      v_loan.name,
      jsonb_build_object(
        'flow', 'loan_complete',
        'review_item_type', 'InstallmentComplete',
        'loan_id', p_loan_id,
        'principal', v_loan.principal
      )
    )
    on conflict (household_id, source_type, source_id) do update
      set
        status = 'pending',
        updated_at = timezone('utc', now()),
        title = excluded.title,
        context_json = excluded.context_json
    returning id into v_item_id;

    if v_item_id is null then
      select i.id into v_item_id
      from public.inbox_items i
      where i.household_id = v_loan.household_id
        and i.source_type = 'guided'
        and i.source_id = p_loan_id;
    end if;
  end if;

  return jsonb_build_object(
    'ok', true,
    'paymentId', v_payment_id,
    'transactionId', v_tx_id,
    'remainingPrincipal', greatest(0, v_remaining),
    'completed', v_completed,
    'inboxItemId', v_item_id
  );
end;
$function$;
CREATE OR REPLACE FUNCTION public.record_loan_payment(p_loan_id uuid, p_account_id uuid, p_mode text DEFAULT 'scheduled'::text, p_paid_at date DEFAULT NULL::date, p_idempotency_key text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_household_id uuid;
  v_key text;
  v_existing public.loan_payments%rowtype;
  v_result jsonb;
  v_remaining numeric;
  v_status text;
  v_schedule_entry_id uuid;
  v_interest_transaction_id uuid;
  v_transaction_ids jsonb;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select hm.household_id
    into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id
    and hm.is_active = true
  limit 1;
  if v_household_id is null then
    raise exception 'Not a household member';
  end if;

  v_key := nullif(trim(coalesce(p_idempotency_key, '')), '');
  if v_key is null then
    raise exception 'Idempotency key required';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(v_household_id::text || ':loan:payment:' || v_key, 0)
  );

  select * into v_existing
  from public.loan_payments lp
  where lp.household_id = v_household_id
    and lp.idempotency_key = v_key;
  if found then
    select l.remaining_principal, l.status
      into v_remaining, v_status
    from public.loans l
    where l.id = v_existing.loan_id
      and l.household_id = v_household_id;
    select e.id into v_schedule_entry_id
    from public.loan_schedule_entries e
    where e.loan_payment_id = v_existing.id
    order by e.sequence
    limit 1;
    select t.id into v_interest_transaction_id
    from public.transactions t
    where t.loan_payment_id = v_existing.id
      and t.type = 'loan_interest'
    order by t.created_at
    limit 1;
    select coalesce(jsonb_agg(t.id order by t.created_at), '[]'::jsonb)
      into v_transaction_ids
    from public.transactions t
    where t.loan_payment_id = v_existing.id;
    return jsonb_build_object(
      'ok', true,
      'paymentId', v_existing.id,
      'transactionId', v_existing.transaction_id,
      'interestTransactionId', v_interest_transaction_id,
      'transactionIds', v_transaction_ids,
      'remainingPrincipal', v_remaining,
      'completed', v_status = 'completed',
      'amount', v_existing.amount,
      'principalPaid', v_existing.principal_paid,
      'interestPaid', v_existing.interest_paid,
      'sourceDelta', -v_existing.amount,
      'scheduleEntryId', v_schedule_entry_id,
      'idempotentReplay', true
    );
  end if;

  v_result := public._record_loan_payment_unchecked_11b(
    p_loan_id, p_account_id, p_mode, p_paid_at
  );

  update public.loan_payments
  set idempotency_key = v_key
  where id = (v_result->>'paymentId')::uuid
    and household_id = v_household_id;

  select coalesce(jsonb_agg(t.id order by t.created_at), '[]'::jsonb)
    into v_transaction_ids
  from public.transactions t
  where t.loan_payment_id = (v_result->>'paymentId')::uuid;

  return (v_result - 'feePaid') || jsonb_build_object(
    'transactionIds', v_transaction_ids,
    'idempotentReplay', false
  );
end;
$function$;
CREATE OR REPLACE FUNCTION public.record_card_transaction(p_account_id uuid, p_type text, p_amount numeric, p_transaction_date date DEFAULT NULL::date, p_note text DEFAULT NULL::text, p_category_id uuid DEFAULT NULL::uuid, p_jar_id uuid DEFAULT NULL::uuid, p_idempotency_key text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_household_id uuid;
  v_effective date;
  v_account public.accounts%rowtype;
  v_settings public.credit_card_settings%rowtype;
  v_recorded jsonb;
  v_transaction_id uuid;
  v_billing_month date;
  v_due_month date;
  v_due_date date;
  v_month public.card_billing_months%rowtype;
  v_statement_amount numeric;
  v_paid_amount numeric;
  v_signed_amount numeric;
  v_status text;
  v_outstanding numeric;
  v_due_day int;
  v_statement_day int;
begin
  v_user_id := auth.uid();
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if p_type not in ('income', 'expense') then
    raise exception 'Invalid transaction type';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount <> trunc(p_amount) then
    raise exception 'Amount must be a positive whole number';
  end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id and hm.is_active = true
  limit 1;
  if v_household_id is null then raise exception 'Active household membership required'; end if;

  select * into v_account
  from public.accounts a
  where a.id = p_account_id
    and a.household_id = v_household_id
    and a.type = 'credit_card'
    and a.is_archived = false
  for update;
  if not found then raise exception 'Card not found'; end if;

  select * into v_settings
  from public.credit_card_settings s
  where s.account_id = p_account_id and s.household_id = v_household_id
  for update;
  if not found then raise exception 'Card settings not found'; end if;

  v_effective := coalesce(
    p_transaction_date,
    timezone('Asia/Ho_Chi_Minh', now())::date
  );
  v_statement_day := least(31, greatest(1, v_settings.statement_day));
  v_due_day := least(31, greatest(1, v_settings.due_day));

  select coalesce(sum(greatest(0, m.statement_amount - m.paid_amount)), 0)
    into v_outstanding
  from public.card_billing_months m
  where m.household_id = v_household_id
    and m.card_account_id = p_account_id
    and m.status in ('open', 'partial');
  if p_type = 'expense' and v_outstanding + p_amount > v_settings.credit_limit then
    raise exception 'Credit limit exceeded';
  end if;

  v_recorded := public.record_transaction(
    p_account_id => p_account_id,
    p_type => p_type,
    p_amount => p_amount,
    p_transaction_date => v_effective,
    p_note => p_note,
    p_category_id => p_category_id,
    p_jar_id => p_jar_id,
    p_idempotency_key => p_idempotency_key
  );
  v_transaction_id := (v_recorded->>'transaction_id')::uuid;

  if exists (
    select 1 from public.card_billing_items i
    where i.transaction_id = v_transaction_id
  ) then
    return v_recorded;
  end if;

  v_signed_amount := case when p_type = 'income' then -abs(p_amount) else abs(p_amount) end;
  v_billing_month := date_trunc('month', v_effective)::date;
  if p_type = 'expense' and extract(day from v_effective)::int > v_statement_day then
    v_billing_month := (v_billing_month + interval '1 month')::date;
  elsif p_type = 'income' then
    select m.billing_month into v_billing_month
    from public.card_billing_months m
    where m.household_id = v_household_id
      and m.card_account_id = p_account_id
      and m.status <> 'settled'
    order by m.billing_month desc
    limit 1;
    v_billing_month := coalesce(v_billing_month, date_trunc('month', v_effective)::date);
  end if;

  v_due_month := case
    when v_due_day <= v_statement_day then (v_billing_month + interval '1 month')::date
    else v_billing_month
  end;
  v_due_date := make_date(
    extract(year from v_due_month)::int,
    extract(month from v_due_month)::int,
    least(
      v_due_day,
      extract(day from (date_trunc('month', v_due_month + interval '1 month') - interval '1 day'))::int
    )
  );

  select * into v_month
  from public.card_billing_months m
  where m.household_id = v_household_id
    and m.card_account_id = p_account_id
    and m.billing_month = v_billing_month
  for update;

  if not found then
    insert into public.card_billing_months (
      household_id, card_account_id, billing_month, statement_amount,
      paid_amount, due_date, status
    ) values (
      v_household_id, p_account_id, v_billing_month, greatest(0, v_signed_amount),
      0, v_due_date, case when v_signed_amount <= 0 then 'settled' else 'open' end
    ) returning * into v_month;
  else
    v_statement_amount := greatest(0, v_month.statement_amount + v_signed_amount);
    v_paid_amount := v_month.paid_amount;
    v_status := case
      when v_statement_amount <= 0 or v_paid_amount >= v_statement_amount then 'settled'
      when v_paid_amount > 0 then 'partial'
      else 'open'
    end;
    update public.card_billing_months
    set statement_amount = v_statement_amount,
        status = v_status,
        updated_at = timezone('utc', now())
    where id = v_month.id;
  end if;

  insert into public.card_billing_items (
    household_id, billing_month_id, card_account_id, transaction_id,
    description, amount, fee_amount, item_type, is_paid, is_converted_to_installment
  ) values (
    v_household_id, v_month.id, p_account_id, v_transaction_id,
    nullif(trim(coalesce(p_note, '')), ''), v_signed_amount, 0, 'standard', false, false
  );

  return v_recorded;
end;
$function$;
CREATE OR REPLACE FUNCTION public.guard_investment_mutation_12b()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if tg_table_name='investment_operations' then
    if new.source_holding_id is not null then
      perform public.investment_assert_holding_12b(new.source_holding_id,new.household_id);
    end if;
    if new.destination_holding_id is not null then
      perform public.investment_assert_holding_12b(new.destination_holding_id,new.household_id);
    end if;
    if new.cash_account_id is not null then
      perform public.investment_assert_account_12b(new.cash_account_id,new.household_id);
    end if;
  elsif tg_table_name='transactions' then
    perform public.investment_assert_account_12b(new.account_id,new.household_id);
  end if;
  return new;
end $function$;
CREATE OR REPLACE FUNCTION public.record_investment_buy(p_holding_id uuid, p_cash_account_id uuid, p_bought_quantity numeric, p_unit_price_vnd numeric, p_total_value_vnd numeric, p_quoted_value_vnd numeric, p_effective_date date, p_fees jsonb, p_notes text, p_idempotency_key text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare hh uuid; h public.investment_holdings%rowtype; old_id uuid; add_result jsonb; fee jsonb; fee_tx uuid; tx uuid; op uuid;
  total numeric; cash_fee numeric:=0; net_q numeric:=p_bought_quantity; fee_h uuid; fee_index int:=0; fee_basis numeric:=0;
begin
  hh:=public.investment_active_household();
  select id into old_id from public.investment_operations where household_id=hh and idempotency_key=p_idempotency_key;
  if found then return public.investment_operation_receipt(old_id,true); end if;
  select * into h from public.investment_holdings where id=p_holding_id and household_id=hh for update;
  if not found then raise exception 'Investment holding not found'; end if;
  perform public.assert_financial_mutation(h.household_id,h.financial_scope,h.owner_membership_id);
  perform public.investment_assert_account_12b(p_cash_account_id,hh);
  total:=case when h.asset_class='bond' then p_total_value_vnd else round(p_bought_quantity*p_unit_price_vnd,0) end;
  if p_bought_quantity<=0 or total<=0 or (h.asset_class<>'bond' and (p_unit_price_vnd is null or p_total_value_vnd is not null)) or (h.asset_class='bond' and (p_total_value_vnd is null or p_unit_price_vnd is not null)) then raise exception 'Invalid buy price'; end if;
  for fee in select value from jsonb_array_elements(coalesce(p_fees,'[]'::jsonb)) loop
    if fee->>'source'='cash' then cash_fee:=cash_fee+coalesce((fee->>'amountVnd')::numeric,0);
    elsif fee->>'source'='destination_asset' then net_q:=net_q-(fee->>'quantity')::numeric;
    elsif fee->>'source'='other_investment' then fee_h:=(fee->>'holdingId')::uuid; perform public.investment_assert_holding_12b(fee_h,hh); fee_basis:=fee_basis+coalesce((public.investment_consume_holding(hh,fee_h,(fee->>'quantity')::numeric)->>'consumedBasis')::numeric,0);
    else raise exception 'Unsupported buy fee source'; end if;
  end loop;
  if net_q<=0 then raise exception 'Fee consumes destination quantity'; end if;
  insert into public.transactions(household_id,account_id,type,amount,currency,transaction_date,status,idempotency_key,created_by,source)
  values(hh,p_cash_account_id,'investment_buy',total,'VND',p_effective_date,'posted',p_idempotency_key||':principal',auth.uid(),'manual') returning id into tx;
  add_result:=public.investment_add_holding(hh,p_holding_id,net_q,total+fee_basis);
  insert into public.investment_operations(household_id,operation_type,destination_holding_id,cash_account_id,destination_quantity,executed_value_vnd,unit_price_vnd,quoted_value_vnd,destination_basis_added,before_quantity,after_quantity,before_basis,after_basis,cash_delta,transaction_id,effective_date,notes,idempotency_key,created_by)
  values(hh,'buy',p_holding_id,p_cash_account_id,net_q,total,p_unit_price_vnd,p_quoted_value_vnd,total+fee_basis,(add_result->>'beforeQuantity')::numeric,(add_result->>'afterQuantity')::numeric,(add_result->>'beforeBasis')::numeric,(add_result->>'afterBasis')::numeric,-total-cash_fee,tx,p_effective_date,p_notes,p_idempotency_key,auth.uid()) returning id into op;
  if h.asset_class='fund' then
    insert into public.investment_lots(household_id,position_id,acquired_at,original_quantity,remaining_quantity,unit_cost,total_cost)
    values(hh,p_holding_id,p_effective_date::timestamptz,net_q,net_q,round((total+fee_basis)/net_q,8),total+fee_basis);
  end if;
  for fee in select value from jsonb_array_elements(coalesce(p_fees,'[]'::jsonb)) loop fee_index:=fee_index+1; if fee->>'source'='cash' then
    insert into public.transactions(household_id,account_id,type,amount,currency,transaction_date,status,idempotency_key,created_by,source) values(hh,p_cash_account_id,'investment_fee',(fee->>'amountVnd')::numeric,'VND',p_effective_date,'posted',p_idempotency_key||':fee:'||fee_index,auth.uid(),'manual') returning id into fee_tx;
    insert into public.investment_fees(household_id,operation_id,fee_source,amount_vnd,fee_value_vnd,cash_account_id,transaction_id) values(hh,op,'cash',(fee->>'amountVnd')::numeric,(fee->>'feeValueVnd')::numeric,p_cash_account_id,fee_tx);
  else fee_h:=case when fee->>'source'='destination_asset' then p_holding_id else (fee->>'holdingId')::uuid end; insert into public.investment_fees(household_id,operation_id,fee_source,quantity,fee_value_vnd,fee_holding_id) values(hh,op,fee->>'source',(fee->>'quantity')::numeric,(fee->>'feeValueVnd')::numeric,fee_h); end if; end loop;
  return public.investment_operation_receipt(op,false);
end $function$;
CREATE OR REPLACE FUNCTION public.record_investment_conversion(p_source_holding_id uuid, p_destination_holding_id uuid, p_source_quantity numeric, p_destination_quantity numeric, p_executed_value_vnd numeric, p_quoted_value_vnd numeric, p_effective_date date, p_fees jsonb, p_notes text, p_idempotency_key text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_hh uuid; v_oid uuid; v_existing uuid; v_fee jsonb; v_source_fee numeric(38,18):=0; v_dest_fee numeric(38,18):=0;
  v_source_c jsonb; v_dest_a jsonb; v_basis numeric(18,0); v_cash_basis numeric(18,0):=0; v_fee_h uuid; v_other jsonb; v_tx uuid; v_fee_tx uuid; v_fee_effects jsonb:='[]'::jsonb;
begin
  v_hh:=public.investment_active_household(); select id into v_existing from public.investment_operations where household_id=v_hh and idempotency_key=p_idempotency_key;
  if found then return public.investment_operation_receipt(v_existing,true); end if;
  if p_source_holding_id=p_destination_holding_id then raise exception 'Conversion holdings must differ'; end if;
  for v_fee in select value from jsonb_array_elements(coalesce(p_fees,'[]'::jsonb)) loop
    if v_fee->>'source'='source_asset' then v_source_fee:=v_source_fee+(v_fee->>'quantity')::numeric;
    elsif v_fee->>'source'='destination_asset' then v_dest_fee:=v_dest_fee+(v_fee->>'quantity')::numeric;
    elsif v_fee->>'source'='cash' then v_cash_basis:=v_cash_basis+(v_fee->>'amountVnd')::numeric;
    elsif v_fee->>'source'<>'other_investment' then raise exception 'Unsupported conversion fee source'; end if;
  end loop;
  if p_destination_quantity-v_dest_fee<=0 then raise exception 'Fee consumes destination quantity'; end if;
  v_source_c:=public.investment_consume_holding(v_hh,p_source_holding_id,p_source_quantity+v_source_fee);
  v_basis:=(v_source_c->>'consumedBasis')::numeric;
  for v_fee in select value from jsonb_array_elements(coalesce(p_fees,'[]'::jsonb)) where value->>'source'='other_investment' loop
    if (v_fee->>'holdingId')::uuid in (p_source_holding_id,p_destination_holding_id) then raise exception 'Other fee holding must differ from conversion legs'; end if;
    v_other:=public.investment_consume_holding(v_hh,(v_fee->>'holdingId')::uuid,(v_fee->>'quantity')::numeric);
    if v_basis is not null and v_other->>'consumedBasis' is not null then v_basis:=v_basis+(v_other->>'consumedBasis')::numeric; else v_basis:=null; end if;
  end loop;
  if v_basis is not null then v_basis:=v_basis+v_cash_basis; end if;
  v_dest_a:=public.investment_add_holding(v_hh,p_destination_holding_id,p_destination_quantity-v_dest_fee,v_basis);
  insert into public.investment_operations(household_id,operation_type,source_holding_id,destination_holding_id,source_quantity,destination_quantity,executed_value_vnd,quoted_value_vnd,source_basis_consumed,destination_basis_added,before_quantity,after_quantity,before_basis,after_basis,cash_delta,effective_date,notes,idempotency_key,created_by)
  values(v_hh,'asset_conversion',p_source_holding_id,p_destination_holding_id,p_source_quantity+v_source_fee,p_destination_quantity-v_dest_fee,p_executed_value_vnd,p_quoted_value_vnd,(v_source_c->>'consumedBasis')::numeric,v_basis,(v_source_c->>'beforeQuantity')::numeric,(v_source_c->>'afterQuantity')::numeric,(v_source_c->>'beforeBasis')::numeric,(v_source_c->>'afterBasis')::numeric,-v_cash_basis,p_effective_date,nullif(trim(coalesce(p_notes,'')),''),p_idempotency_key,auth.uid()) returning id into v_oid;
  for v_fee in select value from jsonb_array_elements(coalesce(p_fees,'[]'::jsonb)) loop
    v_fee_tx:=null;
    if v_fee->>'source'='cash' then
      perform 1 from public.accounts where id=(v_fee->>'cashAccountId')::uuid and household_id=v_hh and not is_archived and type not in ('credit_card','savings_product') for update; if not found then raise exception 'Cash account not found'; end if;
      insert into public.transactions(household_id,account_id,type,amount,currency,transaction_date,note,category_id,jar_id,status,idempotency_key,created_by,source)
      values(v_hh,(v_fee->>'cashAccountId')::uuid,'investment_fee',(v_fee->>'amountVnd')::numeric,'VND',p_effective_date,nullif(trim(coalesce(p_notes,'')),''),null,null,'posted',p_idempotency_key||':fee:'||(select count(*) from public.investment_fees where operation_id=v_oid),auth.uid(),'manual') returning id into v_fee_tx;
      insert into public.investment_fees(household_id,operation_id,fee_source,amount_vnd,fee_value_vnd,cash_account_id,transaction_id) values(v_hh,v_oid,'cash',(v_fee->>'amountVnd')::numeric,(v_fee->>'feeValueVnd')::numeric,(v_fee->>'cashAccountId')::uuid,v_fee_tx);
    else
      v_fee_h:=case v_fee->>'source' when 'source_asset' then p_source_holding_id when 'destination_asset' then p_destination_holding_id else (v_fee->>'holdingId')::uuid end;
      insert into public.investment_fees(household_id,operation_id,fee_source,quantity,fee_value_vnd,fee_holding_id) values(v_hh,v_oid,v_fee->>'source',(v_fee->>'quantity')::numeric,(v_fee->>'feeValueVnd')::numeric,v_fee_h);
    end if;
  end loop;
  return public.investment_operation_receipt(v_oid,false);
end $function$;
CREATE OR REPLACE FUNCTION public.record_investment_sell(p_holding_id uuid, p_cash_account_id uuid, p_sold_quantity numeric, p_unit_price_vnd numeric, p_total_value_vnd numeric, p_quoted_value_vnd numeric, p_effective_date date, p_fees jsonb, p_notes text, p_idempotency_key text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare hh uuid; h public.investment_holdings%rowtype; old_id uuid; fee jsonb; fee_h uuid; cash_fee numeric:=0; source_fee numeric:=0; other_fee numeric:=0; total numeric; c jsonb; tx uuid; op uuid; fee_tx uuid; i int:=0;
begin
  hh:=public.investment_active_household(); select id into old_id from public.investment_operations where household_id=hh and idempotency_key=p_idempotency_key; if found then return public.investment_operation_receipt(old_id,true); end if;
  select * into h from public.investment_holdings where id=p_holding_id and household_id=hh for update; if not found then raise exception 'Investment holding not found'; end if;
  perform public.assert_financial_mutation(h.household_id,h.financial_scope,h.owner_membership_id); perform public.investment_assert_account_12b(p_cash_account_id,hh);
  total:=case when h.asset_class='bond' then p_total_value_vnd else round(p_sold_quantity*p_unit_price_vnd,0) end;
  if p_sold_quantity<=0 or total<=0 or (h.asset_class<>'bond' and (p_unit_price_vnd is null or p_total_value_vnd is not null)) or (h.asset_class='bond' and (p_total_value_vnd is null or p_unit_price_vnd is not null)) then raise exception 'Invalid sell price'; end if;
  for fee in select value from jsonb_array_elements(coalesce(p_fees,'[]'::jsonb)) loop if fee->>'source'='cash' then cash_fee:=cash_fee+(fee->>'amountVnd')::numeric; elsif fee->>'source'='source_asset' then source_fee:=source_fee+(fee->>'quantity')::numeric; elsif fee->>'source'='other_investment' then fee_h:=(fee->>'holdingId')::uuid; perform public.investment_assert_holding_12b(fee_h,hh); other_fee:=other_fee+(fee->>'feeValueVnd')::numeric; else raise exception 'Unsupported sell fee source'; end if; end loop;
  c:=public.investment_consume_holding(hh,p_holding_id,p_sold_quantity+source_fee);
  if total-cash_fee<=0 then raise exception 'Invalid sell proceeds'; end if;
  insert into public.transactions(household_id,account_id,type,amount,currency,transaction_date,status,idempotency_key,created_by,source) values(hh,p_cash_account_id,'investment_sell_proceeds',total,'VND',p_effective_date,'posted',p_idempotency_key||':principal',auth.uid(),'manual') returning id into tx;
  insert into public.investment_operations(household_id,operation_type,source_holding_id,cash_account_id,source_quantity,executed_value_vnd,unit_price_vnd,quoted_value_vnd,source_basis_consumed,realized_result_vnd,before_quantity,after_quantity,before_basis,after_basis,cash_delta,transaction_id,effective_date,notes,idempotency_key,created_by)
  values(hh,'sell',p_holding_id,p_cash_account_id,p_sold_quantity+source_fee,total,p_unit_price_vnd,p_quoted_value_vnd,(c->>'consumedBasis')::numeric,case when c->>'consumedBasis' is null then null else total-cast(c->>'consumedBasis' as numeric)-other_fee-cash_fee end,(c->>'beforeQuantity')::numeric,(c->>'afterQuantity')::numeric,(c->>'beforeBasis')::numeric,(c->>'afterBasis')::numeric,total-cash_fee,tx,p_effective_date,p_notes,p_idempotency_key,auth.uid()) returning id into op;
  for fee in select value from jsonb_array_elements(coalesce(p_fees,'[]'::jsonb)) loop i:=i+1; if fee->>'source'='cash' then insert into public.transactions(household_id,account_id,type,amount,currency,transaction_date,status,idempotency_key,created_by,source) values(hh,p_cash_account_id,'investment_fee',(fee->>'amountVnd')::numeric,'VND',p_effective_date,'posted',p_idempotency_key||':fee:'||i,auth.uid(),'manual') returning id into fee_tx; insert into public.investment_fees(household_id,operation_id,fee_source,amount_vnd,fee_value_vnd,cash_account_id,transaction_id) values(hh,op,'cash',(fee->>'amountVnd')::numeric,(fee->>'feeValueVnd')::numeric,p_cash_account_id,fee_tx); else fee_h:=case when fee->>'source'='source_asset' then p_holding_id else (fee->>'holdingId')::uuid end; insert into public.investment_fees(household_id,operation_id,fee_source,quantity,fee_value_vnd,fee_holding_id) values(hh,op,fee->>'source',(fee->>'quantity')::numeric,(fee->>'feeValueVnd')::numeric,fee_h); end if; end loop;
  return public.investment_operation_receipt(op,false);
end $function$;
CREATE OR REPLACE FUNCTION public.run_month_ritual_autolock_worker()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid;
  v_household_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select hm.household_id into v_household_id
  from public.household_members hm
  where hm.user_id = v_user_id
  order by hm.created_at asc
  limit 1;

  if v_household_id is null then
    raise exception 'No household membership';
  end if;

  if not public.is_household_member(v_household_id) then
    raise exception 'Forbidden';
  end if;

  return public.run_month_ritual_autolock_for_household(v_household_id);
end;
$function$;
CREATE OR REPLACE FUNCTION public.run_month_ritual_autolock_worker_all()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_household record;
  v_batch jsonb;
  v_locked integer := 0;
  v_resolved integer := 0;
  v_households integer := 0;
begin
  for v_household in
    select h.id
    from public.households h
  loop
    v_households := v_households + 1;
    v_batch := public.run_month_ritual_autolock_for_household(v_household.id);
    v_locked := v_locked + coalesce((v_batch->>'locked_count')::integer, 0);
    v_resolved := v_resolved + coalesce((v_batch->>'unmapped_resolved_count')::integer, 0);
  end loop;

  return jsonb_build_object(
    'households_scanned', v_households,
    'locked_count', v_locked,
    'unmapped_resolved_count', v_resolved
  );
end;
$function$;
CREATE OR REPLACE FUNCTION public.record_investment_initial_purchase(p_asset_name text, p_asset_class text, p_quantity numeric, p_unit_price_vnd numeric, p_cash_account_id uuid, p_as_of_date date, p_symbol text, p_provider_custodian text, p_fees jsonb, p_notes text, p_visibility_context text, p_idempotency_key text, p_financial_scope text DEFAULT 'household'::text, p_total_value_vnd numeric DEFAULT NULL::numeric, p_instrument_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_hh uuid;
  v_hid uuid;
  v_existing uuid;
  v_financial_scope text;
  v_owner_membership_id uuid;
begin
  v_hh := public.investment_active_household();
  v_financial_scope := lower(trim(coalesce(p_financial_scope, 'household')));
  if v_financial_scope not in ('household', 'personal') then
    raise exception 'Invalid financial scope';
  end if;
  select hm.id into v_owner_membership_id
  from public.household_members hm
  where hm.id = public.active_membership_id(v_hh)
    and hm.is_active = true;
  if v_financial_scope = 'personal' and v_owner_membership_id is null then
    raise exception 'Active household membership required';
  end if;
  if v_financial_scope = 'household' then
    v_owner_membership_id := null;
  end if;

  select id into v_existing
  from public.investment_operations
  where household_id = v_hh and idempotency_key = p_idempotency_key;
  if found then
    return public.investment_operation_receipt(v_existing, true);
  end if;
  if p_instrument_id is not null and not exists (
    select 1 from public.market_instruments
    where id = p_instrument_id and is_active = true and asset_class = p_asset_class
  ) then
    raise exception 'Invalid market instrument';
  end if;
  perform public.investment_assert_account_12b(p_cash_account_id, v_hh);

  insert into public.investment_holdings(
    household_id, name, symbol, instrument_id, asset_class, provider_custodian,
    visibility_context, lifecycle_status, history_status, quantity,
    remaining_total_cost_basis, notes, created_by, financial_scope,
    owner_membership_id, accounting_method
  ) values (
    v_hh, trim(p_asset_name), nullif(trim(coalesce(p_symbol,'')), ''),
    p_instrument_id, p_asset_class, nullif(trim(coalesce(p_provider_custodian,'')), ''),
    coalesce(p_visibility_context,'household'), 'exited', 'full', 0, 0,
    nullif(trim(coalesce(p_notes,'')), ''), auth.uid(), v_financial_scope,
    v_owner_membership_id,
    case when p_asset_class='fund' then 'FIFO' else 'WEIGHTED_AVERAGE' end
  ) returning id into v_hid;

  return public.record_investment_buy(
    v_hid, p_cash_account_id, p_quantity, p_unit_price_vnd,
    p_total_value_vnd, null, p_as_of_date, coalesce(p_fees,'[]'::jsonb),
    p_notes, p_idempotency_key
  );
end $function$;
CREATE OR REPLACE FUNCTION public.record_investment_initial_purchase(p_asset_name text, p_asset_class text, p_quantity numeric, p_unit_price_vnd numeric, p_cash_account_id uuid, p_as_of_date date, p_symbol text, p_provider_custodian text, p_fees jsonb, p_notes text, p_visibility_context text, p_idempotency_key text, p_financial_scope text DEFAULT 'household'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare hh uuid; holding_id uuid; existing uuid; scope text; owner_id uuid;
begin
  hh:=public.investment_active_household();
  scope:=lower(trim(coalesce(p_financial_scope,'household')));
  if scope not in ('household','personal') then raise exception 'Invalid financial scope'; end if;
  owner_id:=case when scope='personal' then public.active_membership_id(hh) else null end;
  select id into existing from public.investment_operations where household_id=hh and idempotency_key=p_idempotency_key;
  if found then return public.investment_operation_receipt(existing,true); end if;
  perform public.investment_assert_account_12b(p_cash_account_id,hh);
  insert into public.investment_holdings(
    household_id,name,symbol,asset_class,provider_custodian,visibility_context,
    lifecycle_status,history_status,quantity,remaining_total_cost_basis,notes,
    created_by,financial_scope,owner_membership_id,accounting_method
  ) values (
    hh,trim(p_asset_name),nullif(trim(coalesce(p_symbol,'')),''),p_asset_class,
    nullif(trim(coalesce(p_provider_custodian,'')),''),coalesce(p_visibility_context,'household'),
    'exited','full',0,0,nullif(trim(coalesce(p_notes,'')),''),auth.uid(),scope,owner_id,
    case when p_asset_class='fund' then 'FIFO' else 'WEIGHTED_AVERAGE' end
  ) returning id into holding_id;
  return public.record_investment_buy(
    holding_id,p_cash_account_id,p_quantity,p_unit_price_vnd,null,null,p_as_of_date,
    coalesce(p_fees,'[]'::jsonb),p_notes,p_idempotency_key
  );
end $function$;
CREATE OR REPLACE FUNCTION public.record_investment_initial_purchase(p_asset_name text, p_asset_class text, p_quantity numeric, p_unit_price_vnd numeric, p_cash_account_id uuid, p_as_of_date date, p_symbol text, p_provider_custodian text, p_fees jsonb, p_notes text, p_visibility_context text, p_idempotency_key text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_hh uuid; v_hid uuid; v_existing uuid; v_receipt jsonb;
begin
  v_hh := public.investment_active_household();
  select id into v_existing from public.investment_operations where household_id = v_hh and idempotency_key = p_idempotency_key;
  if found then return public.investment_operation_receipt(v_existing, true); end if;
  if p_asset_class not in ('crypto','stock','fund','gold','bond') or p_quantity <= 0 or scale(p_quantity) > 18 or p_unit_price_vnd <= 0 or p_unit_price_vnd <> trunc(p_unit_price_vnd) or p_as_of_date is null then raise exception 'Invalid initial purchase'; end if;
  perform 1 from public.accounts where id = p_cash_account_id and household_id = v_hh and not is_archived and type not in ('credit_card','savings_product') for update;
  if not found then raise exception 'Cash account not found'; end if;
  insert into public.investment_holdings(household_id,name,symbol,asset_class,provider_custodian,visibility_context,lifecycle_status,history_status,quantity,remaining_total_cost_basis,notes,created_by)
  values(v_hh,trim(p_asset_name),nullif(trim(coalesce(p_symbol,'')),''),p_asset_class,nullif(trim(coalesce(p_provider_custodian,'')),''),coalesce(p_visibility_context,'household'),'active','full',0,0,nullif(trim(coalesce(p_notes,'')),''),auth.uid()) returning id into v_hid;
  v_receipt := public.record_investment_buy(v_hid,p_cash_account_id,p_quantity,round(p_quantity * p_unit_price_vnd),null,p_as_of_date,coalesce(p_fees,'[]'::jsonb),p_notes,p_idempotency_key);
  return v_receipt;
end $function$;

CREATE TRIGGER guard_ownership_immutable_trg BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION guard_ownership_immutable();
CREATE TRIGGER ownership_rpc_root_guard BEFORE INSERT OR UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION guard_financial_root_mutation();
CREATE TRIGGER ownership_rpc_cross_resource_guard BEFORE INSERT OR DELETE OR UPDATE ON card_billing_items FOR EACH ROW EXECUTE FUNCTION guard_cross_resource_mutation();
CREATE TRIGGER ownership_rpc_cross_resource_guard BEFORE INSERT OR DELETE OR UPDATE ON card_billing_months FOR EACH ROW EXECUTE FUNCTION guard_cross_resource_mutation();
CREATE TRIGGER ownership_rpc_cross_resource_guard BEFORE INSERT OR DELETE OR UPDATE ON card_payments FOR EACH ROW EXECUTE FUNCTION guard_cross_resource_mutation();
CREATE TRIGGER validate_credit_card_installment_source_trigger BEFORE INSERT OR UPDATE OF source_transaction_id, card_account_id, household_id ON credit_card_installments FOR EACH ROW EXECUTE FUNCTION validate_credit_card_installment_source();
CREATE TRIGGER ownership_rpc_cross_resource_guard BEFORE INSERT OR DELETE OR UPDATE ON credit_card_settings FOR EACH ROW EXECUTE FUNCTION guard_cross_resource_mutation();
CREATE TRIGGER ownership_rpc_cross_resource_guard BEFORE INSERT OR DELETE OR UPDATE ON debt_payments FOR EACH ROW EXECUTE FUNCTION guard_cross_resource_mutation();
CREATE TRIGGER ownership_rpc_cross_resource_guard BEFORE INSERT OR DELETE OR UPDATE ON early_withdrawals FOR EACH ROW EXECUTE FUNCTION guard_cross_resource_mutation();
CREATE TRIGGER ownership_rpc_cross_resource_guard BEFORE INSERT OR DELETE OR UPDATE ON goal_contributions FOR EACH ROW EXECUTE FUNCTION guard_cross_resource_mutation();
CREATE TRIGGER goal_funding_links_integrity BEFORE INSERT OR UPDATE ON goal_funding_links FOR EACH ROW EXECUTE FUNCTION enforce_goal_funding_link_integrity();
CREATE TRIGGER ownership_rpc_goal_funding_guard BEFORE INSERT OR DELETE OR UPDATE ON goal_funding_links FOR EACH ROW EXECUTE FUNCTION guard_goal_funding_link_mutation();
CREATE TRIGGER ownership_rpc_cross_resource_guard BEFORE INSERT OR DELETE OR UPDATE ON goal_period_funded_snapshots FOR EACH ROW EXECUTE FUNCTION guard_cross_resource_mutation();
CREATE TRIGGER guard_ownership_immutable_trg BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION guard_ownership_immutable();
CREATE TRIGGER ownership_rpc_root_guard BEFORE INSERT OR UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION guard_financial_root_mutation();
CREATE TRIGGER household_members_prevent_owned_delete_trg BEFORE DELETE ON household_members FOR EACH ROW EXECUTE FUNCTION prevent_owned_membership_delete();
CREATE TRIGGER ownership_rpc_inbox_source_guard BEFORE UPDATE ON inbox_items FOR EACH ROW EXECUTE FUNCTION guard_inbox_source_mutation();
CREATE TRIGGER investment_fee_event_projection AFTER INSERT ON investment_fees FOR EACH ROW EXECUTE FUNCTION project_investment_fee_event();
CREATE TRIGGER ownership_rpc_cross_resource_guard BEFORE INSERT OR DELETE OR UPDATE ON investment_fees FOR EACH ROW EXECUTE FUNCTION guard_cross_resource_mutation();
CREATE TRIGGER ownership_rpc_root_guard BEFORE INSERT OR UPDATE ON investment_holdings FOR EACH ROW EXECUTE FUNCTION guard_financial_root_mutation();
CREATE TRIGGER investment_operation_event_projection AFTER INSERT ON investment_operations FOR EACH ROW EXECUTE FUNCTION project_investment_operation_event();
CREATE TRIGGER investment_operation_ownership_12b BEFORE INSERT ON investment_operations FOR EACH ROW EXECUTE FUNCTION guard_investment_mutation_12b();
CREATE TRIGGER ownership_rpc_cross_resource_guard BEFORE INSERT OR DELETE OR UPDATE ON investment_operations FOR EACH ROW EXECUTE FUNCTION guard_cross_resource_mutation();
CREATE TRIGGER ownership_rpc_cross_resource_guard BEFORE INSERT OR DELETE OR UPDATE ON investment_valuations FOR EACH ROW EXECUTE FUNCTION guard_cross_resource_mutation();
CREATE TRIGGER trg_guard_historical_jar_period_rule_snapshot BEFORE UPDATE ON jar_period_rule_snapshots FOR EACH ROW EXECUTE FUNCTION guard_historical_jar_period_rule_snapshot();
CREATE TRIGGER guard_ownership_immutable_trg BEFORE UPDATE ON liabilities FOR EACH ROW EXECUTE FUNCTION guard_ownership_immutable();
CREATE TRIGGER ownership_rpc_root_guard BEFORE INSERT OR UPDATE ON liabilities FOR EACH ROW EXECUTE FUNCTION guard_financial_root_mutation();
CREATE TRIGGER ownership_rpc_cross_resource_guard BEFORE INSERT OR DELETE OR UPDATE ON loan_interest_rate_periods FOR EACH ROW EXECUTE FUNCTION guard_cross_resource_mutation();
CREATE TRIGGER loan_payment_account_eligibility BEFORE INSERT ON loan_payments FOR EACH ROW EXECUTE FUNCTION guard_loan_payment_account_eligibility();
CREATE TRIGGER ownership_rpc_cross_resource_guard BEFORE INSERT OR DELETE OR UPDATE ON loan_payments FOR EACH ROW EXECUTE FUNCTION guard_cross_resource_mutation();
CREATE TRIGGER ownership_rpc_cross_resource_guard BEFORE INSERT OR DELETE OR UPDATE ON loan_schedule_entries FOR EACH ROW EXECUTE FUNCTION guard_cross_resource_mutation();
CREATE TRIGGER guard_ownership_immutable_trg BEFORE UPDATE ON loans FOR EACH ROW EXECUTE FUNCTION guard_ownership_immutable();
CREATE TRIGGER ownership_rpc_root_guard BEFORE INSERT OR UPDATE ON loans FOR EACH ROW EXECUTE FUNCTION guard_financial_root_mutation();
CREATE TRIGGER ownership_rpc_cross_resource_guard BEFORE INSERT OR DELETE OR UPDATE ON saving_cycles FOR EACH ROW EXECUTE FUNCTION guard_cross_resource_mutation();
CREATE TRIGGER guard_ownership_immutable_trg BEFORE UPDATE ON savings FOR EACH ROW EXECUTE FUNCTION guard_ownership_immutable();
CREATE TRIGGER ownership_rpc_root_guard BEFORE INSERT OR UPDATE ON savings FOR EACH ROW EXECUTE FUNCTION guard_financial_root_mutation();
CREATE TRIGGER ownership_rpc_cross_resource_guard BEFORE INSERT OR DELETE OR UPDATE ON transaction_tag_assignments FOR EACH ROW EXECUTE FUNCTION guard_cross_resource_mutation();
CREATE TRIGGER validate_transaction_tag_assignment_trigger BEFORE INSERT OR UPDATE OF household_id, transaction_id, tag_id ON transaction_tag_assignments FOR EACH ROW EXECUTE FUNCTION validate_transaction_tag_assignment();
CREATE TRIGGER investment_transaction_ownership_12b BEFORE INSERT ON transactions FOR EACH ROW WHEN (new.type = ANY (ARRAY['investment_buy'::text, 'investment_sell_proceeds'::text, 'investment_income'::text, 'investment_fee'::text])) EXECUTE FUNCTION guard_investment_mutation_12b();
CREATE TRIGGER ownership_rpc_transaction_guard BEFORE INSERT OR DELETE OR UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION guard_transaction_mutation();
CREATE TRIGGER transactions_set_is_reversal BEFORE INSERT ON transactions FOR EACH ROW EXECUTE FUNCTION transactions_set_is_reversal();
CREATE TRIGGER trg_transactions_active_jar BEFORE INSERT OR UPDATE OF jar_id ON transactions FOR EACH ROW EXECUTE FUNCTION enforce_active_jar_on_transaction();
alter table "public"."accounts" enable row level security;
alter table "public"."ai_audit_logs" enable row level security;
alter table "public"."card_billing_items" enable row level security;
alter table "public"."card_billing_months" enable row level security;
alter table "public"."card_payment_applications" enable row level security;
alter table "public"."card_payments" enable row level security;
alter table "public"."categories" enable row level security;
alter table "public"."credit_card_installment_legacy_archive" enable row level security;
alter table "public"."credit_card_installment_schedule" enable row level security;
alter table "public"."credit_card_installments" enable row level security;
alter table "public"."credit_card_settings" enable row level security;
alter table "public"."debt_payments" enable row level security;
alter table "public"."early_withdrawals" enable row level security;
alter table "public"."goal_contributions" enable row level security;
alter table "public"."goal_funding_links" enable row level security;
alter table "public"."goal_period_funded_snapshots" enable row level security;
alter table "public"."goals" enable row level security;
alter table "public"."household_configuration_events" enable row level security;
alter table "public"."household_invitations" enable row level security;
alter table "public"."household_members" enable row level security;
alter table "public"."household_policy_events" enable row level security;
alter table "public"."households" enable row level security;
alter table "public"."inbox_items" enable row level security;
alter table "public"."investment_accounts" enable row level security;
alter table "public"."investment_events" enable row level security;
alter table "public"."investment_fees" enable row level security;
alter table "public"."investment_holdings" enable row level security;
alter table "public"."investment_instruments" enable row level security;
alter table "public"."investment_lots" enable row level security;
alter table "public"."investment_operations" enable row level security;
alter table "public"."investment_providers" enable row level security;
alter table "public"."investment_valuations" enable row level security;
alter table "public"."jar_period_adjustments" enable row level security;
alter table "public"."jar_period_rule_snapshots" enable row level security;
alter table "public"."jar_plans" enable row level security;
alter table "public"."jars" enable row level security;
alter table "public"."liabilities" enable row level security;
alter table "public"."loan_interest_rate_periods" enable row level security;
alter table "public"."loan_payments" enable row level security;
alter table "public"."loan_schedule_entries" enable row level security;
alter table "public"."loans" enable row level security;
alter table "public"."market_currency_rates" enable row level security;
alter table "public"."market_instrument_prices" enable row level security;
alter table "public"."market_instrument_sources" enable row level security;
alter table "public"."market_instruments" enable row level security;
alter table "public"."market_sync_locks" enable row level security;
alter table "public"."market_sync_runs" enable row level security;
alter table "public"."month_ritual_runs" enable row level security;
alter table "public"."plan_movements" enable row level security;
alter table "public"."recurring_rules" enable row level security;
alter table "public"."saving_cycles" enable row level security;
alter table "public"."saving_packages" enable row level security;
alter table "public"."saving_providers" enable row level security;
alter table "public"."savings" enable row level security;
alter table "public"."savings_accounts" enable row level security;
alter table "public"."transaction_tag_assignments" enable row level security;
alter table "public"."transaction_tags" enable row level security;
alter table "public"."transactions" enable row level security;
create policy "accounts_insert_member" on "public"."accounts"
  as PERMISSIVE
  for INSERT
  to "authenticated"
  with check (can_mutate_financial_resource(household_id, financial_scope, owner_membership_id));
create policy "accounts_select_member" on "public"."accounts"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using ((active_membership_id(household_id) IS NOT NULL));
create policy "accounts_update_member" on "public"."accounts"
  as PERMISSIVE
  for UPDATE
  to "authenticated"
  using (can_mutate_financial_resource(household_id, financial_scope, owner_membership_id))
  with check (can_mutate_financial_resource(household_id, financial_scope, owner_membership_id));
create policy "ai_audit_logs_insert_member" on "public"."ai_audit_logs"
  as PERMISSIVE
  for INSERT
  to "authenticated"
  with check (is_household_member(household_id));
create policy "ai_audit_logs_select_member" on "public"."ai_audit_logs"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using (is_household_member(household_id));
create policy "card_billing_items_insert_member" on "public"."card_billing_items"
  as PERMISSIVE
  for INSERT
  to "authenticated"
  with check ((EXISTS ( SELECT 1
   FROM accounts a
  WHERE ((a.id = card_billing_items.card_account_id) AND can_mutate_financial_resource(a.household_id, a.financial_scope, a.owner_membership_id)))));
create policy "card_billing_items_select_member" on "public"."card_billing_items"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using ((EXISTS ( SELECT 1
   FROM accounts a
  WHERE ((a.id = card_billing_items.card_account_id) AND (active_membership_id(a.household_id) IS NOT NULL)))));
create policy "card_billing_items_update_member" on "public"."card_billing_items"
  as PERMISSIVE
  for UPDATE
  to "authenticated"
  using ((EXISTS ( SELECT 1
   FROM accounts a
  WHERE ((a.id = card_billing_items.card_account_id) AND can_mutate_financial_resource(a.household_id, a.financial_scope, a.owner_membership_id)))))
  with check ((EXISTS ( SELECT 1
   FROM accounts a
  WHERE ((a.id = card_billing_items.card_account_id) AND can_mutate_financial_resource(a.household_id, a.financial_scope, a.owner_membership_id)))));
create policy "card_billing_months_insert_member" on "public"."card_billing_months"
  as PERMISSIVE
  for INSERT
  to "authenticated"
  with check ((EXISTS ( SELECT 1
   FROM accounts a
  WHERE ((a.id = card_billing_months.card_account_id) AND can_mutate_financial_resource(a.household_id, a.financial_scope, a.owner_membership_id)))));
create policy "card_billing_months_select_member" on "public"."card_billing_months"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using ((EXISTS ( SELECT 1
   FROM accounts a
  WHERE ((a.id = card_billing_months.card_account_id) AND (active_membership_id(a.household_id) IS NOT NULL)))));
create policy "card_billing_months_update_member" on "public"."card_billing_months"
  as PERMISSIVE
  for UPDATE
  to "authenticated"
  using ((EXISTS ( SELECT 1
   FROM accounts a
  WHERE ((a.id = card_billing_months.card_account_id) AND can_mutate_financial_resource(a.household_id, a.financial_scope, a.owner_membership_id)))))
  with check ((EXISTS ( SELECT 1
   FROM accounts a
  WHERE ((a.id = card_billing_months.card_account_id) AND can_mutate_financial_resource(a.household_id, a.financial_scope, a.owner_membership_id)))));
create policy "card_payment_applications_select_member" on "public"."card_payment_applications"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using ((EXISTS ( SELECT 1
   FROM card_payments cp
  WHERE ((cp.id = card_payment_applications.card_payment_id) AND (EXISTS ( SELECT 1
           FROM accounts a
          WHERE ((a.id = cp.card_account_id) AND (active_membership_id(a.household_id) IS NOT NULL))))))));
create policy "card_payments_select_member" on "public"."card_payments"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using ((EXISTS ( SELECT 1
   FROM accounts a
  WHERE ((a.id = card_payments.card_account_id) AND (active_membership_id(a.household_id) IS NOT NULL)))));
create policy "categories_insert_member" on "public"."categories"
  as PERMISSIVE
  for INSERT
  to "authenticated"
  with check (((household_id IS NOT NULL) AND (is_system = false) AND is_household_member(household_id)));
create policy "categories_select_member" on "public"."categories"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using (((household_id IS NULL) OR is_household_member(household_id)));
create policy "categories_update_member" on "public"."categories"
  as PERMISSIVE
  for UPDATE
  to "authenticated"
  using (((household_id IS NOT NULL) AND (is_system = false) AND is_household_member(household_id)))
  with check (((household_id IS NOT NULL) AND (is_system = false) AND is_household_member(household_id)));
create policy "credit_card_installment_legacy_archive_insert_member" on "public"."credit_card_installment_legacy_archive"
  as PERMISSIVE
  for INSERT
  to "authenticated"
  with check (is_household_member(household_id));
create policy "credit_card_installment_legacy_archive_select_member" on "public"."credit_card_installment_legacy_archive"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using (is_household_member(household_id));
create policy "credit_card_installment_schedule_insert_member" on "public"."credit_card_installment_schedule"
  as PERMISSIVE
  for INSERT
  to "authenticated"
  with check ((EXISTS ( SELECT 1
   FROM credit_card_installments ci
  WHERE ((ci.id = credit_card_installment_schedule.installment_id) AND (EXISTS ( SELECT 1
           FROM accounts a
          WHERE ((a.id = ci.card_account_id) AND can_mutate_financial_resource(a.household_id, a.financial_scope, a.owner_membership_id))))))));
create policy "credit_card_installment_schedule_select_member" on "public"."credit_card_installment_schedule"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using ((EXISTS ( SELECT 1
   FROM credit_card_installments ci
  WHERE ((ci.id = credit_card_installment_schedule.installment_id) AND (EXISTS ( SELECT 1
           FROM accounts a
          WHERE ((a.id = ci.card_account_id) AND (active_membership_id(a.household_id) IS NOT NULL))))))));
create policy "credit_card_installment_schedule_update_member" on "public"."credit_card_installment_schedule"
  as PERMISSIVE
  for UPDATE
  to "authenticated"
  using ((EXISTS ( SELECT 1
   FROM credit_card_installments ci
  WHERE ((ci.id = credit_card_installment_schedule.installment_id) AND (EXISTS ( SELECT 1
           FROM accounts a
          WHERE ((a.id = ci.card_account_id) AND can_mutate_financial_resource(a.household_id, a.financial_scope, a.owner_membership_id))))))))
  with check ((EXISTS ( SELECT 1
   FROM credit_card_installments ci
  WHERE ((ci.id = credit_card_installment_schedule.installment_id) AND (EXISTS ( SELECT 1
           FROM accounts a
          WHERE ((a.id = ci.card_account_id) AND can_mutate_financial_resource(a.household_id, a.financial_scope, a.owner_membership_id))))))));
create policy "credit_card_installments_delete_member" on "public"."credit_card_installments"
  as PERMISSIVE
  for DELETE
  to "authenticated"
  using ((EXISTS ( SELECT 1
   FROM accounts a
  WHERE ((a.id = credit_card_installments.card_account_id) AND can_mutate_financial_resource(a.household_id, a.financial_scope, a.owner_membership_id)))));
create policy "credit_card_installments_insert_member" on "public"."credit_card_installments"
  as PERMISSIVE
  for INSERT
  to "authenticated"
  with check ((EXISTS ( SELECT 1
   FROM accounts a
  WHERE ((a.id = credit_card_installments.card_account_id) AND can_mutate_financial_resource(a.household_id, a.financial_scope, a.owner_membership_id)))));
create policy "credit_card_installments_select_member" on "public"."credit_card_installments"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using ((EXISTS ( SELECT 1
   FROM accounts a
  WHERE ((a.id = credit_card_installments.card_account_id) AND (active_membership_id(a.household_id) IS NOT NULL)))));
create policy "credit_card_installments_update_member" on "public"."credit_card_installments"
  as PERMISSIVE
  for UPDATE
  to "authenticated"
  using ((EXISTS ( SELECT 1
   FROM accounts a
  WHERE ((a.id = credit_card_installments.card_account_id) AND can_mutate_financial_resource(a.household_id, a.financial_scope, a.owner_membership_id)))))
  with check ((EXISTS ( SELECT 1
   FROM accounts a
  WHERE ((a.id = credit_card_installments.card_account_id) AND can_mutate_financial_resource(a.household_id, a.financial_scope, a.owner_membership_id)))));
create policy "credit_card_settings_insert_member" on "public"."credit_card_settings"
  as PERMISSIVE
  for INSERT
  to "authenticated"
  with check ((EXISTS ( SELECT 1
   FROM accounts a
  WHERE ((a.id = credit_card_settings.account_id) AND can_mutate_financial_resource(a.household_id, a.financial_scope, a.owner_membership_id)))));
create policy "credit_card_settings_select_member" on "public"."credit_card_settings"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using ((EXISTS ( SELECT 1
   FROM accounts a
  WHERE ((a.id = credit_card_settings.account_id) AND (active_membership_id(a.household_id) IS NOT NULL)))));
create policy "credit_card_settings_update_member" on "public"."credit_card_settings"
  as PERMISSIVE
  for UPDATE
  to "authenticated"
  using ((EXISTS ( SELECT 1
   FROM accounts a
  WHERE ((a.id = credit_card_settings.account_id) AND can_mutate_financial_resource(a.household_id, a.financial_scope, a.owner_membership_id)))))
  with check ((EXISTS ( SELECT 1
   FROM accounts a
  WHERE ((a.id = credit_card_settings.account_id) AND can_mutate_financial_resource(a.household_id, a.financial_scope, a.owner_membership_id)))));
create policy "debt_payments_select_member" on "public"."debt_payments"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using ((active_membership_id(household_id) IS NOT NULL));
create policy "early_withdrawals_insert_member" on "public"."early_withdrawals"
  as PERMISSIVE
  for INSERT
  to "authenticated"
  with check ((EXISTS ( SELECT 1
   FROM savings s
  WHERE ((s.id = early_withdrawals.saving_id) AND can_mutate_financial_resource(s.household_id, s.financial_scope, s.owner_membership_id)))));
create policy "early_withdrawals_select_member" on "public"."early_withdrawals"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using ((EXISTS ( SELECT 1
   FROM savings s
  WHERE ((s.id = early_withdrawals.saving_id) AND (active_membership_id(s.household_id) IS NOT NULL)))));
create policy "goal_contributions_insert_member" on "public"."goal_contributions"
  as PERMISSIVE
  for INSERT
  to "authenticated"
  with check ((EXISTS ( SELECT 1
   FROM goals g
  WHERE ((g.id = goal_contributions.goal_id) AND can_mutate_financial_resource(g.household_id, g.financial_scope, g.owner_membership_id)))));
create policy "goal_contributions_select_member" on "public"."goal_contributions"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using ((active_membership_id(household_id) IS NOT NULL));
create policy "goal_funding_links_insert_member" on "public"."goal_funding_links"
  as PERMISSIVE
  for INSERT
  to "authenticated"
  with check ((is_household_member(household_id) AND (EXISTS ( SELECT 1
   FROM goals g
  WHERE ((g.id = goal_funding_links.goal_id) AND (g.household_id = goal_funding_links.household_id) AND (g.status = ANY (ARRAY['active'::text, 'ready'::text])) AND can_mutate_financial_resource(g.household_id, g.financial_scope, g.owner_membership_id))))));
create policy "goal_funding_links_select_member" on "public"."goal_funding_links"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using ((active_membership_id(household_id) IS NOT NULL));
create policy "goal_funding_links_update_member" on "public"."goal_funding_links"
  as PERMISSIVE
  for UPDATE
  to "authenticated"
  using ((EXISTS ( SELECT 1
   FROM goals g
  WHERE ((g.id = goal_funding_links.goal_id) AND can_mutate_financial_resource(g.household_id, g.financial_scope, g.owner_membership_id)))))
  with check ((EXISTS ( SELECT 1
   FROM goals g
  WHERE ((g.id = goal_funding_links.goal_id) AND can_mutate_financial_resource(g.household_id, g.financial_scope, g.owner_membership_id)))));
create policy "goal_period_funded_snapshots_insert_member" on "public"."goal_period_funded_snapshots"
  as PERMISSIVE
  for INSERT
  to "authenticated"
  with check (is_household_member(household_id));
create policy "goal_period_funded_snapshots_select_member" on "public"."goal_period_funded_snapshots"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using (is_household_member(household_id));
create policy "goals_delete_member" on "public"."goals"
  as PERMISSIVE
  for DELETE
  to "authenticated"
  using (can_mutate_financial_resource(household_id, financial_scope, owner_membership_id));
create policy "goals_insert_member" on "public"."goals"
  as PERMISSIVE
  for INSERT
  to "authenticated"
  with check (can_mutate_financial_resource(household_id, financial_scope, owner_membership_id));
create policy "goals_select_member" on "public"."goals"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using ((active_membership_id(household_id) IS NOT NULL));
create policy "goals_update_member" on "public"."goals"
  as PERMISSIVE
  for UPDATE
  to "authenticated"
  using (can_mutate_financial_resource(household_id, financial_scope, owner_membership_id))
  with check (can_mutate_financial_resource(household_id, financial_scope, owner_membership_id));
create policy "household_configuration_events_select_member" on "public"."household_configuration_events"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using (is_household_member(household_id));
create policy "household_invitations_select_member" on "public"."household_invitations"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using ((is_household_member(household_id) OR (lower(email) = lower(COALESCE((auth.jwt() ->> 'email'::text), ''::text)))));
create policy "household_members_select_member" on "public"."household_members"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using (is_household_member(household_id));
create policy "household_policy_events_select_member" on "public"."household_policy_events"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using (is_household_member(household_id));
create policy "households_select_member" on "public"."households"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using (is_household_member(id));
create policy "inbox_items_read_state_update_member" on "public"."inbox_items"
  as PERMISSIVE
  for UPDATE
  to "authenticated"
  using (is_household_member(household_id))
  with check (is_household_member(household_id));
create policy "inbox_items_select_member" on "public"."inbox_items"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using (is_household_member(household_id));
create policy "investment_accounts_select" on "public"."investment_accounts"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using (is_household_member(household_id));
create policy "investment_events_select" on "public"."investment_events"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using ((active_membership_id(household_id) IS NOT NULL));
create policy "investment_events_select_12b" on "public"."investment_events"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using (is_household_member(household_id));
create policy "investment_fees_select" on "public"."investment_fees"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using ((active_membership_id(household_id) IS NOT NULL));
create policy "investment_holdings_select" on "public"."investment_holdings"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using ((active_membership_id(household_id) IS NOT NULL));
create policy "investment_instruments_select" on "public"."investment_instruments"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using (is_household_member(household_id));
create policy "investment_lots_select" on "public"."investment_lots"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using ((EXISTS ( SELECT 1
   FROM investment_holdings h
  WHERE ((h.id = investment_lots.position_id) AND (active_membership_id(h.household_id) IS NOT NULL)))));
create policy "investment_lots_select_12b" on "public"."investment_lots"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using (is_household_member(household_id));
create policy "investment_operations_select" on "public"."investment_operations"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using ((active_membership_id(household_id) IS NOT NULL));
create policy "investment_providers_select" on "public"."investment_providers"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using (is_household_member(household_id));
create policy "investment_valuations_select" on "public"."investment_valuations"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using ((active_membership_id(household_id) IS NOT NULL));
create policy "jar_period_adjustments_insert_member" on "public"."jar_period_adjustments"
  as PERMISSIVE
  for INSERT
  to "authenticated"
  with check (is_household_member(household_id));
create policy "jar_period_adjustments_select_member" on "public"."jar_period_adjustments"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using (is_household_member(household_id));
create policy "jar_period_rule_snapshots_insert_member" on "public"."jar_period_rule_snapshots"
  as PERMISSIVE
  for INSERT
  to "authenticated"
  with check (is_household_member(household_id));
create policy "jar_period_rule_snapshots_select_member" on "public"."jar_period_rule_snapshots"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using (is_household_member(household_id));
create policy "jar_period_rule_snapshots_update_member" on "public"."jar_period_rule_snapshots"
  as PERMISSIVE
  for UPDATE
  to "authenticated"
  using (is_household_member(household_id))
  with check (is_household_member(household_id));
create policy "jar_plans_delete_member" on "public"."jar_plans"
  as PERMISSIVE
  for DELETE
  to "authenticated"
  using (is_household_member(household_id));
create policy "jar_plans_insert_member" on "public"."jar_plans"
  as PERMISSIVE
  for INSERT
  to "authenticated"
  with check (is_household_member(household_id));
create policy "jar_plans_select_member" on "public"."jar_plans"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using (is_household_member(household_id));
create policy "jar_plans_update_member" on "public"."jar_plans"
  as PERMISSIVE
  for UPDATE
  to "authenticated"
  using (is_household_member(household_id))
  with check (is_household_member(household_id));
create policy "jars_insert_member" on "public"."jars"
  as PERMISSIVE
  for INSERT
  to "authenticated"
  with check (is_household_member(household_id));
create policy "jars_select_member" on "public"."jars"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using (is_household_member(household_id));
create policy "jars_update_member" on "public"."jars"
  as PERMISSIVE
  for UPDATE
  to "authenticated"
  using (is_household_member(household_id))
  with check (is_household_member(household_id));
create policy "liabilities_insert_member" on "public"."liabilities"
  as PERMISSIVE
  for INSERT
  to "authenticated"
  with check (can_mutate_financial_resource(household_id, financial_scope, owner_membership_id));
create policy "liabilities_select_member" on "public"."liabilities"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using ((active_membership_id(household_id) IS NOT NULL));
create policy "liabilities_update_member" on "public"."liabilities"
  as PERMISSIVE
  for UPDATE
  to "authenticated"
  using (can_mutate_financial_resource(household_id, financial_scope, owner_membership_id))
  with check (can_mutate_financial_resource(household_id, financial_scope, owner_membership_id));
create policy "loan_interest_rate_periods_select_member" on "public"."loan_interest_rate_periods"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using ((EXISTS ( SELECT 1
   FROM loans l
  WHERE ((l.id = loan_interest_rate_periods.loan_id) AND (active_membership_id(l.household_id) IS NOT NULL)))));
create policy "loan_payments_insert_member" on "public"."loan_payments"
  as PERMISSIVE
  for INSERT
  to "authenticated"
  with check ((EXISTS ( SELECT 1
   FROM loans l
  WHERE ((l.id = loan_payments.loan_id) AND can_mutate_financial_resource(l.household_id, l.financial_scope, l.owner_membership_id)))));
create policy "loan_payments_select_member" on "public"."loan_payments"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using ((active_membership_id(household_id) IS NOT NULL));
create policy "loan_schedule_entries_select_member" on "public"."loan_schedule_entries"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using ((EXISTS ( SELECT 1
   FROM loans l
  WHERE ((l.id = loan_schedule_entries.loan_id) AND (active_membership_id(l.household_id) IS NOT NULL)))));
create policy "loans_insert_member" on "public"."loans"
  as PERMISSIVE
  for INSERT
  to "authenticated"
  with check (can_mutate_financial_resource(household_id, financial_scope, owner_membership_id));
create policy "loans_select_member" on "public"."loans"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using ((active_membership_id(household_id) IS NOT NULL));
create policy "loans_update_member" on "public"."loans"
  as PERMISSIVE
  for UPDATE
  to "authenticated"
  using (can_mutate_financial_resource(household_id, financial_scope, owner_membership_id))
  with check (can_mutate_financial_resource(household_id, financial_scope, owner_membership_id));
create policy "market_currency_rates_select_authenticated" on "public"."market_currency_rates"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using (true);
create policy "market_instrument_prices_select_authenticated" on "public"."market_instrument_prices"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using (true);
create policy "market_instrument_sources_select_authenticated" on "public"."market_instrument_sources"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using (true);
create policy "market_instruments_select_authenticated" on "public"."market_instruments"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using (true);
create policy "month_ritual_runs_insert_member" on "public"."month_ritual_runs"
  as PERMISSIVE
  for INSERT
  to "authenticated"
  with check (is_household_member(household_id));
create policy "month_ritual_runs_select_member" on "public"."month_ritual_runs"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using (is_household_member(household_id));
create policy "month_ritual_runs_update_member" on "public"."month_ritual_runs"
  as PERMISSIVE
  for UPDATE
  to "authenticated"
  using (is_household_member(household_id))
  with check (is_household_member(household_id));
create policy "plan_movements_select_member" on "public"."plan_movements"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using (is_household_member(household_id));
create policy "recurring_rules_delete_member" on "public"."recurring_rules"
  as PERMISSIVE
  for DELETE
  to "authenticated"
  using (is_household_member(household_id));
create policy "recurring_rules_insert_member" on "public"."recurring_rules"
  as PERMISSIVE
  for INSERT
  to "authenticated"
  with check (is_household_member(household_id));
create policy "recurring_rules_select_member" on "public"."recurring_rules"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using (is_household_member(household_id));
create policy "recurring_rules_update_member" on "public"."recurring_rules"
  as PERMISSIVE
  for UPDATE
  to "authenticated"
  using (is_household_member(household_id))
  with check (is_household_member(household_id));
create policy "saving_cycles_insert_member" on "public"."saving_cycles"
  as PERMISSIVE
  for INSERT
  to "authenticated"
  with check ((EXISTS ( SELECT 1
   FROM savings s
  WHERE ((s.id = saving_cycles.saving_id) AND can_mutate_financial_resource(s.household_id, s.financial_scope, s.owner_membership_id)))));
create policy "saving_cycles_select_member" on "public"."saving_cycles"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using ((EXISTS ( SELECT 1
   FROM savings s
  WHERE ((s.id = saving_cycles.saving_id) AND (active_membership_id(s.household_id) IS NOT NULL)))));
create policy "saving_cycles_update_member" on "public"."saving_cycles"
  as PERMISSIVE
  for UPDATE
  to "authenticated"
  using ((EXISTS ( SELECT 1
   FROM savings s
  WHERE ((s.id = saving_cycles.saving_id) AND can_mutate_financial_resource(s.household_id, s.financial_scope, s.owner_membership_id)))))
  with check ((EXISTS ( SELECT 1
   FROM savings s
  WHERE ((s.id = saving_cycles.saving_id) AND can_mutate_financial_resource(s.household_id, s.financial_scope, s.owner_membership_id)))));
create policy "saving_packages_insert_member" on "public"."saving_packages"
  as PERMISSIVE
  for INSERT
  to "authenticated"
  with check ((EXISTS ( SELECT 1
   FROM saving_providers p
  WHERE ((p.id = saving_packages.provider_id) AND (p.household_id IS NOT NULL) AND is_household_member(p.household_id) AND (p.is_system = false)))));
create policy "saving_packages_select_auth" on "public"."saving_packages"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using ((EXISTS ( SELECT 1
   FROM saving_providers p
  WHERE ((p.id = saving_packages.provider_id) AND ((p.household_id IS NULL) OR is_household_member(p.household_id))))));
create policy "saving_packages_update_member" on "public"."saving_packages"
  as PERMISSIVE
  for UPDATE
  to "authenticated"
  using ((EXISTS ( SELECT 1
   FROM saving_providers p
  WHERE ((p.id = saving_packages.provider_id) AND (p.household_id IS NOT NULL) AND is_household_member(p.household_id) AND (p.is_system = false)))))
  with check ((EXISTS ( SELECT 1
   FROM saving_providers p
  WHERE ((p.id = saving_packages.provider_id) AND (p.household_id IS NOT NULL) AND is_household_member(p.household_id) AND (p.is_system = false)))));
create policy "saving_providers_insert_member" on "public"."saving_providers"
  as PERMISSIVE
  for INSERT
  to "authenticated"
  with check (((household_id IS NOT NULL) AND is_household_member(household_id) AND (is_system = false)));
create policy "saving_providers_select_auth" on "public"."saving_providers"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using (((household_id IS NULL) OR is_household_member(household_id)));
create policy "saving_providers_update_member" on "public"."saving_providers"
  as PERMISSIVE
  for UPDATE
  to "authenticated"
  using (((household_id IS NOT NULL) AND is_household_member(household_id) AND (is_system = false)))
  with check (((household_id IS NOT NULL) AND is_household_member(household_id) AND (is_system = false)));
create policy "savings_insert_member" on "public"."savings"
  as PERMISSIVE
  for INSERT
  to "authenticated"
  with check (can_mutate_financial_resource(household_id, financial_scope, owner_membership_id));
create policy "savings_select_member" on "public"."savings"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using ((active_membership_id(household_id) IS NOT NULL));
create policy "savings_update_member" on "public"."savings"
  as PERMISSIVE
  for UPDATE
  to "authenticated"
  using (can_mutate_financial_resource(household_id, financial_scope, owner_membership_id))
  with check (can_mutate_financial_resource(household_id, financial_scope, owner_membership_id));
create policy "savings_accounts_insert_member" on "public"."savings_accounts"
  as PERMISSIVE
  for INSERT
  to "authenticated"
  with check (is_household_member(household_id));
create policy "savings_accounts_select_member" on "public"."savings_accounts"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using (is_household_member(household_id));
create policy "savings_accounts_update_member" on "public"."savings_accounts"
  as PERMISSIVE
  for UPDATE
  to "authenticated"
  using (is_household_member(household_id))
  with check (is_household_member(household_id));
create policy "transaction_tag_assignments_delete_member" on "public"."transaction_tag_assignments"
  as PERMISSIVE
  for DELETE
  to "authenticated"
  using (is_household_member(household_id));
create policy "transaction_tag_assignments_insert_member" on "public"."transaction_tag_assignments"
  as PERMISSIVE
  for INSERT
  to "authenticated"
  with check (is_household_member(household_id));
create policy "transaction_tag_assignments_select_member" on "public"."transaction_tag_assignments"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using (is_household_member(household_id));
create policy "transaction_tags_insert_member" on "public"."transaction_tags"
  as PERMISSIVE
  for INSERT
  to "authenticated"
  with check (is_household_member(household_id));
create policy "transaction_tags_select_member" on "public"."transaction_tags"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using (is_household_member(household_id));
create policy "transaction_tags_update_member" on "public"."transaction_tags"
  as PERMISSIVE
  for UPDATE
  to "authenticated"
  using (is_household_member(household_id))
  with check (is_household_member(household_id));
create policy "transactions_delete_member" on "public"."transactions"
  as PERMISSIVE
  for DELETE
  to "authenticated"
  using ((EXISTS ( SELECT 1
   FROM accounts a
  WHERE ((a.id = transactions.account_id) AND can_mutate_financial_resource(a.household_id, a.financial_scope, a.owner_membership_id)))));
create policy "transactions_insert_member" on "public"."transactions"
  as PERMISSIVE
  for INSERT
  to "authenticated"
  with check ((EXISTS ( SELECT 1
   FROM accounts a
  WHERE ((a.id = transactions.account_id) AND can_mutate_financial_resource(a.household_id, a.financial_scope, a.owner_membership_id)))));
create policy "transactions_select_member" on "public"."transactions"
  as PERMISSIVE
  for SELECT
  to "authenticated"
  using ((active_membership_id(household_id) IS NOT NULL));
create policy "transactions_update_member" on "public"."transactions"
  as PERMISSIVE
  for UPDATE
  to "authenticated"
  using ((EXISTS ( SELECT 1
   FROM accounts a
  WHERE ((a.id = transactions.account_id) AND can_mutate_financial_resource(a.household_id, a.financial_scope, a.owner_membership_id)))))
  with check ((EXISTS ( SELECT 1
   FROM accounts a
  WHERE ((a.id = transactions.account_id) AND can_mutate_financial_resource(a.household_id, a.financial_scope, a.owner_membership_id)))));
grant usage on schema public to anon, authenticated, service_role;
revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;
grant INSERT, SELECT, UPDATE on table "public"."accounts" to "authenticated";
grant INSERT, SELECT on table "public"."ai_audit_logs" to "authenticated";
grant INSERT, SELECT, UPDATE on table "public"."card_billing_items" to "authenticated";
grant INSERT, SELECT, UPDATE on table "public"."card_billing_months" to "authenticated";
grant SELECT on table "public"."card_payment_applications" to "authenticated";
grant SELECT on table "public"."card_payments" to "authenticated";
grant INSERT, SELECT on table "public"."categories" to "authenticated";
grant INSERT, SELECT on table "public"."credit_card_installment_legacy_archive" to "authenticated";
grant INSERT, SELECT, UPDATE on table "public"."credit_card_installment_schedule" to "authenticated";
grant DELETE, INSERT, SELECT, UPDATE on table "public"."credit_card_installments" to "authenticated";
grant INSERT, SELECT, UPDATE on table "public"."credit_card_settings" to "authenticated";
grant SELECT on table "public"."debt_payments" to "authenticated";
grant INSERT, SELECT on table "public"."early_withdrawals" to "authenticated";
grant INSERT, SELECT on table "public"."goal_contributions" to "authenticated";
grant INSERT, SELECT, UPDATE on table "public"."goal_funding_links" to "authenticated";
grant INSERT, SELECT on table "public"."goal_period_funded_snapshots" to "authenticated";
grant DELETE, INSERT, SELECT, UPDATE on table "public"."goals" to "authenticated";
grant SELECT on table "public"."household_configuration_events" to "authenticated";
grant SELECT on table "public"."household_invitations" to "authenticated";
grant SELECT on table "public"."household_members" to "authenticated";
grant SELECT on table "public"."household_policy_events" to "authenticated";
grant SELECT, UPDATE on table "public"."households" to "authenticated";
grant SELECT on table "public"."inbox_items" to "authenticated";
grant SELECT on table "public"."investment_accounts" to "authenticated";
grant SELECT on table "public"."investment_events" to "authenticated";
grant SELECT on table "public"."investment_fees" to "authenticated";
grant SELECT on table "public"."investment_holdings" to "authenticated";
grant SELECT on table "public"."investment_instruments" to "authenticated";
grant SELECT on table "public"."investment_lots" to "authenticated";
grant SELECT on table "public"."investment_operations" to "authenticated";
grant SELECT on table "public"."investment_providers" to "authenticated";
grant SELECT on table "public"."investment_valuations" to "authenticated";
grant INSERT, SELECT on table "public"."jar_period_adjustments" to "authenticated";
grant INSERT, SELECT, UPDATE on table "public"."jar_period_rule_snapshots" to "authenticated";
grant DELETE, INSERT, SELECT, UPDATE on table "public"."jar_plans" to "authenticated";
grant INSERT, SELECT, UPDATE on table "public"."jars" to "authenticated";
grant INSERT, SELECT, UPDATE on table "public"."liabilities" to "authenticated";
grant SELECT on table "public"."loan_interest_rate_periods" to "authenticated";
grant INSERT, SELECT on table "public"."loan_payments" to "authenticated";
grant SELECT on table "public"."loan_schedule_entries" to "authenticated";
grant INSERT, SELECT, UPDATE on table "public"."loans" to "authenticated";
grant SELECT on table "public"."market_currency_rates" to "authenticated";
grant SELECT on table "public"."market_instrument_prices" to "authenticated";
grant SELECT on table "public"."market_instrument_sources" to "authenticated";
grant SELECT on table "public"."market_instruments" to "authenticated";
grant INSERT, SELECT, UPDATE on table "public"."month_ritual_runs" to "authenticated";
grant SELECT on table "public"."plan_movements" to "authenticated";
grant DELETE, INSERT, SELECT, UPDATE on table "public"."recurring_rules" to "authenticated";
grant INSERT, SELECT, UPDATE on table "public"."saving_cycles" to "authenticated";
grant INSERT, SELECT, UPDATE on table "public"."saving_packages" to "authenticated";
grant INSERT, SELECT, UPDATE on table "public"."saving_providers" to "authenticated";
grant INSERT, SELECT, UPDATE on table "public"."savings" to "authenticated";
grant INSERT, SELECT, UPDATE on table "public"."savings_accounts" to "authenticated";
grant DELETE, INSERT, SELECT on table "public"."transaction_tag_assignments" to "authenticated";
grant INSERT, SELECT, UPDATE on table "public"."transaction_tags" to "authenticated";
grant SELECT on table "public"."transactions" to "authenticated";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."accounts" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."ai_audit_logs" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."card_billing_items" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."card_billing_months" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."card_payment_applications" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."card_payments" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."categories" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."credit_card_installment_legacy_archive" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."credit_card_installment_schedule" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."credit_card_installments" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."credit_card_settings" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."debt_payments" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."early_withdrawals" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."goal_contributions" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."goal_funding_links" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."goal_period_funded_snapshots" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."goals" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."household_configuration_events" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."household_invitations" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."household_members" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."household_policy_events" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."households" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."inbox_items" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."investment_accounts" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."investment_events" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."investment_fees" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."investment_holdings" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."investment_instruments" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."investment_lots" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."investment_operations" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."investment_providers" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."investment_valuations" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."jar_period_adjustments" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."jar_period_rule_snapshots" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."jar_plans" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."jars" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."liabilities" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."loan_interest_rate_periods" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."loan_payments" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."loan_schedule_entries" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."loans" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."market_currency_rates" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."market_instrument_prices" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."market_instrument_sources" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."market_instruments" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."market_sync_locks" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."market_sync_runs" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."month_ritual_runs" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."plan_movements" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."recurring_rules" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."saving_cycles" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."saving_packages" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."saving_providers" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."savings" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."savings_accounts" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."transaction_tag_assignments" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."transaction_tags" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."transactions" to "postgres";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."accounts" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."ai_audit_logs" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."card_billing_items" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."card_billing_months" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."card_payment_applications" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."card_payments" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."categories" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."credit_card_installment_legacy_archive" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."credit_card_installment_schedule" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."credit_card_installments" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."credit_card_settings" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."debt_payments" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."early_withdrawals" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."goal_contributions" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."goal_funding_links" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."goal_period_funded_snapshots" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."goals" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."household_configuration_events" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."household_invitations" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."household_members" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."household_policy_events" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."households" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."inbox_items" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."investment_accounts" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."investment_events" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."investment_fees" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."investment_holdings" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."investment_instruments" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."investment_lots" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."investment_operations" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."investment_providers" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."investment_valuations" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."jar_period_adjustments" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."jar_period_rule_snapshots" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."jar_plans" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."jars" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."liabilities" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."loan_interest_rate_periods" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."loan_payments" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."loan_schedule_entries" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."loans" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."market_currency_rates" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."market_instrument_prices" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."market_instrument_sources" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."market_instruments" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."market_sync_locks" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."market_sync_runs" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."month_ritual_runs" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."plan_movements" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."recurring_rules" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."saving_cycles" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."saving_packages" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."saving_providers" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."savings" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."savings_accounts" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."transaction_tag_assignments" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."transaction_tags" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table "public"."transactions" to "service_role";
grant EXECUTE on function public.get_invitation_preview(uuid) to "anon";
grant EXECUTE on function public.accept_household_invitation(uuid) to "authenticated";
grant EXECUTE on function public.acknowledge_inbox_item(uuid,text) to "authenticated";
grant EXECUTE on function public.active_membership_id(uuid) to "authenticated";
grant EXECUTE on function public.admin_archive_financial_resource(text,uuid) to "authenticated";
grant EXECUTE on function public.auto_resolve_inbox_item(uuid) to "authenticated";
grant EXECUTE on function public.backfill_legacy_savings_accounts(uuid) to "authenticated";
grant EXECUTE on function public.can_admin_cleanup(uuid) to "authenticated";
grant EXECUTE on function public.can_mutate_financial_resource(uuid,text,uuid) to "authenticated";
grant EXECUTE on function public.change_goal_lifecycle(uuid,text) to "authenticated";
grant EXECUTE on function public.change_household_member_role(uuid,text) to "authenticated";
grant EXECUTE on function public.contribute_to_goal(uuid,numeric,text) to "authenticated";
grant EXECUTE on function public.correct_transaction(uuid,numeric,text,uuid,uuid,uuid,text,date) to "authenticated";
grant EXECUTE on function public.create_category(text,text,uuid) to "authenticated";
grant EXECUTE on function public.create_debt(text,text,text,text,numeric,date,date,text,uuid,text,text) to "authenticated";
grant EXECUTE on function public.create_household_invitation(text) to "authenticated";
grant EXECUTE on function public.create_household_with_essentials(text,text,numeric,text,character,text,text) to "authenticated";
grant EXECUTE on function public.create_loan_with_schedule(text,text,text,numeric,numeric,text,text,numeric,integer,numeric,date,integer,date,date,numeric,numeric,numeric,date,text,character,jsonb,jsonb,text,text) to "authenticated";
grant EXECUTE on function public.create_saving_with_transfer(uuid,numeric,uuid,text,jsonb,text,uuid,date,date,jsonb) to "authenticated";
grant EXECUTE on function public.create_saving_with_transfer(uuid,numeric,uuid,text,jsonb,text,uuid,date,date,jsonb,jsonb) to "authenticated";
grant EXECUTE on function public.create_saving_with_transfer(uuid,numeric,uuid,text,jsonb,text,uuid,date,date,jsonb,jsonb,text,text,text) to "authenticated";
grant EXECUTE on function public.decline_household_invitation(uuid) to "authenticated";
grant EXECUTE on function public.delete_transaction(uuid) to "authenticated";
grant EXECUTE on function public.detect_matured_savings(uuid) to "authenticated";
grant EXECUTE on function public.dismiss_inbox_item(uuid) to "authenticated";
grant EXECUTE on function public.early_withdraw_saving(uuid,uuid,text) to "authenticated";
grant EXECUTE on function public.enqueue_payment_reminder(text,uuid,numeric,character,text,timestamp with time zone,jsonb) to "authenticated";
grant EXECUTE on function public.enqueue_savings_maturity(uuid) to "authenticated";
grant EXECUTE on function public.enqueue_savings_maturity_cascade(uuid) to "authenticated";
grant EXECUTE on function public.get_investment_home_summary_inputs() to "authenticated";
grant EXECUTE on function public.get_invitation_preview(uuid) to "authenticated";
grant EXECUTE on function public.guard_cross_resource_mutation() to "authenticated";
grant EXECUTE on function public.guard_loan_payment_account_eligibility() to "authenticated";
grant EXECUTE on function public.household_base_currency(uuid) to "authenticated";
grant EXECUTE on function public.investment_active_household() to "authenticated";
grant EXECUTE on function public.is_household_admin(uuid) to "authenticated";
grant EXECUTE on function public.is_household_member(uuid) to "authenticated";
grant EXECUTE on function public.is_month_ritual_locked(uuid,date) to "authenticated";
grant EXECUTE on function public.is_resource_owner(uuid,uuid) to "authenticated";
grant EXECUTE on function public.leave_household() to "authenticated";
grant EXECUTE on function public.preview_early_withdraw_saving(uuid,date) to "authenticated";
grant EXECUTE on function public.produce_inbox_item(uuid,text,text,uuid,numeric,text,text,jsonb,uuid,timestamp with time zone,uuid,uuid,text) to "authenticated";
grant EXECUTE on function public.reallocate_jar_capacity(uuid,uuid,numeric,boolean,text) to "authenticated";
grant EXECUTE on function public.reassign_goal_funding_source(uuid,uuid,uuid) to "authenticated";
grant EXECUTE on function public.record_card_transaction(uuid,text,numeric,date,text,uuid,uuid,text) to "authenticated";
grant EXECUTE on function public.record_debt_payment(uuid,uuid,numeric,date,text,text) to "authenticated";
grant EXECUTE on function public.record_investment_buy(uuid,uuid,numeric,numeric,numeric,numeric,date,jsonb,text,text) to "authenticated";
grant EXECUTE on function public.record_investment_conversion(uuid,uuid,numeric,numeric,numeric,numeric,date,jsonb,text,text) to "authenticated";
grant EXECUTE on function public.record_investment_income(uuid,uuid,numeric,text,date,text,text) to "authenticated";
grant EXECUTE on function public.record_investment_initial_purchase(text,text,numeric,numeric,uuid,date,text,text,jsonb,text,text,text,text) to "authenticated";
grant EXECUTE on function public.record_investment_initial_purchase(text,text,numeric,numeric,uuid,date,text,text,jsonb,text,text,text,text,numeric,uuid) to "authenticated";
grant EXECUTE on function public.record_investment_opening_position(text,text,numeric,date,text,text,numeric,numeric,text,text,text,text,uuid) to "authenticated";
grant EXECUTE on function public.record_investment_sell(uuid,uuid,numeric,numeric,numeric,numeric,date,jsonb,text,text) to "authenticated";
grant EXECUTE on function public.record_investment_valuation(uuid,numeric,numeric,date,text,text,text) to "authenticated";
grant EXECUTE on function public.record_liability_payment(uuid,numeric) to "authenticated";
grant EXECUTE on function public.record_loan_payment(uuid,uuid,numeric,numeric,date) to "authenticated";
grant EXECUTE on function public.record_loan_payment(uuid,uuid,text,date,text) to "authenticated";
grant EXECUTE on function public.record_owned_account_transfer(uuid,uuid,numeric,date,text,text) to "authenticated";
grant EXECUTE on function public.record_saving_renewal_decision(uuid,jsonb,boolean) to "authenticated";
grant EXECUTE on function public.record_transaction(uuid,text,numeric,date,text,uuid,uuid,text) to "authenticated";
grant EXECUTE on function public.refund_transaction(uuid,numeric,uuid,text,date) to "authenticated";
grant EXECUTE on function public.remove_household_member(uuid) to "authenticated";
grant EXECUTE on function public.renew_saving_cycle(uuid,text,jsonb,numeric,date,date,uuid,jsonb) to "authenticated";
grant EXECUTE on function public.resolve_inbox_item_to_jar(uuid,uuid) to "authenticated";
grant EXECUTE on function public.revoke_household_invitation(uuid) to "authenticated";
grant EXECUTE on function public.rollover_saving_cycle(uuid,text,uuid,uuid,date,date,text) to "authenticated";
grant EXECUTE on function public.run_inbox_staleness_worker() to "authenticated";
grant EXECUTE on function public.run_month_ritual_autolock_worker() to "authenticated";
grant EXECUTE on function public.set_transaction_tags(uuid,uuid[]) to "authenticated";
grant EXECUTE on function public.settle_card_payment(uuid,uuid,numeric,date,text) to "authenticated";
grant EXECUTE on function public.settle_saving_cycle(uuid,uuid,text) to "authenticated";
grant EXECUTE on function public.sync_loan_debt_attention_inbox() to "authenticated";
grant EXECUTE on function public.update_household_policies(text,text,text) to "authenticated";
grant EXECUTE on function public.update_household_preferences(text,text,text) to "authenticated";
grant EXECUTE on function public.update_loan_interest_rate(uuid,numeric,date,text,jsonb,numeric,numeric,numeric,date,date) to "authenticated";
grant EXECUTE on function public.update_transaction(uuid,uuid,text,numeric,date,text,uuid,uuid) to "authenticated";
grant EXECUTE on function public._create_debt_unchecked_10b(text,text,text,text,numeric,date,date,text,uuid,text,text) to "postgres";
grant EXECUTE on function public._create_loan_with_schedule_unchecked_11b(text,text,text,numeric,numeric,text,text,numeric,integer,numeric,date,integer,date,date,numeric,numeric,numeric,date,text,character,jsonb,jsonb,text) to "postgres";
grant EXECUTE on function public._loan_insert_rate_periods(uuid,uuid,jsonb,uuid) to "postgres";
grant EXECUTE on function public._loan_replace_upcoming_schedule(uuid,uuid,jsonb) to "postgres";
grant EXECUTE on function public._record_debt_payment_unchecked_10b(uuid,uuid,numeric,date,text,text) to "postgres";
grant EXECUTE on function public._record_loan_payment_unchecked_11b(uuid,uuid,text,date) to "postgres";
grant EXECUTE on function public.accept_household_invitation(uuid) to "postgres";
grant EXECUTE on function public.acknowledge_inbox_item(uuid,text) to "postgres";
grant EXECUTE on function public.active_membership_id(uuid) to "postgres";
grant EXECUTE on function public.admin_archive_financial_resource(text,uuid) to "postgres";
grant EXECUTE on function public.assert_financial_mutation(uuid,text,uuid) to "postgres";
grant EXECUTE on function public.auto_resolve_inbox_item(uuid) to "postgres";
grant EXECUTE on function public.autolock_resolve_unmapped_for_period(uuid,date) to "postgres";
grant EXECUTE on function public.backfill_legacy_savings_accounts(uuid) to "postgres";
grant EXECUTE on function public.can_admin_cleanup(uuid) to "postgres";
grant EXECUTE on function public.can_mutate_financial_resource(uuid,text,uuid) to "postgres";
grant EXECUTE on function public.change_goal_lifecycle(uuid,text) to "postgres";
grant EXECUTE on function public.change_household_member_role(uuid,text) to "postgres";
grant EXECUTE on function public.contribute_to_goal(uuid,numeric,text) to "postgres";
grant EXECUTE on function public.correct_transaction(uuid,numeric,text,uuid,uuid,uuid,text,date) to "postgres";
grant EXECUTE on function public.create_category(text,text,uuid) to "postgres";
grant EXECUTE on function public.create_debt(text,text,text,text,numeric,date,date,text,uuid,text,text) to "postgres";
grant EXECUTE on function public.create_household_invitation(text) to "postgres";
grant EXECUTE on function public.create_household_with_essentials(text,text,numeric,text,character,text,text) to "postgres";
grant EXECUTE on function public.create_loan_with_schedule(text,text,text,numeric,numeric,text,text,numeric,integer,numeric,date,integer,date,date,numeric,numeric,numeric,date,text,character,jsonb,jsonb,text,text) to "postgres";
grant EXECUTE on function public.create_saving_with_transfer(uuid,numeric,uuid,text,jsonb,text,uuid,date,date,jsonb) to "postgres";
grant EXECUTE on function public.create_saving_with_transfer(uuid,numeric,uuid,text,jsonb,text,uuid,date,date,jsonb,jsonb) to "postgres";
grant EXECUTE on function public.create_saving_with_transfer(uuid,numeric,uuid,text,jsonb,text,uuid,date,date,jsonb,jsonb,text,text,text) to "postgres";
grant EXECUTE on function public.decline_household_invitation(uuid) to "postgres";
grant EXECUTE on function public.delete_transaction(uuid) to "postgres";
grant EXECUTE on function public.detect_matured_savings(uuid) to "postgres";
grant EXECUTE on function public.dismiss_inbox_item(uuid) to "postgres";
grant EXECUTE on function public.early_withdraw_saving(uuid,uuid,text) to "postgres";
grant EXECUTE on function public.enforce_active_jar_on_transaction() to "postgres";
grant EXECUTE on function public.enforce_goal_funding_link_integrity() to "postgres";
grant EXECUTE on function public.enqueue_payment_reminder(text,uuid,numeric,character,text,timestamp with time zone,jsonb) to "postgres";
grant EXECUTE on function public.enqueue_savings_maturity(uuid) to "postgres";
grant EXECUTE on function public.enqueue_savings_maturity_cascade(uuid) to "postgres";
grant EXECUTE on function public.ensure_miscellaneous_jar(uuid) to "postgres";
grant EXECUTE on function public.get_investment_home_summary_inputs() to "postgres";
grant EXECUTE on function public.get_invitation_preview(uuid) to "postgres";
grant EXECUTE on function public.get_or_create_savings_product_account(uuid) to "postgres";
grant EXECUTE on function public.guard_cross_resource_mutation() to "postgres";
grant EXECUTE on function public.guard_financial_root_mutation() to "postgres";
grant EXECUTE on function public.guard_goal_funding_link_mutation() to "postgres";
grant EXECUTE on function public.guard_historical_jar_period_rule_snapshot() to "postgres";
grant EXECUTE on function public.guard_inbox_source_mutation() to "postgres";
grant EXECUTE on function public.guard_investment_mutation_12b() to "postgres";
grant EXECUTE on function public.guard_loan_payment_account_eligibility() to "postgres";
grant EXECUTE on function public.guard_ownership_immutable() to "postgres";
grant EXECUTE on function public.guard_transaction_mutation() to "postgres";
grant EXECUTE on function public.household_base_currency(uuid) to "postgres";
grant EXECUTE on function public.investment_active_household() to "postgres";
grant EXECUTE on function public.investment_add_holding(uuid,uuid,numeric,numeric) to "postgres";
grant EXECUTE on function public.investment_assert_account_12b(uuid,uuid) to "postgres";
grant EXECUTE on function public.investment_assert_holding_12b(uuid,uuid) to "postgres";
grant EXECUTE on function public.investment_consume_holding(uuid,uuid,numeric) to "postgres";
grant EXECUTE on function public.investment_operation_receipt(uuid,boolean) to "postgres";
grant EXECUTE on function public.is_debt_movement_account_type(text) to "postgres";
grant EXECUTE on function public.is_household_admin(uuid) to "postgres";
grant EXECUTE on function public.is_household_member(uuid) to "postgres";
grant EXECUTE on function public.is_month_ritual_locked(uuid,date) to "postgres";
grant EXECUTE on function public.is_resource_owner(uuid,uuid) to "postgres";
grant EXECUTE on function public.leave_household() to "postgres";
grant EXECUTE on function public.list_active_market_price_targets(text,text) to "postgres";
grant EXECUTE on function public.prevent_owned_membership_delete() to "postgres";
grant EXECUTE on function public.preview_early_withdraw_saving(uuid,date) to "postgres";
grant EXECUTE on function public.produce_inbox_item(uuid,text,text,uuid,numeric,text,text,jsonb,uuid,timestamp with time zone,uuid,uuid,text) to "postgres";
grant EXECUTE on function public.project_investment_fee_event() to "postgres";
grant EXECUTE on function public.project_investment_operation_event() to "postgres";
grant EXECUTE on function public.reallocate_jar_capacity(uuid,uuid,numeric,boolean,text) to "postgres";
grant EXECUTE on function public.reassign_goal_funding_source(uuid,uuid,uuid) to "postgres";
grant EXECUTE on function public.record_card_transaction(uuid,text,numeric,date,text,uuid,uuid,text) to "postgres";
grant EXECUTE on function public.record_debt_payment(uuid,uuid,numeric,date,text,text) to "postgres";
grant EXECUTE on function public.record_investment_buy(uuid,uuid,numeric,numeric,numeric,numeric,date,jsonb,text,text) to "postgres";
grant EXECUTE on function public.record_investment_conversion(uuid,uuid,numeric,numeric,numeric,numeric,date,jsonb,text,text) to "postgres";
grant EXECUTE on function public.record_investment_income(uuid,uuid,numeric,text,date,text,text) to "postgres";
grant EXECUTE on function public.record_investment_initial_purchase(text,text,numeric,numeric,uuid,date,text,text,jsonb,text,text,text) to "postgres";
grant EXECUTE on function public.record_investment_initial_purchase(text,text,numeric,numeric,uuid,date,text,text,jsonb,text,text,text,text) to "postgres";
grant EXECUTE on function public.record_investment_initial_purchase(text,text,numeric,numeric,uuid,date,text,text,jsonb,text,text,text,text,numeric,uuid) to "postgres";
grant EXECUTE on function public.record_investment_opening_position(text,text,numeric,date,text,text,numeric,numeric,text,text,text,text,uuid) to "postgres";
grant EXECUTE on function public.record_investment_sell(uuid,uuid,numeric,numeric,numeric,numeric,date,jsonb,text,text) to "postgres";
grant EXECUTE on function public.record_investment_valuation(uuid,numeric,numeric,date,text,text,text) to "postgres";
grant EXECUTE on function public.record_liability_payment(uuid,numeric) to "postgres";
grant EXECUTE on function public.record_loan_payment(uuid,uuid,numeric,numeric,date) to "postgres";
grant EXECUTE on function public.record_loan_payment(uuid,uuid,text,date,text) to "postgres";
grant EXECUTE on function public.record_owned_account_transfer(uuid,uuid,numeric,date,text,text) to "postgres";
grant EXECUTE on function public.record_saving_renewal_decision(uuid,jsonb,boolean) to "postgres";
grant EXECUTE on function public.record_transaction(uuid,text,numeric,date,text,uuid,uuid,text) to "postgres";
grant EXECUTE on function public.refund_transaction(uuid,numeric,uuid,text,date) to "postgres";
grant EXECUTE on function public.release_market_price_sync_lock(text,uuid) to "postgres";
grant EXECUTE on function public.remove_household_member(uuid) to "postgres";
grant EXECUTE on function public.renew_saving_cycle(uuid,text,jsonb,numeric,date,date,uuid,jsonb) to "postgres";
grant EXECUTE on function public.resolve_inbox_item_to_jar(uuid,uuid) to "postgres";
grant EXECUTE on function public.revoke_household_invitation(uuid) to "postgres";
grant EXECUTE on function public.rollover_saving_cycle(uuid,text,uuid,uuid,date,date,text) to "postgres";
grant EXECUTE on function public.run_inbox_staleness_worker() to "postgres";
grant EXECUTE on function public.run_month_ritual_autolock_for_household(uuid,date) to "postgres";
grant EXECUTE on function public.run_month_ritual_autolock_worker() to "postgres";
grant EXECUTE on function public.run_month_ritual_autolock_worker_all() to "postgres";
grant EXECUTE on function public.savings_calculate_interest(numeric,numeric,date,date,text,date) to "postgres";
grant EXECUTE on function public.savings_early_withdrawal_breakdown(uuid,date) to "postgres";
grant EXECUTE on function public.savings_is_eligible_liquid_account(uuid,uuid) to "postgres";
grant EXECUTE on function public.savings_simple_interest(numeric,numeric,integer) to "postgres";
grant EXECUTE on function public.savings_tax_for_interest(numeric,text,numeric) to "postgres";
grant EXECUTE on function public.set_transaction_tags(uuid,uuid[]) to "postgres";
grant EXECUTE on function public.settle_card_payment(uuid,uuid,numeric,date,text) to "postgres";
grant EXECUTE on function public.settle_saving_cycle(uuid,uuid,text) to "postgres";
grant EXECUTE on function public.sync_loan_debt_attention_inbox() to "postgres";
grant EXECUTE on function public.transactions_set_is_reversal() to "postgres";
grant EXECUTE on function public.try_acquire_market_price_sync_lock(text,uuid,timestamp with time zone) to "postgres";
grant EXECUTE on function public.update_household_policies(text,text,text) to "postgres";
grant EXECUTE on function public.update_household_preferences(text,text,text) to "postgres";
grant EXECUTE on function public.update_loan_interest_rate(uuid,numeric,date,text,jsonb,numeric,numeric,numeric,date,date) to "postgres";
grant EXECUTE on function public.update_transaction(uuid,uuid,text,numeric,date,text,uuid,uuid) to "postgres";
grant EXECUTE on function public.validate_credit_card_installment_source() to "postgres";
grant EXECUTE on function public.validate_transaction_tag_assignment() to "postgres";
grant EXECUTE on function public.list_active_market_price_targets(text,text) to "service_role";
grant EXECUTE on function public.release_market_price_sync_lock(text,uuid) to "service_role";
grant EXECUTE on function public.try_acquire_market_price_sync_lock(text,uuid,timestamp with time zone) to "service_role";
do $$
begin
  if to_regclass('cron.job') is not null then
    if not exists (select 1 from cron.job where jobname = 'month_ritual_autolock_daily') then
      perform cron.schedule('month_ritual_autolock_daily', '0 1 * * *', 'select public.run_month_ritual_autolock_worker_all()');
    end if;
  end if;
exception when others then
  raise notice 'month ritual cron unavailable; scheduled autolock remains disabled';
end;
$$;
