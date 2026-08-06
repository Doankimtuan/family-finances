# Business Smells

**Board:** Business Cohesion & Money Lifecycle Board  
**Date:** 2026-08-03

Systematic detection of 17 business smell types. For each: evidence, severity, description, recommendation.

---

## 1. Feature Islands

### Smell 1.1: Jar Templates (EO-06) — Onboarding-Only Utility
| Property | Assessment |
|----------|------------|
| **Severity** | **LOW** |
| **Affected domains** | Budgets/Jars |
| **Description** | EO-06 is used exactly once (onboarding). After jars are created, templates have no runtime value. Templates are never updated, never re-applied, never compared against actual spending. |
| **Evidence** | Templates are seed data. BR-19 governs application but not maintenance. No lifecycle events reference templates after onboarding. |
| **Recommendation** | Consider "template health check" — at Month Ritual, compare current jar structure to template and suggest adjustments. This integrates templates into the ongoing lifecycle. |

### Smell 1.2: Data Export (EO-11) — Offboarding-Only Utility
| Property | Assessment |
|----------|------------|
| **Severity** | **LOW** |
| **Affected domains** | Shared |
| **Description** | EO-11 exports data but no feature imports exported data back. It's a one-way exit door. Useful but not integrated into any business flow. |
| **Evidence** | No import feature. No domain reads exported data. Export is purely user-facing utility. |
| **Recommendation** | Accept as intentional. Data portability is a user right, not a business integration. |

---

## 2. Dead Business Paths

### Smell 2.1: Month Ritual Without 6 Prior Rituals
| Property | Assessment |
|----------|------------|
| **Severity** | **LOW** |
| **Affected domains** | MonthRitual |
| **Description** | BR-23 requires 6 rituals for Quick Close eligibility. A new user's first 6 months cannot use Quick Close. But the user journey still works (Assisted mode is the default per BR-09). |
| **Evidence** | This is by design, not a bug. Quick Close is a veteran shortcut. |
| **Recommendation** | CLEAN — intentional gate. |

### Smell 2.2: Auto-Resolution (EO-16 R2) Without ReviewItem Types
| Property | Assessment |
|----------|------------|
| **Severity** | **HIGH** (future risk) |
| **Affected domains** | Inbox |
| **Description** | EO-16 (R2) promises auto-resolution rules for Inbox items. But in R1, ReviewItems have no type taxonomy. A savings maturity decision, a card payment reminder, and an unmapped expense are all "ReviewItems." Auto-resolving them identically is dangerous. |
| **Evidence** | Inbox receives ReviewItems from 4 different sources (BR-05, BR-10, BR-17, BR-11). Each source has different resolution semantics. Without type differentiation, auto-resolution can't safely distinguish them. |
| **Recommendation** | Define ReviewItem type taxonomy in R1 (e.g., UnmappedExpense, MaturityDecision, PaymentReminder, InstallmentComplete). Each type has its own auto-resolution rules. |

---

## 3. Duplicate Responsibilities

### Smell 3.1: "Schedule" Concept Duplication
| Property | Assessment |
|----------|------------|
| **Severity** | **MEDIUM** |
| **Affected domains** | Planning, Cards, Installments |
| **Description** | Three domains independently define schedule-like concepts. Planning has RecurringPatterns (frequency-based). Cards have billing cycles. Installments have payment schedules. Calendar view (EO-03) only aggregates RecurringPatterns. |
| **Evidence** | Calendar doesn't show card due dates or installment payments. Three domains all answer "what happens when?" but don't collaborate. |
| **Recommendation** | Extend Calendar (EO-03) to aggregate card due dates and installment payment dates. The Calendar becomes the unified "what happens when" surface. |

### Smell 3.2: Policy Ownership Split
| Property | Assessment |
|----------|------------|
| **Severity** | **LOW** |
| **Affected domains** | Jars, Planning |
| **Description** | Overspend policy (BR-07) is owned by Jars. Income placement policy (BR-04) is owned by Planning. Both are "Policy" concepts. This is borderline duplication but domains are different. |
| **Evidence** | BR-13 (policy changes partner-visible) applies to both. A unified "Household Policies" view would need to aggregate from two domains. |
| **Recommendation** | Accept the split for now. If more policies are added (R2+), consider a Policy domain or a unified policy surface. |

