# Business Flows

## Create Account

Trigger:

- Household identifies a real container to track.

Preconditions:

- User is allowed to act for the household.
- Container has a household-recognizable name.
- Container has a broad account type.
- Starting recorded balance is known or intentionally set.

Business Rules:

- Account must represent a real-world container.
- Account name must be meaningful to the household.
- Account type must remain broad.
- Account must not be a jar, goal, or planning construct.

Expected Result:

- Account becomes Active.
- Eligible account may contribute to real position.
- Transactions may reference the account.

Failure Result:

- Account is not created as active.
- Invalid planning, jar, or non-real container is rejected.

## Update Account

Trigger:

- Household needs to correct recognition or relevance.

Preconditions:

- Account exists.
- Account is not terminally invalid.
- Change preserves historical meaning.

Business Rules:

- Updates cannot turn an account into a planning container.
- Updates cannot silently erase past transaction meaning.
- Broad type changes must preserve financial interpretation.

Expected Result:

- Account remains Active or Historical with updated meaning.

Failure Result:

- Invalid or boundary-breaking change is rejected.

## Review Account

Trigger:

- Household checks account truth against real-world source or memory.

Preconditions:

- Account exists.
- Household has a real-world reference or reason to review.

Business Rules:

- Review is a confidence action.
- Review does not automatically change money.
- Discrepancy must remain explainable.

Expected Result:

- Account is confirmed Active or marked Needs Review until resolved.

Failure Result:

- If truth cannot be established, account remains Needs Review.

## Reconcile / Adjust Recorded Balance

Trigger:

- Recorded balance differs from bank, wallet, card, cash, or household reality.

Preconditions:

- Account exists.
- Household accepts that the record is inaccurate or stale.
- Adjustment is explainable.

Business Rules:

- No silent overwrite.
- Adjustment is not planning allocation.
- Adjustment does not create jar movement.
- Adjustment is a Real Ledger trust repair.

Expected Result:

- Recorded account position becomes explainable again.
- Account returns to Active if uncertainty is resolved.

Failure Result:

- If discrepancy cannot be explained, account remains Needs Review.

## Record Transaction Against Account

Trigger:

- Money enters or leaves a real account.

Preconditions:

- Account is Active.
- Transaction domain owns the money movement record.

Business Rules:

- Account provides container context.
- Transaction owns event details.
- Planning does not directly change account balance.

Expected Result:

- Account recorded balance reflects transaction interpretation.

Failure Result:

- Transaction cannot use inactive, invalid, or non-existent account as active context.

## Recognize Transfer

Trigger:

- Money moves between two household-owned accounts.

Preconditions:

- Source and destination accounts are recognized.
- Movement is between household-relevant containers.

Business Rules:

- Transfer changes money location.
- Transfer does not create household income.
- Transfer does not create household expense.
- Transfer has no jar impact.

Expected Result:

- Source and destination account positions change.
- Household total real position remains neutral, except for fees or exchange effects owned elsewhere.

Failure Result:

- If source or destination is unclear, movement needs review.

## Mark Historical

Trigger:

- Account is no longer used actively but history remains relevant.

Preconditions:

- Account exists.

Business Rules:

- Historical account no longer participates in active daily account choices unless restored.
- Historical account remains available for past transaction meaning.

Expected Result:

- Account becomes Historical.

Failure Result:

- If account has unresolved active obligations, the state change requires review.

## Close Account

Trigger:

- Real-world container is closed or permanently ended.

Preconditions:

- Household recognizes closure.
- Remaining balance or obligation status is understood enough for business clarity.

Business Rules:

- Closure does not delete history.
- Closed account does not act as active transaction target.
- Closure metadata remains lightweight.

Expected Result:

- Account becomes Closed or Historical.
- Past transactions remain explainable.

Failure Result:

- If closure conflicts with active unresolved records, account enters Needs Review.

## Restore Account

Trigger:

- Household determines a Historical account is relevant again or was marked historical by mistake.

Preconditions:

- Account history exists.
- Account is not invalid.

Business Rules:

- Restoration must preserve past meaning.
- Restoration must not duplicate the same real-world container.

Expected Result:

- Account becomes Active.

Failure Result:

- If real-world identity is unclear, account remains Needs Review.

## Export Account Records

Trigger:

- Household wants portability of account facts.

Preconditions:

- Account facts exist.
- Export scope is account records, not advanced analysis.

Business Rules:

- Export is read-only.
- Export does not change account state.

Expected Result:

- Account facts are available outside product context.

Failure Result:

- If account facts cannot be prepared, no account state changes.

