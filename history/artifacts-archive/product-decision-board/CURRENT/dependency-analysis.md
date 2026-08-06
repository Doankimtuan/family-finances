# Dependency Analysis

Cross-feature dependencies, conflicts, and interaction analysis. This document maps which features must ship before others, which features interact, and which feature combinations create new behaviors.

---

## Hard Dependencies (MUST Ship Before)

| Prerequisite | Dependent Feature | Reason |
|---|---|---|
| EO-04 (RecurringPatterns) | EO-03 (Recurring Calendar) | Calendar entries are derived from RecurringPatterns. Calendar cannot ship before patterns exist. |
| EO-04 (RecurringPatterns) | EO-03 (R2: Cash Flow Projections) | Projections require pattern data plus account balances. |
| EO-02 (Card APR Data) | EO-13 (Card Interest Cost) | Interest calculation requires APR. If APR is not populated, interest display shows "Add APR to see interest cost." |
| EO-01 (Auto-Categorization R1) | EO-16 (Auto-Resolution R2) | Auto-resolution rules are more powerful auto-categorization. Inbox maturity (R1 batch ops + auto-suggestions) must precede auto-resolution. |
| EO-07 (Batch Operations) | EO-16 (Auto-Resolution R2) | Batch operations establish Inbox review patterns. Auto-resolution builds on that foundation. |
| EO-08 (Health Score R1) | EO-08 (Health Enriched Insights R2) | Enriched insights require iteration data from R1. |
| EO-08 (Health Score R2) | EO-25 (Health Scenarios v2.5) | Scenario modeling requires stable, trusted Health score. |
| EO-10 (Quick Close) | Existing rituals (6+ completed) | Quick Close eligibility depends on ritual history. Feature is gated, not disabled — it simply won't appear until eligibility is met. |
| EO-15 (Diverse Households) | EO-29 (Permission Granularity) | Granular permissions are meaningless without diverse household structures. Must ship together. |

---

## Soft Dependencies (SHOULD Ship Before)

| Prerequisite | Dependent Feature | Reason |
|---|---|---|
| EO-01 (Auto-Categorization) | EO-06 (Jar Templates) | Template category mappings work better when auto-categorization is available, but templates function without it. |
| EO-04 (Patterns) | EO-05 (Transaction Search) | Pattern-matched transactions are more useful to search, but search functions without patterns. |
| EO-01 (Auto-Categorization) | EO-05 (Transaction Search) | Search is more useful when transactions are categorized, but search works on uncategorized transactions too. |

---

## Feature Interactions (Approved Features That Touch Each Other)

### EO-01 (Auto-Categorization) × EO-07 (Inbox Batch Operations)
**Interaction:** Batch-categorizing multiple Inbox items should respect auto-categorization suggestions. When batch-categorizing, the system can pre-select the suggested category for each item.
**Resolution:** Batch categorization UI shows suggested category as pre-selected when available. User can override in batch.

### EO-01 (Auto-Categorization) × EO-16 (Inbox Auto-Resolution Rules) — R2
**Interaction:** Auto-categorization suggestions and auto-resolution rules could conflict. If auto-categorization suggests "Dining" but the user's auto-resolution rule says "Transportation" for the same merchant, what wins?
**Resolution:** Auto-resolution rules always win over auto-categorization suggestions. Auto-resolution is an explicit user action (they created the rule). Auto-categorization is an implicit suggestion. If an auto-resolution rule matches, the item is auto-resolved and never shows a suggestion.

### EO-01 (Auto-Categorization) × EO-20 (Transaction Splits)
**Interaction:** A split transaction with multiple portions — does each portion get its own auto-categorization suggestion?
**Resolution:** Yes. Each split portion is treated as an individual sub-transaction for categorization purposes. The system may suggest different categories for different portions based on the merchant context.

### EO-20 (Transaction Splits) × EO-07 (Inbox Batch Operations)
**Interaction:** Can a split transaction be included in a batch operation? If a transaction is split into 3 portions and batch-categorized, what happens?
**Resolution:** Inbox ReviewItems for split transactions show each unconfirmed portion. Batch operations work on individual Inbox items (portions), not on the parent transaction. Selecting a split transaction for batch operation selects all its unconfirmed portions.

### EO-20 (Transaction Splits) × EO-05 (Transaction Search/Filtering)
**Interaction:** When filtering by category, does a split transaction appear if only one portion matches the filter?
**Resolution:** Yes. A split transaction appears in category filter results if any portion matches. The transaction list shows the split indicator. This preserves the user's mental model: "I categorized part of this as Dining."

### EO-19 (Jar Reallocation) × EO-07 (Inbox Batch)
**Interaction:** Jar reallocation creates ledger transactions. Reallocation history is queryable. No direct interaction with Inbox batch — they operate on different domains (jars vs. transactions).

