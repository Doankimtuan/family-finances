# Business Rules Impact

This file identifies business-rule impacts only. It does not rewrite existing Sources of Truth.

## New Business Rules Identified

| Proposed rule area | Affected decisions | Need |
|--------------------|-------------------|------|
| Credit-card obligation truth | CARD-PD-007, CARD-PD-008, CARD-PD-011, CARD-PD-012, CARD-PD-013 | Clarify that credit-card limit and available credit are borrowing capacity, not real money. |
| Card purchase vs repayment | CARD-PD-015, CARD-PD-022 | Clarify that card purchase creates spending/obligation and repayment is a separate real money movement. |
| Card statement truth | CARD-PD-009, CARD-PD-010, CARD-PD-011, CARD-PD-014 | Clarify that statement records are household-recorded unless provider-confirmed. |
| Card refund treatment | CARD-PD-016 | Clarify that refunds may reduce card obligation but do not automatically erase current due obligations without statement confirmation. |
| Card installment boundary | CARD-PD-026, CARD-PD-043 | Clarify how card-origin installments interact with Loans without treating revolving card debt as Loans. |
| Card history retention | CARD-PD-023 | Clarify that card closure, expiry, replacement, or archive does not erase card transaction history. |

## Modified Business Rules Identified

No direct modifications to existing frozen Business Rules are made here.

Potential future SoT modification areas:

- BR-01 may need an explicit Cards clarification for available credit, outstanding obligation, repayments, and virtual planning.
- BR-24 may need explicit mention that Health can read card utilization and repayment behavior but cannot mutate card state.

## Clarified Business Rules Identified

| Existing principle | Clarification needed |
|--------------------|---------------------|
| BR-01 Real Ledger is not Virtual Planning | Credit-card available credit is not cash; card repayment is a real ledger movement from a real money source. |
| Health read-only (BR-24) | Health may summarize card risk but cannot create payments, alter card balances, or close cards. |
| Financial safety over convenience | Automatic repayment execution is rejected; provider feeds and reconciliation remain deferred. |
| User understands where money is | Card spending, card obligation, and repayment source must remain distinguishable. |
| Household-first | Shared card obligations should be visible when they affect household cash flow, without over-modeling legal ownership. |
