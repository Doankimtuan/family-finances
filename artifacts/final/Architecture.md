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

# Architecture

## Architecture Specifications

- **spec-arch-pillars**: Architecture pillars (as-is): Core Accounting, Budgeting/Planning/Goals, Jars Intent Layer — per DOMAIN_MODEL.
- **spec-arch-proxy**: Edge/session entry is proxy.ts (no middleware.ts) as discovered in prior reviews / repo.
- **spec-arch-jars-engine**: Jar domain engines (as-is): allocation-engine, rule-engine, validation, rollover-engine, snapshot-engine.

## Technical Baseline

- **spec-arch-stack**: Technical stack (as-is): Next.js App Router + React, Supabase Postgres/Auth/RLS, TanStack Query, Zustand, Zod, server actions + route handlers.

## Domain Layering

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

## Security Architecture Notes

- **spec-sec-perm-auth-required**: Security/authorization requirement: resolveActionContext requires authenticated Supabase user.
- **spec-sec-perm-household-required**: Security/authorization requirement: Most actions require active household_members row for the user.
- **spec-sec-perm-page-gate**: Security/authorization requirement: Pages: no user → /login; no household → /household.
- **spec-sec-perm-rls-member**: Security/authorization requirement: RLS helper is_household_member / is_household_member_cached gates table access by membership.
- **spec-sec-perm-member-equality**: Security/authorization requirement: Partner and admin share most RLS table rights; admin is primarily an app-layer settings gate.
- **spec-sec-perm-admin-settings**: Security/authorization requirement: Admin-only app actions: updateHouseholdSettingsAction, updateAssumptionsAction.
- **spec-sec-perm-bootstrap-partner**: Security/authorization requirement: Household creator is inserted as partner via create_household_with_owner; invite accept also partner.
- **spec-sec-perm-first-member**: Security/authorization requirement: RLS allows first-member insert exception during household setup.
- **spec-sec-perm-service-role**: Security/authorization requirement: Service-role/admin RPCs for aggregates/insights/jar reporting bypass member RLS.
- **spec-sec-perm-categories-system**: Security/authorization requirement: System categories (null household) readable; household categories member-writable.

## Deployment Topology Notes

- **spec-deploy-next**: Deployment target assumed by repo tooling: Next.js application (scripts: dev/build/start) with Supabase backend.
- **spec-deploy-env**: Environment configuration surface documented by .env.local.example (no secret values in specs).

## State Machines

- **sm-jar-review**: jar_review_queue: pending → resolved | dismissed.
- **sm-jar-lifecycle**: Jar: active (is_archived=false) → archived / soft-deleted; movements blocked when inactive.
- **sm-month-close**: jar_month_close_runs: draft → processing → approved | failed.
- **sm-savings**: savings_accounts: active → maturing_soon → matured → renewed|withdrawn | cancelled.
- **sm-maturity-action**: savings_maturity_actions: renew_same | switch_plan | withdraw; withdraw partial|full.
- **sm-installment**: installment_plans: active → completed | cancelled.
- **sm-invitation**: invitations: pending → accepted | revoked | expired.
- **sm-goal**: goals: active | paused | completed | cancelled.
- **sm-scenario**: scenarios: draft | saved | archived.
- **sm-transaction**: transactions: cleared | pending.
- **sm-onboarding-ui**: Onboarding UI progress steps 1–8 (shell TOTAL_STEPS=8); no durable step state found in shell.

## Permissions Model

- **perm-auth-required**: resolveActionContext requires authenticated Supabase user.
- **perm-household-required**: Most actions require active household_members row for the user.
- **perm-page-gate**: Pages: no user → /login; no household → /household.
- **perm-rls-member**: RLS helper is_household_member / is_household_member_cached gates table access by membership.
- **perm-member-equality**: Partner and admin share most RLS table rights; admin is primarily an app-layer settings gate.
- **perm-admin-settings**: Admin-only app actions: updateHouseholdSettingsAction, updateAssumptionsAction.
- **perm-bootstrap-partner**: Household creator is inserted as partner via create_household_with_owner; invite accept also partner.
- **perm-first-member**: RLS allows first-member insert exception during household setup.
- **perm-service-role**: Service-role/admin RPCs for aggregates/insights/jar reporting bypass member RLS.
- **perm-categories-system**: System categories (null household) readable; household categories member-writable.
