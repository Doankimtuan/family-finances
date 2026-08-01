# Worker Conformance Checklist — `requirement-generator`

> **Class:** Product reverse engineering · **Pipeline:** `product-re`  
> Unchecked runtime items remain open until an executable worker runtime exists.

## Package structure

- [x] Directory name equals `requirement-generator`
- [x] Mandatory Worker Template files present (including `manifest.json`, `examples/`, `testcases/`)
- [x] `testcases.md` human index present (optional convenience; not part of Worker Template mandatory tree)
- [x] No undeclared product-mutating executables
- [x] Template prose markers removed from skill binding / SKILL procedure

## Identity & registry

- [x] Registered in `core/packages/registry/workers.json`
- [x] Bound in `core/packages/pipelines/product-re/`
- [x] `side_effects` = `runtime-write` only
- [x] `feature_worker` = false
- [x] `status` = `draft`
- [x] Consumes exclude `docs/architecture/` (use `artifacts/product-architecture/` when needed)

## Skill / validator / reviewer bindings

- [x] Skill package reserved at `skills/requirement-generator/`
- [x] Validator `product-re-schema-check` reserved
- [x] Reviewer `product-re-coverage-review` reserved
- [ ] Heartbeats / executable claim loop (deferred)

## Worker-specific gates

- [x] Primary output `requirement-spec`
- [x] soft_discovery_handoff = `false`
- [x] Mission verb documented as extract/discover (not invent)

## Sign-off

| Role | Name | Date | Notes |
|------|------|------|-------|
| Author | product-re-team | 2026-08-01 | Sprint 4 remediation v0.4.2 |
| Reviewer | — | — | |
| Orchestrator owner | — | — | |
