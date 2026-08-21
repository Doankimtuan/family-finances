# Debt 10D — Create/Edit Debt UX

## Scope

Debt create/edit only. Debt remains a principal-only record; no interest, fee,
schedule, or loan fields were added. The create sheet now explains that
scheduled or interest-bearing obligations belong in Loans.

## Implemented

- Kept one user-facing counterparty field. The stored title is derived from
  that value; older `name` callers remain accepted for compatibility but are
  no longer used as a second identity field.
- Kept the existing compact RHF/Zod create sheet with explicit Borrowed/Lent,
  ownership, counterparty, principal, creation mode, liquid account when
  money moves now, start date, due date, and note.
- Preserved money-movement review → confirm → receipt behavior. Financial
  values in previews and receipts continue through `FinancialValue`.
- Added explicit account-load failure and no-eligible-account states. The
  account selector is not rendered as an empty valid choice.
- Added `DebtEditSheet` on the detail page. It edits only counterparty, due
  date, and note. Direction, original principal, creation mode, origin account
  and transaction, status, ownership, and payment history are not editable.
- The update command uses the existing ownership-aware RLS contract and sends
  only descriptive columns. It permits completed records to remain readable
  and receive metadata edits without reopening them; archived records remain
  read-only.
- Create resets to canonical defaults on each open. Edit resets from persisted
  server values whenever it opens.

Ownership is not exposed in edit because the current domain has no safe
metadata-only ownership transfer contract; create ownership remains unchanged.

## Verification

- Debt/create-edit, Debt 10B account guards, privacy, Home, Transactions, and
  semantic regression tests: 10 files, 93 passed.
- Full Vitest: 135 files, 1,002 passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- Authenticated smoke: 3 passed.
- Prettier check and `git diff --check`: passed.
- Browser evidence: authenticated Debt create sheet at 390px English/light,
  440px Vietnamese/light, and 440px Vietnamese/dark; money-moved account
  selector; keyboard Tab focus and Escape close. The available authenticated
  household has no Debt record, so a persisted edit sheet and populated
  privacy-masked receipt could not be opened without seeding a real record.

## Verdict

**DEBT CREATE/EDIT READY**
