# Action Contract

## Create Account

Trigger:

- User chooses to track a real-world container.

Actor:

- Partner or Admin.

Preconditions:

- Actor has active household membership.
- Container is real, not a jar, goal, budget, or plan.
- Required account facts are supplied.

Validation:

- Name is present and recognizable.
- Broad type is allowed.
- Starting recorded balance is present or intentionally set to zero.
- Real-position eligibility can be determined.
- Account is not being created from a forbidden planning construct.

Business Rules:

- BR-01, BR-02, BR-02a, broad account typing, account must represent reality.

Success Result:

- Account enters Active state.
- Account may contribute to real position if eligible.
- Account can be used as transaction context.

Failure Result:

- No Active account is created.
- Previous state is unchanged.
- User receives validation or permission failure.

## Edit Account

Trigger:

- User changes recognition, broad type, household relevance, or lightweight metadata.

Actor:

- Partner or Admin.

Preconditions:

- Account exists.
- Account is Active, Needs Review, or Historical.
- Change preserves historical meaning.

Validation:

- Updated name remains recognizable.
- Updated type remains broad and allowed.
- Update does not convert account into planning object.
- Update does not erase past transaction meaning.

Business Rules:

- BR-01, account history preservation, broad account typing.

Success Result:

- Account remains in its prior valid state unless the edit resolves Needs Review.
- Updated facts are visible to the household.

Failure Result:

- Update is rejected.
- Existing account facts and state remain unchanged.

## Review Account

Trigger:

- User checks account truth against bank, wallet, cash count, card context, or household memory.

Actor:

- Partner or Admin.

Preconditions:

- Account exists.
- Actor has reason or reference for review.

Validation:

- Account is not Abandoned Draft.
- Review target is an account, not a jar or goal.

Business Rules:

- Review is confidence-only.
- Review does not move money.
- Review does not change planning.

Success Result:

- Account remains Active if confirmed.
- Account enters Needs Review if uncertainty exists.

Failure Result:

- If review cannot complete, account remains in previous state or Needs Review.

## Reconcile / Manual Balance Adjustment

Trigger:

- Recorded balance differs from real-world account reality.

Actor:

- Partner or Admin.

Preconditions:

- Account exists.
- Account is Active or Needs Review.
- Discrepancy is acknowledged by the user.
- Adjustment reason is explainable.

Validation:

- Adjustment is associated with a real account.
- Adjustment is not a jar allocation.
- Adjustment is not silent.
- Adjustment does not make Health or Planning the source of truth.

Business Rules:

- Account adjustment accountability, BR-01, BR-24.

Success Result:

- Account recorded position is explainable.
- Account returns to Active when uncertainty is resolved.
- No planning update occurs.

Failure Result:

- Account remains Needs Review if discrepancy is not explainable.
- No balance adjustment is applied.

## Record Transaction Against Account

Trigger:

- Real money enters or leaves a real account.

Actor:

- Partner, Admin, or permitted system path owned by Transactions.

Preconditions:

- Account exists and is Active.
- Transaction domain owns the money movement.

Validation:

- Account is active transaction context.
- Account is household-relevant.
- Account is not Closed, Historical, Draft, or Abandoned Draft.

Business Rules:

- Accounts provide container context; Transactions own event details.

Success Result:

- Transaction domain records the movement.
- Account recorded position reflects transaction interpretation.

Failure Result:

- Transaction is rejected or sent to review by the owning domain.
- Account state does not change except to Needs Review if context is uncertain.

## Recognize Transfer

Trigger:

- Money moves between two household-relevant accounts.

Actor:

- Partner, Admin, or permitted system path owned by Transactions.

Preconditions:

- Source account exists and is Active.
- Destination account exists and is Active.
- Movement is between household-relevant containers.

Validation:

- Source and destination are different accounts.
- Neither account is Closed, Historical, Draft, or Abandoned Draft.
- Transfer is not a jar movement.
- Transfer is not income or expense.

Business Rules:

- Transfer neutrality, BR-01.

Success Result:

- Source account position decreases.
- Destination account position increases.
- Household real position remains neutral except fees or other transaction-owned effects.
- No Inbox item is created when transfer is clear.
- No Planning update occurs.

Failure Result:

- If source/destination is unclear, related item needs review.
- No false income/expense is created.

## Mark Historical / Archive

Trigger:

- Account no longer participates in current household operations but history matters.

Actor:

- Partner or Admin.

Preconditions:

- Account exists.
- Account is Active or Needs Review.

Validation:

- Account is not Draft or Abandoned Draft.
- Account is not already Closed.
- Active unresolved obligation or unclear final meaning requires review.

Business Rules:

- Account history preservation.
- Inactive accounts cannot be active transaction targets.

Success Result:

- Account becomes Historical.
- Past transactions remain interpretable.
- Account is hidden or excluded from active actions according to UI contract.

Failure Result:

- Account enters or remains Needs Review if unresolved meaning blocks historical status.

## Close Account

Trigger:

- Real-world container is closed or permanently ended.

Actor:

- Partner or Admin.

Preconditions:

- Account exists.
- Account is Active or Needs Review.
- Closure is recognized by household.

Validation:

- Account has enough clarity to close.
- Account is not Draft or Abandoned Draft.
- Closure does not delete history.

Business Rules:

- Closure is not erasure.
- Closed account cannot be active transaction target.

Success Result:

- Account becomes Closed or Historical.
- Past transactions remain interpretable.
- No real money movement is created by closure alone.

Failure Result:

- Account enters Needs Review if closure conflicts with unresolved facts.

## Restore Account

Trigger:

- Historical account becomes relevant again or was archived by mistake.

Actor:

- Partner or Admin.

Preconditions:

- Account exists in Historical state.
- Account real-world identity is still valid or restoration is an acknowledged correction.

Validation:

- Restoration does not duplicate another Active account.
- Restoration preserves past meaning.
- Closed accounts require review before any active use.

Business Rules:

- Recovery transition; invalid attempts preserve prior state.

Success Result:

- Historical account becomes Active.

Failure Result:

- Account remains Historical or moves to Needs Review if identity is unclear.

## Abandon Draft

Trigger:

- User cancels account creation before activation.

Actor:

- Partner or Admin.

Preconditions:

- Account is Draft.

Validation:

- Draft has not become Active.

Business Rules:

- Abandoned Draft has no financial history.

Success Result:

- Draft becomes Abandoned Draft.
- Real position unchanged.

Failure Result:

- If account is already Active, abandonment is forbidden.

## Export Account Records

Trigger:

- Household requests account data portability.

Actor:

- Partner or Admin.

Preconditions:

- Account records exist.
- Actor has household access.

Validation:

- Export is account facts only.
- Export does not include forbidden analysis as Accounts-owned output.

Business Rules:

- Export is read-only.

Success Result:

- Account facts are made available for export.
- Account states and balances are unchanged.

Failure Result:

- Export fails without account state or money changes.

## Reject Invalid Attempt

Trigger:

- Any action violates state, permission, BR-01, BR-24, or product decision constraints.

Actor:

- System enforcing business contract.

Preconditions:

- Attempted action is invalid.

Validation:

- Identify violated contract.

Business Rules:

- Invalid attempts preserve previous valid state.

Success Result:

- Action is rejected.
- Prior state remains unchanged.
- User-visible failure reason is shown where user initiated the action.

Failure Result:

- No partial business state may persist.

