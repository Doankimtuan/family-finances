# Business Rules Impact

This document identifies required Business Rule impacts only. It does not rewrite existing Sources of Truth.

## New Business Rules

| Candidate | Affected capabilities | Impact |
| --- | --- | --- |
| Category is classification only | CAT-PD-001, CAT-PD-003, CAT-PD-010, CAT-PD-031, CAT-PD-032, CAT-PD-033, CAT-PD-034, CAT-PD-035 | Categories must never hold money, execute money movement, expose available balance, or own spending limits. |
| Household category overrides provider category | CAT-PD-018, CAT-PD-036, CAT-PD-037 | Provider labels may inform review but cannot become authoritative household meaning without user-understood acceptance. |
| Category history remains interpretable | CAT-PD-009, CAT-PD-012, CAT-PD-013, CAT-PD-014, CAT-PD-015 | Category changes must not make old transaction history misleading. |

## Modified Business Rules

| Existing rule area | Affected capabilities | Impact |
| --- | --- | --- |
| BR-01 Real Ledger != Virtual Planning | CAT-PD-007, CAT-PD-010, CAT-PD-011, CAT-PD-031, CAT-PD-032, CAT-PD-034, CAT-PD-035 | Clarify that category summaries are actuals by meaning, not balances, budgets, or planned capacity. |
| BR-12 Category-Jar mapping | CAT-PD-011, CAT-PD-030 | Clarify that mapping connects classification to planning interpretation without making Categories own jar state or planning decisions. |
| BR-14 AI non-invention | CAT-PD-018, CAT-PD-020, CAT-PD-022, CAT-PD-037 | Suggested or learned categorization must not silently invent household truth. |
| BR-24 Health read-only | CAT-PD-011 | Health may read category patterns but must not create, change, or approve category meaning. |

## Clarified Business Rules

| Rule area | Affected capabilities | Impact |
| --- | --- | --- |
| Category versus transaction | CAT-PD-003, CAT-PD-005, CAT-PD-007 | Transactions own money facts; Categories label meaning. |
| Category versus account | CAT-PD-010, CAT-PD-031, CAT-PD-032 | Accounts own where money is. |
| Category versus merchant | CAT-PD-010, CAT-PD-018, CAT-PD-023, CAT-PD-036 | Merchant identity and merchant category are evidence, not household category truth. |
| Category versus payment method | CAT-PD-010 | Cash, wallet, card, bank transfer, and VietQR are rails or accounts, not spending purpose. |
| Category versus Inbox | CAT-PD-004, CAT-PD-030 | Inbox owns unresolved review state; Categories own vocabulary. |

## No Source Of Truth Change Here

These impacts are candidates for later controlled business-rule work only. This board does not modify any frozen rule text.
