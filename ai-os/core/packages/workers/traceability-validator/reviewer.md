# Reviewer Binding — `traceability-validator`

> Template for how this worker runs **qualitative** reviewers.  
> Reviewers are not skills and not validators. They produce `review-report` artifacts only.

## When reviewers run

After validation completes without blocking fail (or per profile when validators are advisory).

Order:

1. Task-declared `reviewers[]`
2. Profile rules (e.g. `require_review_on_repo_write`, `require_review_on_plan`)
3. Fail / hold on veto or blocking `fail` when `reviews_blocking: true`

## Reviewer selection

| Source | Rule |
|--------|------|
| Task `reviewers` | Run each id if present in `core/packages/registry/reviewers.json` |
| Worker allow-list | Optional: `validation-engine-coverage-review` — `{{allowed_reviewer_ids_or_star}}` |
| Missing reviewer | Fail run (`phase: reviewing`) or escalate — never skip silently when required |

## Inputs to a reviewer

| Input | Required |
|-------|----------|
| Target artifact id + version | yes |
| Prior validation-report refs | recommended |
| Rubric id + version | yes |
| Run id | yes |
| Gate profile | yes |

## Procedure

1. Set run phase `reviewing` (or equivalent).
2. For each required reviewer:
   - Load reviewer package + rubric.
   - Apply criteria; record per-criterion scores and notes.
   - Write `review-report` artifact (`core/packages/schemas/review-report.schema.json`).
   - Canonical `payload.json` (+ optional `payload.md` summary).
3. Honor vetoes: any veto → overall `fail` regardless of score.
4. Feed aggregate into quality-gate decisioning (orchestrator or worker-local pre-gate).

## Report requirements

Every review-report MUST include:

- `reviewer_id` + `reviewer_version`
- `rubric_id` + `rubric_version`
- `run_id`
- `reviewed_artifact` ref with pinned version
- `result`: `pass` \| `fail` \| `warn` \| `skip`
- `score_total`, `normalized_score` (if rubric scored)
- `criteria[]` with `id`, `score`, `note`
- `vetoes[]`
- `summary`, `recommendation` (`ship` \| `revise` \| `reject` \| … per schema)
- `trace` with `run_id`, `task_id` when applicable

## Independence

- Reviewers MUST NOT re-implement deterministic schema checks (validators own those).
- Reviewers MUST NOT silently rewrite the reviewed artifact; request revise via recommendation.

## Done when (reviewer binding)

- [ ] Every required reviewer produced a report
- [ ] Vetoes enforced
- [ ] Reports validate against `review-report.schema.json`
- [ ] No publish on blocking review fail

## Non-goals

- Do not run skill execution here
- Do not claim exclusive validator ownership of objective checks
- Do not bypass `require_review_on_*` profile flags

## References

- `docs/architecture/reviewer-conventions.md`
- `core/packages/roles/reviewer.md`
- `core/packages/templates/review/report.json`
- `core/packages/schemas/review-report.schema.json`
- `core/packages/schemas/reviewer-spec.schema.json`
- `governance/policies/gate-profiles.json`
