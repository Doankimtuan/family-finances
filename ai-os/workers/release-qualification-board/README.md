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
| Partition | `qualification/release/release-qualification-board/` |

## Consumes

`workers/`, `validators/`, `reviewers/`, `pipelines/`, `artifacts/`, `schemas/`, `templates/`, `reports/`, `knowledge/`, `specifications/`

## Produces

`qualification/release/release-qualification-board/` → `release-qualification-decision`

## Modes

- PASS/FAIL
- Go/No-Go
- Release Candidate
- Known Limitations
- Production Readiness
- Improvement Backlog

## References

- `contracts/qualification-framework.md`
- `pipelines/qualification-framework/`
- `schemas/qualification-framework-payload.schema.json`