---

## 4. Circular Ownership

**CLEAN** — No circular ownership detected. Every concept has a single owning domain. The only borderline case is Policy (split between Jars and Planning) but there is no circular dependency.

---

## 5. Weak Integration

### Smell 5.1: Categories ↔ Jars — No Formal Contract
| Property | Assessment |
|----------|------------|
| **Severity** | **HIGH** |
| **Affected domains** | Categories, Budgets/Jars |
| **Description** | Categories classify transactions. Jars track spending intentions. The category → jar mapping is the bridge between Real and Intention. But there is no business rule that prevents naming divergence. A transaction categorized as "Groceries" maps to nothing if no Jar is named "Groceries." |
| **Evidence** | Cross-domain matrix shows Categories → Jars as "Influences" only. No formal mapping contract. BR-05 handles "unmapped" as an Inbox issue, not a Category-Jar contract issue. |
| **Recommendation** | Add a business rule: "Category names must match Active Jar names for mapping to succeed." OR: Define a formal Category-to-Jar mapping that allows many-to-one (multiple categories map to one jar). |

### Smell 5.2: Inbox ↔ Planning — No Direct Channel
| Property | Assessment |
|----------|------------|
| **Severity** | **MEDIUM** |
| **Affected domains** | Inbox, Planning |
| **Description** | Pattern-generated transactions go to Transactions, which may trigger Inbox (BR-05). But Inbox has no knowledge that this is a recurring bill. Inbox treats it like any unknown expense. |
| **Evidence** | RecurringPattern → Transaction → Inbox is a two-hop path. Inbox should receive: "This is your monthly phone bill — it's usually $85, categorized as Utilities, mapped to Utilities Jar." |
| **Recommendation** | Patterns should annotate generated transactions with "source: recurring pattern" metadata. Inbox reads this annotation and pre-fills resolution fields. |

---

## 6. Broken Lifecycles

### Smell 6.1: Correction Lifecycle — Missing Audit Link
| Property | Assessment |
|----------|------------|
| **Severity** | **MEDIUM** |
| **Affected domains** | Transactions |
| **Description** | Corrections require a reversal transaction (never delete). But there is no business specification for how a reversal links to its original transaction. Without this link, audit trails are incomplete. |
| **Evidence** | Money-lifecycle.md correction trace shows "Original marked as reversed — linked to reversal" but no specification for the link type (reference? transaction pair? reversal flag?). |
| **Recommendation** | Define the reversal link contract: a reversal transaction MUST reference its original transaction by ID. The original transaction MUST be marked with status "reversed" and reference the reversal. |

