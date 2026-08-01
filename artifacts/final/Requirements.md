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

# Requirements

## Requirements Catalog (42)

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

## Coverage

- Business rules: 14
- Features: 18
- Acceptance criteria: 14
