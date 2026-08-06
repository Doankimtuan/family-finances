# Acceptance Checklist

## Actions

- [ ] Create Goal creates an Active goal only with valid purpose and positive target.
- [ ] Edit Goal changes intention only and preserves state.
- [ ] Add Contribution increases perceived progress only.
- [ ] Pause changes Active to Paused.
- [ ] Resume changes Paused to Active.
- [ ] Complete changes Active or Paused to Completed.
- [ ] Cancel changes Active or Paused to Cancelled.
- [ ] Terminal goals reject ordinary mutation.
- [ ] Invalid actions preserve prior valid state.

## Money

- [ ] No Goals action writes the Real Ledger.
- [ ] Goal contribution never creates a transfer.
- [ ] Goal completion never creates a payment, purchase, withdrawal, or settlement.
- [ ] Goal cancellation never releases money.
- [ ] Savings association never changes Savings truth.
- [ ] Evidence review never mutates source-domain facts.

## State

- [ ] Every allowed transition is enforced.
- [ ] Every forbidden transition is rejected.
- [ ] Completed and Cancelled are terminal for ordinary actions.
- [ ] Invalid Attempt does not terminate the underlying valid goal.

## Permissions

- [ ] Owner can view and mutate goals.
- [ ] Partner can view and mutate goals.
- [ ] Admin can view and mutate goals.
- [ ] Viewer can view but cannot mutate goals.
- [ ] Background Worker can only evaluate read-only timing or evidence conditions.
- [ ] System can only perform read-only evaluation unless a permitted rule explicitly allows Inbox creation.

## Inbox And Notifications

- [ ] Routine goal actions create no Inbox items.
- [ ] Evidence conflict creates an Inbox item only when user attention is needed.
- [ ] Inbox acknowledgment never changes money.
- [ ] Inbox dismissal never changes progress.
- [ ] Notifications never claim money moved because of a goal action.

## UI Behavior

- [ ] Active goals show only Active-valid actions.
- [ ] Paused goals show only Paused-valid actions.
- [ ] Completed goals hide ordinary mutation actions.
- [ ] Cancelled goals hide ordinary mutation actions.
- [ ] Complete confirmation states no payment or purchase is created.
- [ ] Cancel confirmation states no money moves.
- [ ] Contribution UI states progress only.
- [ ] Error states show prior valid state.

## Cross-Domain

- [ ] Accounts remain balance owner.
- [ ] Transactions remain movement owner.
- [ ] Savings remains product-truth owner.
- [ ] Cards remain card-obligation owner.
- [ ] Loans remain liability owner.
- [ ] Health never writes goal data.
- [ ] Together permissions are enforced.
- [ ] Planning lock behavior is respected where applicable.
