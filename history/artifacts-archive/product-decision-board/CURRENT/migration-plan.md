# Migration Plan

Phased migration from current state (Sprint 6 Complete) to approved target state across R1, R2, and beyond.

---

## Phase 0: Pre-Migration (Sprint 7 Start)

**Objective:** Prepare the codebase and data for planned changes.

| Step | Action | Owner | Dependency |
|---|---|---|---|
| 1 | Audit existing PlanningRule data: count, complexity distribution, active vs. inactive | Engineering | None |
| 2 | Design RecurringPattern data model and API contract | Architecture | Step 1 |
| 3 | Design migration script: PlanningRule → RecurringPattern mapping logic | Engineering | Step 1, 2 |
| 4 | Create `recurring_patterns` table (empty, alongside existing `planning_rules`) | Engineering | Step 2 |
| 5 | Add all new NULL-able columns to existing tables | Engineering | Per-feature specs |
| 6 | Seed `jar_templates` and `jar_template_items` tables | Engineering | EO-06 spec |
| 7 | Seed default `merchant_category_rules` (system defaults) | Engineering | EO-01 spec |

---

## Phase 1: R1 Feature Rollout (Sprints 7-12)

### Wave 1: Foundation (Sprint 7-8) — P0 Features
| Step | Feature | Key Migration Action |
|---|---|---|
| 1.1 | EO-04: Planning Patterns | Run migration script. Dual-write active. PlanningRule UI becomes "Legacy Rules" (30-day access). |
| 1.2 | Base schema changes | Deploy all new NULL-able columns. No data migration needed for nullable fields. |

### Wave 2: Independent P1 Features (Sprints 8-10)
| Step | Feature | Key Migration Action |
|---|---|---|
| 2.1 | EO-01: Auto-Categorization | Deploy rule engine. Enable default mappings. Users discover via Inbox. |
| 2.2 | EO-06: Jar Templates | Available in onboarding. Existing users discover via Settings. |
| 2.3 | EO-07: Inbox Batch | Additive feature. No migration. |
| 2.4 | EO-12: Savings Maturity | Add maturity_date column. Prompt users to populate on first visit. |
| 2.5 | EO-20: Transaction Splits | Additive feature. No migration. |
| 2.6 | EO-05: Transaction Search | Add search index. No data migration. |

### Wave 3: Dependent P1 Features (Sprints 9-11)
| Step | Feature | Key Migration Action |
|---|---|---|
| 3.1 | EO-02: Card Due Dates | Add card columns. Prompt users to configure on first card visit. |
| 3.2 | EO-13: Card Interest Display | Depends on EO-02 (APR data). Auto-activates when APR populated. |
| 3.3 | EO-09: Installment Interest | Add interest columns. Prompt users to populate on first visit. |
| 3.4 | EO-03: Recurring Calendar | Depends on EO-04 (patterns). Auto-populated from patterns. |
| 3.5 | EO-19: Jar Reallocation | Additive feature. No migration. |

### Wave 4: P2 Features (Sprints 10-12)
| Step | Feature | Key Migration Action |
|---|---|---|
| 4.1 | EO-08: Health Iteration | Begin snapshot capture. No historical backfill; trends start from R1. |
| 4.2 | EO-11: Data Export CSV | Additive feature. No migration. |
| 4.3 | EO-18: Goal Celebration | Add milestone column (default null). No backfill. |
| 4.4 | EO-10: Quick Close | Check existing ritual count. Eligible users see option immediately if 6+ rituals exist. |

### Wave 5: R1 Stabilization (Sprint 12)
| Step | Action |
|---|---|
| 5.1 | Monitor dual-write: PlanningRules vs. RecurringPatterns usage |
| 5.2 | Verify all NULL-able columns have acceptable population rates |
| 5.3 | Gather user feedback on new features |
| 5.4 | Prepare R2 migration plan |

---

## Phase 2: R2 Rollout (Sprints 13-18)

### Wave 6: R2 Features
| Step | Feature | Key Migration Action |
|---|---|---|
| 6.1 | EO-16: Auto-Resolution Rules | Create rule tables. Additive feature; no migration. Rules limited to 5 per household. |
| 6.2 | EO-05 R2: Advanced Search | Add saved_views table. Add amount/jar filter params. |
| 6.3 | EO-11 R2: PDF Export | Additive feature. No migration. |
| 6.4 | EO-03 R2: Cash Flow Projections | Add balance_projections table. Begin daily computation job. |
| 6.5 | EO-08 R2: Enriched Insights | Enhanced analysis on existing snapshot data. No migration. |
| 6.6 | EO-01 R2: ML Categorization | ML model deployment. No schema changes. |

### Wave 7: Cleanup
| Step | Action |
|---|---|
| 7.1 | Verify zero PlanningRule API usage (30+ days post-migration) |
| 7.2 | Drop `planning_rules` and related tables |
| 7.3 | Remove deprecated PlanningRule API endpoints |
| 7.4 | Remove "Legacy Rules" UI link |

---

## Phase 3: v2.1 and Beyond (Sprints 19+)

**Activation-Gated:** Future version migrations only execute when activation criteria are met.

| Version | Feature | Migration Note |
|---|---|---|
| v2.1 | EO-17: Category Sub-Tags | New sub-tag table. Optional hierarchy. |
| v2.5 | EO-14: Goal Multi-Source | New goal_jar junction table. Single-jar goals remain supported. |
| v2.5 | EO-22: Savings Diversity | New savings product type enum. Backward-compatible. |
| v2.5 | EO-25: Health Scenarios | New scenario modeling tables. Additive. |
| v2.5 | EO-28: Variable Rates | New rate_history table. Fixed-rate installments unchanged. |
| v2.5 | EO-30: Ritual Customization | New ritual_config table. Default config matches current ritual. |
| v3 | EO-15: Diverse Households | Major domain model expansion. Requires dedicated migration plan. |
| v3 | EO-29: Permission Granularity | New permission matrix. Ships with EO-15. |

---

## Risk Mitigation for Migration

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| PlanningRule→Pattern migration loses user data | Medium | High | Best-effort script with manual review list for unmappable rules; 30-day dual-write window |
| NULL columns cause UI errors | Low | Medium | All new columns are NULL-able; UI handles null gracefully with prompts |
| Rollback needed during R1 | Low | High | PlanningRules retained throughout R1; single feature-flag disable possible |
| Auto-categorization miscategorizes | Medium | Medium | Suggest-only; no auto-commit; user override tracked |
| Performance degradation from new indexes | Low | Medium | Index strategy reviewed per feature; search index is the only significant addition |

---

## Migration Success Criteria

1. **R1 Launch:** All 18 features operational. PlanningRules migration success rate >95%. Zero data loss.
2. **R1 + 30 days:** PlanningRule API usage at zero. Legacy UI link removed.
3. **R2 Launch:** PlanningRules fully retired. Auto-resolution rules active and undoable.
4. **User Experience:** No existing user workflow broken. All new features discoverable.
