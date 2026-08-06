# Acceptance Checklist

## Account Creation

- [ ] Cannot create Active account without household membership.
- [ ] Cannot create account without recognizable name.
- [ ] Cannot create account without allowed broad type.
- [ ] Cannot create account without starting recorded balance or explicit zero.
- [ ] Cannot create account from jar, goal, budget, or plan.
- [ ] Successful creation places account in Active state.
- [ ] Successful creation does not create a Transaction by itself.
- [ ] Successful creation does not create an Inbox item by itself.

## Account Editing

- [ ] Edit preserves historical transaction meaning.
- [ ] Edit cannot convert account into planning object.
- [ ] Invalid edit leaves previous account facts unchanged.
- [ ] Broad type remains within approved simple taxonomy.

## State Transitions

- [ ] Candidate cannot transition directly to Active.
- [ ] Draft can transition to Active only after required validations pass.
- [ ] Draft can transition to Abandoned Draft.
- [ ] Abandoned Draft never appears as financial history.
- [ ] Active can transition to Needs Review.
- [ ] Active can transition to Historical.
- [ ] Active can transition to Closed.
- [ ] Needs Review can transition to Active after resolution.
- [ ] Needs Review can transition to Historical or Closed after review.
- [ ] Historical can transition to Active only through restore.
- [ ] Closed cannot be ordinary active transaction target.
- [ ] Invalid Attempt preserves previous valid state.

## Money Behavior

- [ ] Accounts never execute money movement directly.
- [ ] Ledger updates only when money moves through Transactions-owned behavior.
- [ ] Planning allocations never change account balance.
- [ ] Inbox acknowledgment never changes money.
- [ ] Health never writes data.
- [ ] Credit limit never contributes to owned-money real position.
- [ ] Historical accounts do not contribute to active real position.
- [ ] Closed accounts do not contribute to active real position.
- [ ] Needs Review accounts are not treated as high-confidence.

## Transfer Behavior

- [ ] Transfer requires distinct source and destination Active accounts.
- [ ] Transfer between owned accounts does not create income.
- [ ] Transfer between owned accounts does not create expense.
- [ ] Transfer has no jar impact.
- [ ] Clear transfer creates no Inbox item.
- [ ] Unclear transfer creates or routes to Account Review.

## Reconciliation / Adjustment

- [ ] Manual adjustment requires explainable reason.
- [ ] Manual adjustment is not silent overwrite.
- [ ] Manual adjustment creates no planning update.
- [ ] Unexplained discrepancy leaves account Needs Review.
- [ ] Successful reconciliation returns account to Active when uncertainty is resolved.

## Inbox

- [ ] Account created successfully creates no Inbox item.
- [ ] Account edited successfully creates no Inbox item.
- [ ] Confirmed review creates no Inbox item.
- [ ] Unresolved discrepancy creates Account Review item.
- [ ] Suspected duplicate creates Account Review item.
- [ ] Inbox item never auto-resolves with money movement.
- [ ] Inbox item dismiss never changes money.
- [ ] No unnecessary informational Account Inbox items are created.

## Notifications

- [ ] Invalid action shows validation warning.
- [ ] Permission failure shows permission warning.
- [ ] Needs Review transition is user-visible.
- [ ] Mark Historical shows confirmation.
- [ ] Close Account shows confirmation.
- [ ] Restore Historical shows confirmation.
- [ ] Export success/failure does not change account state.

## Permissions

- [ ] Non-member cannot read or mutate account data.
- [ ] Viewer cannot mutate account state.
- [ ] Partner can create/edit/review/close when active household member.
- [ ] Admin can create/edit/review/close.
- [ ] Background Worker cannot move money.
- [ ] System can reject invalid attempts.
- [ ] Every permission is enforced before state change.

## UI Behavior

- [ ] Draft complete action disabled until validations pass.
- [ ] Active account shows only valid actions.
- [ ] Needs Review account explains review reason.
- [ ] Historical account cannot be ordinary transaction target.
- [ ] Closed account cannot be ordinary transaction target.
- [ ] Invalid Attempt shows failure without partial success.
- [ ] Confirmation dialogs state whether money moves.

## Boundary Protection

- [ ] Jar-to-account mapping is impossible.
- [ ] Health write-back to Accounts is impossible.
- [ ] Account-owned spending analytics are not created.
- [ ] Automatic money movement from Accounts is impossible.
- [ ] Account export is read-only.

