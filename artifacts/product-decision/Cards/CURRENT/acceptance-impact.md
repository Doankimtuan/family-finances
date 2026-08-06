# Acceptance Impact

This file lists acceptance-criteria impacts only. It does not redesign tests or implementation.

## Required Acceptance Criteria Areas

| Impact area | Affected capabilities | Acceptance impact |
|-------------|----------------------|-------------------|
| Credit-card not real cash | CARD-PD-007, CARD-PD-008, CARD-PD-042 | Acceptance criteria should verify credit-card available credit does not increase real money totals. |
| Card due awareness | CARD-PD-009, CARD-PD-010, CARD-PD-013 | Acceptance criteria should verify due date and remaining due are visible and understandable. |
| Purchase vs repayment | CARD-PD-015, CARD-PD-022 | Acceptance criteria should verify card purchases and repayments are not double-counted as spending. |
| Repayment source | CARD-PD-022 | Acceptance criteria should verify a card repayment identifies the real money source affected. |
| Refund awareness | CARD-PD-016 | Acceptance criteria should verify refunds are distinguishable from new income and ordinary repayment. |
| Billing period | CARD-PD-014 | Acceptance criteria should verify card items can be associated with a billing period. |
| History retention | CARD-PD-023 | Acceptance criteria should verify closed, expired, replaced, or archived cards retain readable history. |
| Health read-only | CARD-PD-038, CARD-PD-044 | Acceptance criteria should verify Health cannot mutate card state, balances, payments, or closure. |
| Rejected automation | CARD-PD-045 | Acceptance criteria should verify Cards do not execute real repayments automatically. |

## Deferred Acceptance Areas

Acceptance criteria are not needed now for:

- Provider-verified feeds.
- Statement parsing and reconciliation.
- Fraud detection.
- Reward optimization.
- Multi-currency cost analysis.
- Tokenized card and subscription detection.
- Detailed dispute lifecycle.

These remain deferred until future Product Decision review.
