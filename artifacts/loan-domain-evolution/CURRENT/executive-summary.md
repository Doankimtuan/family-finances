# Loan Domain Evolution — Executive Summary

**Date:** 2026-08-04  
**Decision:** Evolve Installments (`installment_plans` / `/money/cards`) into a generic **Loan / Installment** bounded context. Remove all Credit Card coupling from this module.

## Verdict

Ship Loan as scheduled long-term liabilities. Credit Card Installments remain a **future Card BC** capability and are not implemented here.

## Locked scope

| In | Out |
|----|-----|
| Bank / store / BNPL / vehicle / home / tuition / medical / other scheduled loans | Credit Card Installment convert |
| Lender, loan type, principal, interest, next due, progress | Statement cycle, credit limit, utilization |
| Payment → Real Ledger Transaction + `loan_payments` history | Migrating open-ended Debts (`liabilities`) |
| BR-11 completion → Inbox ReviewItem | Persisted amortization schedule tables |
| Route `/money/loans`, Loan UI copy | Product/Architecture SoT rewrite |

## Boundaries

- **Loan** — fixed/scheduled repayment obligations (this evolution).
- **Debts** (`/money/debts`) — open-ended owed without schedule; unchanged.
- **Cards** — revolving instrument + billing; unlink from Loan; Card Installment deferred.

## Compatibility stance

- Inbox storage kind remains `emi_complete` (DB constraint); UI/copy says Loan complete.
- Existing installment rows migrate to `loans` with `loan_type=other`, `lender` from former `card_label`.
- Card billing FKs to installment plans are detached.
- Optional redirect `/money/cards` → `/money/loans`.
