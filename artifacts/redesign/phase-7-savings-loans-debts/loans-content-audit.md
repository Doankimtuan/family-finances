# Phase 7 — Loans content audit

Loans answer: **how much principal remains, and what payment comes next?**

Inspected: Design System S6, ledger `Loan` + `mapLoanRow`, list/detail/schedule, create wizard sheet, pay / edit / interest / archive sheets, i18n EN/VI.

Presentation only. Remaining principal, schedule split, and payment allocation are unchanged.

## Canonical routes (discovered)

| Surface | Route | Notes |
| --- | --- | --- |
| List | `/money/loans` | Money → Borrowed & owed |
| Detail | `/money/loans/[id]` via `moneyLoanPath(id)` | `?view=overview\|schedule\|history` |
| Full schedule | `/money/loans/[id]/schedule` | Existing year explorer |
| Create | **sheet** on list | No create route |
| Edit / pay / interest / archive | **sheets** on detail | No extra routes |
| Legacy `/money/cards/[id]` | Redirects to `moneyLoanPath(id)` | Not a Phase 7 destination |

Loans are **not** credit-card installments (Card BC) and **not** informal Debts.

## Domain object

Scheduled loan / installment obligation. Primary number: **`remainingPrincipal`** (server-provided). Original principal, monthly payment, and interest paid are secondary.

Statuses: `active`, `completed`, `cancelled`, `defaulted`, `archived`.

Due presentation: `upcoming`, `due_soon`, `due_today`, `overdue`, `none` (`LoanDueState`). Due-soon window is the existing `LOAN_DUE_SOON_DAYS`.

## Fields

| Field | Source | Kind |
| --- | --- | --- |
| `remainingPrincipal` | Loan row / mapper | server-provided current-state / liability |
| `nextPaymentAmount`, `nextPaymentDate` | Loan + schedule | server-provided |
| Next entry `principalDue` / `interestDue` | Schedule entry | server-provided; **shown separately on detail** |
| `progress` | Mapper | existing derived; **list no longer shows a bar** |
| Lender, type, rate, term | Loan | server-provided |
| Payoff estimate | Existing `LoanPayoffEstimate` | existing helper; not a new UI formula |

## Actions (existing only)

- Add loan (wizard: identity/principal → terms)
- Record payment (`recordLoanPaymentAction`)
- Edit loan / interest periods
- Archive / close with confirmation
- Open schedule / history

Not invented: refinance advice, payoff optimization, credit score, interest-saving tips, combining principal+interest into an unexplained total on the next-payment card.

## Validation

Unchanged Zod / wizard steps (`LoanCreateStep.BASICS` / `TERMS`). Create copy still states borrowed cash is **not** added to an account.

## Unavailable / deferred

- This authenticated household currently has **no loans**, so populated list/detail could not be live-verified.
- Schedule **rows** still use the existing combined split string; the **next payment** card on detail is now labeled Principal vs Interest.
- Progress % remains on detail only when the existing mapper already supplies it.
