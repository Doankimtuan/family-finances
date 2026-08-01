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

# Business Rules

## Validated Business Rules

- **br-real-vs-virtual**: Jar movements must not be treated as real ledger mutations; real money lives in accounts/transactions.
- **br-income-allocate**: Income allocation uses month plans (percent|fixed) then suggest/auto per income_auto_allocate policy (off|suggest|auto_high_confidence).
- **br-expense-allocate**: Expense allocation uses jar_category_rules/jar_rules; auto if mapped and expense_auto_allocate!=off, else jar_review_queue pending.
- **br-jar-active**: Movements require an active jar (not archived / not soft-deleted).
- **br-closed-month**: Approved month close (jar_month_close_runs.status=approved) blocks normal movements; corrections use correction workflow.
- **br-amount-positive**: Movement amounts must be positive; balanceDelta ∈ {-1,0,1}.
- **br-overspend-policy**: Household overspend_policy is warn|block|allow_negative.
- **br-month-close-mode**: month_close_mode is manual|assisted.
- **br-assumptions-admin**: Household planning assumptions (inflation, growth rates) are admin-only updates in settings actions.
- **br-one-household**: create_household_with_owner enforces one active household per user.
- **br-rls-member**: RLS grants household-scoped CRUD via is_household_member(household_id) for most product tables.
- **br-savings-maturity**: Savings maturity actions renew_same|switch_plan|withdraw; withdraw modes partial|full; terminal statuses guarded.
- **br-installment-complete**: Installment plans complete when paid_installments >= num_installments.
- **br-action-context**: Server actions require authenticated user and active household_members row via resolveActionContext.

## Related Domain Entities

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

## Related Workflows

- **wf-onboarding**: Onboarding: welcome→members→money→assets→debts→income/expenses→first-goal→first-insight (8 steps).
- **wf-household-bootstrap**: Household lifecycle: auth → create household RPC → optional invite → accept as partner.
- **wf-jar-sync**: Transaction/savings event → syncTransactionToJarIntent → auto-resolve or jar_review_queue pending.
- **wf-jar-review**: User resolves /jars/review items → resolveJarReviewItemAction → resolveReviewToMovements.
- **wf-month-close**: Month close: preview → approve → overspend cover + rollover → snapshots (draft→processing→approved|failed).
- **wf-activity**: Activity: create income/expense/transfer → may trigger jar sync.
- **wf-savings**: Savings: create → active lifecycle → mature/withdraw via API/UI forms.
- **wf-card-emi**: Card: billing item → convert to installment → settle payments until completed/cancelled.

## Related State Machines

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
