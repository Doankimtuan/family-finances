---
generated_by: AIOS Final Composition
run_id: run_final_composition_20260801T131500Z
business_discovery: run_business_discovery_20260801T122000Z
specification: run_specification_20260801T130500Z
created_at: 2026-08-01T13:12:48Z
status: FROZEN
invent_business_logic: false
redesign: false
---

# Database

## Database Specifications

- **spec-db-profiles**: Database entity `profiles` is part of the as-is schema contract (see cited migrations/domain discovery).
- **spec-db-households**: Database entity `households` is part of the as-is schema contract (see cited migrations/domain discovery).
- **spec-db-household_members**: Database entity `household_members` is part of the as-is schema contract (see cited migrations/domain discovery).
- **spec-db-household_invitations**: Database entity `household_invitations` is part of the as-is schema contract (see cited migrations/domain discovery).
- **spec-db-accounts**: Database entity `accounts` is part of the as-is schema contract (see cited migrations/domain discovery).
- **spec-db-categories**: Database entity `categories` is part of the as-is schema contract (see cited migrations/domain discovery).
- **spec-db-transactions**: Database entity `transactions` is part of the as-is schema contract (see cited migrations/domain discovery).
- **spec-db-recurring_rules**: Database entity `recurring_rules` is part of the as-is schema contract (see cited migrations/domain discovery).
- **spec-db-assets**: Database entity `assets` is part of the as-is schema contract (see cited migrations/domain discovery).
- **spec-db-liabilities**: Database entity `liabilities` is part of the as-is schema contract (see cited migrations/domain discovery).
- **spec-db-goals**: Database entity `goals` is part of the as-is schema contract (see cited migrations/domain discovery).
- **spec-db-scenarios**: Database entity `scenarios` is part of the as-is schema contract (see cited migrations/domain discovery).
- **spec-db-insights**: Database entity `insights` is part of the as-is schema contract (see cited migrations/domain discovery).
- **spec-db-health_score_snapshots**: Database entity `health_score_snapshots` is part of the as-is schema contract (see cited migrations/domain discovery).
- **spec-db-jars**: Database entity `jars` is part of the as-is schema contract (see cited migrations/domain discovery).
- **spec-db-jar_movements**: Database entity `jar_movements` is part of the as-is schema contract (see cited migrations/domain discovery).
- **spec-db-jar_review_queue**: Database entity `jar_review_queue` is part of the as-is schema contract (see cited migrations/domain discovery).
- **spec-db-jar_rules**: Database entity `jar_rules` is part of the as-is schema contract (see cited migrations/domain discovery).
- **spec-db-jar_month_plans**: Database entity `jar_month_plans` is part of the as-is schema contract (see cited migrations/domain discovery).
- **spec-db-jar_month_close_runs**: Database entity `jar_month_close_runs` is part of the as-is schema contract (see cited migrations/domain discovery).
- **spec-db-savings_accounts**: Database entity `savings_accounts` is part of the as-is schema contract (see cited migrations/domain discovery).
- **spec-db-savings_withdrawals**: Database entity `savings_withdrawals` is part of the as-is schema contract (see cited migrations/domain discovery).
- **spec-db-savings_maturity_actions**: Database entity `savings_maturity_actions` is part of the as-is schema contract (see cited migrations/domain discovery).
- **spec-db-installment_plans**: Database entity `installment_plans` is part of the as-is schema contract (see cited migrations/domain discovery).
- **spec-db-rls**: Database access control: membership RLS via is_household_member / cached helpers; service_role for select RPCs.
- **spec-db-migrations-count**: Schema evolution is migration-based; repository currently contains 51 SQL migrations under supabase/migrations/.

## Domain Entities

- **dom-household**: Entity Household: name, currency, locale, timezone, assumptions, created_by.
- **dom-member**: Entity Member: role partner|admin, is_active; linked to auth user.
- **dom-invitation**: Entity Invitation: status pending|accepted|revoked|expired.
- **dom-account**: Entity Account: types cash/checking/savings/ewallet/brokerage/credit_card/other; archive.
- **dom-transaction**: Entity Transaction: income|expense|transfer; cleared|pending.
- **dom-category**: Entity Category: income|expense; system + household-scoped.
- **dom-recurring**: Entity RecurringRule: weekly/monthly templates.
- **dom-asset**: Entity Asset: classes incl. crypto; qty/price history; cashflows.
- **dom-liability**: Entity Liability/Debt: mortgage/loan types; repayment schedules.
- **dom-goal**: Entity Goal: types; status active|paused|completed|cancelled.
- **dom-jar**: Entity Jar: types essential/investment/long_term_saving/education/play/give; archive.
- **dom-jar-intent**: Jar intent layer: plans, rules, review_queue, movements, events, snapshots, close_runs.
- **dom-savings**: Entity SavingsAccount: bank/third_party; status lifecycle; withdrawals; maturity actions.
- **dom-installment**: Entity InstallmentPlan: active|completed|cancelled; billing items.
- **dom-scenario**: Entity Scenario: draft|saved|archived (decision tools).

## Soft Notes

- Prefer migration truth and BD domain pack over stale narrative docs.
- Soft-delete and transfer-shape narratives remain documented as soft notes from BD validation.
