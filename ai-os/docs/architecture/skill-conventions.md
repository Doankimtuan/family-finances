# Skill Conventions

## Definition

A **skill** is a declarative capability package that transforms declared inputs into declared artifact outputs under orchestrator control.

Skills are not workers. Validators and reviewers are **not** skills.

## Roles allowed

`planner` | `executor` | `orchestrator-helper`

Only. Deterministic checks → `core/packages/validators/`. Judgment → `core/packages/reviewers/`.

## Required package files

| File | Required | Schema / template |
|------|----------|-------------------|
| `manifest.json` | yes | `core/packages/schemas/skill-manifest.schema.json` |
| `SKILL.md` | yes | `core/packages/templates/skill/SKILL.md` |
| `input.schema.json` | recommended | JSON Schema |
| `output.schema.json` | recommended | JSON Schema |

## Manifest rules

1. `id` unique key in `core/packages/registry/skills.json` `entries`.
2. `version` semver; `status` from `packageStatus`.
3. `inputs`/`outputs` list artifact types registered in `artifact-types`.
4. `side_effects` declared.
5. Framework phase: reserved stubs only — no product-mutating bodies.

## SKILL.md rules

- Frontmatter `name` matches manifest `id`.
- Description: third person, WHAT + WHEN, ≤ 1024 chars.
- Body ≤ 500 lines; references one level deep.
- Output to canonical `payload.*` only.

## Grades

`strict` | `guided` | `open`

## Registration

```json
"entries": {
  "example-skill": {
    "id": "example-skill",
    "path": "skills/example-skill",
    "version": "0.0.0",
    "status": "reserved"
  }
}
```
