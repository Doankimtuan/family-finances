# Skill Binding — `traceability-validator`

Skill claim/execute binding for Validation Engine worker `traceability-validator`.
Skills live under `skills/traceability-validator`.

## Allowed skill roles

- `planner` · `executor` · `orchestrator-helper`

Reject `validator` / `reviewer` skill roles.

## Claim protocol

1. Claim `task_id` with unique `run_id`.
2. Update run-record; acquire `task:{task_id}` lock.
3. Load skill; verify `mutate_source_artifacts` is false.
4. Execute skill procedure; write produce staging only.
5. Stop for package validator/reviewer.

## Consumes

`schemas/`, `artifacts/`, `workers/`, `pipelines/`, `execution/`, `templates/`, `knowledge/`

## Produces

`validation/`

## Rule

Never modify artifacts. Never invent missing information. Structured findings only.
