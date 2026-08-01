# Worker Port Contract

Workers claim runs, load skill/validator/reviewer packages, respect side-effect budgets, write artifacts under `runtime/`, and emit `events.jsonl`.

## Manifest

`schemas/worker-manifest.schema.json`

Required: `id`, `version`, `implements_roles`, `side_effects`, `status`.

## Phase gate (v0.4.1)

| Allowed | Forbidden |
|---------|-----------|
| Discovery Workers under `workers/discover-*` | Feature Workers |
| Side effects ⊆ `runtime-write` | `repo-write` / `external` without a later phase bump |
| Registration in `registry/workers.json` + `pipelines/discovery/` | Ad-hoc scripts outside the template tree |

## Conformance checklist

Instantiate from `templates/worker/` and complete that pack’s `checklist.md`.

Minimum:

- [ ] Package tree matches `templates/worker/` exactly
- [ ] Honors execution-lifecycle.md phases
- [ ] Uses predecessor/successor dependency resolution
- [ ] Writes only `payload.*` canonical paths
- [ ] Fills `trace` per TRACEABILITY.md
- [ ] Never publishes on blocking gate fail
- [ ] `testcases/` cover happy path + budget + blocking validation
- [ ] `extensions.worker_class` is `discovery` for this phase

## Package template

Canonical copy-from pack: `templates/worker/`

| File | Purpose |
|------|---------|
| `README.md` | Identity + layout |
| `skill.md` | Skill claim/execute binding (not skill-package `SKILL.md`) |
| `validator.md` | Deterministic checks |
| `reviewer.md` | Qualitative review |
| `checklist.md` | Activation gate |
| `output-schema.json` | Primary output envelope schema |
| `manifest.json` | `worker-manifest.schema.json` |
| `examples/` | Human illustrations |
| `testcases/` | Conformance fixtures |

## Capability packages

Registered discovery skills/validators/reviewers must exist on disk under `skills/`, `validators/`, `reviewers/` (reserved stubs allowed).

## Pipeline registration

Discovery Workers must appear in:

1. `registry/workers.json`
2. `pipelines/discovery/pipeline.json`
3. `pipelines/discovery/dependency-graph.json` (schema: `pipeline-dependency-graph.schema.json`)
