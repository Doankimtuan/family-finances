---
generated_by: Product Strategy Board
run_id: run_product_strategy_20260801T140000Z
status: PRODUCT_V2_CANDIDATE
source_of_truth: NOT_ADOPTED
v1_unchanged: true
created_at: 2026-08-01T13:59:30Z
---

# Business Rules v2

Rules below are **product rules**. They retain V1 intent where still valid; wording and defaults are rewritten.

### BR2-01 Truth separation *(from br-real-vs-virtual)*

Jar/plan figures are intentions. Only Money/ledger balances represent real funds. UI must not conflate them.

### BR2-02 Membership gate *(from br-action-context, br-rls-member)*

All household money actions require an authenticated user with active membership.

### BR2-03 Active intention targets *(from br-jar-active)*

Allocations only target Active jars. Paused/Archived jars are non-targets (labels clarified).

### BR2-04 Income placement *(from br-income-allocate)*

Income is placed into the monthly plan via percent or fixed plan. Automation modes: Off · Suggest · Auto (high confidence). **Default: Suggest.**

### BR2-05 Expense placement *(from br-expense-allocate)*

Mapped expenses may auto-assign when automation ≠ Off. Unmapped expenses create Inbox decisions.

### BR2-06 Amounts *(from br-amount-positive)*

Stored movement magnitudes are positive; direction encodes in/out. Users see signed plain language.

### BR2-07 Overspend policy *(from br-overspend-policy)*

Household chooses Warn · Block · Allow negative. **Default for new households: Warn.**

### BR2-08 Month ritual lock *(from br-closed-month)*

After an approved Month Ritual, normal plan movements freeze; corrections use an explicit correction path.

### BR2-09 Ritual mode *(from br-month-close-mode)*

Assisted ritual is default; Manual is power-user.

### BR2-10 Savings maturity *(from br-savings-maturity)*

Maturity actions: renew same · switch plan · withdraw (partial/full) with terminal state guards.

### BR2-11 Installment completion *(from br-installment-complete)*

Plan completes when paid installments reach planned count.

### BR2-12 One household (MVP) *(from br-one-household)*

One active household per user in v2 Now. Multi-household is Later.

### BR2-13 Policy changes are visible *(evolves br-assumptions-admin)*

Material policy/assumption changes are partner-visible (audit). Admin elevation may still gate some edits, but silent sole-operator UX is rejected.

### BR2-14 AI non-invention *(product v2)*

AI may explain and suggest using household data. AI must not invent balances or execute money movement without an explicit user/policy path.
