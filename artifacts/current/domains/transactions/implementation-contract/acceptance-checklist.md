# Acceptance Checklist

## Core Actions

- [ ] Income cannot be recorded without valid household, actor, active account, positive amount, currency, date, and direction.
- [ ] Expense cannot be recorded without valid household, actor, active account, positive amount, currency, date, and direction.
- [ ] Owned-account transfer requires distinct valid household-owned source and destination accounts.
- [ ] Transfer is not counted as income by default.
- [ ] Transfer is not counted as expense by default.
- [ ] Meaning-only update never changes amount, account, date, currency, or direction.
- [ ] Search/filter never changes transaction state.
- [ ] Archive never deletes transaction history.

## State

- [ ] Every valid record action results in Recorded then Resolved or Needs Review.
- [ ] Needs Review can become Resolved only through valid household decision.
- [ ] Reversed cannot become ordinary Resolved.
- [ ] Historical transactions remain read-visible.
- [ ] Invalid Attempt never mutates prior valid state.
- [ ] Every transition matches state-contract.md.

## Money

- [ ] Ledger updates only when real money moves or audit-safe correction/reversal explains prior money truth.
- [ ] Inbox acknowledgment never changes money.
- [ ] Category change never changes money.
- [ ] Jar/planning reference never changes real ledger money.
- [ ] Refund linked to original expense is not ordinary income.
- [ ] Correction preserves audit story and does not silently overwrite history.
- [ ] Reversal unwinds active meaning and does not delete history.

## Inbox

- [ ] Missing expense meaning creates one active review item when user action is required.
- [ ] Missing income meaning creates review only when household policy expects review.
- [ ] Clear owned-account transfer creates no Inbox item.
- [ ] Ambiguous transfer creates review and is not counted as income/expense by default.
- [ ] Refund without original creates review.
- [ ] Duplicate active review item for same transaction/reason is forbidden.
- [ ] Resolving Inbox review never moves money unless routed to valid money action.

## Permissions

- [ ] Viewer cannot record, correct, reverse, refund, resolve review, archive, or change meaning.
- [ ] Owner and Partner can perform ordinary household money actions.
- [ ] Background Worker cannot make household judgment decisions.
- [ ] System cannot use Health, AI, or provider data as final transaction truth.
- [ ] Forbidden action leaves prior state unchanged.

## UI Behavior

- [ ] Money actions show pending/working state.
- [ ] Duplicate submission is prevented during pending/working state.
- [ ] Correction and reversal require confirmation.
- [ ] Failed action visibly states no transaction state changed.
- [ ] Empty history state is shown when no transactions exist.
- [ ] Empty search result does not imply money is missing.
- [ ] Boundary errors explain Real Ledger versus Virtual Planning in plain language.

## Cross-Domain

- [ ] Accounts provide active real container validation.
- [ ] Planning consumes transaction facts but never creates transaction facts.
- [ ] Health never writes transaction data.
- [ ] Cards, Loans, Savings, and Goals consume transaction facts without owning them.
- [ ] Categories validate meaning without changing money.
- [ ] Together consumes transaction evidence without mutating transaction truth.

## Edge Cases

- [ ] Duplicate action does not create duplicate active money meaning.
- [ ] Interrupted retry produces one valid result or no state change.
- [ ] Provider changes are read-only evidence in current scope.
- [ ] Missing account blocks ordinary Recorded/Resolved state.
- [ ] Refund without original remains Needs Review.
- [ ] Transfer misclassification triggers neutral-transfer handling or review.
