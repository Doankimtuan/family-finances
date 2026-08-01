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

# Software Requirements Specification (SRS)

## Scope

This SRS consolidates functional, technical, UI, security, and deployment specifications for Family Finances.

## Functional Requirements

- **spec-fn-wf-onboarding**: Functional workflow: Onboarding: welcome→members→money→assets→debts→income/expenses→first-goal→first-insight (8 steps).
- **spec-fn-wf-household-bootstrap**: Functional workflow: Household lifecycle: auth → create household RPC → optional invite → accept as partner.
- **spec-fn-wf-jar-sync**: Functional workflow: Transaction/savings event → syncTransactionToJarIntent → auto-resolve or jar_review_queue pending.
- **spec-fn-wf-jar-review**: Functional workflow: User resolves /jars/review items → resolveJarReviewItemAction → resolveReviewToMovements.
- **spec-fn-wf-month-close**: Functional workflow: Month close: preview → approve → overspend cover + rollover → snapshots (draft→processing→approved|failed).
- **spec-fn-wf-activity**: Functional workflow: Activity: create income/expense/transfer → may trigger jar sync.
- **spec-fn-wf-savings**: Functional workflow: Savings: create → active lifecycle → mature/withdraw via API/UI forms.
- **spec-fn-wf-card-emi**: Functional workflow: Card: billing item → convert to installment → settle payments until completed/cancelled.
- **spec-uj-uj-daily-partner**: User journey must remain supported: Daily partner: login → dashboard/accounts/activity/goals → log cashflows → clear jar review → manage savings/card/goals.
- **spec-uj-uj-new-household**: User journey must remain supported: New household: signup → create household → invite partner → onboarding 8 steps → first insight.
- **spec-uj-uj-jar-setup-review**: User journey must remain supported: Jar journey: setup presets/plans/rules → cashflows enqueue/auto → resolve review → optional month close.
- **spec-uj-uj-savings-maturity**: User journey must remain supported: Savings journey: open fixed-term → track status → mature/withdraw/renew via savings APIs/UI.
- **spec-uj-uj-card-installment**: User journey must remain supported: Card journey: view billing → convert to EMI → settle until completed.
- **spec-uj-uj-settings-admin**: User journey must remain supported: Admin settings journey: household settings + assumptions (admin-gated).
- **spec-sm-sm-jar-review**: State machine constraint (as-is): jar_review_queue: pending → resolved | dismissed.
- **spec-sm-sm-jar-lifecycle**: State machine constraint (as-is): Jar: active (is_archived=false) → archived / soft-deleted; movements blocked when inactive.
- **spec-sm-sm-month-close**: State machine constraint (as-is): jar_month_close_runs: draft → processing → approved | failed.
- **spec-sm-sm-savings**: State machine constraint (as-is): savings_accounts: active → maturing_soon → matured → renewed|withdrawn | cancelled.
- **spec-sm-sm-maturity-action**: State machine constraint (as-is): savings_maturity_actions: renew_same | switch_plan | withdraw; withdraw partial|full.
- **spec-sm-sm-installment**: State machine constraint (as-is): installment_plans: active → completed | cancelled.
- **spec-sm-sm-invitation**: State machine constraint (as-is): invitations: pending → accepted | revoked | expired.
- **spec-sm-sm-goal**: State machine constraint (as-is): goals: active | paused | completed | cancelled.
- **spec-sm-sm-scenario**: State machine constraint (as-is): scenarios: draft | saved | archived.
- **spec-sm-sm-transaction**: State machine constraint (as-is): transactions: cleared | pending.
- **spec-sm-sm-onboarding-ui**: State machine constraint (as-is): Onboarding UI progress steps 1–8 (shell TOTAL_STEPS=8); no durable step state found in shell.

## Non-Functional / Technical

- **spec-arch-stack**: Technical stack (as-is): Next.js App Router + React, Supabase Postgres/Auth/RLS, TanStack Query, Zustand, Zod, server actions + route handlers.

## UI Specifications

