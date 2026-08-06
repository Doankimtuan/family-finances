# Implementation Order

Sequenced implementation plan based on dependencies and priorities. Each phase lists what to build, in what order, and what must be complete before starting.

---

## Phase 1: Foundation (Sprint 7) — P0

**Prerequisite:** Sprint 6 Complete

### Sprint 7

| Order | Feature | Effort | Key Deliverable |
|---|---|---|---|
| 1.1 | **EO-04: Simplify Planning to Patterns** | Large | RecurringPattern CRUD, migration script, dual-write active |

**Why First:** Every planning feature (EO-03 calendar, future planning features) depends on RecurringPatterns. The old PlanningRule engine must be replaced before users accumulate more complex rules.

**Acceptance Gate:**
- [ ] RecurringPatterns API deployed and functional
- [ ] Migration script runs successfully on production data snapshot
- [ ] Dual-write verified: new patterns go to RecurringPatterns; old rules accessible via legacy UI
- [ ] BR-04 income placement moved to household level
- [ ] 0 data loss in migration

---

## Phase 2: Independent P1 Features (Sprints 8-9)

**Prerequisite:** Phase 1 complete (EO-04)

### Sprint 8

| Order | Feature | Effort | Notes |
|---|---|---|---|
| 2.1 | **EO-01: Auto-Categorization** | Large | Seed default mapping table. Rule engine. Inbox suggestion UI. |
| 2.2 | **EO-06: Jar Templates** | Small | Seed template data. Template selection UI in onboarding + Settings. |
| 2.3 | **EO-20: Transaction Split Support** | Medium | Split data model. Split UI on transaction detail + Inbox. |
| 2.4 | **EO-05: Transaction Search/Filtering (R1)** | Medium | Search index. Search bar + filter panel UI. |

### Sprint 9

| Order | Feature | Effort | Notes |
|---|---|---|---|
| 2.5 | **EO-07: Inbox Batch Operations** | Medium | Multi-select + batch action bar. Undo mechanism. |
| 2.6 | **EO-02: Card Payment Due Dates** | Medium | Card fields. Payment reminder Inbox cards. Push notifications. |
| 2.7 | **EO-09: Installment Interest Visibility** | Medium | Amortization calculation. Interest display on installment detail. |
| 2.8 | **EO-12: Savings Maturity Alerts** | Medium | Maturity tracking. Scheduled job for alerts. Maturity Inbox actions. |

**Acceptance Gate (End of Sprint 9):**
- [ ] 8 features operational
- [ ] Auto-categorization: default mappings working, custom rules creatable
- [ ] Inbox batch: multi-select, categorize, dismiss, undo all working
- [ ] Card reminders generating Inbox items
- [ ] No regressions in existing transaction/Inbox flows

---

## Phase 3: Dependent P1 + P2 Features (Sprints 10-11)

**Prerequisite:** Phase 2 complete

### Sprint 10

| Order | Feature | Effort | Notes |
|---|---|---|---|
| 3.1 | **EO-03: Recurring Bill Calendar (R1)** | Medium | Calendar UI. Data from RecurringPatterns (EO-04). |
| 3.2 | **EO-13: Card Interest Cost Display** | Small | Depends on EO-02 (APR). Interest calculation + display. |
| 3.3 | **EO-11: Data Export CSV** | Small | CSV generation endpoint. Download UI. |
| 3.4 | **EO-19: Simple Jar Reallocation UX** | Medium | Move Money flow. Ledger transaction creation. |

### Sprint 11

| Order | Feature | Effort | Notes |
|---|---|---|---|
| 3.5 | **EO-08: Health Score Iteration (R1)** | Medium | Snapshot capture. Trend chart. Factor breakdown. Insights. |
| 3.6 | **EO-18: Goal Progress Celebration** | Small | Milestone detection. Confetti animation. Inbox notification. |
| 3.7 | **EO-10: Month Ritual Quick Close** | Medium | Eligibility check. Quick Close summary UI. Partner visibility. |

**Acceptance Gate (End of Sprint 11):**
- [ ] All 18 R1 features operational
- [ ] Calendar shows recurring patterns correctly
- [ ] Card detail shows complete payment + interest picture
- [ ] Quick Close gated correctly (only for 6+ ritual users)
- [ ] Health dashboard shows trend + insights

---

## Phase 4: R1 Stabilization (Sprint 12)

**Prerequisite:** All R1 features deployed

### Sprint 12

| Order | Activity | Notes |
|---|---|---|
| 4.1 | Full regression testing | All existing flows + all new features |
| 4.2 | Performance testing | Search index performance, batch operation performance |
| 4.3 | User acceptance testing | Real-user feedback on new features |
| 4.4 | Monitoring setup | Auto-categorization accuracy, batch operation error rate, Health snapshot job |
| 4.5 | Documentation | User guides for all new features |
| 4.6 | PlanningRule deprecation notice | 30-day countdown to legacy UI removal (executed in R2) |
| 4.7 | R2 planning refinement | Based on R1 usage data and feedback |

