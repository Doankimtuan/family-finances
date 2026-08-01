# Solution Architecture Redesign Pipeline

**Status:** draft · **Preserve business behavior** · **Feature Workers:** forbidden · **Invent business logic:** forbidden

## Workers

| Worker | Wave | Produces |
|--------|------|----------|
| `architecture-consultant` | 0 | artifacts/architecture-v2/, governance/decision-records/, artifacts/redesign/ |
| `tech-stack-consultant` | 1 | artifacts/tech-stack/, artifacts/migration/ |
| `refactoring-consultant` | 1 | artifacts/migration/, artifacts/redesign/ |
| `folder-structure-designer` | 2 | artifacts/folder-structure/ |

## Consumes

`artifacts/knowledge/`, `artifacts/features/`, `artifacts/business/`, `docs/architecture/` → **`artifacts/product-architecture/`**, `artifacts/requirements/`, `governance/quality/`

## Rules

- Do not discover new features or modify business rules.
- Do not overwrite discovery / Product RE artifacts.
- Every payload entry requires `source_paths` + `confidence`.

## Smoke

`npm run aios:solution-architecture:smoke`
