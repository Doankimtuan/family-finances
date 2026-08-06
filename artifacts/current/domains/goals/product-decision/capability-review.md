# Capability Review

## Decision Matrix

| ID | Capability | Description | Business value | User value | Complexity | Risk | Decision | Reasoning |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GOAL-PD-001 | Named future purpose | Represent a goal as a real-life future purpose. | High | High | Low | Low | APPROVED | Strongly validated; users naturally save for concrete outcomes. |
| GOAL-PD-002 | Target amount | Represent estimated amount needed. | High | High | Low | Medium | APPROVED | Essential to goal usefulness; target is an estimate, not a contract. |
| GOAL-PD-003 | Optional timing pressure | Represent a target date or time relevance. | Medium | High | Low | Medium | APPROVED WITH MODIFICATIONS | Useful for date-driven goals but must remain desired timing, not provider truth or obligation status. |
| GOAL-PD-004 | Perceived progress | Represent funded/progress amount. | High | High | Medium | High | APPROVED WITH MODIFICATIONS | Motivating, but must be framed as intention progress, not bank balance. |
| GOAL-PD-005 | Contribution history or updates | Record progress updates over time. | High | Medium | Medium | High | APPROVED WITH MODIFICATIONS | Real behavior, but contribution must not imply bank transfer unless backed by Transactions. |
| GOAL-PD-006 | Goal lifecycle state | Represent active, paused, completed, cancelled. | High | High | Low | Medium | APPROVED | Matches real household behavior and current product state model. |
| GOAL-PD-007 | Intention versus real balance distinction | Explicitly separate goal from real money. | High | High | Low | Low | APPROVED | Non-negotiable BR-01 protection and central to user trust. |
| GOAL-PD-008 | Goal purpose explanation | Explain what the goal is for. | Medium | High | Low | Low | APPROVED | Keeps goals household-readable and emotionally meaningful. |
| GOAL-PD-009 | Household-level visibility | Make household goals visible to partners. | High | High | Medium | High | APPROVED WITH MODIFICATIONS | Shared goals are valuable, but privacy and blame risks require scope safeguards. |
| GOAL-PD-010 | Pause, complete, cancel as real-life states | Support natural exits and interruptions. | High | High | Low | Medium | APPROVED WITH MODIFICATIONS | Validated, but completion language must not imply purchase/payment completion. |
| GOAL-PD-011 | Goal-jar association | Relate a goal to a jar/envelope. | Medium | Medium | Medium | High | DEFERRED | Real but risks confusing goals with jars before basic concepts are trusted. |
| GOAL-PD-012 | Savings product association | Relate a goal to a savings product for context. | Medium | High | Medium | High | APPROVED WITH MODIFICATIONS | Useful and validated as context only; Savings owns product truth. |
| GOAL-PD-013 | Account or transaction evidence | Use real-money facts as read-only goal context. | High | High | High | High | APPROVED WITH MODIFICATIONS | Helps truthfulness, but ownership and language must remain read-only and evidence-based. |
| GOAL-PD-014 | Partner-specific contribution context | Show who contributed or why. | Medium | Medium | Medium | High | DEFERRED | Partner fairness is real, but blame/privacy risk needs research. |
| GOAL-PD-015 | Notes or reason | Record simple human context. | Medium | Medium | Low | Medium | APPROVED | Helpful for household memory and low complexity when kept simple. |
| GOAL-PD-016 | Deadline pressure | Interpret urgency around target date. | Medium | High | Medium | Medium | APPROVED WITH MODIFICATIONS | Useful only as plain household pressure, not automated judgment. |
| GOAL-PD-017 | Partial or overfunded progress | Represent under, partial, full, or over target. | Medium | Medium | Low | Medium | APPROVED WITH MODIFICATIONS | Real edge case; must avoid implying extra money is available elsewhere. |
| GOAL-PD-018 | Compare progress with real money evidence | Compare intention progress with read-only facts. | High | High | High | High | APPROVED WITH MODIFICATIONS | Valuable for safety, but must avoid false certainty and source-domain mutation. |
| GOAL-PD-019 | Goal priority | Rank goals against each other. | Medium | Medium | Medium | Medium | DEFERRED | Real later, but over-optimizes before basic goals are trusted. |
| GOAL-PD-020 | Recurring planned contributions | Represent expected recurring goal funding. | Medium | Medium | Medium | High | DEFERRED | Useful but risks unnecessary automation and false transfer expectations. |
| GOAL-PD-021 | Non-cash support or gifts context | Represent cash gifts, family support, or non-bank contributions. | Medium | Medium | Medium | High | DEFERRED | Vietnam-relevant but needs evidence and terminology research. |
| GOAL-PD-022 | Multi-goal trade-off analysis | Compare goals with each other. | Medium | Medium | High | High | DEFERRED | Useful later but too complex before goal truth and priority language are validated. |
| GOAL-PD-023 | Long-horizon life-event modeling | Model marriage, birth, move, home, vehicle transitions. | Medium later | Medium later | High | High | DEFERRED | Real 5-10 year need, but broad and life-stage-specific. |
| GOAL-PD-024 | Education cost preparation | Represent child education preparation. | Medium later | High later | High | Medium | DEFERRED | Important for families with children but requires separate validation. |
| GOAL-PD-025 | Home deposit preparation | Represent home purchase preparation. | Medium later | High later | High | High | DEFERRED | Real but could enter loan, asset, family support, and advisory territory. |
| GOAL-PD-026 | Goal-backed cash-flow forecasting | Forecast cash position using goal assumptions. | Medium | High | High | High | DEFERRED | High false-certainty risk; depends on mature factual data quality. |
| GOAL-PD-027 | Provider-assisted evidence matching | Match providers to goal progress. | Medium | Medium | High | High | DEFERRED | Requires consent, provider reliability, and correction policy. |
| GOAL-PD-028 | Inflation-aware target review | Review targets against price changes. | Medium later | Medium later | High | High | DEFERRED | Useful but risks advisory complexity and stale assumptions. |
| GOAL-PD-029 | Household goal negotiation history | Keep decision history around goals. | Medium | Medium | High | High | DEFERRED | Partner behavior is real, but privacy and blame risks are unresolved. |
| GOAL-PD-030 | Goal confidence based on factual coverage | Rate confidence that progress is backed by real money. | High | High | High | High | DEFERRED | Valuable but too subtle before users understand progress versus balance. |
| GOAL-PD-031 | AI explanations grounded in facts | Explain goals using existing facts only. | Medium later | Medium later | High | High | DEFERRED | Future-only; requires AI non-invention, Health read-only, and trust maturity. |

## Summary

| Decision | Count |
| --- | --- |
| APPROVED | 6 |
| APPROVED WITH MODIFICATIONS | 11 |
| DEFERRED | 14 |
| REJECTED | 0 |
| Total reviewed | 31 |
