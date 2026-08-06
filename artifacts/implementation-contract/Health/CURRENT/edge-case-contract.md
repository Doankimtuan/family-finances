# Edge Case Contract

## Duplicate Assessment

Trigger:

- Same actor requests Health multiple times.

Expected behavior:

- Assessment may be repeated or reused only if current facts are still valid.

Business result:

- No duplicate state, Inbox item, notification, or source write.

User-visible result:

- Current assessment or loading state.

Recovery behavior:

- Refresh from current facts if prior context is stale.

## Expired Or Stale Facts

Trigger:

- Prior source context is no longer current.

Expected behavior:

- Health becomes Stale or omits stale factor/comparison.

Business result:

- No source changes.

User-visible result:

- Stale or partial context shown.

Recovery behavior:

- Refresh after source facts become current.

## Permission Change

Trigger:

- Household role, partner visibility, or source permission changes.

Expected behavior:

- Health reassesses visible context or becomes Unavailable.

Business result:

- No source changes.

User-visible result:

- Permission-blocked or reduced-factor context.

Recovery behavior:

- Reassess after permission restoration.

## Source Conflict

Trigger:

- Source facts are contradictory or cannot be interpreted safely.

Expected behavior:

- Conflicting factor is omitted or assessment becomes Partial/Invalid Attempt.

Business result:

- Correction belongs to source domain.

User-visible result:

- Health explains that source context is incomplete or inconsistent when possible.

Recovery behavior:

- Reassess after source-domain correction.

## Virtual Money Confusion

Trigger:

- Scenario or factor would treat Planning/Goals as spendable cash.

Expected behavior:

- Interpretation is blocked.

Business result:

- Invalid Attempt or factor omission.

User-visible result:

- Boundary message: planning is intention, not real money.

Recovery behavior:

- Use real ledger facts for money interpretation.

## Advisory Drift

Trigger:

- Factor or scenario would provide medical, insurance, credit, investment, tax, or legal advice.

Expected behavior:

- Unsafe interpretation is blocked or omitted.

Business result:

- Health remains non-advisory.

User-visible result:

- Neutral financial-pressure language only.

Recovery behavior:

- Reassess with non-advisory factor language.

## Interrupted Process

Trigger:

- Network or source-read interruption occurs during assessment.

Expected behavior:

- Health becomes Unavailable, Partial, or Stale.

Business result:

- No source changes.

User-visible result:

- Loading or error state.

Recovery behavior:

- Retry assessment.

## Invalid Mutation Attempt

Trigger:

- Actor attempts to move money, edit source facts, resolve Inbox, or create notification through Health.

Expected behavior:

- Attempt is rejected.

Business result:

- Invalid Attempt; prior valid Health state remains if current.

User-visible result:

- Boundary error or route to owning domain without action.

Recovery behavior:

- User performs action in owning domain if permitted.
