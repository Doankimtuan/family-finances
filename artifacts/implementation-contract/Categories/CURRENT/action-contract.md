# Action Contract

## Create Category

Trigger:

- User creates a reusable household classification label.

Actor:

- Owner, Partner, or Admin.

Preconditions:

- Actor is an active household member with mutation permission.
- Category name is provided.
- Category kind is income or expense.
- Category meaning is classification-only.
- Category is not an obvious duplicate of an active category meaning.

Validation:

- Name is present, non-blank, and understandable.
- Kind is valid.
- Household context is valid.
- Name does not imply account, jar, budget, payment method, available balance, or provider truth.
- If category-to-jar mapping is required by current business rules, mapping must be valid and active.

Business Rules:

- Category is classification only.
- Category vocabulary is household-scoped.
- Category kind must fit intended meaning.

Success Result:

- Category enters Active state.
- Category becomes available for future valid classification.
- No money moves.

Failure Result:

- No category is created.
- Prior state remains unchanged.
- User receives a clear failure reason.

## Assign Category To Transaction

Trigger:

- User selects category meaning for a transaction.

Actor:

- Owner, Partner, or Admin.

Preconditions:

- Transaction exists and belongs to the household.
- Category is Active.
- Category kind matches transaction direction or accepted business meaning.
- Actor can mutate transaction meaning.

Validation:

- Transaction reference is valid.
- Category reference is valid.
- Archived category is not used for ordinary new assignment.
- Assignment does not change amount, account, date, currency, or direction.
- Assignment does not create planning, Health, payment, or account mutation.

Business Rules:

- Transactions own money facts.
- Categories label meaning only.
- Provider suggestions are not final truth.

Success Result:

- Transaction assignment state becomes Categorized.
- Transaction has accepted household category meaning.
- Other domains may read category meaning.

Failure Result:

- Transaction remains Uncategorized or keeps prior valid category.
- No money, planning, Inbox, or Health state changes unless separately valid.

## Leave Transaction Uncategorized

Trigger:

- User intentionally leaves meaning unknown, or no category is selected.

Actor:

- Owner, Partner, Admin, or System when preserving unknown state.

Preconditions:

- Transaction exists.
- Category meaning is unknown or intentionally not decided.

Validation:

- No forced category is applied.
- Existing transaction fact remains valid.

Business Rules:

- Unknown meaning must not be guessed.
- Uncategorized does not invalidate the transaction.

Success Result:

- Assignment state is Uncategorized.
- Any required review belongs to Inbox rules.

Failure Result:

- If transaction does not exist or actor lacks permission, prior state remains unchanged.

## Correct Category Assignment

Trigger:

- User changes wrong transaction category meaning.

Actor:

- Owner, Partner, or Admin.

Preconditions:

- Transaction exists.
- New category is valid or user removes category to return to Uncategorized.
- Correction changes meaning only.

Validation:

- Same validations as Assign Category To Transaction.
- If removing category, Uncategorized state must be allowed.
- Correction must not rewrite transaction fact.

Business Rules:

- Category correction changes meaning only.
- Category history remains interpretable.

Success Result:

- Assignment becomes Categorized with corrected category or Uncategorized.
- Category actuals and filters use corrected current meaning.

Failure Result:

- Prior valid assignment remains.
- No money movement occurs.

## Filter By Category

Trigger:

- User requests transactions for a category.

Actor:

- Owner, Partner, Viewer, Admin, Background Worker read-only, or System read-only.

Preconditions:

- Actor can view household transaction history.
- Category exists or historical meaning is available.

Validation:

- Read permission exists.
- Requested category meaning is valid for retrieval.

Business Rules:

- Filtering is read-only.
- Archived categories may be used for historical retrieval.

Success Result:

- Matching transaction facts are returned for review.
- No state changes.

Failure Result:

- No results or permission error.
- No state changes.

## Summarize Category Actuals

Trigger:

- User or allowed read-only consumer requests actual income or expense grouped by category.

Actor:

- Owner, Partner, Viewer, Admin, Background Worker read-only, or System read-only.

Preconditions:

- Actor can view source transaction facts.
- Period is valid.
- Category meaning is valid or historical.

Validation:

- Summary is actuals-only.
- Uncategorized or materially uncertain facts are not silently represented as complete category truth.
- Virtual planning movement is excluded from real actuals.

Business Rules:

- Category actuals are past facts only.
- Category actuals are not budgets, balances, available money, forecasts, or Health actions.

Success Result:

- Read-only category actuals are available.
- No state changes.

Failure Result:

- Summary is unavailable or visibly incomplete.
- No state changes.

## Rename Category

Trigger:

- User changes category wording.

Actor:

- Owner, Partner, or Admin.

Preconditions:

- Category exists.
- Category is Active or Archived.
- New name preserves or clarifies classification meaning.

Validation:

- New name is present and non-blank.
- New name does not violate category boundaries.
- Rename does not create obvious active duplicate meaning.
- Historical meaning remains interpretable.

Business Rules:

- Rename changes wording, not transaction facts.
- Category history remains interpretable.

Success Result:

- Category remains in prior Active or Archived state with updated wording.
- Historical category meaning remains understandable.

Failure Result:

- Category name remains unchanged.
- Prior valid state remains.

## Archive Category

Trigger:

- User stops category from future ordinary use.

Actor:

- Owner, Partner, or Admin.

Preconditions:

- Category exists and is Active.
- Historical use, if any, can remain interpretable.

Validation:

- Archive does not orphan historical transaction meaning.
- Archive does not mutate money facts, planning, Inbox, or Health.

Business Rules:

- Archive affects future selection only.
- Archived categories preserve history.

Success Result:

- Category state becomes Archived.
- Existing transaction assignments remain interpretable.

Failure Result:

- Category remains Active.
- Prior assignments remain unchanged.

## Restore Category

Trigger:

- User reopens an archived category for future use.

Actor:

- Owner, Partner, or Admin.

Preconditions:

- Category exists and is Archived.
- Category meaning remains valid.

Validation:

- Restored category does not violate boundaries.
- Restored category does not create obvious active duplicate meaning.

Business Rules:

- Restore reopens future use.
- Restore is not a financial correction.

Success Result:

- Category state becomes Active.

Failure Result:

- Category remains Archived.

## Review Provider Or Merchant Suggestion

Trigger:

- Provider, merchant, or system evidence proposes category meaning.

Actor:

- Owner, Partner, Admin, or System as suggestion producer only.

Preconditions:

- Transaction exists.
- Suggested category exists and is Active.
- Suggestion is clearly non-authoritative.

Validation:

- Suggestion does not auto-finalize household meaning.
- Suggested kind fits transaction meaning.
- Actor acceptance is required before assignment becomes Categorized.

Business Rules:

- Household category overrides provider category.
- Suggestions must not silently invent final meaning.

Success Result:

- Accepted suggestion becomes household category assignment.
- Rejected or ignored suggestion leaves prior assignment state unchanged or Uncategorized.

Failure Result:

- Invalid suggestion is discarded.
- No final category meaning changes.

## Review Shared Category Meaning

Trigger:

- Partner questions, confirms, or clarifies category meaning.

Actor:

- Owner, Partner, Admin, or Viewer read-only.

Preconditions:

- Household context is valid.
- Review is about comprehension, not spending approval.

Validation:

- Any mutation follows assign, correct, rename, archive, or restore validations.
- Review action itself does not move money or change Health.

Business Rules:

- Shared meaning is comprehension.
- Categories must not become surveillance or approval workflow.

Success Result:

- Meaning is understood, corrected, or left unresolved.

Failure Result:

- Prior valid meaning remains.
