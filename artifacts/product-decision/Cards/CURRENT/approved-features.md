# Approved Features

## Approved Capabilities

| Capability IDs | Feature area | Why approved | Expected product value | Dependencies | Scope |
|----------------|--------------|--------------|------------------------|--------------|-------|
| CARD-PD-001 | Card instrument | Cards are real household financial instruments. | Establishes a clear place for card-specific behavior. | Accounts, Transactions | Household-recognizable card record. |
| CARD-PD-003 | Issuer identity | Users recognize cards by bank or provider. | Improves trust and statement matching. | Accounts | Issuer/provider identity only. |
| CARD-PD-007 | Credit limit | Credit limit is essential to credit-card reality. | Helps users avoid overuse and understand borrowing capacity. | Cards | Credit-card limit only; not cash. |
| CARD-PD-009, CARD-PD-010 | Statement and due dates | Dates are central to household repayment behavior. | Prevents surprise bills and supports cash-flow awareness. | Planning, Inbox | Statement date and payment due date. |
| CARD-PD-011, CARD-PD-012, CARD-PD-013 | Statement, paid, and remaining due amounts | Users need clear repayment amount visibility. | Shows what is owed, paid, and still due. | Transactions, Accounts | Recorded card obligation amounts. |
| CARD-PD-014 | Billing-period association | Credit-card transactions need statement context. | Helps explain why purchases appear in a bill. | Transactions | Association to billing period, not provider-grade reconciliation. |
| CARD-PD-015 | Purchase vs repayment separation | Prevents double-counting and protects BR-01. | Keeps household spending and card repayment understandable. | Transactions, Accounts | Card purchase and repayment are distinct financial events. |
| CARD-PD-016 | Refund awareness | Refund timing is a validated household confusion. | Improves trust when statement numbers change. | Transactions | Basic card refund awareness. |
| CARD-PD-022 | Card repayment source | Users must know where repayment money leaves from. | Preserves real-ledger clarity and household accountability. | Accounts, Transactions | Repayment from real money source to card obligation. |
| CARD-PD-023 | Card history preservation | Closure or expiry should not erase financial history. | Preserves auditability and partner context. | Accounts, Transactions | Historical card records remain readable. |

## Product Value

Approved capabilities create the minimum safe Cards product surface:

- Card identity.
- Credit-card limit and billing dates.
- Statement amount, paid amount, and remaining due.
- Clear separation of spending and repayment.
- Refund awareness.
- Real repayment source.
- Preserved history.

These support long-term household financial management without introducing unnecessary automation or provider-dependent complexity.
