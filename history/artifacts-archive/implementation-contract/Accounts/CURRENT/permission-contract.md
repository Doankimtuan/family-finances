# Permission Contract

## Roles

- Owner: The user who created or primarily manages an account record; not a separate permission tier unless already supported by Together.
- Partner: Active household member.
- Viewer: Read-only household participant if such role exists in the consuming surface.
- Admin: Household member with administrative authority.
- Background Worker: System actor performing approved non-money tasks.
- System: Contract enforcement actor.

## Permission Matrix

| Action | Owner | Partner | Viewer | Admin | Background Worker | System | Reason |
|--------|-------|---------|--------|-------|-------------------|--------|--------|
| Create Account | Allowed if active member | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Household money action requires membership. |
| Edit Account | Allowed if active member | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Account facts are household money facts. |
| Review Account | Allowed if active member | Allowed | View only | Allowed | Forbidden | Forbidden | Review requires human judgment. |
| Reconcile / Manual Adjustment | Allowed if active member | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Explainable money trust repair requires authorized human. |
| Record Transaction Against Account | Allowed through Transactions | Allowed through Transactions | Forbidden | Allowed through Transactions | Only if approved by Transactions | Forbidden directly | Transactions own movement. |
| Recognize Transfer | Allowed through Transactions | Allowed through Transactions | Forbidden | Allowed through Transactions | Only if approved by Transactions | Forbidden directly | Transfer is Real Ledger behavior. |
| Mark Historical / Archive | Allowed if active member | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Changes active household account set. |
| Close Account | Allowed if active member | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Ends active use. |
| Restore Account | Allowed if active member | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Reopens active relevance. |
| Abandon Draft | Allowed for draft actor or active member | Allowed | Forbidden | Allowed | Forbidden | Forbidden | Draft has no financial history. |
| Export Account Records | Allowed if active member | Allowed | Allowed only if export permissions allow | Allowed | Forbidden | Forbidden | Export is read-only but sensitive. |
| Reject Invalid Attempt | Not applicable | Not applicable | Not applicable | Not applicable | Not applicable | Allowed | Contract enforcement. |

## Universal Permission Rules

- Non-members cannot read or mutate account data.
- Viewer cannot mutate account state or money.
- Background Worker cannot move money or change account state except where a future approved contract permits read-only/system maintenance behavior.
- System may reject invalid actions but must not invent business facts.

