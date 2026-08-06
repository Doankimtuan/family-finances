# Business Boundaries

## What Belongs Here

Inbox owns:

- Review item business identity.
- Source linkage for attention.
- Reason attention is needed.
- Active versus historical attention.
- Business state of the review item.
- Household outcome: resolved, acknowledged, dismissed, deferred, expired, auto-resolved, or archived.
- Concise decision history.
- Non-punitive staleness and workload context.

## What Belongs Elsewhere

| Responsibility | Owning domain |
| --- | --- |
| Real account balances | Accounts |
| Transaction facts | Transactions |
| Card credit, statements, repayments | Cards |
| Loan contracts and repayments | Loans |
| Savings terms, maturity, renewal, withdrawal | Savings |
| Virtual allocation and intention | Planning |
| Goal intention and progress | Goals |
| Health interpretation | Health |
| Category vocabulary | Categories |
| Partner visibility and relationship policy | Together / household policy |
| Notifications and message delivery | Notification system |

## What Inbox Must Never Own

- Real money movement.
- Bank balance truth.
- Card repayment truth.
- Loan balance truth.
- Savings renewal or withdrawal truth.
- Jar balance or planning allocation truth.
- Health score mutation.
- Partner performance analytics.
- Generic notification feeds.
- Chat or comment systems.
- Provider statement truth.

## Responsibility Leakage Prevention

- Every Inbox item must have an owning source or source reason.
- Every outcome that affects another domain must be consumed by that domain under its own rules.
- Inbox outcome history must not be treated as financial truth unless the owning domain confirms the related financial truth.
- Inbox cannot become the owner merely because it is where the household made a decision.
