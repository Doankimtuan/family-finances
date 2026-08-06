# Permission Contract

## Roles

- Owner: User who created or primarily manages the loan record; not a separate permission tier unless already supported by Together.
- Partner: Active household member.
- Viewer: Read-only household participant if such role exists in the consuming surface.
- Admin: Household member with administrative authority.
- Background Worker: System actor performing approved non-money tasks.
- System: Contract enforcement actor.

## Permission Matrix

| Action | Owner | Partner | Viewer | Admin | Background Worker | System | Reason |
|--------|-------|---------|--------|-------|-------------------|--------|--------|
| Create Loan | Allowed if active member | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Household money obligation action requires membership. |
| Edit Loan Details | Allowed if active member | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Loan facts affect household planning and trust. |
| Update Rate Awareness | Allowed if active member | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Rate changes require human interpretation. |
| Review Loan | Allowed if active member | Allowed | View only | Allowed | Forbidden | Forbidden | Review requires human judgment. |
| Record Scheduled Repayment | Allowed if active member | Allowed | Forbidden | Allowed | Forbidden | Forbidden directly | Real repayment record requires authorized human action. |
| Record Partial Or Irregular Repayment | Allowed if active member | Allowed | Forbidden | Allowed | Forbidden | Forbidden directly | Irregular payment requires human interpretation. |
| Estimate Early Payoff | Allowed | Allowed | Allowed if loan visible | Allowed | Forbidden | Forbidden | Read-only planning context. |
| Mark Completed | Allowed if active member | Allowed | Forbidden | Allowed | Forbidden | Forbidden | State change affects household obligation truth. |
| Cancel Loan | Allowed if active member | Allowed | Forbidden | Allowed | Forbidden | Forbidden | State change affects household obligation truth. |
| Mark Defaulted | Allowed if active member | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Serious state change requires authorized human. |
| Archive Loan | Allowed if active member | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Changes current-use visibility. |
| Recover Loan State | Allowed if active member | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Recovery requires human explanation. |
| Abandon Draft | Allowed for draft actor or active member | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Draft has no active financial history. |
| Create due/overdue reminder | Forbidden | Forbidden | Forbidden | Forbidden | Allowed if approved scheduler | Forbidden directly | Background Worker may surface attention without money movement. |
| Reject Invalid Attempt | Not applicable | Not applicable | Not applicable | Not applicable | Not applicable | Allowed | Contract enforcement. |

## Universal Permission Rules

- Non-members cannot read or mutate loan data.
- Viewer cannot mutate loan state, money, repayment, or rate.
- Background Worker cannot move money, record repayment, close loans, or change balances.
- System may reject invalid actions but must not invent business facts.
- Partner visibility must respect household visibility rules from Together if they exist.

