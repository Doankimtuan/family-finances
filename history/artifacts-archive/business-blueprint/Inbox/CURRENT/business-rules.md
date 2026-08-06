# Business Rules

## Existing Rules

| Rule | Business behavior |
| --- | --- |
| BR-01 Real Ledger != Virtual Planning | Inbox may connect real facts and planning decisions, but it cannot merge them or own either truth. |
| BR-24 Health is read-only | Health may consume Inbox context but cannot mutate Inbox items or outcomes. |

## Clarified Rules

| Rule | Business behavior |
| --- | --- |
| Inbox is decision-bearing attention only | Generic notifications, marketing, awareness-only messages, and passive feeds do not belong in Inbox. |
| Source ownership remains external | The source domain owns the fact, obligation, product, or intention that caused the item. |
| Resolution is not money movement | Resolving an Inbox item ends attention and may route outcome; it does not itself pay, transfer, save, borrow, or withdraw money. |
| Acknowledgement is not resolution | Acknowledgement means the household has seen and accepted awareness only. |
| Dismissal is not deletion | Dismissal removes active attention but does not erase source truth. |
| Expiration is not payment | Expiration ends time-bound Inbox attention only. |
| Archive is not hiding | Only no-longer-active items may become historical. |
| Deferral remains active attention | Deferred items are still unresolved and must not be treated as completed history. |

## Derived Rules

| Rule | Business behavior |
| --- | --- |
| Every accepted Inbox item must have a reason | The household must be able to understand why attention is needed. |
| Every accepted Inbox item must have source context | The item must remain traceable to a source domain or accepted source reason. |
| Suggestions must be explainable | Suggested outcomes are optional and subordinate to user decision. |
| Auto-resolution must be constrained | Auto-resolution may occur only for low-risk repeated review decisions and must not move money. |
| Staleness is non-punitive | Staleness gives operational context and must not be a shame score. |
| Workload metrics are operational | Inbox may count burden; Health may read it; Inbox does not score health. |
| Partner analytics are forbidden | Inbox must not measure partner performance or contribution. |
| Invalid attempts preserve prior state | Failed business actions do not change the item. |
