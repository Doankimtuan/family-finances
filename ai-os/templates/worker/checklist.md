# Worker Conformance Checklist — `{{worker_id}}`

> Complete every item before setting package status to `active`.  
> Unchecked items ⇒ package remains `reserved` or `draft`.

## Package structure

- [ ] Directory name equals `{{worker_id}}` (kebab-case)
- [ ] Contains exactly the mandatory files from `templates/worker/README.md`
- [ ] No undeclared executables that mutate the product repo
- [ ] `manifest.json` present (from template) and validates against `schemas/worker-manifest.schema.json`
- [ ] All `{{placeholders}}` removed from package docs

## Identity & registry

- [ ] `id` unique among workers
- [ ] `version` is semver
- [ ] `implements_roles` non-empty and accurate
- [ ] `side_effects` declared and minimal
- [ ] `status` reflects reality (`reserved` until phase opens)

## Skill path (`skill.md`)

- [ ] Skill roles limited to planner / executor / orchestrator-helper
- [ ] Claim uses `art_…` run ids and exclusive task lock
- [ ] Inputs resolved via dependency graph
- [ ] Side-effect budget enforced before execute
- [ ] Outputs use canonical `payload.*` only
- [ ] Trace filled per `TRACEABILITY.md`
- [ ] Heartbeats written to `events.jsonl`

## Validator path (`validator.md`)

- [ ] Validators run after persist, before review (when required)
- [ ] Missing required validators fail loudly
- [ ] Reports conform to `validator-report.schema.json`
- [ ] Blocking fail prevents publish
- [ ] Findings are deterministic and objective

## Reviewer path (`reviewer.md`)

- [ ] Reviewers run after validation (when required)
- [ ] Missing required reviewers fail loudly
- [ ] Reports conform to `review-report.schema.json`
- [ ] Vetoes force fail
- [ ] Blocking fail / profile flags prevent publish

## Output schema

- [ ] `output-schema.json` is valid JSON Schema draft 2020-12
- [ ] Primary worker output validates against it in `testcases/`
- [ ] Schema `$id` uses `https://aios.dev/schemas/workers/{{worker_id}}/output.schema.json` pattern (or documented local id)

## Examples & testcases

- [ ] `examples/` contains at least one sample input fixture
- [ ] `testcases/` contains at least one machine-readable case
- [ ] Fixtures use `art_…` ids and pinned versions
- [ ] Negative cases cover: budget exceed, missing skill, blocking validation fail

## Lifecycle & safety

- [ ] Honors `execution-lifecycle.md` phases
- [ ] Never publishes on blocking gate fail
- [ ] Never schedules/executes hard dependents of failed tasks (worker refuses claim)
- [ ] Secrets never written into artifact payloads
- [ ] Conforms to `contracts/worker-port.md`

## Sign-off

| Role | Name | Date | Notes |
|------|------|------|-------|
| Author | {{author}} | {{date}} | |
| Reviewer | {{reviewer}} | {{date}} | |
| Orchestrator owner | {{owner}} | {{date}} | |
