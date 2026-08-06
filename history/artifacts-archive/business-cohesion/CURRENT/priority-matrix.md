# Priority Matrix

**Board:** Business Cohesion & Money Lifecycle Board  
**Date:** 2026-08-03

All findings (smells, gaps, opportunities) ranked by Severity × User Impact × Business Risk.

---

## Scoring Methodology

Each finding scored on three axes (1-10):
- **Severity (S):** How broken is this? (1 = cosmetic, 10 = system failure)
- **User Impact (U):** How much does this affect users? (1 = invisible, 10 = blocks core journey)
- **Business Risk (R):** What's the financial/operational risk? (1 = none, 10 = existential)

**Composite Score:** S × U × R (range: 1-1000)

---

## Top 10 — Critical Priority

### #1: Category-Jar Divergence Risk
| Axis | Score | Rationale |
|------|-------|-----------|
| Severity | 8 | Silent data corruption — transactions categorized but not jar-mapped |
| User Impact | 7 | Inbox grows, users lose trust in auto-cat, manual work increases |
| Business Risk | 8 | Inaccurate jar tracking → wrong spending decisions → ViNha becomes unreliable |
| **Composite** | **448** | |
| **Source** | Business Smell 5.1, Feedback Loop M1 | |
| **Recommendation** | IO-02: Category-Jar Naming Contract |

---

### #2: Inbox ReviewItem Type Taxonomy Missing
| Axis | Score | Rationale |
|------|-------|-----------|
| Severity | 8 | Mixed-type ReviewItems will break R2 auto-resolution (EO-16) |
| User Impact | 8 | Users treat all items the same, miss critical financial decisions |
| Business Risk | 7 | Auto-resolution without types = dangerous (could auto-resolve a savings maturity) |
| **Composite** | **448** | |
| **Source** | Business Smell 2.2, IO-01 | |
| **Recommendation** | IO-01: ReviewItem Type Taxonomy |

---

### #3: Inbox as Single Integration Point Bottleneck
| Axis | Score | Rationale |
|------|-------|-----------|
| Severity | 6 | Works today, but fragile — 4 sources feed Inbox with no type safety |
| User Impact | 8 | All intention mapping flows through Inbox; bottleneck = system unusable |
| Business Risk | 8 | ViNha degrades to expense tracker if Inbox fails |
| **Composite** | **384** | |
| **Source** | Business Smell 13.1 | |
| **Recommendation** | IO-01 + IO-06: Type taxonomy + priority scoring |

---

### #4: BR-14 Identity Collision (SoT Defect)
| Axis | Score | Rationale |
|------|-------|-----------|
| Severity | 7 | Two mandatory rules share one ID — compliance language is ambiguous |
| User Impact | 5 | Users never see the ID; teams and agents do — wrong features may ship |
| Business Risk | 9 | AI write-back or Health mutation each "pass" BR-14 under one interpretation |
| **Composite** | **315** | |
| **Source** | Business Smell 12.2, Product Business-Catalog vs Philosophy/Decision Board | |
| **Recommendation** | Future SoT: keep Product BR-14 = AI non-invention; mint distinct Health-RO ID. Board does not edit SoT. |

---

### #5: Correction Lifecycle Missing Audit Link
| Axis | Score | Rationale |
|------|-------|-----------|
| Severity | 7 | Can't trace why a transaction was reversed; audit integrity compromised |
| User Impact | 4 | Rare event; most users never correct transactions |
| Business Risk | 9 | Financial audit failure; data integrity question for any regulatory scenario |
| **Composite** | **252** | |
| **Source** | Lifecycle Gap 2, Business Smell 6.1 | |
| **Recommendation** | Define reversal link: `reverses_transaction_id` + status change |

---

### #6: Refund Lifecycle Missing Structured Link
| Axis | Score | Rationale |
|------|-------|-----------|
| Severity | 6 | Refunds work but audit trail is incomplete |
| User Impact | 4 | Refunds are common; incomplete link is invisible to users |
| Business Risk | 8 | Same audit risk as corrections — refunds are financial reversals |
| **Composite** | **192** | |
| **Source** | Lifecycle Gap 1 | |
| **Recommendation** | Define refund link contract: refund references original transaction |



---

### #6: "Schedule" Concept Duplication Across 3 Domains
| Axis | Score | Rationale |
|------|-------|-----------|
| Severity | 5 | Each domain works independently; no functional break |
| User Impact | 7 | Users check Inbox for reminders, Calendar for bills, memory for installments |
| Business Risk | 5 | Missed payments from siloed schedule views |
| **Composite** | **175** | |
| **Source** | Business Smell 3.1 | |
| **Recommendation** | IO-04: Unified Calendar Surface |

---

### #7: Inbox ← Planning Direct Channel Missing
| Axis | Score | Rationale |
|------|-------|-----------|
| Severity | 5 | Recurring bills still work — just more manual work |
| User Impact | 7 | Every recurring bill requires manual Inbox resolution each month |
| Business Risk | 5 | User fatigue leads to Inbox neglect |
| **Composite** | **175** | |
| **Source** | Business Smell 5.2, IO-03 | |
| **Recommendation** | IO-03: Planning annotates transactions for Inbox |

---

