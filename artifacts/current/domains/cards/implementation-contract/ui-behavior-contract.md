# UI Behavior Contract

This contract describes required behavior only. It does not design UI.

## State Behavior

| State | Visible actions | Hidden actions | Disabled actions | Required messages |
|-------|-----------------|----------------|------------------|-------------------|
| Draft | Continue setup, abandon draft | Record purchase, repayment, statement | None if required facts missing | Required facts missing. |
| Active | Edit, record purchase, record statement, record repayment, review, close, archive | None by default | Actions invalid for card type | Credit is not cash. |
| Needs Review | Review, edit, correct, recover, archive with warning | None by default | Normal purchase/closure if truth unresolved | Card truth needs review. |
| Billing Open | Record repayment, record refund, record fee/interest, review | None by default | Close without warning if due remains | Remaining due is still owed. |
| Billing Partially Paid | Record more repayment, review, record adjustment | None by default | Mark settled without valid payment/credit/correction | Partial payment does not settle the bill. |
| Billing Settled | View history, review, archive | Record normal repayment against settled period | Reopen without review | Billing period is settled by household record. |
| Closed | View history, review, archive | Record new normal purchase | Reactivate without review | Closed card preserves history. |
| Expired | View history, review, archive | Record new normal purchase | Active use without review/replacement | Expired card may still have history. |
| Replaced | View history, review, archive | Treat old credential as new active card | New purchase on replaced identity | Replacement preserves history. |
| Archived | View history, recover to review | New normal activity | Active use without recovery | Archived card is historical. |
| Abandoned Draft | None or view minimal draft history | All financial actions | All mutation except allowed cleanup if supported elsewhere | Draft was abandoned. |
| Invalid Attempt | Return to previous valid state | Not applicable | Not applicable | No change was made. |

## Confirmation Dialogs

Required confirmations:

- Record repayment: confirm amount, source, date, and that money movement is real.
- Record partial repayment: confirm remaining due stays open.
- Record refund: confirm refund is not ordinary income by default.
- Close card with any unresolved due, refund, or Needs Review condition.
- Archive card with unresolved obligation.
- Recover archived, closed, expired, or settled state.

## Warning Messages

Required warnings:

- Available credit is borrowing capacity, not cash.
- Statement values are household-recorded unless provider-confirmed.
- Partial payment may leave fees or interest risk unknown.
- Cashback/statement credit is not real income unless it enters a real account.
- Health insights are read-only.
- Cards cannot execute repayment automatically.

## Loading Behavior

- During any submitted action, prevent duplicate submission for that action.
- Show pending action state without changing business state until success.
- If interrupted, preserve prior valid state.

## Empty States

- No cards: explain that cards are tracked when they affect household money.
- No credit-card billing periods: show no due amount by default.
- No active cards: historical cards remain accessible if archived/closed records exist.

## Error States

- Permission failure: explain actor cannot perform the action.
- Validation failure: identify missing or invalid business fact.
- State failure: explain required state.
- Money failure: explain no money moved.
- Boundary failure: explain Cards cannot treat credit as cash, execute repayment, or turn revolving debt into Loan by default.
