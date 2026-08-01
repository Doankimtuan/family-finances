# Worker Conformance Checklist — `product-analyst`

> **Class:** Product reverse engineering · **Pipeline:** `product-re`  
> Unchecked runtime items remain open until an executable worker runtime exists.

## Package structure

- [x] Directory name equals `product-analyst`
- [x] Mandatory Worker Template files present (including `manifest.json`, `examples/`, `testcases/`)
- [x] `testcases.md` human index present (optional convenience; not part of Worker Template mandatory tree)
- [x] No undeclared product-mutating executables
- [x] Template prose markers removed from skill binding / SKILL procedure

## Identity & registry

- [x] Registered in `registry/workers.json`
- [x] Bound in `pipelines/product-re/`
- [x] `side_effects` = `runtime-write` only
- [x] `feature_worker` = false
- [x] `status` = `draft`
- [x] Consumes exclude `architecture/` (use `product-architecture/` when needed)

## Skill / validator / reviewer bindings

- [x] Skill package reserved at `skills/product-analyst/`
- [x] Validator `product-re-schema-check` reserved
- [x] Reviewer `product-re-coverage-review` reserved
- [ ] Heartbeats / executable claim loop (deferred)

## Sign-off

| Role | Name | Date | Notes |
|------|------|------|-------|
| Author | product-re-team | 2026-08-01 | Sprint 4 remediation v0.4.2 |
| Reviewer | — | — | |
| Orchestrator owner | — | — | |
