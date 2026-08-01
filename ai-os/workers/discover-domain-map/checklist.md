# Worker Conformance Checklist — `discover-domain-map`

> Complete every item before setting package status to `active`.
>
> **Class:** Discovery Worker (`worker_class: discovery`). Feature Workers are out of scope.
> Unchecked items ⇒ package remains `draft` (not `active`).

## Package structure

- [x] Directory name equals `discover-domain-map` (kebab-case)
- [x] Contains exactly the mandatory files from `templates/worker/README.md`
- [x] No undeclared executables that mutate the product repo
- [x] `manifest.json` present and validates against `schemas/worker-manifest.schema.json`
- [x] Template markers removed from package docs

## Identity & registry

- [x] `id` unique among workers
- [x] `version` is semver
- [x] `implements_roles` non-empty and accurate
- [x] `side_effects` declared and minimal (`runtime-write`)
- [x] `status` is `draft` (package registered; not claimed `active` until runtime exists)
- [x] Registered in `registry/workers.json` and `pipelines/discovery/`

## Skill path (`skill.md`)

- [x] Skill roles limited to planner / executor / orchestrator-helper
- [x] Claim uses `art_…` run ids and exclusive lock `task:{task_artifact_id}`
- [x] Inputs resolved via dependency graph
- [x] Side-effect budget enforced before execute
- [x] Outputs use canonical `payload.*` only
- [x] Trace filled per `TRACEABILITY.md`
- [ ] Heartbeats written to `events.jsonl` (requires executable runtime — deferred)
- [x] Reserved discovery skill package exists at `skills/discover-domain-map/`

## Validator path (`validator.md`)

- [x] Validators run after persist, before review (when required)
- [x] Missing required validators fail loudly (documented)
- [x] Reports must conform to `validator-report.schema.json`
- [x] Blocking fail prevents publish
- [x] Findings are deterministic and objective
- [x] Reserved validator package exists at `validators/discovery-schema-check/`

## Reviewer path (`reviewer.md`)

- [x] Reviewers run after validation (when required)
- [x] Missing required reviewers fail loudly (documented)
- [x] Reports must conform to `review-report.schema.json`
- [x] Vetoes force fail
- [x] Blocking fail / profile flags prevent publish
- [x] Reserved reviewer package exists at `reviewers/discovery-coverage-review/`

## Output schema

- [x] `output-schema.json` is valid JSON Schema draft 2020-12
- [x] Primary worker envelope present; discovery payload schema is `schemas/discovery-report.schema.json`
- [x] Schema `$id` uses workers/discover-domain-map/output.schema.json pattern

## Examples & testcases

- [x] `examples/` contains sample input, output envelope, and discovery-report payload
- [x] `testcases/` contains machine-readable cases
- [x] Fixtures use `art_…` ids and pinned versions
- [x] Negative cases cover: budget exceed, missing skill, blocking validation fail

## Lifecycle & safety

- [x] Honors `execution-lifecycle.md` phases (documented binding)
- [x] Never publishes on blocking gate fail
- [x] Never schedules/executes hard dependents of failed tasks (worker refuses claim)
- [x] Secrets never written into artifact payloads
- [x] Conforms to `contracts/worker-port.md` for Discovery phase
- [ ] Executable claim/run loop (deferred — Core does not invoke workers in v0.4.x)

## Sign-off

| Role | Name | Date | Notes |
|------|------|------|-------|
| Author | aios-discovery-remediation | 2026-08-01 | Structure + registry remediation; runtime deferred |
| Reviewer | — | — | Pending architect re-review |
| Orchestrator owner | — | — | Not activated |