**R1 Launch Gate:**
- [ ] All acceptance criteria for all 18 features passing
- [ ] Zero P0/P1 bugs
- [ ] Migration success rate >95%
- [ ] Performance within acceptable thresholds
- [ ] User acceptance testing positive

---

## Phase 5: R2 Features (Sprints 13-18)

**Prerequisite:** R1 stable (30+ days post-launch)

### Sprint 13-14: R2 Foundation

| Order | Feature | Effort | Notes |
|---|---|---|---|
| 5.1 | **EO-16: Inbox Auto-Resolution Rules** | Large | Rule CRUD. Auto-resolution engine. Audit log. Undo mechanism. Partner notifications. |
| 5.2 | **EO-05 R2: Advanced Search/Filtering** | Medium | Amount/jar filters. Saved views. Quick-access menu. |

### Sprint 15-16: R2 Enrichment

| Order | Feature | Effort | Notes |
|---|---|---|---|
| 5.3 | **EO-11 R2: PDF Monthly Reports** | Medium | PDF generation. Charts. A4 formatting. |
| 5.4 | **EO-03 R2: Cash Flow Projections** | Large | Balance projection engine. Projection visualization. Low-balance warnings. |

### Sprint 17-18: R2 Intelligence

| Order | Feature | Effort | Notes |
|---|---|---|---|
| 5.5 | **EO-08 R2: Enriched Health Insights** | Medium | Deeper analysis. Personalized insights from iteration data. |
| 5.6 | **EO-01 R2: ML Categorization** | Large | ML model training on override data. Confidence scoring improvement. |

### Sprint 18: R2 Cleanup

| Order | Activity |
|---|---|
| 5.7 | Drop `planning_rules` and related tables |
| 5.8 | Remove deprecated PlanningRule API endpoints |
| 5.9 | Remove legacy UI links |
| 5.10 | R2 acceptance testing |

**R2 Launch Gate:**
- [ ] Auto-resolution rules: 5-rule limit enforced, 30-day undo working
- [ ] Auto-resolution log: permanent, partner-visible
- [ ] Cash flow projections: accuracy within acceptable range
- [ ] ML categorization: accuracy improvement over R1 rule-based
- [ ] PlanningRules fully retired

---

## Phase 6: v2.1 (Sprints 19-22)

**Prerequisite:** R2 stable + activation criteria met for EO-17

| Order | Feature | Activation Check |
|---|---|---|
| 6.1 | EO-17: Category Sub-Tags | Auto-categorization live 6+ months; user demand validated |

---

## Phase 7: v2.5 (Sprints 23-30)

**Prerequisite:** v2.1 stable + activation criteria met per feature

| Order | Feature | Activation Check |
|---|---|---|
| 7.1 | EO-14: Goal Multi-Source Funding | Goal usage 6+ months |
| 7.2 | EO-25: Health Scenario Modeling | Health score stable 2+ cycles |
| 7.3 | EO-22: Savings Product Diversity | Basic savings stable |
| 7.4 | EO-28: Installment Variable Rates | Market data confirms |
| 7.5 | EO-30: Month Ritual Customization | Quick Close stable 6+ months |

---

## Phase 8: v3 (Sprints 31+)

**Prerequisite:** v2.5 stable + activation criteria met

| Order | Feature | Notes |
|---|---|---|
| 8.1 | EO-15: Together Diverse Households | Major domain expansion |
| 8.2 | EO-29: Together Permission Granularity | Ships with EO-15 |

---

## Implementation Principles

1. **Ship in dependency order.** Never ship a dependent feature before its prerequisite.
2. **One wave at a time.** Complete and stabilize each wave before starting the next.
3. **No feature creep during implementation.** Approved scope is the scope. Deferred features stay deferred until activation criteria are met.
4. **BR-01/BR-14 audit at every phase gate.** Verify no boundary violations introduced.
5. **User feedback informs priorities within a wave.** Within a wave, reprioritize based on user feedback, but never across waves.

---

## Estimated Effort Summary

| Phase | Sprints | Features | Effort |
|---|---|---|---|
| Phase 1 (P0) | 1 | 1 | Large |
| Phase 2 (P1) | 2 | 8 | 2 Large, 5 Medium, 1 Small |
| Phase 3 (P1-P2) | 2 | 7 | 5 Medium, 2 Small |
| Phase 4 (Stabilization) | 1 | 0 | Testing + monitoring |
| Phase 5 (R2) | 6 | 6 | 3 Large, 3 Medium |
| Phase 6 (v2.1) | 4 | 1 | Medium |
| Phase 7 (v2.5) | 8 | 5 | High complexity |
| Phase 8 (v3) | TBD | 2 | Very High complexity |
