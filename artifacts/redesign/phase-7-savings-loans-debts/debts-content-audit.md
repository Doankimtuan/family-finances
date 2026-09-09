# Phase 7 — Debts content audit

Debts answer: **who owes whom, and what is currently outstanding?**

Inspected: ledger debt constants, list/detail, create/edit/payment sheets, `DebtDirection`, settlement/payment mutations, i18n EN/VI.

Presentation only. Direction, outstanding (`remainingAmount`), and settlement math are unchanged.

## Canonical routes (discovered)

| Surface | Route | Notes |
| --- | --- | --- |
| List | `/money/debts` | Money → Borrowed & owed |
| Detail | `/money/debts/[id]` via `moneyDebtPath(id)` | Outstanding hero + counterpart |
| Create | **sheet** on list | No create route |
| Edit / payment / settlement | **sheets** on detail | Existing mutations |

Debts are informal money between the household and a counterpart. They are **not** Loans (no required interest, installment schedule, or lender product).

## Direction (existing terminology)

`DebtDirection.BORROWED` → household owes (`You owe` / `Bạn đang nợ`).  
`DebtDirection.LENT` → counterpart owes (`Owes you` / `Đang nợ bạn`).

Direction is a **text label + icon + `data-debt-direction`**. Color is never the only cue.

List groups active records:

- **To repay** (`payable`) — borrowed
- **Waiting to receive** (`receivable`) — lent

## Fields

| Field | Source | Kind |
| --- | --- | --- |
| Outstanding | `remainingAmount` | server-provided current-state |
| Counterpart | `creditor` / counterparty | server-provided |
| Direction | `DebtDirection` | persisted |
| Due state | existing `DebtDue` | derived from due date + status |
| Progress paid / percent | existing `DebtProgress` | **detail only**; not invented; removed from list rows |
| Note, start/due dates, origin tx | debt row | server-provided |

Creation modes (unchanged): `existing_balance` vs `money_moved`.

Statuses include active / completed / archived (existing `DebtStatus`).

## Actions (existing only)

- Add record (direction first, then counterpart, amount, recording mode, dates, note)
- Record repayment / receive payment (existing confirm + mutation)
- Edit counterpart / due date / note (principal and direction stay fixed after create)

Not invented: interest, installment schedule, partial-settlement behavior beyond what already exists, treating debts as formal loans.

## Validation

Unchanged. Create still requires direction + amount; counterparty labels swap with direction (`Who do you owe?` vs `Who owes you?`).

## Unavailable / deferred

- This authenticated household currently has **no debts**, so grouped list + detail direction could not be live-verified. Empty state + create sheet were.
- Date fields use the existing shared date control (HeroUI), not a new native-date UX.
- Create/edit sheets were **not restyled** beyond copy already present; field set already matches counterpart → direction → amount priority.
