# Exceptional Scenarios

## Cancellation

Health has no cancellable owned money object.

Business expectation:

- User may leave or stop viewing Health.
- No source facts change.
- Current assessment ends for that session.

## Correction

Health cannot correct source facts.

Business expectation:

- If Health appears wrong, the correction occurs in the owning domain.
- Health reassesses only after corrected facts are visible.

## Recovery

Recovery occurs after missing, stale, invalid, or unavailable context is resolved outside Health.

Business expectation:

- Health moves from Unavailable, No Visible Facts, Partial, Stale, or Invalid Attempt to a valid assessment state only when grounded facts support it.

## Emergency

Examples:

- Medical expense appears.
- Sudden family support is needed.
- Debt pressure rises.
- Salary is delayed.

Business expectation:

- Health may reflect visible pressure.
- Health must not advise medical, insurance, credit, or payment action.
- Health must not move money.

## Conflict

Examples:

- Partners disagree about the interpretation.
- One partner believes hidden cash or obligations exist.
- A Health factor feels blaming.

Business expectation:

- Health remains household-level and neutral.
- Partner-specific scoring is forbidden.
- Missing facts can make the assessment Partial.

## Expired Data

Examples:

- Source facts are too old.
- Prior comparison is no longer comparable.
- Household membership changed since prior assessment.

Business expectation:

- Health marks assessment Stale or omits comparison.
- Health does not silently use expired facts.

## Invalid State

Examples:

- Health is asked to treat a jar as cash.
- Health is asked to resolve an Inbox item.
- Health is asked to trigger repayment.
- Health is asked to provide insurance advice.

Business expectation:

- Health returns Invalid Attempt for the requested interpretation.
- Prior valid assessment remains unchanged if still current.

## Unexpected User Behavior

Examples:

- User interprets Strong as permission to spend.
- User interprets Starting as personal failure.
- User expects Health to know missing cash.

Business expectation:

- Health must keep source factors and completeness visible.
- Health must not strengthen the misunderstanding with advisory language.

## System Interruption

Examples:

- Source-domain facts are unavailable.
- Household permission cannot be verified.
- Assessment cannot be explained safely.

Business expectation:

- Health becomes Unavailable, Partial, Stale, or Invalid Attempt.
- No source-domain facts are changed.
