# Action Contract

## Record Income

Trigger:

- Money enters a household account.

Actor:

- Owner, Partner, Admin, or System when acting on a valid household money event.

Preconditions:

- Actor may perform money actions for the household.
- Household context is valid.
- Destination account is active and real.
- Amount, currency, date, destination account, and income direction are known.

Validation:

- Amount is positive.
- Currency is supported by current household scope.
- Date is valid.
- Destination account belongs to household and is active.
- Income is not a jar allocation, goal progress, forecast, or Health signal.

Business Rules:

- BR-01, BR-02, BR-02a, BR-06, BR-12, BR-15.
- Income may create review work when meaning is incomplete.

Success Result:

- Transaction becomes Recorded.
- If meaning is complete, state becomes Resolved.
- If meaning is incomplete, state becomes Needs Review.
- Account real position becomes explainable.

Failure Result:

- Transaction is not created.
- Prior state is unchanged.
- User-visible failure explains invalid field, permission, state, account, or boundary issue.

## Record Expense

Trigger:

- Money leaves a household account.

Actor:

- Owner, Partner, Admin, or System when acting on a valid household money event.

Preconditions:

- Actor may perform money actions for the household.
- Household context is valid.
- Source account is active and real.
- Amount, currency, date, source account, and expense direction are known.

Validation:

- Amount is positive.
- Currency is supported by current household scope.
- Date is valid.
- Source account belongs to household and is active.
- Expense is not virtual planning movement.

Business Rules:

- BR-01, BR-02, BR-02a, BR-06, BR-12, BR-15.
- Unmapped or unclear expense enters review.

Success Result:

- Transaction becomes Recorded.
- If meaning is complete, state becomes Resolved.
- If meaning is incomplete, state becomes Needs Review.
- Account real position becomes explainable.

Failure Result:

- Transaction is not created.
- Prior state is unchanged.
- User-visible failure explains invalid field, permission, state, account, or boundary issue.

## Record Owned-Account Transfer

Trigger:

- Money moves between two household-owned real accounts.

Actor:

- Owner, Partner, Admin, or System when acting on a valid household transfer.

Preconditions:

- Actor may perform money actions for the household.
- Source and destination accounts are active, real, and household-owned.
- Source and destination are distinct.
- Amount, currency, date, source, and destination are known.

Validation:

- Amount is positive.
- Source account is valid.
- Destination account is valid.
- Transfer does not use category or jar meaning as money movement.
- Any fee must be handled as separate expense meaning.

Business Rules:

- BR-01, BR-02, BR-02a, BR-06, BR-12, BR-15.
- Transfer is not income by default.
- Transfer is not expense by default.
- Transfer has no jar impact by default.

Success Result:

- Transfer becomes Recorded.
- If owned-account neutrality is clear, state becomes Resolved.
- If ownership or purpose is unclear, state becomes Needs Review.
- Household total real position remains neutral except separately recorded fees.

Failure Result:

- Transfer is not recorded as ordinary income or expense.
- Prior state is unchanged.
- Ambiguous transfer is rejected or kept Needs Review only when a real transaction fact already exists.

## Add Or Change Household Meaning

Trigger:

- Household clarifies transaction note, category, or planning reference.

Actor:

- Owner, Partner, or Admin.

Preconditions:

- Transaction exists.
- Transaction is Recorded, Needs Review, Resolved, Refund Linked, or Corrected.
- Requested meaning does not change real money facts.

Validation:

- Category, if used, is valid for household and transaction direction.
- Planning reference, if used, is valid and remains virtual.
- Note/description is household-appropriate and within current product limits.
- Amount, account, date, currency, and real direction are not changed by this action.

Business Rules:

- Category explains meaning.
- Jar/planning reference is virtual meaning.
- Review does not change truth.

Success Result:

- Meaning is updated.
- Transaction remains same real ledger fact.
- Needs Review becomes Resolved when no unresolved question remains.

Failure Result:

- Meaning is unchanged.
- Transaction remains in previous valid state.

## Send To Review

Trigger:

- Transaction meaning, category, transfer interpretation, refund relation, or planning reference is incomplete.

Actor:

- Owner, Partner, Admin, System, or Background Worker.

Preconditions:

- Transaction exists.
- Review reason is connected to transaction understanding.

Validation:

- Transaction is not Historical unless active uncertainty is being restored.
- Review item is not duplicative of an existing active review for the same transaction/reason.
- Review does not alter amount, account, date, currency, or direction.

Business Rules:

- Unresolved facts remain visible.
- Review does not change truth.
- No unnecessary Inbox items.

Success Result:

- Transaction becomes Needs Review.
- Inbox item exists when user action is required.

Failure Result:

- No new review item is created.
- Transaction state remains unchanged.

## Resolve Review

Trigger:

- Household answers an unresolved transaction question.

Actor:

- Owner, Partner, or Admin.

Preconditions:

- Transaction is Needs Review.
- Actor may resolve household review work.
- Resolution is within domain boundaries.

Validation:

- Resolution does not mutate financial anchors.
- Category/planning references are valid if supplied.
- Transfer/refund/correction/reversal outcome uses the corresponding action when needed.
- Resolution does not hide unresolved financial uncertainty.

