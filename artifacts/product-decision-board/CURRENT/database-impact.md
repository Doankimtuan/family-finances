# Database Impact

Database implications of all approved and modified features. This is a product-level view — entity concepts, not schema DDL.

---

## New Entities

### R1 — Entities to Create

| Entity | Source | Description | Key Fields |
|---|---|---|---|
| `recurring_patterns` | EO-04 | Recurring transaction patterns | household_id, merchant_pattern, amount_min, amount_max, frequency, category_id, direction, is_active, is_archived |
| `merchant_category_rules` | EO-01 | Auto-categorization mappings | household_id, merchant_pattern, category_id, source (default/user), confidence, override_count |
| `transaction_splits` | EO-20 | Transaction split portions | transaction_id, category_id, jar_id, amount, note |
| `health_score_snapshots` | EO-08 | Monthly Health score records | household_id, month, score, factor_breakdown, calculated_at |
| `jar_templates` | EO-06 | Template definitions (seed data) | template_id, locale, name, description, icon |
| `jar_template_items` | EO-06 | Template jar configs (seed data) | template_id, jar_name_key, suggested_allocation_pct, suggested_category_ids |
| `payment_confirmations` | EO-02 | Manual payment marks | card_id, due_date, confirmed_at |

### R2 — Entities to Create

| Entity | Source | Description | Key Fields |
|---|---|---|---|
| `auto_resolution_rules` | EO-16 | Inbox auto-resolution rules | household_id, merchant_pattern, category_id, jar_id, is_active, created_by |
| `auto_resolution_log` | EO-16 | Permanent auto-resolution audit | rule_id, transaction_id, merchant_name, category_id, jar_id, resolved_at, undone_at |
| `saved_filter_views` | EO-05 (R2) | Named transaction filter views | household_id, name, filter_params |
| `balance_projections` | EO-03 (R2) | Materialized projected balances | household_id, date, account_id, projected_balance |

---

## New Fields on Existing Entities

| Entity | New Field(s) | Source | Type |
|---|---|---|---|
| `households` | `income_placement` | EO-04 (BR-04 relocated) | enum: off, suggest, auto |
| `households` | `quick_close_eligible` | EO-10 | boolean (derived) |
| `cards` | `apr` | EO-02 | decimal |
| `cards` | `next_payment_due_date` | EO-02 | date |
| `cards` | `minimum_payment_amount` | EO-02 | decimal |
| `cards` | `reminder_window_days` | EO-02 | integer |
| `cards` | `reminders_enabled` | EO-02 | boolean |
| `installments` | `interest_rate` | EO-09 | decimal |
| `installments` | `interest_type` | EO-09 | enum: fixed, reducing_balance |
| `savings` | `maturity_date` | EO-12 | date |
| `savings` | `maturity_alert_snoozed_until` | EO-12 | date |
| `goals` | `last_celebrated_milestone` | EO-18 | enum: 25, 50, 75, 100 |
| `month_rituals` | `close_type` | EO-10 | enum: full, quick |
| `month_rituals` | `quick_close_summary` | EO-10 | JSON |
| `month_rituals` | `quick_close_confirmed_sections` | EO-10 | JSON array |

---

## Deprecated / To-Be-Retired Entities

| Entity | Source | Deprecation | Retirement |
|---|---|---|---|
| `planning_rules` | EO-04 | R1 (dual-write period) | R2 |
| All PlanningRule-related tables | EO-04 | R1 (dual-write period) | R2 |

---

## Migration Strategy Overview

### Phase 1: R1 Deployment
1. Create all new entities (tables)
2. Add all new fields with NULL defaults
3. Migrate `planning_rules` → `recurring_patterns` (best-effort script)
4. Seed `jar_templates` and `jar_template_items` with template data
5. Mark `planning_rules` as deprecated but retain for rollback

### Phase 2: Post-R1 Stabilization
1. Monitor dual-write period (30 days)
2. Verify no active PlanningRule usage
3. Drop deprecated tables in R2 deployment

### Phase 3: R2 Deployment
1. Create `auto_resolution_rules`, `auto_resolution_log`, `saved_filter_views`
2. Create `balance_projections` if cash-flow projection ships in R2

### Rollback Strategy
- R1: `planning_rules` retained; rollback restores PlanningRule UI
- R1: All new fields are NULL-able; rollback hides new UI components
- No destructive migrations in R1

---

## Data Integrity Constraints

| Constraint | Applies To | Rule |
|---|---|---|
| Split sum = transaction total | `transaction_splits` | SUM(amount) for a transaction_id must equal `transactions.amount` |
| Max 5 active rules | `auto_resolution_rules` | COUNT(is_active=true) per household ≤ 5 (R2) |
| One active household | Existing BR-12 | Enforced at application level |
| Pattern frequency enum | `recurring_patterns.frequency` | weekly, biweekly, monthly, quarterly, yearly |

---

## Performance Considerations

- Full-text search index on `transactions.merchant_name` for EO-05
- Monthly health snapshot computation (scheduled job, not real-time)
- `auto_resolution_log` is append-only, partitionable by month for performance
- `balance_projections` (R2) may be materialized for performance; recomputed daily
