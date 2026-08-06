# Priority Matrix

All approved and modified features ranked by rollout priority. Priority is determined by: business value, user value, competitive necessity, financial safety, dependencies, and MKP discipline.

---

## Priority Definitions

| Priority | Label | Timeline | Criteria |
|---|---|---|---|
| **P0** | MKP-Critical | Sprint 7-8 | Must ship before any P1 feature; blocking dependency for other features |
| **P1** | High | Sprint 8-11 | Critical for MKP quality; competitive gap closer; financial safety |
| **P2** | Medium | Sprint 10-12 | Important but not blocking; UX enhancement; data enrichment |
| **P3** | R2 | Sprint 13-18 | Requires R1 maturity; new capability on stable foundation |
| **P4** | v2.1 | Sprint 19-22 | Activation-gated; requires 6+ months of usage data |
| **P5** | v2.5+ | Sprint 23+ | Domain expansion; complex features on mature foundation |

---

## P0 — MKP-Critical (Sprint 7-8)

| Rank | ID | Feature | Domain | Rationale |
|---|---|---|---|---|
| 1 | EO-04 | Simplify Planning to Patterns | Planning | Foundation for EO-03, all planning features. Must ship before Planning complexity grows. Reduces architecture complexity immediately. |

**P0 Feature Count: 1**

---

## P1 — High Priority (Sprint 8-11)

| Rank | ID | Feature | Domain | Rationale |
|---|---|---|---|---|
| 2 | EO-01 | Auto-Categorization | Categories | Biggest competitive gap. Every competitor offers this. ViNha's most urgent gap to close. |
| 3 | EO-02 | Card Payment Due Dates | Cards | Financial safety gap. Missing payments has severe consequences for users. |
| 4 | EO-07 | Inbox Batch Operations | Inbox | One-by-one review doesn't scale. Critical for Inbox maturity as transaction volume grows. |
| 5 | EO-20 | Transaction Split Support | Transactions | Important user need. Multi-category transactions are common real-world scenarios. |
| 6 | EO-09 | Installment Interest Visibility | Installments | Financial safety. Users can't make informed prepayment decisions without interest data. |
| 7 | EO-12 | Savings Maturity Alerts | Savings | Implements BR-10. Prevents missed maturities. Financial safety. |
| 8 | EO-06 | Jar Templates | Budgets/Jars | New user onboarding critical. Reduces "blank page" problem. |
| 9 | EO-05 | Transaction Search/Filtering | Transactions | Basic search usability. Becomes critical as transaction volume grows. |
| 10 | EO-03 | Recurring Bill Calendar (Modified) | Planning | Depends on EO-04. High competitive value. Provides forward visibility. |
| 11 | EO-13 | Card Interest Cost Display | Cards | Pairs with EO-02. Complete card cost picture. Financial awareness. |

**P1 Feature Count: 10**

---

## P2 — Medium Priority (Sprint 10-12)

| Rank | ID | Feature | Domain | Rationale |
|---|---|---|---|---|
| 12 | EO-11 | Data Export CSV | Shared | Data portability. Users need their data. CSV is table stakes. |
| 13 | EO-08 | Health Score Iteration | Health | Continuous improvement. Not blocking; iteration happens over time. |
| 14 | EO-19 | Simple Jar Reallocation UX | Budgets/Jars | UX improvement for common task. Not blocking; existing flow works. |
| 15 | EO-18 | Goal Progress Celebration | Goals | Positive reinforcement. Simple UX enhancement. Lowest complexity. |
| 16 | EO-10 | Month Ritual Quick Close (Modified) | Month Close | Gated feature (6 rituals). Only applicable to experienced users. |

**P2 Feature Count: 5**

---

## P3 — R2 (Sprint 13-18)

| Rank | ID | Feature | Domain | Rationale |
|---|---|---|---|---|
| 17 | EO-16 | Inbox Auto-Resolution Rules (Modified) | Inbox | Requires R1 Inbox maturity. Safety-critical (undo, audit, limits). |
| 18 | EO-11 R2 | Data Export PDF | Shared | Builds on CSV export. Monthly report use case. |
| 19 | EO-05 R2 | Advanced Search/Filtering | Transactions | Saved views, amount/jar filters. Requires R1 search baseline. |
| 20 | EO-03 R2 | Cash Flow Projections | Planning | Requires stable RecurringPatterns. Full Simplifi-competitive feature. |
| 21 | EO-08 R2 | Enriched Health Insights | Health | Requires R1 health data. Deeper insights from iteration data. |
| 22 | EO-01 R2 | ML-Based Categorization | Categories | Requires R1 override data for training. Higher accuracy. |

**P3 Feature Count: 6 (2 new features + 4 R2 extensions)**

---

## P4 — v2.1 (Sprint 19-22)

| Rank | ID | Feature | Domain | Activation Criteria |
|---|---|---|---|---|
| 23 | EO-17 | Category Sub-Tags | Categories | Auto-categorization mature (6+ months); user demand validated |

**P4 Feature Count: 1**

---

## P5 — v2.5 and Beyond (Sprint 23+)

| Rank | ID | Feature | Domain | Activation Criteria |
|---|---|---|---|---|
| 24 | EO-14 | Goal Multi-Source Funding | Goals | Goal usage data validates need (6+ months) |
| 25 | EO-25 | Health Scenario Modeling | Health | Health score trusted (2+ quarterly cycles) |
| 26 | EO-22 | Savings Product Diversity | Savings | Basic savings stable; user demand |
| 27 | EO-28 | Installment Variable Rate Support | Installments | Market data shows Vietnam adoption |
| 28 | EO-30 | Month Ritual Customization | Month Close | Quick Close stable (6+ months); ritual data available |
| 29 | EO-15 | Together Diverse Households | Together | Partner model stable (12+ months) |
| 30 | EO-29 | Together Permission Granularity | Together | Ships with EO-15 |
| 31 | EO-21 | Card Reward Tracking | Cards | User research confirms top-3 demand |
| 32 | EO-27 | Account Type Sub-Classification | Accounts | User feedback; EO-22 implemented |

**P5 Feature Count: 9**

---

## Priority Distribution Chart

```
P0: █ (1)   — MKP foundation
P1: ██████████ (10) — Competitive gap + financial safety
P2: █████ (5) — UX enhancement + enrichment
P3: ██████ (6) — R2 maturity features
P4: █ (1) — v2.1 activation-gated
P5: █████████ (9) — v2.5+ domain expansion
```

---

## R1 Feature Summary by Priority

| Priority | Count | Features |
|---|---|---|
| P0 | 1 | EO-04 |
| P1 | 10 | EO-01, EO-02, EO-03, EO-05, EO-06, EO-07, EO-09, EO-12, EO-13, EO-20 |
| P2 | 5 | EO-08, EO-10, EO-11, EO-18, EO-19 |
| **R1 Total** | **16** | **+ 2 R1-extensions (EO-03 modified, EO-10 modified) = 18 features** |
