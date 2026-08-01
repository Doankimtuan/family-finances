# Worker Port Contract

Workers claim runs, load skill/validator/reviewer packages, respect side-effect budgets, write artifacts under `runtime/`, and emit `events.jsonl`.

## Manifest

`core/packages/schemas/worker-manifest.schema.json`

Required: `id`, `version`, `implements_roles`, `side_effects`, `status`.

## Phase gate (v0.7.0)

| Allowed | Forbidden |
|---------|-----------|
| Discovery Workers under `core/packages/workers/discover-*` bound by `core/packages/pipelines/discovery/` | Feature Workers |
| Product RE Workers with `extensions.pipeline: product-re` | `repo-write` / `external` without a later phase bump |
| Solution Architecture Workers with `extensions.pipeline: solution-architecture` | Inventing business logic / overwriting discovery artifacts |
| Specification Engineering Workers with `extensions.pipeline: specification-engineering` | Redesigning the system / changing business requirements |
| Validation Engine Workers with `extensions.pipeline: validation-engine` | Mutating source artifacts / inventing missing information |
| Side effects ⊆ `runtime-write` | Ad-hoc scripts outside the template tree |
| Registration in `core/packages/registry/workers.json` + matching pipeline | Invoking workers from Core |

`worker_class` remains `discovery` for Discovery, Product RE, Solution Architecture, Specification Engineering, and Validation Engine packages (Feature Workers deferred). Pipelines are distinguished by `extensions.pipeline` / registry `pipeline`.

## Conformance checklist

Instantiate from `core/packages/templates/worker/` and complete that pack’s `checklist.md`.

Minimum:

- [ ] Package tree matches `core/packages/templates/worker/` exactly
- [ ] Honors execution-lifecycle.md phases
- [ ] Uses predecessor/successor dependency resolution
- [ ] Writes only `payload.*` canonical paths
- [ ] Fills `trace` per TRACEABILITY.md
- [ ] Never publishes on blocking gate fail
- [ ] `testcases/` cover happy path + budget + blocking validation
- [ ] `extensions.worker_class` is `discovery`; set `extensions.pipeline` to the owning pipeline

## Package template

Canonical copy-from pack: `core/packages/templates/worker/`

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

Registered skills/validators/reviewers for a pipeline must exist on disk under `skills/`, `core/packages/validators/`, `core/packages/reviewers/` (reserved stubs allowed).

## Pipeline registration

### Discovery

1. `core/packages/registry/workers.json`
2. `core/packages/pipelines/discovery/pipeline.json`
3. `core/packages/pipelines/discovery/dependency-graph.json`

### Product reverse engineering

1. `core/packages/registry/workers.json`
2. `core/packages/pipelines/product-re/pipeline.json`
3. `core/packages/pipelines/product-re/dependency-graph.json`

Product RE **must not** consume `docs/architecture/` (AIOS control-plane docs). Use `artifacts/product-architecture/` for product architecture observations.

### Solution architecture redesign

1. `core/packages/registry/workers.json`
2. `core/packages/pipelines/solution-architecture/pipeline.json`
3. `core/packages/pipelines/solution-architecture/dependency-graph.json`

Logical consume `docs/architecture/` resolves to `artifacts/product-architecture/`. Solution Architecture workers must preserve validated business behavior, require `source_paths` + `confidence` on entries, and must not invent business logic or overwrite discovery/Product RE artifacts.

### Specification engineering

1. `core/packages/registry/workers.json`
2. `core/packages/pipelines/specification-engineering/pipeline.json`
3. `core/packages/pipelines/specification-engineering/dependency-graph.json`

Logical consume `docs/architecture/` resolves to `artifacts/product-architecture/` (+ soft `artifacts/architecture-v2/`, `governance/decision-records/`, `artifacts/tech-stack/`, `artifacts/migration/`, `artifacts/folder-structure/`). Specification Engineering workers require full spec body fields + traceability matrix on non-gap entries; must not invent business logic, redesign, change requirements, or overwrite validated upstream artifacts. Soft `artifacts/repository/` is human/pre-step authored. Ordering ownership: `core/packages/pipelines/specification-engineering/RACI.md`. Core does not execute these workers by default.

### Validation engine

1. `core/packages/registry/workers.json`
2. `core/packages/pipelines/validation-engine/pipeline.json`
3. `core/packages/pipelines/validation-engine/dependency-graph.json`

Validation Engine workers **never modify** source artifacts and **never invent** missing information. Outputs are structured findings (`validation-finding` / `validation-status` / `quality-scores` / `validation-report`) under `artifacts/validation/`, `artifacts/scores/`, `artifacts/reports/` (optional mirror `governance/quality/validation-scorecard/`). Contract: `core/packages/contracts/validation-engine.md`. Packaging only — Core does not execute validations in v0.7.0.
