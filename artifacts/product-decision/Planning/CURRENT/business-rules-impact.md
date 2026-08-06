# Business Rules Impact

This document identifies required Business Rule impacts only. It does not rewrite existing Sources of Truth.

## New Business Rules

| Candidate | Affected capabilities | Impact |
| --- | --- | --- |
| Planning intent is not provider truth | PL-PD-001, PL-PD-006, PL-PD-007, PL-PD-022 | Expected income, recurring items, due dates, and calendar projections must remain clearly expected unless confirmed by owning domains. |
| Planning adaptation does not move money | PL-PD-002, PL-PD-016, PL-PD-017, PL-PD-024 | Jar changes, sinking funds, payoff intentions, and emergency reallocations are virtual unless real movement is recorded elsewhere. |
| Planning review is household learning | PL-PD-009, PL-PD-010, PL-PD-021 | Review and mismatch language must explain, not judge or silently rewrite facts. |

## Modified Business Rules

| Existing rule area | Affected capabilities | Impact |
| --- | --- | --- |
| BR-01 Real Ledger != Virtual Planning | PL-PD-002, PL-PD-005, PL-PD-008, PL-PD-013, PL-PD-017, PL-PD-024 | Needs explicit Planning wording for jars, goals, debt payoff intentions, facts, and emergency reallocations. |
| BR-04 Income placement | PL-PD-001, PL-PD-003 | Clarify expected income allocation versus actual income arrival. |
| BR-08 Month Ritual lock | PL-PD-010, PL-PD-011, PL-PD-021 | Clarify that review lock applies to planning state and corrections, not real ledger history. |
| BR-13 Partner-visible assumptions | PL-PD-012, PL-PD-018, PL-PD-020 | Planning assumptions may be emotionally sensitive and need partner-visible policy clarity before expansion. |
| BR-14 AI non-invention | PL-PD-036 | AI explanations must not invent balances, due truth, or recommended actions. |
| BR-24 Health read-only | PL-PD-013, PL-PD-028, PL-PD-036 | Health may read Planning but must not mutate plan, facts, or recommendations. |

## Clarified Business Rules

| Rule area | Affected capabilities | Impact |
| --- | --- | --- |
| Goal versus savings product | PL-PD-005, PL-PD-016 | Clarify that goals and sinking funds are intention unless backed by Savings product facts. |
| Recurring expectation versus payment | PL-PD-006, PL-PD-026 | Clarify that recurring detection or rules do not prove payment. |
| Calendar pressure | PL-PD-007, PL-PD-022, PL-PD-027 | Clarify expected pressure versus forecast certainty. |
| Shared planning safety | PL-PD-012, PL-PD-018, PL-PD-020 | Clarify privacy and blame-sensitive handling before future expansion. |