### #8: Month Ritual No Approval Timeout
| Axis | Score | Rationale |
|------|-------|-----------|
| Severity | 4 | Rare — most users close months. But when they don't, jars are forever mutable |
| User Impact | 4 | Invisible until someone edits a January transaction in December |
| Business Risk | 8 | Historical financial data is treated as living data; integrity risk |
| **Composite** | **128** | |
| **Source** | Lifecycle Gap 5 | |
| **Recommendation** | Auto-lock jars 30 days after month-end with "pending review" status |

---

### #9: No Inbox ReviewItem Expiry/Staleness
| Axis | Score | Rationale |
|------|-------|-----------|
| Severity | 4 | Items pile up but don't break anything |
| User Impact | 7 | Cluttered Inbox = Inbox Zero becomes impossible = users stop trying |
| Business Risk | 4 | Stale items don't cause financial errors — just UX degradation |
| **Composite** | **112** | |
| **Source** | Lifecycle Gap 7 | |
| **Recommendation** | Define staleness rules per ReviewItem type |

---

### #10: Manual Repetition for Recurring Unknown Expenses
| Axis | Score | Rationale |
|------|-------|-----------|
| Severity | 4 | Manual work, not system failure |
| User Impact | 6 | Users repeat the same mapping every month for the same payee |
| Business Risk | 4 | Erodes trust in automation; increases Inbox abandonment risk |
| **Composite** | **96** | |
| **Source** | Business Smell 11.1 | |
| **Recommendation** | Extend BR-16: 3 same payee+category+jar → auto-map |

---

## Complete Priority Ranking

| Rank | Finding | S | U | R | Score | Source |
|------|---------|---|---|---|-------|--------|
| 1 | Category-Jar divergence | 8 | 7 | 8 | 448 | Smell 5.1 |
| 2 | Inbox type taxonomy missing | 8 | 8 | 7 | 448 | Smell 2.2 |
| 3 | Inbox single-point bottleneck | 6 | 8 | 8 | 384 | Smell 13.1 |
| 4 | Correction audit link missing | 7 | 4 | 9 | 252 | Gap 2 |
| 5 | Refund structured link missing | 6 | 4 | 8 | 192 | Gap 1 |
| 6 | Schedule duplication (3 domains) | 5 | 7 | 5 | 175 | Smell 3.1 |
| 7 | Inbox ← Planning channel missing | 5 | 7 | 5 | 175 | Smell 5.2 |
| 8 | Ritual no approval timeout | 4 | 4 | 8 | 128 | Gap 5 |
| 9 | No Inbox item expiry | 4 | 7 | 4 | 112 | Gap 7 |
| 10 | Manual repetition for recurring | 4 | 6 | 4 | 96 | Smell 11.1 |
| 11 | Health → Inbox priority missing | 5 | 8 | 3 | 120 | IO-06 |
| 12 | Category naming authority gap | 5 | 5 | 4 | 100 | Smell 15.1 |
| 13 | Manual jar reallocation patterns | 4 | 6 | 4 | 96 | Smell 9.1 |
| 14 | Goal ↔ Planning feedback missing | 4 | 5 | 3 | 60 | IO-05 |
| 15 | No emergency mode | 3 | 5 | 4 | 60 | Gap 3 |
| 16 | Alert cascade cancellation undefined | 2 | 3 | 5 | 30 | Gap 4 |
| 17 | Goal completion no post-path | 2 | 4 | 3 | 24 | Gap 9 |
| 18 | Card statement archiving missing | 2 | 3 | 3 | 18 | Gap 8 |
| 19 | Actual vs. expected recurring amount | 2 | 4 | 2 | 16 | Gap 6 |
| 20 | EO-06 templates onboarding-only | 2 | 3 | 2 | 12 | Smell 1.1 |
| 21 | EO-11 export-only utility | 1 | 2 | 2 | 4 | Smell 1.2 |
| 22 | InterestCost naming collision | 1 | 1 | 2 | 2 | Smell 16.1 |
| 23 | Policy ownership split | 1 | 1 | 2 | 2 | Smell 3.2 |
| 24 | Goal celebrations fire-and-forget | 1 | 2 | 1 | 2 | Smell 7.2 |
| 25 | BR-05 vs BR-04 incorrect mapping | 2 | 2 | 1 | 4 | Smell 12.1 |

---

## Priority Tiers

### Tier 1 — Address Before R1 Complete (Score > 300)
1. Category-Jar Divergence (448)
2. Inbox Type Taxonomy (448)
3. Inbox Bottleneck (384)

### Tier 2 — Address Before R2 Starts (Score 100–300)
4. Correction Audit Link (252)
5. Refund Structured Link (192)
6. Schedule Duplication (175)
7. Inbox ← Planning Channel (175)
8. Ritual Timeout (128)
9. Inbox Item Expiry (112)
10. Health → Inbox Priority (120)
11. Category Naming Authority (100)

### Tier 3 — Address During R2 (Score < 100)
Everything else. These are quality-of-life improvements, not structural risks.

---

## Cost of Inaction

If Tier 1 findings are not addressed:
- **R2 auto-resolution (EO-16) will ship on a fragile Inbox.** Auto-resolving undifferentiated ReviewItems is dangerous — a savings maturity could be auto-resolved as "Miscellaneous" spending.
- **Category-Jar divergence will compound.** Each month, more unmapped transactions enter Inbox. Users lose trust. Auto-categorization adoption drops.
- **Inbox bottleneck will be the #1 support issue.** "Why do I have 47 items in my Inbox?" → Answer: "Because Categories and Jars don't talk to each other."
