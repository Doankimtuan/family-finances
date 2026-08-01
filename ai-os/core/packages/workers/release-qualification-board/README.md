# Worker — `release-qualification-board`

> **Pipeline:** `qualification-framework` · **Status:** draft · **Evaluate only — never modify framework**  
> **Primary output:** `release-qualification-decision`

## Mission

Aggregate all benchmarks into PASS/FAIL, Go/No-Go, release candidate decision, known limitations, production readiness, and improvement backlog.

## Identity

| Field | Value |
|-------|-------|
| Worker id | `release-qualification-board` |
| Pipeline | `qualification-framework` |
| Skill | `release-qualification-board` |
| Partition | `governance/qualification/release/release-qualification-board/` |

## Consumes

`core/packages/workers/`, `core/packages/validators/`, `core/packages/reviewers/`, `core/packages/pipelines/`, `artifacts/`, `core/packages/schemas/`, `core/packages/templates/`, `artifacts/reports/`, `artifacts/knowledge/`, `artifacts/specifications/`

## Produces

`governance/qualification/release/release-qualification-board/` → `release-qualification-decision`

## Modes

- PASS/FAIL
- Go/No-Go
- Release Candidate
- Known Limitations
- Production Readiness
- Improvement Backlog

## References

- `core/packages/contracts/qualification-framework.md`
- `core/packages/pipelines/qualification-framework/`
- `core/packages/schemas/qualification-framework-payload.schema.json`
