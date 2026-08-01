# Validator Binding — `refactoring-consultant`

> Template for how this worker runs **deterministic** validators.  
> Validators are not skills. They produce `validation-report` artifacts only.

## When validators run

After skill persistence (`ready` outputs), before review (unless task declares no validators).

Order:

1. Task-declared `validators[]` (kebab ids)
2. Type-default validators from policy / registry (if any)
3. Fail-fast on first blocking `fail` when gate profile `validators_blocking: true`

## Validator selection

| Source | Rule |
|--------|------|
| Task `validators` | Run each id if present in `registry/validators.json` |
| Worker allow-list | Optional: `solution-architecture-schema-check` |
| Missing validator | Fail run (`phase: validating`) or escalate — never skip silently |

## Inputs to a validator

| Input | Required |
|-------|----------|
| Target artifact id + version | yes |
| Run id | yes |
| Validator package (`validators/solution-architecture-schema-check`) | yes |
| Gate profile name | yes (from orchestration-state) |

## Procedure

1. Set run phase `validating`.
2. For each required validator:
   - Load validator spec / checks.
   - Execute deterministically (same inputs → same findings).
   - Write `validation-report` artifact (`schemas/validator-report.schema.json`).
   - Use canonical `payload.json` (+ optional `payload.md` narrative).
3. Aggregate results for the quality-gate subject.
4. If blocking fail → mark run `failed`; leave outputs `ready` (not `published`).

## Report requirements

Every validation-report MUST include:

- `validator_id` + `validator_version`
- `run_id`
- `validated_artifact` ref with pinned `artifact_version`
- `result`: `pass` \| `fail` \| `warn` \| `skip`
- `findings[]` with `check_id`, `severity`, `message` (hint optional)
- `stats` counts by severity
- `trace` with at least `run_id`, `task_id` when applicable

## Severity → gate

Follow `architecture/validator-conventions.md` and the active gate profile `blocking_severities`.

## Done when (validator binding)

- [ ] Every declared validator produced a report artifact
- [ ] Blocking fails prevent publish
- [ ] Reports validate against `validator-report.schema.json`
- [ ] No qualitative judgment language in findings (objective only)

## Non-goals

- Do not score rubrics (that is `reviewer.md`)
- Do not mutate product code to “fix” findings unless a separate executor task is planned
- Do not invent severity labels outside `critical|high|medium|low|info`

## References

- `architecture/validator-conventions.md`
- `roles/validator.md`
- `templates/validation/report.json`
- `schemas/validator-report.schema.json`
- `schemas/validator-spec.schema.json`
- `policies/gate-profiles.json`
