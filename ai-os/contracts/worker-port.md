# Worker Port Contract

Workers claim runs, load skill/validator/reviewer packages, respect side-effect budgets, write artifacts under `runtime/`, and emit `events.jsonl`.

## Manifest

`schemas/worker-manifest.schema.json`

Required: `id`, `version`, `implements_roles`, `side_effects`, `status`.

## Phase gate (v0.4.2)

| Allowed | Forbidden |
|---------|-----------|
| Discovery Workers under `workers/discover-*` bound by `pipelines/discovery/` | Feature Workers |
| Product RE Workers under `workers/` with `extensions.pipeline: product-re`, bound by `pipelines/product-re/` | `repo-write` / `external` without a later phase bump |
| Side effects ⊆ `runtime-write` | Ad-hoc scripts outside the template tree |
| Registration in `registry/workers.json` + matching pipeline | Invoking workers from Core |

`worker_class` remains `discovery` for both Discovery and Product RE packages (Feature Workers deferred). Product RE is distinguished by `extensions.pipeline` / registry `pipeline: product-re`.

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
- [ ] `extensions.worker_class` is `discovery`; Product RE sets `extensions.pipeline` = `product-re`

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

Registered skills/validators/reviewers for a pipeline must exist on disk under `skills/`, `validators/`, `reviewers/` (reserved stubs allowed).

## Pipeline registration

### Discovery

1. `registry/workers.json`
2. `pipelines/discovery/pipeline.json`
3. `pipelines/discovery/dependency-graph.json`

### Product reverse engineering

1. `registry/workers.json`
2. `pipelines/product-re/pipeline.json`
3. `pipelines/product-re/dependency-graph.json`

Product RE **must not** consume `architecture/` (AIOS control-plane docs). Use `product-architecture/` for product architecture observations.
