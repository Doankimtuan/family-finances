# Boundaries

## What Belongs Here

Inbox owns:

- Review item identity.
- Review item state.
- Decision queue visibility.
- Source linkage.
- Review context needed for household attention.
- Resolution, acknowledgement, dismissal, expiration, and archive state.
- Attribution of who processed an item.
- The distinction between open and no-longer-open items.

## What Belongs In Another Domain

| Concept | Owning Domain |
| --- | --- |
| Transaction fact, amount, account, direction | Transactions / Ledger |
| Real account balance | Accounts |
| Card statement, credit limit, due amount | Cards |
| Savings product terms, maturity, renewal, withdrawal | Savings |
| Loan or installment obligation | Loans |
| Jar allocation and budget intent | Planning / Ledger depending on existing ownership |
| Household membership and authorization | Tenancy |
| Provider connection and imported data pipeline | Integration / Provider boundary |
| Notifications, push messages, email delivery | Notification system |
| Financial health scoring | Health / Insights |

## Where Integrations Happen

Integrations may feed Inbox through:

- Bank or wallet transaction imports.
- Card statements and reminders.
- Savings maturity notices.
- Bill-provider reminders.
- E-invoice or receipt sources.
- Internal domain events that require household review.

Integration does not transfer ownership of the financial fact to Inbox. It only creates or updates household attention.

## Where Ownership Changes

Ownership changes when a pending decision becomes a domain action or historical record.

- Inbox owns pending attention.
- The source domain owns the financial fact.
- The target domain owns the result of a decision.
- Historical audit may be shared, but financial truth remains with the owning domain.

## What Inbox Should Not Become

- A general notification center.
- A chat or comment system.
- A task-management system.
- A provider statement ledger.
- A payment executor.
- A hidden automation engine.
- A replacement for month-end review.
