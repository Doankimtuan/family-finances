# API Impact

API implications of all approved and modified features. This is a product-level contract view — endpoints, DTOs, and versioning implications, not implementation details.

---

## New Endpoints (R1)

### Auto-Categorization (EO-01)
| Method | Path | Description |
|---|---|---|
| GET | `/api/categories/auto-suggest?merchant=&household_id=` | Get suggested category for a merchant |
| POST | `/api/categories/rules` | Create custom merchant→category rule |
| DELETE | `/api/categories/rules/:id` | Delete custom rule |
| GET | `/api/categories/rules?household_id=` | List all rules for household |

### Card Payments (EO-02)
| Method | Path | Description |
|---|---|---|
| POST | `/api/cards/:id/mark-payment` | Mark payment as made for a card |
| GET | `/api/cards/due-soon?household_id=` | List cards with upcoming payment due dates |

### Planning Patterns (EO-04)
| Method | Path | Description |
|---|---|---|
| GET | `/api/planning/patterns?household_id=` | List all RecurringPatterns |
| POST | `/api/planning/patterns` | Create a RecurringPattern |
| PATCH | `/api/planning/patterns/:id` | Update a RecurringPattern |
| DELETE | `/api/planning/patterns/:id` | Delete a RecurringPattern |
| POST | `/api/planning/patterns/:id/pause` | Pause a pattern |
| POST | `/api/planning/patterns/:id/archive` | Archive a pattern |
| GET | `/api/planning/patterns/match?transaction_id=` | Check which patterns match a transaction |

### Recurring Bill Calendar (EO-03)
| Method | Path | Description |
|---|---|---|
| GET | `/api/planning/calendar?household_id=&month=&year=` | Get calendar entries for a month |

### Jar Templates (EO-06)
| Method | Path | Description |
|---|---|---|
| GET | `/api/jars/templates` | List available templates for locale |
| GET | `/api/jars/templates/:id` | Get template detail with items |
| POST | `/api/jars/templates/:id/apply` | Apply template to household |

### Inbox Batch Operations (EO-07)
| Method | Path | Description |
|---|---|---|
| POST | `/api/inbox/batch` | Execute batch action on multiple items |
| GET | `/api/inbox/grouped?household_id=&group_by=merchant` | Get inbox items grouped by merchant |

### Health Score Iteration (EO-08)
| Method | Path | Description |
|---|---|---|
| GET | `/api/health/trend?household_id=&months=6` | Get health score trend |
| GET | `/api/health/insights?household_id=` | Get actionable insights |

### Installment Interest (EO-09)
| Method | Path | Description |
|---|---|---|
| GET | `/api/installments/:id/prepayment-savings` | Calculate potential interest savings from prepayment |

### Savings Maturity (EO-12)
| Method | Path | Description |
|---|---|---|
| POST | `/api/savings/:id/mature` | Process maturity action (renew/withdraw/transfer) |

### Card Interest (EO-13)
| Method | Path | Description |
|---|---|---|
| GET | `/api/cards/interest-summary?household_id=` | Aggregate interest cost across all cards |

### Goal Celebration (EO-18)
| Method | Path | Description |
|---|---|---|
| POST | `/api/goals/:id/celebrate-milestone` | Mark milestone as celebrated |

### Jar Reallocation (EO-19)
| Method | Path | Description |
|---|---|---|
| POST | `/api/jars/reallocate` | Reallocate money between jars |
| GET | `/api/jars/:id/reallocations` | Get reallocation history for a jar |

### Data Export (EO-11)
| Method | Path | Description |
|---|---|---|
| GET | `/api/export/transactions/csv?date_from=&date_to=&filters...` | Export transactions as CSV |
| GET | `/api/export/accounts/csv?household_id=` | Export accounts as CSV |

### Month Ritual Quick Close (EO-10)
| Method | Path | Description |
|---|---|---|
| GET | `/api/rituals/quick-close-eligibility?household_id=` | Check Quick Close eligibility |

---

## New Endpoints (R2)

### Auto-Resolution Rules (EO-16)
| Method | Path | Description |
|---|---|---|
| GET | `/api/inbox/rules?household_id=` | List auto-resolution rules |
| POST | `/api/inbox/rules` | Create auto-resolution rule |
| PATCH | `/api/inbox/rules/:id` | Update auto-resolution rule |
| DELETE | `/api/inbox/rules/:id` | Delete auto-resolution rule |
| GET | `/api/inbox/resolved?household_id=` | List auto-resolved items |
| POST | `/api/inbox/resolved/:id/undo` | Undo an auto-resolution |
| GET | `/api/inbox/auto-resolution-log?household_id=` | View auto-resolution log |
| GET | `/api/inbox/rule-preview?merchant=&household_id=` | Preview which rule matches a merchant |