- **spec-ui-principles**: UI standards (existing): calm/precise/warm/honest/grounded; 3-tier hierarchy glance→review→deep dive — docs/DESIGN_PRINCIPLES.md.
- **spec-ui-routes**: UI route inventory locked to 36 discovered page.tsx files under app/.
- **spec-ui-nav**: Primary navigation includes dashboard/accounts/activity/goals patterns per bottom-tab-bar and journeys.

## Security Specifications

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

## Deployment Specifications

- **spec-deploy-next**: Deployment target assumed by repo tooling: Next.js application (scripts: dev/build/start) with Supabase backend.
- **spec-deploy-env**: Environment configuration surface documented by .env.local.example (no secret values in specs).

## Coding Standards

- **spec-code-ts**: Coding standard: TypeScript strict project (tsconfig.json) with ESLint (eslint.config.mjs / eslint-config-next).
- **spec-code-zod**: Coding standard: Zod validation at form/API edges as used across lib/** and actions.
- **spec-code-server-actions**: Coding standard: server mutations go through action modules + resolveActionContext/audit helpers.
- **spec-code-jars-boundary**: Coding standard: jar business rules live under lib/jars/domain/*; do not re-encode conflicting rules in UI.

## Requirements Catalog

- **req-br-real-vs-virtual**: Jar movements must not be treated as real ledger mutations; real money lives in accounts/transactions.
- **req-br-income-allocate**: Income allocation uses month plans (percent|fixed) then suggest/auto per income_auto_allocate policy (off|suggest|auto_high_confidence).
- **req-br-expense-allocate**: Expense allocation uses jar_category_rules/jar_rules; auto if mapped and expense_auto_allocate!=off, else jar_review_queue pending.
- **req-br-jar-active**: Movements require an active jar (not archived / not soft-deleted).
- **req-br-closed-month**: Approved month close (jar_month_close_runs.status=approved) blocks normal movements; corrections use correction workflow.
- **req-br-amount-positive**: Movement amounts must be positive; balanceDelta ∈ {-1,0,1}.
- **req-br-overspend-policy**: Household overspend_policy is warn|block|allow_negative.
- **req-br-month-close-mode**: month_close_mode is manual|assisted.
- **req-br-assumptions-admin**: Household planning assumptions (inflation, growth rates) are admin-only updates in settings actions.
- **req-br-one-household**: create_household_with_owner enforces one active household per user.
- **req-br-rls-member**: RLS grants household-scoped CRUD via is_household_member(household_id) for most product tables.
- **req-br-savings-maturity**: Savings maturity actions renew_same|switch_plan|withdraw; withdraw modes partial|full; terminal statuses guarded.
- **req-br-installment-complete**: Installment plans complete when paid_installments >= num_installments.
- **req-br-action-context**: Server actions require authenticated user and active household_members row via resolveActionContext.
- **req-ft-auth**: System SHALL provide the discovered feature: Auth login/signup at /login.
- **req-ft-household**: System SHALL provide the discovered feature: Household create/invite/accept at /household.
- **req-ft-onboarding**: System SHALL provide the discovered feature: Eight-step onboarding wizard under /onboarding/*.
- **req-ft-dashboard**: System SHALL provide the discovered feature: Dashboard aggregates household financial overview at /dashboard.
- **req-ft-accounts**: System SHALL provide the discovered feature: Accounts hub including cash/checking and detail at /accounts and /accounts/[id].
- **req-ft-savings**: System SHALL provide the discovered feature: Fixed-term savings accounts with mature/withdraw at /accounts/savings*.
- **req-ft-cards**: System SHALL provide the discovered feature: Credit card detail with billing items and installments at /accounts/card/[id].
- **req-ft-assets**: System SHALL provide the discovered feature: Assets including crypto and investment profiles at /assets/[id].
- **req-ft-debts**: System SHALL provide the discovered feature: Debt/liability management via accounts debt actions and onboarding debts step.
- **req-ft-activity**: System SHALL provide the discovered feature: Transaction activity log at /activity.
- **req-ft-goals**: System SHALL provide the discovered feature: Goals with contributions/status at /goals.
- **req-ft-jars**: System SHALL provide the discovered feature: Virtual jars: list, detail, history, setup, review queue.
- **req-ft-categories**: System SHALL provide the discovered feature: Category management at /categories and settings/categories.
- **req-ft-recurring**: System SHALL provide the discovered feature: Recurring rules at /recurring.
- **req-ft-decision-tools**: System SHALL provide the discovered feature: Decision tools / scenarios at /decision-tools.
- **req-ft-settings**: System SHALL provide the discovered feature: Settings: profile, household, members, assumptions, cash-flow, categories.
- **req-ft-insights**: System SHALL provide the discovered feature: AI insights foundation (flagged) with migrations and lib/insights.
- **req-ft-health**: System SHALL provide the discovered feature: Health scoring surface behind feature flag.
- **req-perm-auth-required**: System SHALL enforce: resolveActionContext requires authenticated Supabase user.
- **req-perm-household-required**: System SHALL enforce: Most actions require active household_members row for the user.
- **req-perm-page-gate**: System SHALL enforce: Pages: no user → /login; no household → /household.
- **req-perm-rls-member**: System SHALL enforce: RLS helper is_household_member / is_household_member_cached gates table access by membership.
- **req-perm-member-equality**: System SHALL enforce: Partner and admin share most RLS table rights; admin is primarily an app-layer settings gate.
- **req-perm-admin-settings**: System SHALL enforce: Admin-only app actions: updateHouseholdSettingsAction, updateAssumptionsAction.
- **req-perm-bootstrap-partner**: System SHALL enforce: Household creator is inserted as partner via create_household_with_owner; invite accept also partner.
- **req-perm-first-member**: System SHALL enforce: RLS allows first-member insert exception during household setup.
- **req-perm-service-role**: System SHALL enforce: Service-role/admin RPCs for aggregates/insights/jar reporting bypass member RLS.
- **req-perm-categories-system**: System SHALL enforce: System categories (null household) readable; household categories member-writable.

## Acceptance Criteria Summary

- **ac-br-real-vs-virtual**: Given a jar movement is created, When account balances are queried, Then real ledger balances are unchanged.
- **ac-br-jar-active**: Given a jar is archived or soft-deleted, When a normal movement is attempted, Then validation rejects the movement.
- **ac-br-closed-month**: Given a month close run is approved, When a normal movement is attempted for that month, Then the system requires the correction workflow.
- **ac-br-rls-member**: Given a user without active household membership, When querying household-scoped tables, Then RLS returns no rows.
- **ac-br-action-context**: Given an unauthenticated caller, When invoking a server action using resolveActionContext, Then the action fails unauthorized.
- **ac-br-assumptions-admin**: Given a partner (non-admin) member, When updating household assumptions, Then the settings action denies the update.
- **ac-br-one-household**: Given a user already in an active household, When create_household_with_owner is called again, Then creation is rejected per RPC rules.
- **ac-br-savings-maturity**: Given a savings account in a terminal status, When mature/withdraw is invoked, Then RPC/service guards prevent invalid transitions.
- **ac-br-installment-complete**: Given paid_installments reaches num_installments, When settle runs, Then installment plan status becomes completed.
- **ac-br-expense-allocate**: Given an expense with a mapped category rule and expense_auto_allocate enabled, When synced, Then a jar movement or resolved allocation occurs without inventing new policy values.
- **ac-br-income-allocate**: Given income and a month plan, When allocation runs under income_auto_allocate=suggest, Then suggestions are produced for review rather than silent invented splits.
- **ac-ft-onboarding**: Given a new household, When onboarding is followed, Then the eight discovered steps (welcome→…→first-insight) are available as documented routes.
- **ac-ft-jars**: Given a member, When navigating jars surfaces, Then list/detail/history/setup/review routes exist as discovered.
- **ac-ft-auth**: Given no session, When accessing gated pages, Then redirect to /login as discovered.
