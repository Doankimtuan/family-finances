# Acceptance Checklist

## Category Definition

- [ ] Category can be created only with valid household context.
- [ ] Category creation requires non-blank name.
- [ ] Category creation requires valid income or expense kind.
- [ ] Category creation rejects boundary-breaking labels that imply balance, budget, account, payment method, jar, or provider truth.
- [ ] Category creation rejects obvious duplicate active meaning.
- [ ] Successful category creation creates no money movement.

## Category Assignment

- [ ] Category can be assigned only to an existing household transaction.
- [ ] Archived category cannot be assigned to ordinary new transaction.
- [ ] Category kind must be compatible with transaction meaning.
- [ ] Assigning category does not change transaction amount.
- [ ] Assigning category does not change transaction account.
- [ ] Assigning category does not change transaction date.
- [ ] Assigning category does not change transaction currency.
- [ ] Assigning category does not change transaction direction.
- [ ] Transaction can remain Uncategorized when meaning is unknown.
- [ ] Wrong category can be corrected to another valid category.
- [ ] Category can be removed from transaction only as explicit Uncategorized meaning.

## Category Lifecycle

- [ ] Category rename preserves prior valid state on failure.
- [ ] Category rename does not move money.
- [ ] Category archive makes category unavailable for ordinary future selection.
- [ ] Category archive preserves historical transaction meaning.
- [ ] Category restore works only from Archived state.
- [ ] Category restore does not imply financial correction.
- [ ] Invalid actions preserve prior valid category state.

## Suggestions

- [ ] Provider or merchant suggestion is visible as evidence only.
- [ ] Suggested category never becomes Categorized without user-understood acceptance.
- [ ] User can reject suggestion without changing prior category meaning.
- [ ] User can override suggestion with another valid category.
- [ ] Background Worker and System cannot finalize household meaning.

## Read-Only Behavior

- [ ] Category filter is read-only.
- [ ] Category actuals summary is read-only.
- [ ] Category actuals are not shown as budget, balance, available money, or forecast.
- [ ] Health reads category patterns only.
- [ ] Planning reads category meaning only and does not receive category-owned capacity.

## Inbox And Notifications

- [ ] No Inbox item is created for ordinary successful category creation.
- [ ] No Inbox item is created for ordinary successful category assignment.
- [ ] Category-review Inbox item exists only when user action is required.
- [ ] Duplicate active Inbox item for same transaction and category-review reason is forbidden.
- [ ] Resolving category-related Inbox item never moves money.
- [ ] Category notifications never imply money movement.

## Permissions

- [ ] Owner can view and mutate categories.
- [ ] Partner can view and mutate categories.
- [ ] Admin can view and mutate categories.
- [ ] Viewer can view but cannot mutate categories.
- [ ] Background Worker can only read or suggest.
- [ ] System can only read or suggest.
- [ ] No actor can move money through Categories.
- [ ] No actor can mutate Health through Categories.

## Boundary Safety

- [ ] Category cannot hold money.
- [ ] Category cannot expose available balance.
- [ ] Category cannot execute payment.
- [ ] Category cannot enforce spending cap.
- [ ] Category cannot replace jar or budget.
- [ ] Category cannot certify provider truth.
- [ ] Category cannot decide household intent autonomously.