### Data Export PDF (EO-11 R2 Extension)
| Method | Path | Description |
|---|---|---|
| GET | `/api/export/monthly-report/pdf?household_id=&month=&year=` | Generate monthly PDF report |

### Saved Filter Views (EO-05 R2 Extension)
| Method | Path | Description |
|---|---|---|
| POST | `/api/transactions/saved-views` | Save a filter view |
| GET | `/api/transactions/saved-views?household_id=` | List saved filter views |
| DELETE | `/api/transactions/saved-views/:id` | Delete a saved view |

### Cash Flow Projections (EO-03 R2 Extension)
| Method | Path | Description |
|---|---|---|
| GET | `/api/planning/projected-balance?household_id=` | Get projected account balances |

---

## Modified Endpoints (R1)

| Method | Path | Modification | Source |
|---|---|---|---|
| GET | `/api/transactions` | New query params: search, date_from, date_to, category_ids, account_ids | EO-05 |
| GET | `/api/transactions/:id` | New field: splits (array of split portions) | EO-20 |
| POST | `/api/transactions` | New optional field: splits array | EO-20 |
| PUT | `/api/transactions/:id/splits` | Modify transaction splits | EO-20 |
| GET | `/api/cards/:id` | New fields: apr, next_payment_due_date, minimum_payment, estimated_interest, interest_ytd | EO-02, EO-13 |
| PATCH | `/api/cards/:id` | Accepts: reminder_window_days, reminders_enabled | EO-02 |
| GET | `/api/installments/:id` | New fields: interest_rate, interest_type, amortization_summary | EO-09 |
| GET | `/api/installments/:id/payments` | Each payment now includes principal/interest split | EO-09 |
| GET | `/api/savings/:id` | New fields: maturity_date, days_until_maturity | EO-12 |
| GET | `/api/health/score` | New fields: trend, top_factors, insights | EO-08 |
| GET | `/api/goals/:id` | New field: current_milestone (nearest 25/50/75/100 not yet celebrated) | EO-18 |
| GET | `/api/jars/:id` | New field: reallocation_history | EO-19 |
| GET | `/api/households/:id` | New field: income_placement | EO-04 |
| PATCH | `/api/households/:id` | Accepts: income_placement | EO-04 |
| POST | `/api/rituals/:id/close` | Accepts: close_type (full/quick), confirmed_sections | EO-10 |
| GET | `/api/rituals/:id` | New fields: close_type, quick_close_summary | EO-10 |
| GET | `/api/inbox/items` | New field: suggested_category, suggestion_confidence (on ReviewItem DTO) | EO-01 |

---

## Deprecated Endpoints (R1 — Retained for Migration, Removed in R2)

| Method | Path | Replacement |
|---|---|---|
| All PlanningRule CRUD endpoints | Various | Replaced by `/api/planning/patterns/*` |

---

## DTO Changes

### InboxReviewItem DTO (Modified — EO-01, EO-16)
- **New (R1):** `suggested_category` (Category | null), `suggestion_confidence` (enum: high, medium, low)
- **New (R2):** `auto_resolved` (boolean), `matched_rule_id` (UUID | null)

### Transaction DTO (Modified — EO-20)
- **New (R1):** `is_split` (boolean), `splits` (TransactionSplit[] | null)

### Card DTO (Modified — EO-02, EO-13)
- **New (R1):** `apr`, `next_payment_due_date`, `minimum_payment_amount`, `reminder_window_days`, `reminders_enabled`, `estimated_interest_this_cycle`, `interest_ytd`, `payment_status` (enum: ok, due_soon, overdue)

### Installment DTO (Modified — EO-09)
- **New (R1):** `interest_rate`, `interest_type`, `amortization_summary` (object: total_interest, paid_interest, remaining_interest, effective_apr)

### Health Score DTO (Modified — EO-08)
- **New (R1):** `trend` (enum: up, down, stable), `trend_value` (number), `top_positive_factors` (array), `top_negative_factors` (array), `insights` (array)

### Month Ritual DTO (Modified — EO-10)
- **New (R1):** `close_type` (enum: full, quick), `quick_close_summary` (object | null)

---

## Versioning Implications

- **No breaking changes in R1.** All new fields are additive. All new endpoints are additive (except deprecated PlanningRule endpoints, which are retained).
- **R2 breaking changes:** PlanningRule endpoints removed. Clients must migrate to RecurringPattern endpoints.
- **API versioning strategy:** Not required for R1 (backward-compatible). R2 may warrant `/api/v2/` prefix for Planning module endpoints if breaking changes are confirmed.

---

## Endpoint Count Summary

| Version | New Endpoints | Modified Endpoints | Deprecated | Total Net Change |
|---|---|---|---|---|
| R1 | 25 | 17 | 1 set (PlanningRules) | +25 new, +17 modified |
| R2 | 10 | 0 | Remove deprecated | +35 cumulative |
