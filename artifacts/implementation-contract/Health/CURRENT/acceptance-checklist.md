# Acceptance Checklist

## Read-Only Enforcement

- [ ] Health creates no Accounts records.
- [ ] Health creates no Transactions records.
- [ ] Health creates no Cards records.
- [ ] Health creates no Loans records.
- [ ] Health creates no Savings records.
- [ ] Health creates no Planning records.
- [ ] Health creates no Goals records.
- [ ] Health creates no Inbox records.
- [ ] Health creates no Categories records.
- [ ] Health changes no Together membership or permission state.
- [ ] Health performs no insert, update, delete, approval, repayment, transfer, reconciliation, close, archive, or notification creation behavior.

## State Behavior

- [ ] Every Health assessment resolves to exactly one valid Health state.
- [ ] Unavailable appears when household context or permission is invalid.
- [ ] No Visible Facts appears when household exists but no usable facts are visible.
- [ ] Partial appears when missing or stale facts materially limit interpretation.
- [ ] Stale appears when prior facts are not current enough.
- [ ] Invalid Attempt appears when BR-01, BR-24, grounding, or advice boundaries are violated.
- [ ] Invalid Attempt never transitions directly to Strong.

## Factor And Grounding

- [ ] Every displayed condition has factor explanations or an explicit no-factor state.
- [ ] Every factor identifies or implies its owning source domain.
- [ ] Ungrounded factors are omitted or blocked.
- [ ] Missing facts are never treated as absence of risk.
- [ ] Hidden balances, income, claims, obligations, or risk facts are never invented.

## Money Safety

- [ ] Health never moves money.
- [ ] Health never writes ledger entries.
- [ ] Health never updates Planning.
- [ ] Health never treats jars, goals, or allocations as cash.
- [ ] Health never treats available credit as real money.
- [ ] Health output is never presented as authorization to spend.

## Inbox And Notifications

- [ ] Health creates no Inbox item for successful assessment.
- [ ] Health creates no Inbox item for score/state change.
- [ ] Health creates no Inbox item for Partial, Stale, or Unavailable states.
- [ ] Health never resolves, dismisses, defers, or acknowledges Inbox items.
- [ ] Health creates no notifications.

## Permissions

- [ ] Owner can view Health when household context allows.
- [ ] Partner can view Health only when household visibility allows.
- [ ] Viewer can view Health only when source visibility allows.
- [ ] Background Worker and System can compute read-only context only.
- [ ] Admin cannot use Health to mutate source domains.
- [ ] Factors hidden by permission are omitted or cause Partial context.

## UI Behavior

- [ ] Health shows condition and factors together.
- [ ] Partial and Stale states show completeness/staleness context.
- [ ] Scenarios are labeled read-only.
- [ ] Health UI exposes no direct money movement action.
- [ ] Health UI exposes no source mutation action.
- [ ] Health UI exposes no Inbox resolution action.
- [ ] Health UI uses non-advisory language.

## Cross-Domain

- [ ] Accounts remain source of account truth.
- [ ] Transactions remain source of money movement truth.
- [ ] Cards remain source of card truth.
- [ ] Loans remain source of loan truth.
- [ ] Savings remains source of savings truth.
- [ ] Planning remains source of virtual intention truth.
- [ ] Goals remain source of goal truth.
- [ ] Inbox remains source of decision truth.
- [ ] Together remains source of permission truth.
