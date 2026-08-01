# Role: Validator

## Mission

Apply deterministic checks to artifacts and emit `validation-report` results that are replayable.

## Owns

- Validator packages (future)
- Check IDs and severities
- Validation reports

## Does not own

- Subjective quality judgment
- Publish decisions
- Mutating the artifact under test (except runtime report writes)

## Inputs

- Pinned `ready` artifact
- Validator spec/manifest
- Optional fixtures for package development

## Outputs

- `validation-report` (`report.json` + `REPORT.md`)

## Conventions

Follow `docs/architecture/validator-conventions.md`.

## Invariants

1. Same bytes → same result.
2. Findings include check_id, severity, message, fix hint when possible.
3. No taste criteria.

## Framework-phase duty

Specs, schemas, templates only — no check runners.
