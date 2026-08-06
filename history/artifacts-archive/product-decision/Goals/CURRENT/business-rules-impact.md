# Business Rules Impact

This document identifies required Business Rule impacts only. It does not rewrite existing Sources of Truth.

## New Business Rules

| Candidate | Affected capabilities | Impact |
| --- | --- | --- |
| Goal progress is intention | GOAL-PD-004, GOAL-PD-005, GOAL-PD-017 | Goal progress and contributions must not be treated as proof of real money movement. |
| Goal completion is not payment completion | GOAL-PD-006, GOAL-PD-010 | Completed goal state must not imply purchase, transfer, withdrawal, or payment occurred. |
| Goal evidence is read-only | GOAL-PD-013, GOAL-PD-018, GOAL-PD-030 | Goals may consume factual evidence only from owning domains and must preserve source ownership. |

## Modified Business Rules

| Existing rule area | Affected capabilities | Impact |
| --- | --- | --- |
| BR-01 Real Ledger != Virtual Planning | GOAL-PD-004, GOAL-PD-005, GOAL-PD-007, GOAL-PD-012, GOAL-PD-013, GOAL-PD-018 | Clarify that goal progress, contributions, and associations are virtual or read-only unless a money domain records real movement. |
| BR-13 Partner-visible assumptions | GOAL-PD-009, GOAL-PD-014, GOAL-PD-029 | Goal visibility and contribution context are emotionally sensitive and need policy clarity before expansion. |
| BR-14 AI non-invention | GOAL-PD-031 | AI explanations must not invent balances, evidence, affordability, or advice. |
| BR-24 Health read-only | GOAL-PD-031 | Health may read goal context but must not mutate goals or create goal actions. |

## Clarified Business Rules

| Rule area | Affected capabilities | Impact |
| --- | --- | --- |
| Goal versus savings product | GOAL-PD-012 | Savings owns product balance, rate, maturity, withdrawal, renewal, and settlement. |
| Goal versus account | GOAL-PD-013, GOAL-PD-018 | Accounts own real balances; Goals may only reference evidence. |
| Goal versus jar | GOAL-PD-011 | Jars are allocation envelopes; Goals are future outcomes. |
| Goal timing | GOAL-PD-003, GOAL-PD-016 | Target dates and deadline pressure are household intention unless an owning domain confirms due truth. |
