# Business Flows

## Create Category

Trigger:

- Household needs a reusable classification label.

Preconditions:

- Household context is valid.
- Category meaning is understandable to the household.
- Category kind is income or expense.
- Category does not duplicate a known active meaning in an obvious way.
- Category does not claim to be a balance, budget, account, payment method, or jar.

Business Rules:

- Category is classification only.
- Category belongs to household vocabulary.
- Category kind must match intended income or expense meaning.
- Category must not hold money or planning capacity.

Expected Result:

- Category becomes active and available for future classification.

Failure Result:

- Category is not created when meaning is invalid, kind is invalid, household context is invalid, or the label violates domain boundaries.

## Categorize Transaction

Trigger:

- Household knows what a transaction was for.

Preconditions:

- Transaction fact exists.
- Category is active.
- Category kind is compatible with transaction meaning.
- Assignment does not alter transaction amount, account, date, currency, or real direction.

Business Rules:

- Transactions own money facts.
- Categories label meaning only.
- Category assignment must not create jar movement, goal progress, health change, or account balance change.

Expected Result:

- Transaction has household category meaning.
- Category-filtered history and actuals may include the transaction.
- Other domains may consume the category meaning as read-only evidence.

Failure Result:

- Transaction remains uncategorized or keeps prior valid meaning when assignment violates kind, state, or boundary rules.

## Leave Transaction Uncategorized

Trigger:

- Household does not know or does not want to decide the category yet.

Preconditions:

- Transaction fact exists.
- Missing meaning is acceptable as explicit uncertainty.

Business Rules:

- Unknown meaning must not be guessed.
- Uncategorized does not invalidate the transaction fact.
- Inbox may carry unresolved review state when household attention is needed.

Expected Result:

- Transaction remains financially valid but has no category meaning.
- Category summaries exclude or separately recognize the lack of category meaning.

Failure Result:

- If another domain requires a decision, the unresolved work remains outside Categories until meaning is clarified.

## Correct Category Assignment

Trigger:

- Household discovers a transaction has wrong category meaning.

Preconditions:

- Transaction fact exists.
- New category meaning is valid.
- Correction is about meaning, not money fact.

Business Rules:

- Category correction does not rewrite real ledger truth.
- Category correction does not erase the fact that earlier interpretation may have existed.
- Category correction must preserve household understanding.

Expected Result:

- Transaction is classified with corrected household meaning.
- Future category retrieval and actuals use the corrected meaning.

Failure Result:

- Prior valid meaning remains when the correction violates category kind, category state, or domain boundaries.

## Filter By Category

Trigger:

- Household asks which transactions belong to a category.

Preconditions:

- Category exists or historical category meaning remains interpretable.
- Transaction history exists.

Business Rules:

- Filtering is read-only.
- Filtering must preserve transaction facts.
- Archived categories may remain meaningful for historical filtering.

Expected Result:

- Household receives transaction facts matching category meaning.

Failure Result:

- No transaction state changes when no matching facts exist or category meaning is unavailable.

## Summarize Category Actuals

Trigger:

- Household asks how much actual income or expense belongs to a category over a period.

Preconditions:

- Categorized transaction facts exist.
- Period and category meaning are understandable.

Business Rules:

- Summary is actuals-only.
- Summary must not imply budget, category balance, available money, or spending cap.
- Summary must not include virtual planning movement as real spending.
- Health may read summaries but cannot mutate them.

Expected Result:

- Household sees past transaction totals grouped by category meaning.

Failure Result:

- Summary is not presented as complete truth when category meaning is missing, invalid, or materially uncertain.

## Rename Category

Trigger:

- Household decides category wording should change.

Preconditions:

- Category exists.
- New wording preserves or clarifies intended meaning.
- Rename does not turn category into budget, account, payment method, or jar.

Business Rules:

- Category history must remain interpretable.
- Rename changes label wording, not transaction facts.
- Rename must not hide past meaning.

Expected Result:

- Category has clearer current wording.
- Historical meaning remains understandable.

Failure Result:

- Rename is not accepted when it creates boundary confusion, duplicate meaning, or historical ambiguity that cannot be explained.

## Archive Category

Trigger:

- Household no longer wants to use a category for future transactions.

Preconditions:

- Category exists.
- Category may or may not have historical transaction use.

Business Rules:

- Archive affects future selection only.
- Archive must not erase historical transaction meaning.
- Archive must not mutate money facts or planning state.

Expected Result:

- Category is unavailable for future ordinary selection.
- Historical transactions remain understandable.

Failure Result:

- Archive is not accepted when it would orphan historical meaning or create invalid unresolved state.

## Restore Category

Trigger:

- Household needs an archived category again.

Preconditions:

- Category exists as archived.
- Category meaning is still valid.

Business Rules:

- Restore reopens future use.
- Restore does not change past transaction facts.
- Restore does not imply prior archive was a financial correction.

Expected Result:

- Category becomes available for future classification again.

Failure Result:

- Category remains archived when meaning is invalid, conflicting, or outside boundaries.

## Review Provider Or Merchant Suggestion

Trigger:

- External or inferred evidence suggests a category.

Preconditions:

- Suggestion is presented as evidence, not final truth.
- Household can accept, ignore, or override the suggestion.
- Suggested category is valid for the transaction meaning.

Business Rules:

- Household category overrides provider category.
- Provider category is not certified truth.
- Suggestions must not silently finalize household meaning.
- Suggested categorization must not invent money movement or planning outcome.

Expected Result:

- If accepted, transaction receives household category meaning.
- If ignored or rejected, no final category meaning changes.

Failure Result:

- Suggestion is not applied when the household does not understand or accept it, or when it violates category kind or boundaries.

## Review Shared Category Meaning

Trigger:

- A partner questions or needs to understand category meaning.

Preconditions:

- Household context is valid.
- Review concerns comprehension of meaning, not approval of spending.

Business Rules:

- Shared meaning supports household understanding.
- Categories must not become surveillance, blame, or approval workflow.
- Partner review does not change money facts by itself.

Expected Result:

- Household meaning is clarified, corrected, or left unresolved.

Failure Result:

- If no valid shared meaning is agreed, prior valid meaning remains or the transaction stays uncategorized.
