# Worker Conformance Checklist — `implementation-planner`

> **Pipeline:** `specification-engineering`  
> Unchecked runtime items remain open until an executable worker runtime exists.

## Package structure

- [x] Directory name equals `implementation-planner`
- [x] Mandatory Worker Template files present
- [x] `testcases.md` human index present
- [x] No undeclared product-mutating executables
- [x] Template markers removed

## Identity & registry

- [x] Registered in `registry/workers.json`
- [x] Bound in `pipelines/specification-engineering/`
- [x] `side_effects` = `runtime-write` only
- [x] `feature_worker` = false
- [x] `invent_business_logic` = false
- [x] `status` = `draft`

## Skill / validator / reviewer bindings

- [x] Skill package reserved at `skills/implementation-planner/`
- [x] Validator `specification-engineering-schema-check` reserved
- [x] Reviewer `specification-engineering-coverage-review` reserved
- [ ] Heartbeats / executable claim loop (deferred)

## Worker-specific gates

- [x] Primary output `implementation-plan`
- [x] Traceability + unknowns required on entries
- [x] Does not overwrite validated upstream artifacts

## Sign-off

| Role | Name | Date | Notes |
|------|------|------|-------|
| Author | specification-engineering-team | 2026-08-01 | Worker scaffold only (not executed) |
| Remediation | specification-engineering-team | 2026-08-01 | Board HOLD fix v0.6.1 (schema/RACI/examples/skills) |
| Reviewer | — | — | |
| Orchestrator owner | — | — | |
