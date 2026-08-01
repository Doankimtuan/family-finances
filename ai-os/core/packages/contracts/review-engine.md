# Review Engine Contract

Pipeline: `core/packages/pipelines/review-engine/` · RACI: `core/packages/pipelines/review-engine/RACI.md` · Version: **0.8.1**

## Handoff

Assume **Validation Engine PASS** (`artifacts/reports/`). Reviewers cite artifacts/validation/scores as evidence; they do **not** re-run schema validation.

## Invariants

1. Never modify source artifacts. 2. Never regenerate outputs. 3. Never validate schemas. 4. Never invent — use `UNKNOWN:`.
5. Every entry: review_id, target, finding, evidence, impact, severity, recommendation, alternative_solution, confidence, traceability, unknowns, source_paths.
6. `statement` = one-line summary; `finding` = detailed rationale. 7. `impact` ≠ severity literal.

## Naming

| Artifact | Producer |
|----------|----------|
| `review-finding` | `*-reviewer` (partitioned) |
| `review-status` | `review-orchestrator` (primary) |
| `review-scores` | `review-orchestrator` (secondary → `governance/`) |
| `governance-decision` | `final-decision-board` (partitioned) |
| `gate-review-report` | `core/packages/validators/review-engine-schema-check` |

Worker `*-reviewer` ≠ gate package `core/packages/reviewers/review-engine-coverage-review` ≠ artifact `review-report` (gate rubric output).

## Produces

| Folder | Types / kinds |
|--------|----------------|
| `governance/reviews/<worker_id>/` | `review-finding` |
| `governance/reviews/` | `review-status` |
| `governance/` | `review-scores` |
| `governance/decisions/final-decision-board/` | go-no-go, release-recommendation, decision |
| `governance/recommendations/final-decision-board/` | overall-recommendation |
| `governance/improvements/final-decision-board/` | improvement-plan |
| `governance/final-decision-board/` | summary, critical-risks |

## Consumes

Per worker (see registry). Pipeline alias: **`pipeline/`** → `core/packages/pipelines/`.

Shared: `artifacts/`, `artifacts/validation/`, `artifacts/reports/`, `artifacts/scores/`, `artifacts/knowledge/`, `artifacts/specifications/`, `core/packages/pipelines/` plus domain packs (artifacts/features/, artifacts/business/, artifacts/requirements/, artifacts/acceptance/, artifacts/architecture-v2/, core/packages/workers/, skills/, core/packages/schemas/, core/packages/registry/, core/packages/templates/, …).

## Partial / incremental

`extensions.validation_scope` scopes which partitions are in scope; untouched → `UNKNOWN:` in status entries.

## Scoring

10 dimensions: architecture, business, product, documentation, specifications, maintainability, scalability, extensibility, ai-reliability, overall-engineering-quality — all require `score_value`.

## NO-GO

Critical unresolved reviewer finding → **NO-GO**; else **GO** with documented conditions.
