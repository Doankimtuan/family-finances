# Edge Case Contract

## Duplicate Action

Trigger:

- User repeats activate, exit, cancel, archive, or valuation update.

Expected behavior:

- If repeated action would create duplicate state change, reject or treat as no-op.

Business result:

- No duplicate holding, exit, Inbox item, or money interpretation.

User-visible result:

- User sees already-completed or duplicate-action message.

Recovery behavior:

- User may review or correct if previous action was wrong.

## Expired Or Stale Data

Trigger:

- Valuation date is old, unknown, or contradicted by later information.

Expected behavior:

- Value remains estimated and stale/unknown.

Business result:

- Holding may enter Under Review if stale value affects interpretation.

User-visible result:

- Stale/unknown warning.

Recovery behavior:

- Update valuation or accept stale/unknown status.

## Cancelled Operation

Trigger:

- User abandons recognition, exit, update, or review before confirmation.

Expected behavior:

- No state change occurs.

Business result:

- Previous valid state remains.

User-visible result:

- Action cancelled or no changes saved.

Recovery behavior:

- User may restart action.

## Provider Changes

Trigger:

- Provider value, statement, or availability changes.

Expected behavior:

- Provider data is read-only unless future integration is approved.
- Contradiction creates review, not automatic correction.

Business result:

- Holding remains Active or enters Under Review.

User-visible result:

- Source/date/context shown as changed or uncertain.

Recovery behavior:

- User confirms updated value or resolves contradiction.

## Manual Adjustment

Trigger:

- User manually changes value, contribution, cost context, liquidity, or ownership.

Expected behavior:

- Manual nature remains clear when relevant.

Business result:

- Read-only holding facts update; no money movement.

User-visible result:

- Updated context shown with manual/uncertain source if applicable.

Recovery behavior:

- Later correction can update or resolve manual uncertainty.

## Interrupted Process

Trigger:

- User closes app or system stops during action.

Expected behavior:

- Unconfirmed actions do not change state.
- Confirmed actions must be reflected once and only once.

Business result:

- No partial business transition.

User-visible result:

- User sees previous state or completed state, not an ambiguous half-state.

Recovery behavior:

- Review holding if user is unsure.

## Network Retry

Trigger:

- Same confirmed action is retried.

Expected behavior:

- Retry must not duplicate state changes, Inbox items, or transaction context.

Business result:

- Final state is deterministic.

User-visible result:

- User sees completed action or duplicate ignored.

Recovery behavior:

- User may review if result is uncertain.

## Conflict

Trigger:

- Partner updates same holding, or ownership/visibility is disputed.

Expected behavior:

- Conflicting facts do not silently overwrite trusted context.

Business result:

- Holding enters Under Review if conflict affects meaning.

User-visible result:

- Conflict/review message.

Recovery behavior:

- User resolves with corrected facts or accepted uncertainty.

## Invalid State

Trigger:

- User tries forbidden transition.

Expected behavior:

- Action is rejected.

Business result:

- State unchanged; no money moves.

User-visible result:

- State error explains unavailable action.

Recovery behavior:

- Use allowed transition or create new recognition if business reality changed.

## Unexpected User Behavior

Trigger:

- User tries to use unrealized gain as plan money, record contribution as profit, or request investment advice.

Expected behavior:

- Meaning is rejected.

Business result:

- No Planning update, no Ledger write, no advice.

User-visible result:

- Clear financial-safety message.

Recovery behavior:

- User records correct fact in owning domain.
