# Approved Features

## HLT-PD-001: Household Financial Condition Reflection

Why approved:

- Phase 1 identifies Health as the household condition mirror.
- Phase 2 validates that young households ask whether they are financially okay.

Expected product value:

- Gives households a shared financial condition language.
- Reduces ambiguity across separate financial records.

Dependencies:

- Source-domain facts from Accounts, Transactions, Planning, Inbox, Cards, Loans, and related domains.

Scope:

- Read-only condition signal.
- No action, advice, or source-fact ownership.

## HLT-PD-004: Unresolved Decision Pressure

Why approved:

- Open decisions are realistic household risk and avoidance indicators.

Expected product value:

- Makes unmanaged decision burden visible without turning Inbox into Health.

Dependencies:

- Inbox read facts.

Scope:

- Count or presence-based interpretation only.

## HLT-PD-005: Plan Presence And Rhythm

Why approved:

- Planning rhythm is a realistic sign of household control.

Expected product value:

- Helps users see that intention management affects household stability.

Dependencies:

- Planning read facts.

Scope:

- Health reads plan existence and rhythm; Planning owns plan truth.

## HLT-PD-007: Recent Activity Rhythm

Why approved:

- Recent tracking activity supports trust and awareness.

Expected product value:

- Helps distinguish active household visibility from stale records.

Dependencies:

- Transaction read facts.

Scope:

- Activity rhythm only, not financial judgment by transaction volume alone.

## HLT-PD-009: Factor Explanation

Why approved:

- Phase 2 shows users need visible reasons before trusting Health.

Expected product value:

- Prevents black-box score anxiety.
- Improves partner conversation quality.

Dependencies:

- Every Health signal must have explainable source factors.

Scope:

- Plain factor explanation grounded in household facts.

## HLT-PD-010: Read-Only Grounded Interpretation

Why approved:

- Protects BR-24.
- Phase 1 and Phase 2 validate Health as a mirror, not an actor.

Expected product value:

- Preserves trust and domain clarity.

Dependencies:

- Source domains continue to own actions and truth.

Scope:

- Health reads only and interprets only.

## HLT-PD-019: Data Completeness Awareness

Why approved:

- Missing data is one of the largest trust risks for Health.

Expected product value:

- Helps users understand when a signal is partial.

Dependencies:

- Awareness of visible and missing source categories.

Scope:

- Completeness context only; no demand that users track everything.
