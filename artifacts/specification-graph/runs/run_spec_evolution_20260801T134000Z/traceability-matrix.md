# Traceability Matrix

**Run:** `run_spec_evolution_20260801T134000Z`  
**Rows:** 14 (BusinessRule-centric)

| Business Rule | Features | Requirement | Acceptance | UI | API | DB | Tasks | Impl |
|---------------|----------|-------------|------------|----|-----|----|-------|------|
| `br-action-context` | — | `req-br-action-context` | `ac-br-action-context` | — | `spec-api-server-actions` | — | — | — |
| `br-amount-positive` | — | `req-br-amount-positive` | — | — | — | — | — | — |
| `br-assumptions-admin` | `ft-household`<br>`ft-settings` | `req-br-assumptions-admin` | `ac-br-assumptions-admin` | — | — | — | — | — |
| `br-closed-month` | `ft-jars` | `req-br-closed-month` | `ac-br-closed-month` | — | — | `spec-db-jar_month_close_runs`<br>`spec-db-jar_month_plans`<br>`spec-db-jar_movements`<br>`spec-db-jar_review_queue`… | — | — |
| `br-expense-allocate` | `ft-jars` | `req-br-expense-allocate` | `ac-br-expense-allocate` | — | — | — | — | — |
| `br-income-allocate` | — | `req-br-income-allocate` | `ac-br-income-allocate` | — | — | — | — | — |
| `br-installment-complete` | `ft-cards` | `req-br-installment-complete` | `ac-br-installment-complete` | — | — | `spec-db-installment_plans` | — | — |
| `br-jar-active` | `ft-jars` | `req-br-jar-active` | `ac-br-jar-active` | — | — | `spec-db-jar_month_close_runs`<br>`spec-db-jar_month_plans`<br>`spec-db-jar_movements`<br>`spec-db-jar_review_queue`… | — | — |
| `br-month-close-mode` | — | `req-br-month-close-mode` | — | — | — | — | — | — |
| `br-one-household` | `ft-household`<br>`ft-settings` | `req-br-one-household` | `ac-br-one-household` | — | — | — | — | — |
| `br-overspend-policy` | — | `req-br-overspend-policy` | — | — | — | — | — | — |
| `br-real-vs-virtual` | `ft-jars` | `req-br-real-vs-virtual` | `ac-br-real-vs-virtual` | — | — | — | — | — |
| `br-rls-member` | — | `req-br-rls-member` | `ac-br-rls-member` | — | — | `spec-db-rls` | — | — |
| `br-savings-maturity` | — | `req-br-savings-maturity` | `ac-br-savings-maturity` | — | — | `spec-db-savings_accounts`<br>`spec-db-savings_maturity_actions`<br>`spec-db-savings_withdrawals` | — | — |

## Orphan summary

```json
{
  "requirements_without_acceptance": 28,
  "requirements_without_upstream_rule_or_feature": 8,
  "features_without_requirement": 0,
  "business_rules_without_requirement": 0,
  "api_specs_without_requirement": 0,
  "db_specs_without_requirement": 15,
  "ui_specs_without_requirement": 2,
  "tasks_without_requirement": 10
}
```

Full lists in `graph.json` → `orphans`.
