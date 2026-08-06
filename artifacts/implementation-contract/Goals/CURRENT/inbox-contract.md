# Inbox Contract

## Principle

Goals should not create unnecessary Inbox items.

Routine goal actions do not require Inbox. Inbox is used only when a household decision is needed because goal meaning or source evidence is unclear.

## Inbox Matrix

| Business event | Should Inbox item exist? | Type | Priority | Required action | Expiration | Auto resolution | Dismiss rules |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Goal created | No | None | None | None | None | None | Not applicable. |
| Goal edited | No | None | None | None | None | None | Not applicable. |
| Contribution update added | No | None | None | None | None | None | Not applicable. |
| Goal paused | No | None | None | None | None | None | Not applicable. |
| Goal resumed | No | None | None | None | None | None | Not applicable. |
| Goal completed | No | None | None | None | None | None | Not applicable. |
| Goal cancelled | No | None | None | None | None | None | Not applicable. |
| Target date approaching | No | None | None | None | None | None | Not applicable. |
| Target date passed | No by default | None | None | None | None | None | Not applicable. |
| Evidence missing | No by default | None | None | None | None | None | Not applicable. |
| Evidence conflicts with goal progress | Yes only when user attention is needed | GoalReview | Normal | Review progress, keep current meaning, edit progress, pause, complete, or cancel. | No automatic expiration in current contract. | No automatic resolution. | User may dismiss only when conflict is acknowledged. |
| Savings association becomes unreadable | Yes only if current goal view would otherwise mislead | GoalReview | Normal | Remove context, keep context as unavailable, or review goal progress. | No automatic expiration in current contract. | No automatic resolution. | User may dismiss after acknowledging unavailable source. |
| Partner conflict | No automatic Inbox item | None | None | None | None | None | Partner decision workflow is not approved scope. |

## Forbidden Inbox Behavior

- Inbox acknowledgment must never move money.
- Inbox dismissal must never update goal progress.
- Inbox must not automatically complete or cancel a goal.
- Inbox must not mutate Accounts, Transactions, Savings, Cards, Loans, or Health.
