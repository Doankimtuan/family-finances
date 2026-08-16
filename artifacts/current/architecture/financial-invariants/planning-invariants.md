# Planning Invariants

## Immutable Planning Truths

1. Planning never owns money.
2. Virtual Jars never change Ledger.
3. Goals never own money.
4. Categories never own money.
5. Only Accounts own where real money is.
6. Transactions own real money movement.
7. BR-01 must never be weakened: Real Ledger and Virtual Planning must remain distinct in language, data, APIs, UI, reports, tests, and future features.
8. Expected income, expected interest, recurring expectations, calendar pressure, goal progress, jar capacity, and reminders are not confirmed money.
9. Emergency reallocation changes planning capacity and communication priority only. It does not withdraw, transfer, repay, save, borrow, or spend.
10. Monthly Review is optional. Marking or skipping a review never locks Plan mutations or Money (Plan V2 supersedes V1 BR-08 lock).

## Verification

Pass. Planning, Goals, Categories, Inbox, Health, and product experience sources consistently protect virtual-versus-real language. Implementation planning already requires a BR-01 constitutional check that plan movements execute `$0.00` ledger transactions.

## Engineering Contracts

- `PlanMovement` must never create a non-zero ledger mutation.
- Category-to-Jar mapping may explain spending but must not change account balances.
- Goal completion must be derived from source-domain evidence, not by treating target intent as held funds.
- UI labels must never call jar capacity, goal amount, or planned amount a bank balance.
- Reports must carry source ownership labels for account money, product value, obligation, and planning intent.


## Plan V2 Review Invariants

10. Monthly Review is optional, non-blocking, and report-only.
11. `approved`, `pending_review`, and historical review states never make Plan mutations unavailable.
12. Assisted means recommendation layer only; it never moves money, auto-closes a period, or allocates automatically.
13. Legacy V1 ritual rows and timestamps may be preserved without becoming a second ledger or a Plan lock.
