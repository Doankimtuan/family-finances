# Updated Product Roadmap

Incorporating all Product Decision Board decisions. Frozen scope from prior roadmap preserved; new decisions integrated.

---

## R0 — Foundation Rewrite (CURRENT)

**Status:** Sprint 6 Complete. Awaiting Sprint 7.

**Scope (FROZEN — unchanged by Board decisions):**
- IA (Information Architecture)
- Inbox (basic review flow)
- Progressive Onboarding
- F-Auth, F-Together, F-Onboard, F-Home, F-Money, F-Plan, F-Inbox, F-Health foundations

**Sprint 7 Priorities (Board-Aligned):**
- EO-04: Simplify Planning to Patterns (P0 — must ship first)
- Dependency: RecurringPattern model must be in place before EO-03, EO-05 advanced features

---

## R1 — MKP Complete (Sprints 7-12)

**Goal:** Ship the Minimum Kinda Product. Close competitive gaps. Establish financial safety.

### P0 — Must Ship First (Sprint 7-8)
| Feature | ID | Rationale |
|---|---|---|
| Simplify Planning to Patterns | EO-04 | Foundation for EO-03 calendar + all planning features |

### P1 — High Priority (Sprints 8-11)
| Feature | ID | Dependencies |
|---|---|---|
| Recurring Bill Calendar | EO-03 (Modified) | EO-04 (RecurringPatterns) |
| Auto-Categorization | EO-01 | None (ships independently) |
| Card Payment Due Dates | EO-02 | None |
| Card Interest Cost Display | EO-13 | EO-02 (APR data) |
| Installment Interest Visibility | EO-09 | None |
| Savings Maturity Alerts | EO-12 | None |
| Transaction Split Support | EO-20 | None |
| Transaction Search/Filtering | EO-05 | None |
| Jar Templates | EO-06 | None |
| Inbox Batch Operations | EO-07 | None |

### P2 — Medium Priority (Sprints 10-12)
| Feature | ID | Dependencies |
|---|---|---|
| Health Score Iteration | EO-08 | R1 Health baseline |
| Data Export CSV | EO-11 | None |
| Goal Progress Celebration | EO-18 | None |
| Simple Jar Reallocation UX | EO-19 | None |
| Month Ritual Quick Close | EO-10 (Modified) | Requires 6 completed rituals (existing users only) |

### R1 Feature Count: 15 Approved + 3 Modified = 18 features

---

## R2 — Phase 2 (Sprints 13-18)

**Goal:** Inbox maturity, data enrichment, Health depth. Auto-resolution with safeguards.

| Feature | ID | Dependencies |
|---|---|---|
| Inbox Auto-Resolution Rules | EO-16 (Modified) | EO-01 (categorization patterns), EO-07 (batch ops) |
| Data Export PDF Monthly Summaries | EO-11 (R2 extension) | EO-08 (Health score for reports) |
| Transaction Advanced Filtering (amount, jar, saved views) | EO-05 (R2 extension) | EO-05 R1 basic search |
| Recurring Bill Calendar — Cash Flow Projections | EO-03 (R2 extension) | EO-04 stable, EO-08 (score for context) |
| Health Score Enriched Insights | EO-08 (R2 extension) | EO-08 R1 iteration data |
| ML-Based Auto-Categorization Suggestions | EO-01 (R2 extension) | EO-01 R1 rule-based system + override data |
| Auto-Resolution Rule Limit Review | EO-16 (ongoing) | Usage data from R2 launch |

### R2 Feature Count: 2 new + 5 extensions = 7 items

---

## v2.1 — Post-R2 Stability (Sprints 19-22)

**Goal:** Address validated user needs that emerged from R1-R2 usage. One focused feature.

| Feature | ID | Activation Criteria |
|---|---|---|
| Category Sub-Tags | EO-17 | Auto-categorization mature (6+ months); user demand validated |

---

## v2.5 — Domain Expansion (Sprints 23-30)

**Goal:** Address savings/investment sophistication, planning depth, and UX refinement.

| Feature | ID | Activation Criteria |
|---|---|---|
| Goal Multi-Source Funding | EO-14 | Goal usage data validates need |
| Savings Product Diversity | EO-22 | Basic savings stable; user demand validated |
| Health Scenario Modeling | EO-25 | Health score trusted (2+ quarterly cycles) |
| Installment Variable Rate Support | EO-28 | Market data shows Vietnam adoption |
| Month Ritual Customization | EO-30 | Quick Close stable (6+ months); ritual data available |

---

## v3 — Household Expansion (Sprints 31+)

**Goal:** Support diverse household structures beyond partner model.

| Feature | ID | Notes |
|---|---|---|
| Together Diverse Households | EO-15 | Fundamental domain model expansion |
| Together Permission Granularity | EO-29 | Must ship with EO-15; permission model supports all structures |

---

## Future Capability Pack (Research Phase — No Target Date)

| Feature | ID | Notes |
|---|---|---|
| Card Reward Tracking | EO-21 | Optimization, not foundation |
| Account Type Sub-Classification | EO-27 | Low-value metadata extension |

---

## MKP Scope (FROZEN — Unchanged)

**Must Ship (R0-R1):**
- F-Auth, F-Together, F-Onboard, F-Home, F-Money, F-Plan, F-Inbox, F-Health

**Must NOT Ship (R2+):**
- F-AI-Assist (R2 scope — auto-resolution rules, ML categorization)
- F-Approvals (R2 scope)
- F-Wealth (v2.5-v3 scope)
- F-Offline-Read (v3+ scope)
- F-Multi-Household (v3+ scope)

---

## Key Milestones

| Milestone | Target | Key Deliverable |
|---|---|---|
| R1 MKP Launch | End of Sprint 12 | 15 approved + 3 modified features live |
| R2 Launch | End of Sprint 18 | Auto-resolution rules, enriched Health, PDF export |
| v2.1 | End of Sprint 22 | Category sub-tags |
| v2.5 | End of Sprint 30 | Savings diversity, health scenarios, goal multi-funding |
| v3 | Sprint 31+ | Diverse households, granular permissions |
