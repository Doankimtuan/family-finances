# Domain Scoring — Aggregated Assessment

The Domain Philosophy Board has assessed all 13 domains across seven criteria. This document aggregates the scores, provides summary commentary, and identifies the strongest and most vulnerable domains.

---

## Scoring Methodology

Each domain was scored on a 1-10 scale for:
- **Business Clarity:** How clearly is the domain's purpose defined?
- **Financial Correctness:** How well does the domain reflect real financial behavior?
- **User Value:** How much does this domain contribute to the household's financial life?
- **Longevity:** How durable is this domain — will its purpose still be valid in 5 years?
- **Extensibility:** Can the domain evolve without fundamental redesign?
- **Simplicity:** Is the domain as simple as it can be without losing value?
- **Future Evolution:** How much room does the domain have to grow?

---

## Aggregate Scores

| Domain | Clarity | Correctness | Value | Longevity | Extensibility | Simplicity | Evolution | **Overall** |
|--------|---------|-------------|-------|-----------|---------------|------------|-----------|-------------|
| **Transactions** | 10 | 10 | 10 | 10 | 9 | 9 | 9 | **9.6** |
| **Accounts** | 10 | 10 | 9 | 10 | 8 | 10 | 8 | **9.3** |
| **Inbox** | 9 | 9 | 10 | 9 | 8 | 8 | 8 | **8.7** |
| **Budgets (Jars)** | 9 | 9 | 10 | 9 | 8 | 7 | 8 | **8.6** |
| **Together** | 9 | 9 | 9 | 9 | 7 | 9 | 7 | **8.4** |
| **Goals** | 9 | 9 | 8 | 9 | 7 | 9 | 7 | **8.3** |
| **Installments** | 9 | 9 | 8 | 9 | 7 | 9 | 7 | **8.3** |
| **Savings** | 9 | 9 | 7 | 9 | 7 | 9 | 7 | **8.1** |
| **Month Close** | 9 | 9 | 9 | 9 | 7 | 7 | 7 | **8.1** |
| **Health** | 8 | 8 | 8 | 9 | 9 | 6 | 8 | **8.0** |
| **Planning** | 8 | 8 | 9 | 9 | 8 | 6 | 8 | **8.0** |
| **Categories** | 8 | 9 | 7 | 9 | 6 | 9 | 7 | **7.9** |
| **Cards** | 8 | 9 | 8 | 9 | 7 | 7 | 7 | **7.9** |

---

## Analysis

### By Bounded Context

| Context | Domains | Average Score |
|---------|---------|---------------|
| Real Ledger | Accounts, Transactions, Cards, Savings, Installments | **8.6** |
| Intention Plan | Budgets, Goals, Planning, Month Close, Inbox | **8.3** |
| Tenancy | Together | **8.4** |
| Insight | Health | **8.0** |
| Shared | Categories | **7.9** |

**Observation:** The Real Ledger domains score highest on average. This is expected — these domains map directly to well-understood financial concepts. The Intention Plan domains score slightly lower due to the inherent complexity of "intention" as a concept and the need for constant boundary enforcement (BR-01). Health and Planning score lower due to simplicity risks — these domains are most susceptible to feature creep.

### Strongest Domains (9.0+)

1. **Transactions (9.6):** The atomic domain. Everything depends on it. Perfect clarity, perfect correctness, maximum user value. The only risk is feature creep (split transactions, attachments) — but the core is flawless.

2. **Accounts (9.3):** The foundational domain. Perfect clarity — money has a home. The only deduction is extensibility (account types are relatively fixed).

### Strong Domains (8.0-8.9)

3. **Inbox (8.7):** Philosophically powerful. The decision-queue model is clear and differentiated. User value is maximum — the Inbox is where ViNha's philosophy becomes tangible.

4. **Budgets / Jars (8.6):** The heart of the Intention Plan. Strong concept but requires constant boundary enforcement (BR-01). Lifecycle states and overspend policy add necessary complexity.

