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

## Verification

Pass. Planning, Goals, Categories, Inbox, Health, and product experience sources consistently protect virtual-versus-real language. Implementation planning already requires a BR-01 constitutional check that plan movements execute `$0.00` ledger transactions.

## Engineering Contracts

- `PlanMovement` must never create a non-zero ledger mutation.
- Category-to-Jar mapping may explain spending but must not change account balances.
- Goal completion must be derived from source-domain evidence, not by treating target intent as held funds.
- UI labels must never call jar capacity, goal amount, or planned amount a bank balance.
- Reports must carry source ownership labels for account money, product value, obligation, and planning intent.