Business Rules:

- Review clarifies meaning only.
- Inbox resolution does not move money.

Success Result:

- Transaction becomes Resolved, Refund Linked, Corrected, Reversed, or remains Needs Review with clearer reason.
- Related Inbox item is resolved or remains pending according to unresolved work.

Failure Result:

- Review remains open.
- Transaction remains Needs Review.

## Search Or Filter Activity

Trigger:

- User asks to view, find, or filter transaction history.

Actor:

- Owner, Partner, Viewer, Admin, System, Background Worker for read-only purposes.

Preconditions:

- Actor may view household transaction history.

Validation:

- Read scope is within household access.
- Search/filter criteria are read-only.

Business Rules:

- Search and filtering do not change state.
- Health/read-only consumers cannot mutate facts.

Success Result:

- Matching transaction history is returned or empty state is shown.
- No transaction state changes.

Failure Result:

- No transaction state changes.
- User-visible error explains permission or read failure.

## Record Refund

Trigger:

- Money returns in relation to a previous expense or unresolved returned-money event.

Actor:

- Owner, Partner, Admin, or System when acting on a valid household money event.

Preconditions:

- Refund amount, account, date, and returned-money direction are known.
- Original expense is identifiable, or refund will remain Needs Review.
- Original transaction is not invalid for refund relation.

Validation:

- Refund amount is positive.
- Refund account is active and real.
- Refund does not exceed original refundable business meaning unless marked Needs Review.
- Refund is not treated as ordinary income when linked to original expense.

Business Rules:

- Refund is linked real event.
- Partial and full refunds preserve original story.
- Refund does not erase original expense.

Success Result:

- Refund transaction is Recorded.
- Original transaction becomes Refund Linked when relation is valid.
- Refund transaction becomes Resolved or Needs Review.
- Account real position becomes explainable.

Failure Result:

- Refund is not linked incorrectly.
- If returned money is real but original is unknown, it remains Needs Review.
- Prior valid states remain.

## Correct Transaction

Trigger:

- Household determines amount, account, date, currency, or direction is wrong.

Actor:

- Owner, Partner, or Admin.

Preconditions:

- Original transaction exists.
- Original is Recorded, Needs Review, or Resolved.
- Correction reason is explainable.
- Corrected facts are complete and valid.

Validation:

- Corrected amount is positive when applicable.
- Corrected account is active and real.
- Corrected date and currency are valid.
- Corrected direction respects income/expense/transfer semantics.
- Correction is not a silent overwrite.
- Correction is not planning movement.

Business Rules:

- Correction audit truth.
- Invalid attempts preserve prior state.
- Financial safety outranks convenience.

Success Result:

- Original transaction becomes Corrected or part of Corrected history.
- Corrected transaction story is explainable.
- Any related review item is resolved or updated.
- Account real position becomes explainable according to corrected truth.

Failure Result:

- Original transaction remains unchanged or Needs Review.
- User-visible failure explains invalid correction.

## Reverse Transaction

Trigger:

- A previous transaction must be unwound because it should not stand as active financial truth.

Actor:

- Owner, Partner, or Admin.

Preconditions:

- Original transaction exists.
- Original is Recorded, Needs Review, or Resolved.
- Reversal reason is valid and explainable.

Validation:

- Reversal does not delete original.
- Reversal does not create virtual planning movement.
- Reversal does not return a Reversed transaction to ordinary Resolved state.

Business Rules:

- Reversal audit truth.
- Historical preservation.

Success Result:

- Original transaction becomes Reversed.
- Reversal story remains visible.
- Related review item is resolved or updated.

Failure Result:

- Original state remains unchanged.
- User-visible failure explains invalid reversal.

## Lightweight Reconciliation

Trigger:

- Household compares transaction history with bank, wallet, card, cash, or memory.

Actor:

- Owner, Partner, Admin, or System for read-only confidence checks.

Preconditions:

- Transaction history exists.
- Real-world reference or discrepancy exists.

Validation:

- Reconciliation input is not treated as authoritative provider import.
- Any money change routes through record, refund, correction, or reversal action.
- No automatic mutation is made by read-only comparison.

Business Rules:

- Lightweight reconciliation supports confidence.
- Provider data is not automatically authoritative.

Success Result:

- Transaction remains unchanged, becomes Needs Review, or proceeds through a valid recovery action.

Failure Result:

- Prior transaction states remain unchanged.
- User-visible result explains unresolved discrepancy.

## Archive As Historical

Trigger:

- Transaction no longer requires active review but remains part of household history.

Actor:

- Owner, Partner, Admin, or System.

Preconditions:

- Transaction exists.
- No active unresolved work remains, or household accepts historical uncertainty.

Validation:

- Archive is not deletion.
- Historical state preserves account evidence and audit relationships.

Business Rules:

- Historical preservation.
- Unresolved facts remain visible unless accepted as historical uncertainty.

Success Result:

- Transaction becomes Historical.
- It remains read-visible for account evidence and household memory.

Failure Result:

- Transaction remains Needs Review or previous valid state.
