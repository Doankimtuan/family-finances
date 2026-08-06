# Implementation Checklist

## State

- [ ] Draft never has provider-held principal.
- [ ] Pending Funding never appears as completed money.
- [ ] Active requires confirmed/manual provider-held principal.
- [ ] Paused is not implemented as a Savings state.
- [ ] Completed, Closed Early, Cancelled, and Archived are terminal for money actions.
- [ ] Renewed old cycle cannot be renewed again.
- [ ] Forbidden transitions are rejected.

## Ledger

- [ ] Expected interest never writes Ledger.
- [ ] Accrued interest never writes Ledger.
- [ ] Maturity reminder never writes Ledger.
- [ ] Inbox acknowledgment never writes Ledger.
- [ ] Renewal preference never writes Ledger.
- [ ] Funding writes Ledger only when confirmed/manual accepted.
- [ ] Withdrawal writes Ledger only with provider/manual actual.
- [ ] Early withdrawal preview never writes Ledger.
- [ ] Duplicate action never creates duplicate Ledger entries.
- [ ] Corrections go through Ledger ownership.

## Inbox

- [ ] Maturity decision is created at maturity/grace.
- [ ] Savings maturity never auto-resolves.
- [ ] Early withdrawal confirmation is required after preview.
- [ ] Penalty warning cannot substitute for confirmation.
- [ ] Dismiss does not move money.
- [ ] Duplicate reminders are cancelled/resolved after final decision.
- [ ] No Inbox item exists without decision/review purpose.

## Renewal

- [ ] Saved preference pre-fills/recommends only.
- [ ] Rate change requires explicit acceptance.
- [ ] Package unavailable blocks renewal.
- [ ] Renewal creates immutable new cycle.
- [ ] Renewal never creates duplicate Saving.

## Withdrawal

- [ ] Withdraw after close is rejected.
- [ ] Early withdrawal requires Active state.
- [ ] Stale early withdrawal preview cannot be confirmed.
- [ ] Partial withdrawal is not standard behavior.
- [ ] Provider-confirmed partial exception posts actual only.

## Cross-Domain

- [ ] Goals/purpose never change Savings balance.
- [ ] Planning pause never changes Savings state.
- [ ] Health remains read-only.
- [ ] Together policy controls permissions/decision memory only.
- [ ] Accounts own funding/settlement account identity.
- [ ] Transactions own posted money movement.

## Notifications

- [ ] Notifications never write Ledger.
- [ ] Notifications never change state.
- [ ] Informational interest paid notification does not create Inbox by default.
- [ ] Duplicate notifications are suppressed or idempotent.

