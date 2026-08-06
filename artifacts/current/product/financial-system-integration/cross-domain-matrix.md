# Cross-Domain Matrix

## Validation Result

PASS WITH RECOMMENDATIONS

The documented interactions are directionally coherent. The older synchronized architecture names 9 bounded contexts, while the completed blueprint set names 12 business domains. This is acceptable if Savings, Investments, Goals, Loans, Cards, and Together are implemented as modules or sub-contexts under the approved architecture without changing ownership.

## Required Interaction Checks

| Interaction | Status | Validation |
| --- | --- | --- |
| Accounts <-> Transactions | Pass | Accounts own containers; Transactions explain movement and account impact. |
| Transactions <-> Categories | Pass | Transactions own facts; Categories classify meaning without rewriting amount, date, account, currency, or direction. |
| Categories <-> Planning | Pass | Category-to-Jar mapping supports actuals-to-plan interpretation under BR-12. |
| Planning <-> Goals | Pass | Goals are future intention and may participate in Planning without owning real product facts. |
| Savings <-> Inbox | Pass | Maturity, renewal, withdrawal, penalty, and settlement decisions are Inbox-eligible; Savings executes lifecycle after valid decision. |
| Loans <-> Inbox | Pass with recommendation | Due, overdue, stale, completed, and repayment review conditions are described; typed payloads need implementation-level specificity. |
| Cards <-> Inbox | Pass | Payment reminders, statement uncertainty, fees, refunds, and due dates are decision-bearing; Inbox cannot execute repayment. |
| Investments <-> Inbox | Pass with recommendation | Review-worthy uncertainty exists; decision taxonomy should prevent Inbox from becoming advice or trading workflow. |
| Inbox <-> Health | Pass | Health reads unresolved burden only and cannot mutate Inbox. |
| Together <-> writable domains | Pass with recommendation | Together scopes membership and policy visibility; implementation needs explicit actor authorization and materiality contracts per writable domain. |
| Health reads every domain | Pass | Health boundaries explicitly forbid writes to every domain. |

## Collaboration Pattern

```text
Source domain detects condition
-> emits typed event
-> Inbox creates eligible ReviewItem only if a decision is required
-> household resolves, acknowledges, defers, dismisses, expires, or auto-resolves where allowed
-> source domain consumes outcome under its own rules
-> Health may read final state but emits no operational event
```

## Matrix Risk

The source material is consistent, but implementation could drift if event names, payload meanings, and ownership checks are spread informally across features. The integration layer needs a canonical event registry derived from frozen business rules and blueprints.

