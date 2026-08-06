# Permission Contract

## Roles

- Owner: User who created or primarily manages the card record; not a separate permission tier unless already supported by Together.
- Partner: Active household member.
- Viewer: Read-only household participant if such role exists in the consuming surface.
- Admin: Household member with administrative authority.
- Background Worker: System actor performing approved non-money tasks.
- System: Contract enforcement actor.

## Permission Matrix

| Action | Owner | Partner | Viewer | Admin | Background Worker | System | Reason |
|--------|-------|---------|--------|-------|-------------------|--------|--------|
| Create Card | Allowed if active member | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Card tracking affects household money interpretation. |
| Edit Card Facts | Allowed if active member | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Card facts affect obligation and planning. |
| Record Card Purchase | Allowed if active member | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Purchase changes obligation or real ledger context. |
| Associate Purchase To Billing Period | Allowed | Allowed | Forbidden | Allowed | Allowed if deterministic from approved facts | Allowed for validation/enforcement only | Billing association may be deterministic and non-money. |
| Record Statement | Allowed if active member | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Statement truth requires human interpretation. |
| Record Card Repayment | Allowed if active member | Allowed | Forbidden | Allowed | Forbidden | Forbidden directly | Real repayment record requires authorized human action. |
| Record Partial Repayment | Allowed if active member | Allowed | Forbidden | Allowed | Forbidden | Forbidden directly | Partial payment requires human interpretation. |
| Record Refund | Allowed if active member | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Refund interpretation affects obligation. |
| Record Fee Or Interest | Allowed if active member | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Charge interpretation affects obligation. |
| Record Cashback Or Statement Credit | Allowed if active member | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Credit interpretation affects obligation. |
| Recognize Card-Origin Installment | Allowed if active member | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Boundary with Loans requires human interpretation. |
| Close Card | Allowed if active member | Allowed | Forbidden | Allowed | Forbidden | Forbidden | State change affects household obligation truth. |
| Archive Card | Allowed if active member | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Changes current-use visibility. |
| Review Card | Allowed if active member | Allowed | View only | Allowed | Forbidden | Forbidden | Review requires human judgment. |
| Recover Card State | Allowed if active member | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Recovery requires human explanation. |
| Abandon Draft | Allowed for draft actor or active member | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Draft has no active financial history. |
| Create due/overdue reminder | Forbidden | Forbidden | Forbidden | Forbidden | Allowed if approved scheduler | Forbidden directly | Background Worker may surface attention without money movement. |
| Reject Invalid Attempt | Not applicable | Not applicable | Not applicable | Not applicable | Not applicable | Allowed | Contract enforcement. |

## Universal Permission Rules

- Non-members cannot read or mutate card data.
- Viewer cannot mutate card state, money, repayment, statement, or billing facts.
- Background Worker cannot move money, record repayment, close cards, or change balances.
- System may reject invalid actions but must not invent business facts.
- Partner visibility must respect household visibility rules from Together if they exist.
