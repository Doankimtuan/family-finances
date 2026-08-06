# Credit card analysis (legacy → Product v2)

## Verdict

**D-01 deferred implementation; D-04 (2026-08-03) overrides and ships** `mvp_plus_emi` + cashback with over-limit block. See `decision-log.md` and `implemented-features.md`.

## Legacy behaviors audited

| Concept | Legacy | Productive? | Disposition |
|---------|--------|-------------|-------------|
| Billing cycle / statement day | `credit_card_settings.statement_day`; month key by day ≤ statement | Valuable if Product owns CC accounts | **Propose** |
| Closing date | Same as statement day | Yes | **Propose** with cycle |
| Payment due day | `due_day` stored; UI day-of-month urgency | Partially broken (`due_date` never written) | **Propose** fixed due_date derivation |
| Outstanding balance | Σ statement − paid over open/partial months | Yes | **Propose** |
| Available credit | max(0, limit − outstanding) | Soft only; spend not blocked | **Propose** + decide enforce policy |
| Current / previous statement | `card_billing_months` + items (last 12) | Yes; Product rejected “billing dump” | **Propose** simplified statement summary, not dump |
| Minimum payment | No product field; TDSR 5% proxy | Incomplete / misleading | **Discard** until Product defines |
| Auto payment | Column unused | Dead | **Discard** or Future |
| Installments | Convert + plans | Keep as `/money/cards` EMI | **Preserve** Product path |
| Partial payment | FIFO month paid_amount; items paid only on full settle | Subtle | **Propose** with settle UX |
| Transaction posting | Trigger on expense/income | Heavy; timezone bugs | **Propose** carefully if CC returns |
| Interest | annual_rate on plans; UI used conversion fee | Incomplete accrual | **Discard** accrual; fee optional on EMI |
| Over limit | Soft clamp only | Incomplete | **Propose** warn vs block |
| Payment / statement history | Billing month cards | Useful | **Propose** |
| Month closing | status → settled | Yes | **Propose** |
| Cashback | Income rewired to unpaid cycle | Nice | **Propose** optional |
| Linked payment account | Settings FK | Useful for settle | **Propose** |

## Product conflict

- Feature Challenge Matrix: cards **SIMPLIFY**, EMI like debt plan, **not billing dump**
- Schema: no `credit_card` in accounts CHECK
- AC surface: installment completion only

## Proposal (not authorized to implement)

If Product later re-opens first-class cards:

1. Add `credit_card` type + `credit_card_settings` (limit, statement_day, due_day, linked_account)
2. Billing months/items with explicit due_date write on cycle open
3. Settle command with source balance check + FIFO
4. Utilization + upcoming due on card detail (not Accounts liquid list)
5. Keep EMI convert as bridge to existing `installment_plans`
6. Ship Product REQ/AC before engineering

Until then: Accounts page links to Debts / Savings / Cards as **plans & credit** (never Balance).
