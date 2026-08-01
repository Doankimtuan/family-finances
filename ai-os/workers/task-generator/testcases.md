# Testcases index — `task-generator`

| Case | Intent |
|------|--------|
| `case-01-happy-path.json` | Happy path with consume inputs |
| `case-02-budget-exceed.json` | Side-effect budget exceeded |
| `case-03-blocking-validation-fail.json` | Blocking validation fail |
| `case-04-blocking-review-fail.json` | Blocking review fail |
| `case-05-missing-skill.json` | Missing skill package |

## Invariants

- Consumes: `knowledge/`, `repository/`, `features/`, `business/`, `product-architecture/` (logical `architecture/`), `architecture-v2/`, `requirements/`, `quality/`, `redesign/`, `workflow/`, `acceptance/`, `specifications/`
- Primary: `engineering-task-graph`
- Traceability + unknowns required
- No invented business logic; no overwrite of validated artifacts
