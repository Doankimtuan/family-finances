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

# Acceptance Criteria

## Acceptance Catalog (14)

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

## Linkage Rule

Every acceptance entry includes a `requirement_id` linking to the Requirements pack.
