# Cross-Domain Invariants

## Settlement Rules

1. Savings only moves money through Accounts and Transactions.
2. Investment cash effects only settle through Accounts and Transactions.
3. Loan payments only settle through Accounts and Transactions.
4. Card repayments only settle through Accounts and Transactions.
5. Product domains may explain meaning but do not bypass ledger truth.

## Reference Rules

1. Refund always references the original transaction when identifiable.
2. Correction always references the original transaction and preserves reversal/correction chain.
3. Reclassification preserves ownership boundaries and does not duplicate source truth.
4. Transfers between household-owned accounts are neutral to total household position unless separate fees, taxes, FX, or corrections exist.

## Non-Mutation Rules

1. Inbox acknowledgement never mutates Ledger by itself.
2. Inbox resolution does not pay, transfer, renew, withdraw, repay, or correct by itself.
3. Health never mutates anything.
4. AI never invents balances or executes unauthorized transactions.
5. Reminders, notifications, and calendar entries do not prove payment or settlement.

## Required Contract

Every cross-domain event must define producer, source owner, payload, related object ids, idempotency key, consumer behavior, and forbidden side effects.

