# Loans 11D — Detail, Payment & Schedule/History UX

## Verdict

# LOANS DETAIL/PAYMENT NOT READY

The implementation is present and the automated quality gates pass, but the
required authenticated populated-Loan browser evidence is unavailable. The
configured E2E household currently has no Loan fixture, so overdue/due-today,
payment review, receipt replay, and populated history could not be verified in
Chromium.

## Implemented

- Detail hierarchy now makes remaining principal primary and presents original
  principal, rate, next payment, due state, dates, lender, ownership, and note
  in a flat fact layout.
- Schedule displays upcoming, due today, overdue, paid, and waived. Persisted
  `partial` entries are handled as unpaid schedule entries without exposing a
  Partial label.
- Payment keeps the existing shared HeroUI-backed Select/Date controls, liquid
  account filtering, reset-on-open edit forms, 11B idempotency/replay, and
  principal/interest split. Fee remains absent.
- Receipt shows one payment outcome, total/principal/interest, source account,
  effective date, remaining principal, completion state, and grouped
  transaction links. Replay copy explicitly says the payment was already
  recorded and no additional payment was made.
- Payment history shows one row per payment with amount/date/source/split and a
  grouped Transaction detail link. Amounts use `FinancialValue`; raw payment
  IDs are not displayed.
- Loan, schedule, and payment reads now distinguish not-found/read-error and
  preserve schedule/history failures instead of converting them to empty data.
- Existing offline banner remains read-only; payment/edit actions remain
  blocked offline. No hard-delete or principal/history mutation path was added.

## Verification

- `npm run lint` — PASS.
- `npm run typecheck` — PASS.
- `npm run test -- --run` — PASS, 138 files / 1,016 tests.
- 11B idempotency, 11C due-state, financial semantics, Home metrics,
  Transactions grouping, and privacy regressions — PASS within the full suite.
- `npm run build` — PASS.
- Authenticated browser state setup — PASS.
- Authenticated `/en/money/loans` smoke at the configured household — PASS,
  but only the empty state was available.
- `npm run e2e:auth-check` — 1 auth setup test passed; 2 existing
  authenticated infrastructure tests failed outside this Loan scope.

## Blocking evidence

Re-run with an authenticated household containing a populated Loan fixture and
capture 390/440/768/1280px, EN/VI, light/dark, privacy hidden/revealed,
reduced-motion, due/overdue, payment review, first payment, replay, receipt,
history, schedule error, history partial error, and offline read-only states.
