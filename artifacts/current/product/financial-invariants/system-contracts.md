# System Contracts

## Global Contracts

1. BR-01 is non-negotiable. Real ledger and virtual planning are separate in data, UI, APIs, tests, and language.
2. BR-24 is non-negotiable. Health is read-only and has zero write paths.
3. Financial history is append-only.
4. Every money mutation is account-grounded.
5. Every source truth has exactly one owner.
6. Every cross-domain effect travels through explicit events or source-owned commands.
7. Every financial operation is idempotent.
8. Every temporal operation is deterministic.
9. Every failed operation preserves prior valid state or moves to explicit review.
10. Every financial fact is auditable.

## Domain Ownership Matrix

| Truth | Owner |
| --- | --- |
| Account identity and recorded position | Accounts |
| Real money movement | Transactions |
| Virtual allocation and plan capacity | Planning/Jars |
| Category meaning and jar mapping | Categories |
| Savings product principal, maturity, renewal, withdrawal | Savings |
| Investment holding, valuation context, exit meaning | Investments |
| Loan obligation and remaining principal | Loans |
| Card obligation and due interpretation | Cards |
| Decision-bearing attention | Inbox |
| Membership, authority, visibility | Together |
| Interpretation only | Health |

## Forbidden Contracts

- Planning-to-ledger direct mutation.
- Health write access.
- Inbox-as-payment.
- Reminder-as-proof.
- Goal-as-balance.
- Credit-limit-as-cash.
- Unrealized-investment-value-as-spendable-money.
- Expected-interest-as-ledger-income.
- Silent historical rewrite.

