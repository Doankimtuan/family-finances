# Engineering Review — Sprint 1

## Reuse

| Asset | Reused? | Notes |
|-------|---------|-------|
| Shared UI (`Button`, `TextField`, `StatusAlert`, `TopAppBar`, `Balance`) | **Yes** | Category / refund / correct forms |
| `assertMoneyActionAllowed` | **Yes** | All money mutations |
| Ledger constants | **Yes** | Statuses, directions, error codes, paths |
| `app-path` builders | **Yes** | `moneyTransactionCorrectPath`, `moneyTransactionRefundPath` |
| Capture form patterns | **Partial** | Correct/edit/refund forms parallel rather than shared shell |
| Transaction row select/mapper | **Partial** | Duplicated `TX_SELECT` strings across queries |

## Duplication / smells

| Item | Severity | Location |
|------|----------|----------|
| Edit vs Correct forms | Medium | `edit-transaction-form.tsx` ≈ `correct-transaction-form.tsx` |
| Refundable/correctable gates in UI | Low | Detail page re-implements status checks already in policy/constants |
| Prior refund total computed in route | Low | `refund/page.tsx` |
| Misleading JSDoc on `updateTransaction` (“Correct a ledger entry”) | Medium | `update-transaction.ts` — confuses BR-03 Correct with mutate |
| Tests use direction string literals | Low | `ledger-transaction-edit.test.ts` (constants policy) |

## Abstraction quality

- Policies (`category-jar-policy`, `refund-policy`, `correction-policy`) are the right home for BR math — **good**.
- `jarCapacityRestoredByRefund` is a tautology (`return amount`) — weak abstraction; capacity should be proven against a shared spent/remaining query.
- No over-engineering of event bus for Alpha0 — **appropriate under-engineering**.

## Engineering score input

**7.0 / 10**