5. **Together (8.4):** Simple, correct, essential. Without Together, ViNha has no identity as household software.

6. **Goals (8.3):** Clean and distinct from Jars. Limited by its "nice to have" nature — not all households use goals.

7. **Installments (8.3):** Focused and correct. Culturally relevant for Vietnamese households.

8. **Savings (8.1):** Culturally relevant. Score reflects that not all households use term deposits.

9. **Month Close (8.1):** The heartbeat. Score reflects the challenge of making a ceremony feel light, not heavy.

### Adequate Domains (7.5-7.9)

10. **Health (8.0):** Valuable but dangerous. The read-only nature is essential. Simplicity risk is high.

11. **Planning (8.0):** Powerful but dangerous. Rules can become complex quickly. Must resist becoming a programming language.

12. **Categories (7.9):** Correctly modest. The score reflects its intentionally limited role. A higher score would be concerning — it would mean Categories are over-engineered.

13. **Cards (7.9):** Correct but complex. Current Balance vs. Statement Balance distinction adds conceptual weight.

---

## Criteria Averages

| Criterion | Average Score | Commentary |
|-----------|---------------|------------|
| Business Clarity | 8.8 | Generally clear. Health and Planning have some ambiguity at the edges. |
| Financial Correctness | 9.0 | The strongest criterion. All domains are financially sound. |
| User Value | 8.5 | High overall. Savings and Categories score lower because their value depends on household behavior. |
| Longevity | 9.1 | The strongest criterion. These domains are built on permanent financial concepts. |
| Extensibility | 7.5 | Moderate. Most domains are deliberately constrained — this is a feature, not a bug. |
| Simplicity | 7.8 | Adequate. Health and Planning are the simplicity risks. The board recommends vigilance. |
| Future Evolution | 7.5 | Moderate but appropriate. Stable domains do not need high evolution potential. |

---

## The Fragility Index

Some domains are more fragile than others — small violations of their boundaries cause disproportionate damage. This is not about the domain's quality; it is about the *consequence of getting it wrong.*

| Domain | Fragility | Why |
|--------|-----------|-----|
| **Budgets (Jars)** | Critical | BR-01 violation (confusing Jar allocation with Account balance) undermines the entire system philosophy |
| **Health** | Critical | BR-14 violation (Health writing instead of reading) destroys trust |
| **Accounts** | High | If Accounts and Jars blur, the two-truths distinction collapses |
| **Inbox** | High | If the Inbox becomes a notification center or task manager, its philosophical power is lost |
| **Planning** | High | If rules become too complex, Planning undermines the simplicity it is meant to create |
| **Categories** | Medium | If Categories become a standalone surface, ViNha becomes an expense tracker |
| **Together** | Medium | If roles proliferate, ViNha becomes enterprise software |
| **Month Close** | Medium | If the ritual becomes a chore, the behavioral rhythm breaks |

---

## Board Commentary

The domain philosophy of ViNha is coherent and defensible. Every domain has a clear reason to exist, a well-defined boundary, and a demonstrable connection to real household finance behavior.

Two domains require ongoing vigilance:

1. **Health** — The read-only boundary must be absolute. As ViNha matures, the temptation to let Health "help" by suggesting or executing financial actions will grow. BR-14 is the safeguard.

2. **Planning** — The simplicity boundary must be defended aggressively. Recurring rules should remain simple (percent or fixed, no conditionals). Category-to-Jar mappings should remain one-to-one. If rule configuration requires instruction, Planning has failed.

The board notes that Categories has the lowest score but considers this appropriate. Categories SHOULD be modest. A "better" Categories score would indicate over-engineering.

---

## Aggregate Verdict

**Overall Domain Health: 8.3 / 10**

The domain architecture is strong. The Real Ledger / Intention Plan distinction is philosophically sound and well-defended. The supporting domains (Together, Health, Categories) are correctly scoped. The primary risk is not in the domains themselves but in the discipline to maintain their boundaries over time.
