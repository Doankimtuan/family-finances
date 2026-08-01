# Solution Architecture Redesign Pipeline

**Status:** draft · **Preserve business behavior** · **Feature Workers:** forbidden · **Invent business logic:** forbidden

## Workers

| Worker | Wave | Produces |
|--------|------|----------|
| `architecture-consultant` | 0 | architecture-v2/, decision-records/, redesign/ |
| `tech-stack-consultant` | 1 | tech-stack/, migration/ |
| `refactoring-consultant` | 1 | migration/, redesign/ |
| `folder-structure-designer` | 2 | folder-structure/ |

## Consumes

`knowledge/`, `features/`, `business/`, `architecture/` → **`product-architecture/`**, `requirements/`, `quality/`

## Rules

- Do not discover new features or modify business rules.
- Do not overwrite discovery / Product RE artifacts.
- Every payload entry requires `source_paths` + `confidence`.

## Smoke

`npm run aios:solution-architecture:smoke`
