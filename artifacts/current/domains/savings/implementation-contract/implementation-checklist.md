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

- [ ] Expected/accrued interest never writes Ledger except when a valid `auto_renew_until_cancelled` rollover records it through the existing rollover calculation.
- [ ] Maturity reminder never writes Ledger.
- [ ] Inbox acknowledgment never writes Ledger.
- [ ] Renewal preference never writes Ledger; only its explicit auto-renewal preauthorization can execute the configured rollover at maturity.
- [ ] Funding writes Ledger only when confirmed/manual accepted.
- [ ] Withdrawal writes Ledger only with provider/manual actual.
- [ ] Early withdrawal preview never writes Ledger.
- [ ] Duplicate action never creates duplicate Ledger entries.
- [ ] Corrections go through Ledger ownership.

## Inbox

- [ ] Manual maturity policies create a decision at maturity; invalid auto-renew settings create an actionable fallback item.
- [ ] Successful automatic rollover creates a read-only result item with working read/unread controls and no money decision controls.
- [ ] Early withdrawal confirmation is required after preview.
- [ ] Penalty warning cannot substitute for confirmation.
- [ ] Dismiss does not move money.
- [ ] Duplicate reminders are cancelled/resolved after final decision.
- [ ] No Inbox item exists without decision/review purpose.

## Renewal

- [ ] Only `auto_renew_until_cancelled` auto-rolls; all other saved policies remain manual.
- [ ] Package/rule/account failure follows `ask_user` and does not silently select an alternative.
- [ ] Rollover failure leaves the cycle unchanged and eligible for retry; concurrent/repeated runs cannot create duplicate cycles or transactions.
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