### Smell 6.2: Emergency Lifecycle — No Emergency Mode
| Property | Assessment |
|----------|------------|
| **Severity** | **LOW** |
| **Affected domains** | Budgets/Jars, Inbox |
| **Description** | An emergency car repair and an overspend on dining look identical in the system. Both trigger BR-07 Warn. Both require jar reallocation. There's no "this was an emergency" flag for the Month Ritual. |
| **Evidence** | Emergency lifecycle (money-lifecycle.md #10) shows the ritual note as the only differentiation. The system itself treats all overspends identically. |
| **Recommendation** | Add an "Emergency" flag on jar reallocations. Emergency reallocations skip BR-07 Warn (they're intentional). Month Ritual shows emergency vs. discretionary overspends separately. |

---

## 7. One-Way Data Flow (Dead Ends)

### Smell 7.1: Health Data — Rich Input, No Consumer
| Property | Assessment |
|----------|------------|
| **Severity** | **LOW** |
| **Affected domains** | Health |
| **Description** | Health reads from 7 domains and produces scores, narratives, and trends. But no domain reads Health data back. Health is a pure leaf node. |
| **Evidence** | Cross-domain matrix shows Health has 7 outgoing "Summarizes" edges but zero incoming "Read by" edges (from operational domains). |
| **Recommendation** | CLEAN — this is BR-14 by design. Health is the final destination for financial reflection. But consider: could Month Ritual include Health insights as part of the review? (It already does — Ritual reads Health's snapshot.) |

### Smell 7.2: Goal Celebrations — Fire and Forget
| Property | Assessment |
|----------|------------|
| **Severity** | **LOW** |
| **Affected domains** | Goals |
| **Description** | EO-18 celebrations fire but don't feed back into any business process. The celebration doesn't adjust jar allocations, doesn't inform Planning patterns, doesn't update Health. |
| **Evidence** | Goal celebrations are purely user-facing notifications. No domain action follows. |
| **Recommendation** | Consider: after a celebration, offer to adjust goal funding (increase/decrease) or create a new goal. Turn the celebration into a decision point. |

---

## 8. Hidden Dependencies

### Smell 8.1: EO-08 Health → All Domains (Implicit)
| Property | Assessment |
|----------|------------|
| **Severity** | **LOW** |
| **Affected domains** | Health, All |
| **Description** | Health's score depends on data from every domain, but this dependency is implicit in BR-14 (read-only). It's not a hidden dependency — it's documented. |
| **Evidence** | BR-14 states "Health is read-only" but doesn't enumerate which domains Health reads from. The cross-domain matrix makes this explicit. |
| **Recommendation** | CLEAN — the dependency is documented in the cross-domain matrix and BR-14. |

---

## 9. Unnecessary User Steps

### Smell 9.1: Manual Jar Reallocation for Predictable Patterns
| Property | Assessment |
|----------|------------|
| **Severity** | **MEDIUM** |
| **Affected domains** | Budgets/Jars, Planning |
| **Description** | If every month "Dining" is overspent and "Groceries" is underspent by similar amounts, and the user manually reallocates, this is a pattern that could be automated. |
| **Evidence** | EO-19 provides the reallocation UX. BR-04 governs income allocation but not mid-month reallocation. No learning mechanism for reallocation patterns. |
| **Recommendation** | Future consideration: after N months of similar reallocation, suggest a permanent jar allocation adjustment. "You've moved $50 from Groceries to Dining for 3 months straight — adjust the plan?" |

---

## 10. Missing Feedback Loops

See `feedback-loops.md` for detailed analysis. Summary:
- Positive loops: Saving → Health score → Motivation (healthy)
- Negative loops: Overspending → Inbox → Adjustment (healthy)
- Missing: Category-Jar divergence detection (no feedback when they drift apart)
- Missing: Template effectiveness tracking (do templated jars match actual spending?)

---

## 11. Manual Repetition

### Smell 11.1: Inbox Resolution for Recurring Unknown Expenses
| Property | Assessment |
|----------|------------|
| **Severity** | **MEDIUM** |
| **Affected domains** | Inbox, Categories |
| **Description** | If a transaction with an unknown payee appears monthly and the user manually maps it to the same jar each time, this is manual repetition that EO-01 and BR-16 should eliminate. |
| **Evidence** | BR-16 handles category overrides (3 → update rule). But it handles category classification, not jar mapping. The user manually maps to jar even after auto-categorization succeeds. |
| **Recommendation** | Extend BR-16 logic: if the same payee + category combination maps to the same jar 3 times, auto-map future transactions. |

---

## 12. Business Rule Conflicts

### Smell 12.1: BR-05 (Unmapped → Inbox) vs. BR-04 (Auto-Allocation)
| Property | Assessment |
|----------|------------|
| **Severity** | **LOW** |
| **Affected domains** | Inbox, Planning |
| **Description** | BR-04 Auto mode auto-allocates income. BR-05 sends unmapped transactions to Inbox. If auto-allocation makes a mapping error (wrong jar), BR-05 doesn't catch it because the transaction IS mapped — just incorrectly. |
| **Evidence** | BR-05 only triggers when no mapping exists. Incorrect mappings bypass BR-05. The user must discover and correct during Month Ritual. |
| **Recommendation** | Add a "confidence" indicator to auto-allocations. High-confidence allocations are silent. Low-confidence allocations create Inbox items for review, even in Auto mode. |

### Smell 12.2: BR-14 Identity Collision (CRITICAL SoT Defect)
| Property | Assessment |
|----------|------------|
| **Severity** | **HIGH** |
| **Affected domains** | Health, Global / AI |
| **Description** | The same ID **BR-14** means two different rules across frozen packs. Product Definition Business-Catalog: “AI may explain/suggest from household data; must not invent balances or execute money movement without explicit user/policy path.” Domain Philosophy Health, Reality Validation DNI-01, Decision Board BR compliance notes, and this board’s Product Constitution: “Health is read-only.” Health.md blends both: “Respect BR-14. Health can explain and suggest. It must not invent balances…” |
| **Evidence** | `artifacts/product-definition/CURRENT/Business-Catalog.md` New Official Rules row BR-14; `artifacts/domain-philosophy/CURRENT/domains/health.md`; `artifacts/product-decision-board/CURRENT/business-rule-changes.md` BR Compliance Notes (“BR-14 (Health is Read-Only)”). |
| **Business impact** | Teams cannot cite “BR-14” unambiguously. AI features and Health features may each claim compliance while violating the other meaning. |
| **Recommendation (validation only — do not edit SoT here)** | Future SoT governance should split IDs (e.g. keep Product BR-14 = AI non-invention; assign Health-RO a distinct BR ID). Until then, this board treats **both** constraints as mandatory and labels Health read-only as **Health-RO**. |

### Smell 12.3: EO-19 Reallocation vs Intention Purity
| Property | Assessment |
|----------|------------|
| **Severity** | **MEDIUM** |
| **Affected domains** | Budgets/Jars, Transactions, Accounts |
| **Description** | Decision Board compliance notes: EO-19 reallocations “create a ledger transaction” / “real money movement.” Domain Philosophy: jars hold intentions; Month Ritual / jars do not move Account money. Manual Adjustment lifecycle requires a clear Real vs Intention fork. |
| **Evidence** | Decision Board `business-rule-changes.md` BR-01 compliance note on EO-19; Philosophy Budgets/Jars never-own bank balances. |
| **Recommendation** | Clarify in future SoT whether reallocation is Plan Movement only, labeled Account transfer, or synthetic ledger type — without presenting jar totals as balances (BR-01). |

---

## 13. Future Scaling Risks

### Smell 13.1: Inbox as Single Integration Point
| Property | Assessment |
|----------|------------|
| **Severity** | **MEDIUM** |
| **Affected domains** | Inbox |
| **Description** | Inbox is the bridge between Real and Intention. BR-05, BR-10, BR-17, and BR-11 all flow through Inbox. If Inbox becomes a bottleneck (performance, UX, or design), the entire system degrades. |
| **Evidence** | Cross-domain matrix shows Inbox with 13 edges — the most connected domain. Four external triggers feed Inbox. All intention mapping flows through Inbox. |
| **Recommendation** | Accept the hub pattern but strengthen it: add ReviewItem type taxonomy (for R2), add priority/urgency scoring, add batch intelligence (group similar items). |

---

## 14. Financial Inconsistencies

**CLEAN** — No financial inconsistency detected. Real Ledger always uses real money amounts. Intention Plan uses allocation amounts. BR-01 ensures these are never confused. The only concern is if a Jar shows negative balance but the corresponding Account has positive balance — that's fine; it's an intention overspend, not a money error.

---

## 15. Decision Gaps

### Smell 15.1: Who Owns Category Naming?
| Property | Assessment |
|----------|------------|
| **Severity** | **MEDIUM** |
| **Affected domains** | Categories, Budgets/Jars |
| **Description** | When a user creates a new spending category (e.g., "Pet Care"), should a corresponding jar be created? When a user creates a new jar (e.g., "Pet Expenses"), should a category be created? No domain owns this decision. |
| **Evidence** | Categories and Jars are independently managed. The mapping is emergent, not governed. |
| **Recommendation** | Define the authority: "Jars own the naming taxonomy. Categories mirror Jar names for mapping purposes. New categories can be created independently but are flagged for Jar creation if unmapped." |

---

## 16. Ownership Ambiguity

### Smell 16.1: "InterestCost" — Cards vs. Installments
| Property | Assessment |
|----------|------------|
| **Severity** | **LOW** |
| **Affected domains** | Cards, Installments |
| **Description** | Both Cards and Installments have an "interest cost" concept. Cards interest (BR-22) is different from Installment interest (BR-20) — different financial instruments. But the naming collision is confusing. |
| **Evidence** | Business-ownership.md shows InterestCost split between two domains. This is correct (they're different things) but confusing (same conceptual name). |
| **Recommendation** | Rename: "CardInterestCost" and "InstallmentInterestCost" — make the domain ownership explicit in the concept name. |

### Smell 16.2: Inbox — Decision Queue vs Notification Center
| Property | Assessment |
|----------|------------|
| **Severity** | **MEDIUM** |
| **Affected domains** | Inbox, Cards, Goals, Savings |
| **Description** | Philosophy: Inbox is NOT a notification center — it is a decision queue. EO-02/BR-17 push payment reminders into Inbox; EO-18 celebrations surface via Inbox; EO-12 maturity alerts lead to Inbox. Reminder/celebration items dilute the “one card, one decision” mental model. |
| **Evidence** | Domain Philosophy Inbox non-responsibilities vs Decision Board EO-02, EO-12, EO-18. |
| **Recommendation** | Officially expand Inbox kinds (decision | time-bound financial alert | celebration) OR route non-decision alerts to notifications while Inbox keeps only actionable ReviewItems. Validation only — no redesign here. |

### Smell 16.3: Goals Funding Model — Philosophy vs Decision Board
| Property | Assessment |
|----------|------------|
| **Severity** | **LOW** |
| **Affected domains** | Goals, Budgets/Jars |
| **Description** | Philosophy Goals: funded through one or more Jars. Decision Board deferred EO-14 (multi-source); R1 model is single-jar funding. |
| **Evidence** | Domain Philosophy Goals; Decision Board `deferred.md` EO-14. |
| **Recommendation** | Treat R1 as single-jar. Philosophy “one or more” is aspirational until EO-14 activates. |

---

## 17. Lifecycle Gaps

See `lifecycle-gaps.md` for detailed analysis. Key gaps:
- Refund lifecycle: no structured reversal-to-original link
- Correction lifecycle: no audit link specification
- Emergency lifecycle: no emergency mode concept

---

## Smell Summary

| # | Smell Type | Finding | Severity |
|---|-----------|---------|----------|
| 1 | Feature Islands | EO-06 templates onboarding-only; EO-11 export-only | LOW |
| 2 | Dead Business Paths | EO-16 R2 needs ReviewItem types | HIGH (future) |
| 3 | Duplicate Responsibilities | Schedule concept in 3 domains | MEDIUM |
| 4 | Circular Ownership | CLEAN | — |
| 5 | Weak Integration | Categories ↔ Jars no contract | HIGH |
| 5 | Weak Integration | Inbox ↔ Planning no direct channel | MEDIUM |
| 6 | Broken Lifecycles | Correction missing audit link | MEDIUM |
| 6 | Broken Lifecycles | Emergency no emergency mode | LOW |
| 7 | One-Way Data Flow | Health data has no consumer | LOW (by design) |
| 7 | One-Way Data Flow | Goal celebrations fire-and-forget | LOW |
| 8 | Hidden Dependencies | CLEAN | — |
| 9 | Unnecessary User Steps | Manual reallocation for patterns | MEDIUM |
| 10 | Missing Feedback Loops | Category-Jar divergence detection | HIGH |
| 10 | Missing Feedback Loops | Template effectiveness tracking | LOW |
| 11 | Manual Repetition | Recurring unknown expenses manual mapping | MEDIUM |
| 12 | Rule Conflicts | BR-05 vs BR-04 Auto incorrect mapping | LOW |
| 12 | Rule Conflicts | **BR-14 ID collision (AI vs Health-RO)** | **HIGH** |
| 12 | Rule Conflicts | EO-19 reallocation vs Intention purity | MEDIUM |
| 13 | Future Scaling | Inbox as single integration point | MEDIUM |
| 14 | Financial Inconsistencies | CLEAN | — |
| 15 | Decision Gaps | Category naming authority | MEDIUM |
| 16 | Ownership Ambiguity | InterestCost naming collision | LOW |
| 16 | Ownership Ambiguity | Inbox decision vs notification | MEDIUM |
| 16 | Ownership Ambiguity | Goals multi-jar Philosophy vs EO-14 deferred | LOW |
| 17 | Lifecycle Gaps | refund, correction, emergency, manual adjustment | LOW-MEDIUM |

**Total smells detected: 18 active findings (4 CLEAN categories)**
