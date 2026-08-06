# Requirement Impact

This file identifies requirement impacts only. It does not create or rewrite requirement Sources of Truth.

## New Requirements Identified

| Proposed requirement area | Affected capabilities | Impact |
|---------------------------|----------------------|--------|
| Credit-card record | CARD-PD-001, CARD-PD-003, CARD-PD-007, CARD-PD-009, CARD-PD-010 | Product may need explicit credit-card record support with issuer, limit, statement date, and due date. |
| Card obligation visibility | CARD-PD-011, CARD-PD-012, CARD-PD-013 | Product may need to show statement amount, paid amount, and remaining due amount as card obligation facts. |
| Card purchase and repayment distinction | CARD-PD-015, CARD-PD-022 | Product may need to distinguish original card spending from repayment movement. |
| Card refund awareness | CARD-PD-016 | Product may need to represent refunds in card context. |
| Card history retention | CARD-PD-023 | Product may need to keep card history readable after lifecycle changes. |

## Modified Requirements Identified

| Existing requirement area | Affected capabilities | Impact |
|---------------------------|----------------------|--------|
| Money / Accounts | CARD-PD-002, CARD-PD-008, CARD-PD-042 | Requirements should clarify that credit cards are not liquid accounts and available credit is not money. |
| Money / Transactions | CARD-PD-014, CARD-PD-015, CARD-PD-016, CARD-PD-022 | Requirements should clarify card-specific transaction timing and repayment semantics. |
| Money / Card Installment | CARD-PD-026, CARD-PD-043 | Requirements should clarify that card-origin installments are visible without making revolving balances Loans. |
| Health | CARD-PD-038, CARD-PD-044 | Requirements should clarify read-only card risk interpretation. |
| Planning / Inbox | CARD-PD-009, CARD-PD-010, CARD-PD-013 | Requirements should clarify due-date and remaining-due awareness without automatic payment execution. |

## Removed Requirements Identified

No existing requirements are identified for removal in this decision phase.

Rejected concepts that should not become requirements:

- Include available credit in real money totals.
- Treat revolving card debt as Loans by default.
- Let Health mutate Cards.
- Execute automatic card repayments.
