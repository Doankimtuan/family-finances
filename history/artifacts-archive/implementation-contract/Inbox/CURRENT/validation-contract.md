# Validation Contract

## Required Fields

Every accepted Inbox item must have:

- Household identity.
- Source domain or accepted source reason.
- Source reference or source context.
- Reason attention is needed.
- Item type.
- Current state.
- Created time.

Outcome actions must have:

- Actor.
- Item identity.
- Requested outcome.
- Outcome-specific required fields.

## Business Validation

- Item must be decision-bearing financial attention.
- Generic notification behavior is rejected.
- Required action must exist for every Pending item.
- Dismissal cannot hide required decision.
- Expiration requires time-bound basis.
- Auto-resolution requires accepted low-risk pattern.

## Financial Validation

- Inbox action must not move real money.
- Inbox action must not create ledger writes.
- Inbox action must not create planning allocation by itself.
- Inbox action must not mutate Health.
- Outcome routed to another domain must pass that domain's financial rules.

## Ownership Validation

- Actor belongs to household or has valid administrative/system authority.
- Viewer access is read-only.
- Background Worker cannot make household judgment.
- System cannot resolve ambiguous or high-risk items.

## State Validation

- Action must be allowed from current state.
- Terminal state cannot receive active action without recovery.
- Invalid attempt must preserve prior valid state.
- Archived item can return to Pending only through recovery.

## Cross-Domain Validation

- Source domain remains authoritative.
- Target domain must accept outcome before its own truth changes.
- Categories must validate category vocabulary.
- Planning must validate virtual intention boundaries.
- Health cannot be a mutation target.
- Together/household policy governs visibility-sensitive behavior.
