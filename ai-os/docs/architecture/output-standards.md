# Output Standards

## Universal rules

1. **Canonical payload** — `payload.json` | `payload.md` | `payload.patch` | `payload.bin` only.
2. **Human companion optional** — `ARTIFACT.md` / `PLAN.md` / … never set as `meta.payload.path`.
3. **Schema validity** — JSON must validate before status `ready`.
4. **Pinned refs** — `artifact_id` + `artifact_version`.
5. **No secrets**.
6. **UTC ISO-8601 timestamps**.
7. **Enums from common schema only**.

## Markdown

- One H1; status block near top; prefer < 800 lines.
- Relative links within `ai-os/`.

## JSON

- UTF-8, 2-space indent in core/packages/templates/registries.
- `additionalProperties: false` on roots unless `extensions`.
- Empty arrays over omitted required lists.

## Role outputs

| Role | Canonical outputs |
|------|-------------------|
| Planner | task artifacts + dependency-graph + plan (`payload.json`) |
| Executor | typed `payload.*` + `meta.json` |
| Validator | validation-report `payload.json` |
| Reviewer | review-report `payload.json` |
| Orchestrator | orchestration-state, plan-decision, quality-gate, escalation |

## Status block

```markdown
> **Status:** draft  
> **ID:** art_...  
> **Type:** plan  
> **Version:** 1
```

## Forbidden

- Using `PLAN.md` / `ARTIFACT.md` as the payload path
- Schema-invalid `ready` artifacts
- Dual ID prefixes outside `art_`
- Chat-as-lineage
