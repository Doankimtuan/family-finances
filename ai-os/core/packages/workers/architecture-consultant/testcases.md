# Testcases index — `architecture-consultant`

Human index for conformance fixtures under `testcases/`.

## Cases

| Case | Intent |
|------|--------|
| `case-01-happy-path.json` | Happy path with full consume inputs |
| `case-02-budget-exceed.json` | Side-effect budget exceeded |
| `case-03-blocking-validation-fail.json` | Blocking validation fail |
| `case-04-blocking-review-fail.json` | Blocking review fail |
| `case-05-missing-skill.json` | Missing skill package |

## Invariants

- Consumes: `artifacts/knowledge/`, `artifacts/features/`, `artifacts/business/`, `artifacts/product-architecture/` (logical `docs/architecture/`), `artifacts/requirements/`, `governance/quality/`
- Primary type: `architecture-v2-spec`
- Entries require `source_paths` + `confidence`
- No invented business logic; no overwrite of discovery artifacts
