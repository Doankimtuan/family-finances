# Acceptance Checklist

## State And Actions

- [ ] Every accepted Inbox item starts as Pending.
- [ ] Candidate that fails eligibility does not create an Inbox item.
- [ ] Pending can resolve only through a valid resolution action.
- [ ] Pending can acknowledge only when acknowledgement is valid for item type.
- [ ] Pending can dismiss only when dismissal does not hide required attention.
- [ ] Pending can defer only when deferral is allowed.
- [ ] Deferred remains unresolved active attention.
- [ ] Pending and Deferred cannot archive directly.
- [ ] Expired cannot be resolved without recovery.
- [ ] Archived can become Pending only through valid recovery.
- [ ] Invalid action leaves prior valid state unchanged.

## Money And BR Safety

- [ ] Inbox action never creates a ledger write.
- [ ] Inbox acknowledgement never changes money.
- [ ] Inbox dismissal never deletes source truth.
- [ ] Inbox expiration never means paid.
- [ ] Inbox auto-resolution never moves money.
- [ ] Inbox never creates planning allocation by itself.
- [ ] Health never writes Inbox data.
- [ ] BR-01 is enforced for every outcome.
- [ ] BR-24 is enforced for every Health interaction.

## Source And Cross-Domain

- [ ] Every item has source domain or accepted source reason.
- [ ] Every item has reason attention is needed.
- [ ] Source domain remains authoritative after item creation.
- [ ] Owning domain must accept outcome before its truth changes.
- [ ] Category outcome validates against Categories.
- [ ] Planning outcome validates virtual-only boundary.
- [ ] Savings outcome does not execute inside Inbox.
- [ ] Card reminder acknowledgement does not mean card payment.

## Permissions

- [ ] Viewer can read allowed items only.
- [ ] Viewer cannot mutate Inbox state.
- [ ] Owner and Partner can resolve allowed household items.
- [ ] Background Worker cannot make household judgment decisions.
- [ ] System can auto-resolve only eligible constrained patterns.
- [ ] Forbidden action returns failure and preserves state.

## Inbox Quality

- [ ] Generic notifications never create Inbox items.
- [ ] Marketing messages never create Inbox items.
- [ ] Duplicate active source/reason does not create duplicate active item.
- [ ] Suggestions are optional.
- [ ] Suggestion failure does not block manual review.
- [ ] Staleness is non-punitive.
- [ ] Workload metrics are operational, not Health mutation.
- [ ] Partner coordination analytics are absent.

## UI Behavior

- [ ] Active queue shows Pending and Deferred items.
- [ ] Historical queue separates no-longer-active items.
- [ ] Empty active queue does not claim full financial safety.
- [ ] Disabled actions match permission and state.
- [ ] Loading state prevents duplicate submission.
- [ ] Error state states prior state was unchanged.
- [ ] Auto-resolved item is distinguishable from user-resolved item.
