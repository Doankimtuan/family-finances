# Validation Contract

## Required Fields

| Action | Required fields |
| --- | --- |
| Create Category | Household context, category name, category kind |
| Assign Category To Transaction | Household context, transaction, active category |
| Leave Transaction Uncategorized | Household context, transaction |
| Correct Category Assignment | Household context, transaction, new category or explicit removal |
| Filter By Category | Household context, category or historical category meaning |
| Summarize Category Actuals | Household context, period, category scope |
| Rename Category | Household context, category, new category name |
| Archive Category | Household context, active category |
| Restore Category | Household context, archived category |
| Review Provider Suggestion | Household context, transaction, suggestion, user decision |
| Review Shared Meaning | Household context, category or transaction meaning |

## Business Validation

- Category name is non-blank and understandable.
- Category kind is income or expense.
- Category meaning is classification-only.
- Category does not imply account, jar, budget, balance, payment method, merchant identity, provider truth, or available money.
- Active duplicate meaning is rejected when obvious.
- Archived category is unavailable for ordinary new assignment.
- Rename preserves historical interpretability.
- Archive preserves historical interpretability.
- Restore returns only valid category meaning to Active state.

## Financial Validation

- Category action has no money source or destination.
- Category action does not change transaction amount.
- Category action does not change transaction account.
- Category action does not change transaction date.
- Category action does not change transaction currency.
- Category action does not change transaction direction.
- Category action does not create ledger money movement.
- Category actuals are past transaction facts only.
- Category actuals are not budget, balance, available money, or forecast.

## Ownership Validation

- Actor belongs to the household for mutation actions.
- Viewer has read-only access only.
- Background Worker and System cannot finalize household category meaning.
- Provider cannot own final category meaning.
- Health cannot mutate category state.
- Planning cannot make Categories own jar state.

## State Validation

- Create moves None -> Active only.
- Archive moves Active -> Archived only.
- Restore moves Archived -> Active only.
- Invalid actions preserve prior valid state.
- Suggested -> Categorized requires user-understood acceptance.
- Uncategorized -> Categorized requires valid category.
- Categorized -> Uncategorized is allowed only as explicit removal of meaning.

## Cross-Domain Validation

- Transaction must exist before assignment.
- Category kind must be compatible with transaction meaning.
- Category-to-jar interpretation must respect Planning ownership.
- Inbox review state must remain owned by Inbox.
- Health read-only consumption must not write back.
- Card, wallet, bank, or provider category must remain evidence only.
