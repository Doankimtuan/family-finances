# Validation Contract

## Required Fields

| Item | Required fields |
| --- | --- |
| Income intention | Name/source label, expected amount or basis, direction, household context |
| Jar | Name, kind, state, household context |
| Allocation | Target intention, amount or percent, planning period/context |
| Goal | Name, target amount when used, status, household context |
| Recurring expectation | Name, expected amount, direction, frequency/timing, active status |
| Expected due date | Date, expected/source-confirmed status, related item |
| Review period | Period, actor, review decision |
| Correction | Target item/period, correction reason, corrected planning value |
| Emergency reallocation | Source/affected intention, amount, direction, reason |

## Business Validation

- Actor has valid household context.
- Item belongs to the active household.
- Action is allowed for current state.
- Locked periods accept only correction behavior.
- Historical records are read-only.
- Draft cannot be completed directly.
- Terminal states cannot silently become Active.

## Financial Validation

- Planning action cannot move money.
- Amounts used for virtual movement are positive.
- Allocation percent is within valid planning range.
- Planned amount is not balance.
- Expected income is not received income.
- Recurring expectation is not payment.
- Goal progress is not Savings product balance.
- Emergency reallocation is not transfer or withdrawal.

## Ownership Validation

- Accounts own account position.
- Transactions own real movement.
- Cards own card truth.
- Loans own loan truth.
- Savings owns savings product truth.
- Inbox owns discrete decision queue.
- Health owns read-only interpretation.
- Together owns membership and policy.

## State Validation

- Requested transition must appear in state contract.
- Forbidden transitions fail.
- Invalid Attempt preserves prior valid state.
- Needs Review blocks lock only when review is required for period confidence.
- Archived and Historical items are not allocation targets.

## Cross-Domain Validation

- Source facts must belong to same household.
- Source facts are read-only in Planning.
- Source-confirmed facts must be attributed to owning domain.
- Health cannot write Planning.
- Inbox resolution cannot move money.
- Notifications cannot mutate Planning or money.
- AI explanation cannot invent balances, due truth, or actions.