### EO-02 (Card Due Dates) × EO-13 (Card Interest Cost)
**Interaction:** Both enhance the card detail view. Payment due dates provide timing context; interest cost provides cost context. Together they create a complete "cost of this card" picture.
**Resolution:** EO-13 ships after EO-02. Card detail view progressively enhances: basic info → payment info (EO-02) → interest info (EO-13). Both visible on the same card detail screen.

### EO-03 (Recurring Calendar) × EO-04 (Recurring Patterns)
**Interaction:** The calendar is a read-only view of RecurringPatterns. No direct editing from calendar — tap navigates to pattern edit. This keeps the calendar simple and the pattern as the source of truth.
**Resolution:** One-way relationship: Patterns → Calendar. Calendar never modifies patterns.

### EO-08 (Health Score) × EO-10 (Month Ritual Quick Close)
**Interaction:** Quick Close summary includes Health score change. This connects the ritual (monthly review) to Health (ongoing tracking).
**Resolution:** Health score change is displayed in Quick Close summary. No Health write-back. Health informs the ritual; the ritual does not inform Health.

### EO-08 (Health Score) × EO-12 (Savings Maturity)
**Interaction:** Savings maturity events affect Health score (maturing savings → available funds → higher liquidity score). Maturity alerts and Health insights are complementary.
**Resolution:** Both operate independently. Health reads savings data; savings doesn't read Health. No circular dependency.

### EO-10 (Quick Close) × BR-09 (Assisted Default)
**Interaction:** Quick Close must not become the default ritual mode. The Board modified EO-10 to reinforce this: Assisted remains default; Quick Close is an explicit choice.
**Resolution:** Quick Close eligibility check. Eligible users see both options; Assisted is visually primary (default).

---

## Feature Conflicts (Tensions Between Approved Features)

### Conflict 1: Simplicity (EO-04) vs. Feature Growth (15 features)
**Tension:** EO-04 simplifies Planning. But 15 new features add complexity elsewhere. Is the net product simpler?
**Resolution:** EO-04 removes the most complex subsystem (PlanningRule engine). New features add capabilities that are individually simple (search, calendar view, templates). The net effect: one complex system removed, many simple capabilities added. Net simpler.

### Conflict 2: Auto-Categorization Suggestions (EO-01) vs. User Agency
**Tension:** The more accurate auto-categorization becomes, the less users engage with categorization decisions. This could erode the "decide together" ethos.
**Resolution:** Suggestions are never auto-committed (BR-14 compliance). The Inbox review step remains. Even at 95% accuracy, the 5% that are wrong require user attention — maintaining the review habit. R1 is rule-based (lower accuracy, more user engagement). R2 ML is deployed only after user trust is established.

### Conflict 3: Quick Close (EO-10) vs. Ritual Completeness
**Tension:** Quick Close reduces ritual friction but could reduce ritual value. Users might quick-close without genuine review.
**Resolution:** Board modifications addressed this: 6-ritual minimum, mandatory summary sections, explicit per-section confirmation, partner visibility, distinct marking. Quick Close is a different path through the ritual, not skipping it.

---

## Feature Interaction Matrix

| Feature | EO-01 | EO-02 | EO-03 | EO-04 | EO-05 | EO-07 | EO-08 | EO-09 | EO-10 | EO-12 | EO-13 | EO-16 | EO-18 | EO-19 | EO-20 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| EO-01 | — | | D | | S | + | | | | | | + | | | + |
| EO-02 | | — | | | | | | | | | S | | | | |
| EO-03 | D | | — | D | | | | | | | | | | | |
| EO-04 | | | D | — | S | | | | | | | | | | |
| EO-05 | S | | | S | — | | | | | | | | | | + |
| EO-07 | + | | | | | — | | | | | | S | | 0 | + |
| EO-08 | | | | | | | — | | + | 0 | | | | | |
| EO-10 | | | | | | | + | | — | | | | | | |
| EO-16 | + | | | | | S | | | | | | — | | | |
| EO-20 | + | | | | + | + | | | | | | | | | — |

**Legend:**
- `D` = Hard dependency (must ship before)
- `S` = Soft dependency (should ship before)
- `+` = Feature interaction (complementary)
- `0` = No significant interaction
- `—` = Self

---

## Summary

| Category | Count |
|---|---|
| Hard Dependencies | 9 |
| Soft Dependencies | 3 |
| Feature Interactions | 11 |
| Feature Conflicts | 3 |
| Total Cross-Feature Relationships | 26 |

**Key Insight:** EO-04 (Planning Patterns) is the critical P0 dependency — 2 features depend on it. EO-01 (Auto-Categorization) has the most interactions (4 features touch it). The dependency graph is acyclic — no circular dependencies exist.
