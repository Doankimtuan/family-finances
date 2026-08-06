# Business Rules

## Existing Rules

| Rule | Behavior in Together |
|------|----------------------|
| BR-01 Real Ledger is not Virtual Planning | Together never treats household policies, membership, or roles as money, balances, jars, or allocations. |
| BR-02 Auth + membership required for money actions | Together membership supplies the household participation side of this rule. |
| BR-02a RLS membership enforcement | Household-scoped data must not be visible to non-members. |
| BR-02b Single account per verified email | Identity duplication must not create duplicate household meaning. |
| BR-04 Income placement household-level default | Together may hold household-level income placement policy; Planning owns behavior. |
| BR-07 Overspend policy | Together may hold current overspend policy; Planning owns enforcement. |
| BR-09 Month Ritual default | Together may expose household ritual mode context; Month Ritual owns execution. |
| BR-12 One active household per user in v2 Now | Multi-household is deferred; current behavior assumes one active household. |
| BR-13 Material policy changes partner-visible | Policy changes must be visible as household context. |
| BR-24 Health read-only | Health may read household-scoped context but must not change Together or money facts. |

## Clarified Rules

| Rule area | Clarified behavior |
|-----------|-------------------|
| Household trust boundary | Household membership defines who participates in shared finance. |
| Invitation consent | A person joins only through valid household creation or explicit acceptance. |
| Role simplicity | Partner/Admin are the only current responsibility concepts. |
| Admin meaning | Admin is policy responsibility, not money ownership or relationship authority. |
| Partner equality | Partners share daily money participation. |
| Policy attribution | Attribution explains material change context; it is not partner scoring. |
| Inactive member context | Inactive members may exist only for historical interpretation in current scope. |

## Derived Rules

| ID | Rule |
|----|------|
| TGT-BR-D01 | A household must have at least one active member to be active. |
| TGT-BR-D02 | A non-member must not access household-scoped financial information. |
| TGT-BR-D03 | A terminal invitation cannot be accepted. |
| TGT-BR-D04 | A policy change cannot move money. |
| TGT-BR-D05 | Role changes cannot create custom permissions. |
| TGT-BR-D06 | Historical membership context cannot imply current participation. |
| TGT-BR-D07 | Household preferences interpret future/current context but do not rewrite financial history. |
| TGT-BR-D08 | Together must reject legal-registry, dispute-resolution, surveillance, and automatic-money responsibilities. |

## Frozen SoT Notice

These rules document business behavior for this blueprint. They do not rewrite frozen Source of Truth artifacts.
