# Information Architecture

## Assessment

The IA is fundamentally correct and should not be redesigned. It maps cleanly to household mental models:

- Money: real containers and movement.
- Plan: intention and future use.
- Inbox: decisions.
- Together: people and policies.
- Health: read-only condition.

The biggest IA need is terminology consistency inside screens.

## Naming Review

| Term | User Clarity | UX Guidance |
|------|--------------|-------------|
| Account | Medium | Pair with "real money location" on first exposure |
| Saving | Medium | Use "Savings product" when needed to distinguish from Goal/Jar |
| Investment | Medium | Pair with "estimated value" and "not cash" where relevant |
| Goal | Strong | Pair with "intention" where progress is shown |
| Planning | Strong | Use nav label "Plan"; use "Jars" for allocations |
| Category | Medium | Keep as transaction meaning, not budget |
| Inbox | Medium | Do not call items notifications |
| Health | Medium | Use "condition" and "visible facts" language |

## Recommendations

### PX-IA-01: Standardize amount labels

Problem: Amounts can represent cash, debt, planned capacity, estimated value, due amount, or progress.

User Impact: Users misunderstand what they can spend or what has happened.

Affected Screens: Home, Money, Plan, Savings, Loans, Cards, Investments, Goals, Health.

Frequency: Daily.

Business Impact: High.

Recommended UX: Every non-obvious amount must include a semantic label: "Real balance", "Planned", "Estimated", "Due", "Remaining", "Progress", or "Expected".

Implementation Cost: Low.

Priority: P0.

### PX-IA-02: Avoid synonym drift

Problem: Friendly copy can accidentally introduce disallowed or confusing synonyms.

User Impact: Users learn multiple words for the same concept.

Affected Screens: All.

Frequency: Daily.

Business Impact: Medium.

Recommended UX: Use glossary terms consistently. Avoid "wallet" for Account, "budget envelope" for Jar, "notification" for ReviewItem, and "auto optimizer" for Health.

Implementation Cost: Low.

Priority: P1.

