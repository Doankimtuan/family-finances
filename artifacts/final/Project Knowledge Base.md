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

# Project Knowledge Base

## Knowledge Entries

- **kn-pillar-real-vs-virtual**: Family Finances separates real accounting (accounts + transactions) from virtual jar intents (jars + jar_movements + review queue).
- **kn-household-tenancy**: Household is the tenancy root; members have roles partner|admin; invitations pending|accepted|revoked|expired.
- **kn-roles-naming**: Schema roles are partner/admin (not owner/member). RPC create_household_with_owner inserts role partner.
- **kn-jars-docs**: Jar allocation and review behavior is documented in docs/JAR_ALLOCATION_REVIEW.md and docs/JAR_FINAL_ARCHITECTURE.md.
- **kn-feature-flags**: Feature flags gate jars, cashflow, insights, and health surfaces via lib/config/features.ts.
- **kn-auth-gate**: Unauthenticated users redirect to /login; authenticated users without household redirect to /household.

## Features

- **ft-auth**: Auth login/signup at /login.
- **ft-household**: Household create/invite/accept at /household.
- **ft-onboarding**: Eight-step onboarding wizard under /onboarding/*.
- **ft-dashboard**: Dashboard aggregates household financial overview at /dashboard.
- **ft-accounts**: Accounts hub including cash/checking and detail at /accounts and /accounts/[id].
- **ft-savings**: Fixed-term savings accounts with mature/withdraw at /accounts/savings*.
- **ft-cards**: Credit card detail with billing items and installments at /accounts/card/[id].
- **ft-assets**: Assets including crypto and investment profiles at /assets/[id].
- **ft-debts**: Debt/liability management via accounts debt actions and onboarding debts step.
- **ft-activity**: Transaction activity log at /activity.
- **ft-goals**: Goals with contributions/status at /goals.
- **ft-jars**: Virtual jars: list, detail, history, setup, review queue.
- **ft-categories**: Category management at /categories and settings/categories.
- **ft-recurring**: Recurring rules at /recurring.
- **ft-decision-tools**: Decision tools / scenarios at /decision-tools.
- **ft-settings**: Settings: profile, household, members, assumptions, cash-flow, categories.
- **ft-insights**: AI insights foundation (flagged) with migrations and lib/insights.
- **ft-health**: Health scoring surface behind feature flag.

## Domain

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
- **dom-bounded-ledger**: Bounded context Real Ledger: accounts, transactions, assets, liabilities, savings.
- **dom-bounded-jars**: Bounded context Virtual Jars: jars, movements, review queue, month close.
- **dom-bounded-tenancy**: Bounded context Household tenancy & auth.

## Permissions

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

## User Journeys

- **uj-daily-partner**: Daily partner: login → dashboard/accounts/activity/goals → log cashflows → clear jar review → manage savings/card/goals.
- **uj-new-household**: New household: signup → create household → invite partner → onboarding 8 steps → first insight.
- **uj-jar-setup-review**: Jar journey: setup presets/plans/rules → cashflows enqueue/auto → resolve review → optional month close.
- **uj-savings-maturity**: Savings journey: open fixed-term → track status → mature/withdraw/renew via savings APIs/UI.
- **uj-card-installment**: Card journey: view billing → convert to EMI → settle until completed.
- **uj-settings-admin**: Admin settings journey: household settings + assumptions (admin-gated).

## Workflows

- **wf-onboarding**: Onboarding: welcome→members→money→assets→debts→income/expenses→first-goal→first-insight (8 steps).
- **wf-household-bootstrap**: Household lifecycle: auth → create household RPC → optional invite → accept as partner.
- **wf-jar-sync**: Transaction/savings event → syncTransactionToJarIntent → auto-resolve or jar_review_queue pending.
- **wf-jar-review**: User resolves /jars/review items → resolveJarReviewItemAction → resolveReviewToMovements.
- **wf-month-close**: Month close: preview → approve → overspend cover + rollover → snapshots (draft→processing→approved|failed).
- **wf-activity**: Activity: create income/expense/transfer → may trigger jar sync.
- **wf-savings**: Savings: create → active lifecycle → mature/withdraw via API/UI forms.
- **wf-card-emi**: Card: billing item → convert to installment → settle payments until completed/cancelled.
