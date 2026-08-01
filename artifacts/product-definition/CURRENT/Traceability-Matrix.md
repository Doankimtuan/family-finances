---
document: Traceability Matrix
product_definition: v2.0.0
status: OFFICIAL_SOURCE_OF_TRUTH
run_id: run_product_definition_20260801T144500Z
created_at: 2026-08-01T14:46:45Z
supersedes_candidate: ai-os/artifacts/product-strategy/runs/run_product_strategy_20260801T140000Z/
does_not_overwrite_spec_v1: true
---

# Traceability Matrix

| Requirement | Business Rule | Feature | Acceptance | Workflow | API | Database | Task |
|-------------|---------------|---------|------------|----------|-----|----------|------|
| `REQ-001` | `BR-01` | `F-Home` | `AC-001` | `WF-Daily` | `API-Dashboard` | `DB-Accounts+Jars` | `TASK-Home` |
| `REQ-002` | `BR-02`, `BR-02a` | `F-Auth` | `AC-002` | `WF-Auth` | `API-Session` | `DB-Members` | `TASK-Auth` |
| `REQ-003` | `BR-03` | `F-Plan` | `AC-003` | `WF-Capture-Place` | `API-Jars` | `DB-Jars` | `TASK-Plan` |
| `REQ-004` | `BR-04` | `F-Plan` | `AC-004` | `WF-Capture-Place` | `API-Jars` | `DB-JarPlans` | `TASK-Plan` |
| `REQ-005` | `BR-05` | `F-Inbox` | `AC-005` | `WF-Capture-Place` | `API-Jars-Review` | `DB-ReviewQueue` | `TASK-Inbox` |
| `REQ-006` | `BR-06` | `F-Plan` | `AC-006` | `WF-Capture-Place` | `API-Jars` | `DB-Movements` | `TASK-Plan` |
| `REQ-007` | `BR-07` | `F-Together` | `AC-007` | `WF-Together-Policy` | `API-Household` | `DB-Households` | `TASK-Together` |
| `REQ-008` | `BR-08` | `F-Plan` | `AC-008` | `WF-Month-Ritual` | `API-MonthClose` | `DB-CloseRuns` | `TASK-Ritual` |
| `REQ-009` | `BR-09` | `F-Plan` | `AC-009` | `WF-Month-Ritual` | `API-MonthClose` | `DB-Households` | `TASK-Ritual` |
| `REQ-010` | `BR-10` | `F-Money` | `AC-010` | `WF-Savings-Maturity` | `API-Savings` | `DB-Savings` | `TASK-Savings` |
| `REQ-011` | `BR-11` | `F-Money` | `AC-011` | `WF-EMI` | `API-Accounts-Card` | `DB-Installments` | `TASK-Cards` |
| `REQ-012` | `BR-12` | `F-Together` | `AC-012` | `WF-Onboard` | `API-Household` | `DB-Members` | `TASK-Together` |
| `REQ-013` | `BR-13` | `F-Together` | `AC-013` | `WF-Together-Policy` | `API-Settings` | `DB-Audit` | `TASK-Together` |
| `REQ-014` | `BR-02` | `F-Onboard` | `AC-014` | `WF-Onboard` | `API-Household` | `DB-Accounts+Jars` | `TASK-Onboard` |
| `REQ-015` | `BR-01` | `F-Health` | `AC-015` | `WF-Weekly` | `API-Insights` | `DB-Health` | `TASK-Health` |
| `REQ-016` | `BR-05` | `F-Money` | `AC-016` | `WF-Capture-Place` | `API-Categories` | `DB-Categories` | `TASK-Money` |
| `REQ-017` | `BR-14` | `F-AI-Assist` | `AC-017` | `WF-Assist` | `API-Insights` | `DB-Insights` | `TASK-AI` |
| `REQ-018` | `BR-15` | `F-Money` | `AC-018` | `WF-Daily` | `API-All-Mutating` | `DB-Ledger` | `TASK-Platform` |
| `REQ-019` | `BR-02` | `F-Home` | `AC-019` | `WF-Daily` | `API-N/A-UI` | `DB-N/A` | `TASK-A11y` |
| `REQ-020` | `BR-02`, `BR-13` | `F-Together` | `AC-020` | `WF-Together-Policy` | `API-Settings` | `DB-Members` | `TASK-Together` |
