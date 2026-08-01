# Validator Conventions

## Definition

A **validator** applies deterministic, replayable checks to artifacts. Same input bytes → same result.

Validators do not invent requirements. They enforce schemas, naming, structure, and declared policies.

## Separation from reviewers

| Validator | Reviewer |
|-----------|----------|
| Deterministic | Judgmental |
| Binary/structured findings | Rubric scores + narrative |
| No “taste” | Taste / fit / clarity |
| Must be automatable | May require an LLM role |

If a check can be fully automated without subjective interpretation, it belongs in a validator.

## Package shape

```
validators/<id>/
├── manifest.json
├── VALIDATOR.md
├── checks/*.json          # declarative check specs
└── fixtures/{pass,fail}/
```

## Manifest requirements

- `id`, `version`, `applies_to` (artifact types)
- `checks[]` with `check_id`, `severity`, `rule`
- `fail_fast` boolean
- `outputs` → `validation-report`

Schema: `schemas/validator-spec.schema.json`

## Check design rules

1. One check = one assertable rule.
2. Messages must include: what failed, where, how to fix.
3. Prefer schema validation before semantic checks.
4. No network calls unless `side_effects` includes `external` and orchestrator allows it.
5. Fixtures required for every `critical` check before `active` status.

## Report contract

Validators emit artifact type `validation-report`:

- `result`: `pass` | `fail` | `warn` | `skip`
- `findings[]`: `{ check_id, severity, message, path?, hint? }`
- `stats`: counts by severity
- `validated_artifact`: pinned id+version

Template: `templates/validation/`

## Severity policy

| Severity | Default gate effect |
|----------|---------------------|
| `critical` | `fail` blocks publish |
| `high` | `fail` blocks publish |
| `medium` | `warn` unless policy `strict` |
| `low` / `info` | informational |

## Naming

- Validator IDs: `kebab-case` only (`schema-conformance`, `naming-guard`) — no `valpkg_` prefix
- Check IDs: `kebab-case`, stable forever once `active`
- Registry: `registry/validators.json` `entries.<id>`

## Framework-phase rule

Ship manifests, docs, fixtures shapes, and schemas only. Do not implement executable check runners.
