# Requirement Impact

This document identifies requirement impacts only. It does not rewrite existing Sources of Truth.

## New Requirements

| Candidate requirement | Affected capabilities | Impact |
| --- | --- | --- |
| Planning surfaces must label planned amounts as intention, not balance. | PL-PD-002, PL-PD-005, PL-PD-008 | Protects BR-01 in user-facing requirement language. |
| Expected recurring and due items must not imply payment completion. | PL-PD-006, PL-PD-007, PL-PD-022 | Prevents false paid-state interpretation. |
| Planning review must support explicit correction. | PL-PD-010, PL-PD-011, PL-PD-021 | Keeps month review safe and recoverable. |
| Planning may read source-domain facts without owning them. | PL-PD-013, PL-PD-017, PL-PD-022 | Protects Accounts, Transactions, Cards, Loans, Savings, Inbox, and Health boundaries. |

## Modified Requirements

| Existing requirement area | Affected capabilities | Impact |
| --- | --- | --- |
| REQ-001 Home plan pulse | PL-PD-002, PL-PD-008, PL-PD-013 | Plan pulse language must avoid bank-balance implication. |
| REQ-003 Active jar allocation | PL-PD-002, PL-PD-004 | Active/paused/archived intention state remains planning-only. |
| REQ-004 Income placement | PL-PD-001, PL-PD-003 | Expected income placement should remain distinct from actual income confirmation. |
| REQ-006 Movement magnitudes | PL-PD-024 | Emergency reallocations must use positive magnitude and explicit virtual direction. |
| REQ-008 Month Ritual lock | PL-PD-010, PL-PD-011, PL-PD-021 | Review, lock, and correction language should be household-understandable. |
| REQ-009 Month Ritual mode | PL-PD-010 | Assisted review remains appropriate, but terminology should be validated. |
| REQ-013 Partner-visible assumptions | PL-PD-012, PL-PD-018, PL-PD-020 | Shared planning and family-support assumptions affect partner trust. |
| REQ-017 AI non-invention | PL-PD-036 | AI explanation scope must remain fact-grounded and non-mutating. |

## Removed Requirements

None identified.

Rejected capabilities PL-PD-033 and PL-PD-035 should not create requirements.
