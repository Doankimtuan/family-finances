# Worker Conformance Checklist — `refactoring-consultant`

> **Class:** Solution architecture redesign · **Pipeline:** `solution-architecture`  
> Unchecked runtime items remain open until an executable worker runtime exists.

## Package structure

- [x] Directory name equals `refactoring-consultant`
- [x] Mandatory Worker Template files present (`manifest.json`, `examples/`, `testcases/`)
- [x] `testcases.md` human index present (requested deliverable)
- [x] No undeclared product-mutating executables
- [x] Template markers removed

## Identity & registry

- [x] Registered in `registry/workers.json`
- [x] Bound in `pipelines/solution-architecture/`
- [x] `side_effects` = `runtime-write` only
- [x] `feature_worker` = false
- [x] `preserve_business_behavior` = true
- [x] `status` = `draft`

## Skill / validator / reviewer bindings

- [x] Skill package reserved at `skills/refactoring-consultant/`
- [x] Validator `solution-architecture-schema-check` reserved
- [x] Reviewer `solution-architecture-coverage-review` reserved
- [ ] Heartbeats / executable claim loop (deferred)

## Sign-off

| Role | Name | Date | Notes |
|------|------|------|-------|
| Author | solution-architecture-team | 2026-08-01 | Sprint solution-architecture scaffold |
| Reviewer | — | — | |
| Orchestrator owner | — | — | |
