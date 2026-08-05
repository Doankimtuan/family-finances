# Schema Changes

## Rename & reshape

`public.installment_plans` → `public.loans`

| Old column | New / action |
|------------|--------------|
| `total_amount` | `principal` |
| (computed) | `remaining_principal` |
| `installment_amount` | `monthly_payment` |
| `card_label` | `lender` |
| — | `loan_type` (default `other`) |
| — | `annual_interest_rate` nullable |
| — | `start_date`, `expected_end_date` |
| — | `repayment_frequency` default `monthly` |
| — | `next_payment_date` |
| `due_day` | retained for calendar day-of-month |
| `paid_installments`, `num_installments` | dropped after remaining_principal backfill |
| `card_account_id`, `source_*` | dropped |

## New table: `loan_payments`

- `id`, `household_id`, `loan_id`, `account_id`, `transaction_id`
- `amount`, `principal_paid`, `interest_paid`, `paid_at`
- `created_by`, timestamps
- RLS: household member select/insert

## RPC

- Drop `record_installment_payment(uuid)`
- Add `record_loan_payment(p_loan_id, p_account_id, p_amount, p_interest_paid, p_paid_at)`
  - Inserts `transactions` expense (status `posted`, note loan payment — **no** unmapped Inbox)
  - Inserts `loan_payments`
  - Decrements `remaining_principal`
  - Advances `next_payment_date`
  - On remaining ≤ 0: status `completed` + inbox `emi_complete`

## Card detach

- `UPDATE card_billing_items SET installment_plan_id = NULL` (and clear convert flags as needed for consistency)
- Drop FK from loans to card accounts

## Constraints

- `loan_type` in documented enum set
- `repayment_frequency` in (`monthly`, …)
- `remaining_principal >= 0` and `<= principal`
- `status` in (`active`, `completed`, `cancelled`, `defaulted`, `archived`)

---

## Amortization engine (append)

Migration: `20260804180000_loan_amortization_engine.sql`

### New / extended `loans` columns

| Column | Purpose |
|--------|---------|
| `repayment_method` | `fixed_monthly` \| `reducing_balance` |
| `term_months` | Normalized term |
| `first_payment_date` | Schedule anchor |
| `total_interest` | Planned total interest |
| `total_repayment` | Planned principal + interest |

`monthly_payment` remains **computed** (not user-entered on create).

### Table `loan_schedule_entries`

| Column | Purpose |
|--------|---------|
| `loan_id`, `sequence` | 1..N ordered |
| `due_date` | Payment due |
| `principal_due`, `interest_due`, `total_due` | Planned amounts |
| `remaining_balance_after` | After period if paid as planned |
| `status` | `upcoming` \| `paid` \| `partial` \| `waived` |
| `paid_at`, `loan_payment_id` | Link when settled |

RLS: household members may **select**; mutations via security-definer RPCs.

Future extensibility (not added now): balloon flag, rate-period id — leave for later segments / refinance.

### RPCs

- `create_loan_with_schedule(...)` — atomic loan + schedule insert
- `record_loan_payment(p_loan_id, p_account_id, p_mode, p_paid_at)` — modes `scheduled` \| `early_payoff`; schedule is source of truth (no client interest override)
- `set_loan_status(p_loan_id, p_status)` — `cancelled` \| `defaulted` \| `archived`

Authenticated `DELETE` on `loans` revoked; loans with payment history must not be hard-deleted.

---

## Interest strategies (append)

Migration: `20260804190000_loan_interest_strategies.sql`

### New `loans` columns

| Column | Purpose |
|--------|---------|
| `interest_strategy` | `fixed` \| `promo_fixed_to_floating` \| `floating` |
| `promo_fixed_rate` / `promo_fixed_months` / `promo_floating_rate` / `promo_rate_effective_on` | Promo inputs |

`annual_interest_rate` remains the **current effective** denormalized rate.

### Table `loan_interest_rate_periods`

Immutable timeline: `sequence`, `effective_from`, `effective_to`, `annual_rate`, `kind` (`fixed` \| `promotional` \| `floating`).

Extension point (not added now): benchmark code, margin bps, review cadence.

### RPCs

- `create_loan_with_schedule` — accepts strategy + promo fields + `p_rate_periods` JSON
- `update_loan_interest_rate` — append floating period; replace upcoming schedule only
