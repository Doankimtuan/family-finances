# Inbox Contract

## Inbox Rules

- Inbox items exist only when user action is required.
- Inbox items must never create, mutate, or delete transaction money.
- Duplicate active Inbox items for the same transaction and same review reason are forbidden.
- Resolving an Inbox item clarifies meaning only unless it routes to a valid correction, refund, or reversal action.

## Event Matrix

| Business event | Should Inbox item exist? | Type | Priority | Required action | Expiration | Auto resolution | Dismiss rules |
|----------------|--------------------------|------|----------|-----------------|------------|-----------------|---------------|
| Expense recorded with complete meaning | No | None | None | None | None | None | Not applicable |
| Expense recorded with missing category/jar/meaning | Yes | Unresolved transaction meaning | Normal | Add meaning or intentionally leave unresolved | None by default | When transaction becomes Resolved, Corrected, Reversed, or Historical with accepted uncertainty | Dismiss only if household accepts no further action; no money change |
| Income recorded with complete meaning | No | None | None | None | None | None | Not applicable |
| Income recorded with missing placement/meaning where household policy expects review | Yes | Income meaning review | Normal | Clarify income meaning or placement reference | None by default | When transaction becomes Resolved or Historical with accepted uncertainty | Dismiss only if household accepts no further action; no money change |
| Owned-account transfer with clear neutrality | No | None | None | None | None | None | Not applicable |
| Transfer with unclear ownership/purpose | Yes | Transfer review | High | Confirm neutral transfer or reclassify via valid action | None by default | When transfer becomes Resolved, Corrected, or Reversed | Dismiss only if uncertainty is accepted; no income/expense count by default |
| Refund with known original | No unless user action remains | Refund review | Normal | Confirm relation only if needed | None by default | When Refund Linked is established | Dismiss only if refund relation is not needed |
| Refund without original | Yes | Refund review | Normal | Link original or accept unresolved returned money | None by default | When linked or accepted as unresolved historical fact | Dismiss only with no money mutation |
| Correction needed | Yes if user must decide | Correction review | High | Confirm corrected facts or leave Needs Review | None by default | When Corrected or Reversed | Dismiss only if transaction remains Needs Review or accepted historical uncertainty |
| Reversal needed | Yes if user must decide | Reversal review | High | Confirm reversal reason | None by default | When Reversed | Dismiss only if reversal not pursued |
| Reconciliation discrepancy | Yes if unresolved after comparison | Reconciliation review | High | Choose no change, review, correction, refund, or reversal | None by default | When discrepancy has valid outcome | Dismiss only if discrepancy accepted |
| Search/filter no results | No | None | None | None | None | None | Not applicable |
| Archive historical | No | None | None | None | None | None | Not applicable |

## Priority Definitions

- High: Financial fact or classification can distort income, expense, transfer, refund, correction, or account explanation.
- Normal: Meaning is useful but does not currently threaten financial correctness.

## Expiration Contract

- Transaction review items do not expire by default.
- Expiration may not silently resolve money ambiguity.

## Auto Resolution Contract

- Auto resolution is allowed only when a valid transaction state transition removes the need for review.
- Auto resolution must never infer household meaning from Health, AI, or provider data as final truth.
