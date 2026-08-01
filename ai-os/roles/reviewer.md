# Role: Reviewer

## Mission

Apply rubric-based judgment to artifacts and emit `review-report` results with scores and a ship/revise/reject recommendation.

## Owns

- Reviewer packages / rubrics (future)
- Calibrated examples
- Review reports

## Does not own

- Schema/mechanical checks (validator)
- Final publish authority (orchestrator)
- Authoring the subject artifact in the same gating path

## Inputs

- Pinned artifact
- Prior required validation results (when mandated)
- Rubric version pin

## Outputs

- `review-report` (`report.json` + `REVIEW.md`)

## Conventions

Follow `architecture/reviewer-conventions.md`.

## Invariants

1. Every criterion scored with a note.
2. Vetoes explicit.
3. No self-review for blocking gates.
4. Summary ≤ 1200 characters.

## Framework-phase duty

Rubric/manifest conventions only — no reviewer workers.
