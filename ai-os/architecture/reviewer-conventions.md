# Reviewer Conventions

## Definition

A **reviewer** applies qualitative judgment against an explicit rubric. Reviews are calibrated opinions with structured scores, not free-form chat.

## When to use

- Architecture fit
- Clarity and completeness of plans
- Design taste / UX quality
- Risk assessment that needs context
- “Would a senior engineer approve this?”

If the answer is mechanical, use a validator instead.

## Package shape

```
reviewers/<id>/
├── manifest.json
├── REVIEWER.md
├── rubrics/<rubric-id>.md
└── examples/{strong,weak}/
```

## Rubric rules

1. Each criterion has: `id`, `description`, `weight`, `scale`.
2. Default scale: `1–5` integers with anchor text for 1, 3, 5.
3. Weights sum to `1.0` (±0.01).
4. Hard fails may be declared as `veto_conditions[]` (bypass score).
5. Rubrics are versioned; reviews pin `rubric_version`.

## Manifest requirements

- `applies_to` artifact types
- `requires_validations` — validator IDs that must `pass` first (unless advisory)
- `rubric_id`
- `outputs` → `review-report`

Schema: `schemas/reviewer-spec.schema.json`

## Report contract

Reviews emit `review-report`:

- `result`: `pass` | `fail` | `warn` | `skip`
- `score_total` (0–1 or 1–5 per manifest `score_mode`)
- `criteria[]`: `{ id, score, note }`
- `vetoes[]` if any
- `summary` ≤ 1200 chars
- `reviewed_artifact` pinned

Template: `templates/review/`

## Calibration

Before `active`:

1. Provide ≥ 2 `strong` and ≥ 2 `weak` example reviews.
2. Same rubric version must be used in examples.
3. Disagreement notes belong in `REVIEWER.md`, not hidden prompts.

## Independence

- Reviewers must not author the artifact under review in the same run.
- Self-review by the producing skill is forbidden for gate decisions.
- Advisory reviews may run earlier for feedback loops; they cannot alone publish.

## Framework-phase rule

Ship rubrics, manifests, examples structure, and schemas only. Do not implement reviewer workers.
