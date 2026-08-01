# Testcases index — `task-generator`

| Case | Intent |
|------|--------|
| `case-01-happy-path.json` | Happy path with consume inputs |
| `case-02-budget-exceed.json` | Side-effect budget exceeded |
| `case-03-blocking-validation-fail.json` | Blocking validation fail |
| `case-04-blocking-review-fail.json` | Blocking review fail |
| `case-05-missing-skill.json` | Missing skill package |

## Invariants

- Consumes: `artifacts/knowledge/`, `artifacts/repository/`, `artifacts/features/`, `artifacts/business/`, `artifacts/product-architecture/` (logical `docs/architecture/`), `artifacts/architecture-v2/`, `artifacts/requirements/`, `governance/quality/`, `artifacts/redesign/`, `artifacts/workflow/`, `artifacts/acceptance/`, `artifacts/specifications/`
- Primary: `engineering-task-graph`
- Traceability + unknowns required
- No invented business logic; no overwrite of validated artifacts
