# AIOS Release Notes — 0.12.0

**Date:** 2026-08-01  
**Phase:** Refactoring Board — Capability-first simplification  
**Stance:** Zero attachment; safe changes only

## Executive summary

Introduces an **8-capability mental model** as the primary architecture for humans and `@Run` commands. Preserves all required capabilities (RE, Spec, Validation, Review, Runtime, Qualification). Physical worker deletion/merge deferred to protect packaging BC.

## Applied

- `docs/capabilities/` registry + per-capability READMEs
- `docs/architecture/SIMPLIFIED_ARCHITECTURE.md`
- `docs/architecture/REFACTORING_BOARD_REPORT.md` (full keep/merge/delete decisions)
- `@Run` → capability map in `runtime/commands/command-registry.json`
- Deleted duplicate `core/packages/configs/runtime/*.yaml` (pointer README remains)
- Removed accidental `Untitled/` stub
- Rewrote `AGENTS.md` capability-first

## Deferred (explicit)

Physical merge/delete of micro-workers in validate / review / qualify / runtime — requires execution adapters. See board report.

## Before vs After

| Metric | Before (0.11.0) | After (0.12.0) |
|--------|-----------------|----------------|
| User-facing units | 81 workers | **8 capabilities** (+1 optional scaffold) |
| `@Run full` mental steps | worker forest | **6 capabilities** |
| Registered workers (physical) | 81 | 81 (BC preserved) |
| Pipelines | 9 | 9 (scaffold marked optional) |
| Duplicate runtime YAML | 2 locations | **1 canonical** |
| Accidental `Untitled/` | present | **removed** |

## Board scores (subjective)

| Score | Before | After |
|-------|--------|-------|
| Architecture | 4/10 | **7/10** |
| Simplicity | 3/10 | **7/10** |
| Maintainability | 4/10 | **6/10** (docs); physical still heavy |
| Extensibility | 6/10 | **8/10** (capability extension point) |
| Production readiness | 5/10 | **6/10** (clearer UX; execution still packaging) |

## Estimated reductions (cognitive / future physical)

| Estimate | Value |
|----------|-------|
| Cognitive component reduction | ~90% (81 → 8) |
| Deferred physical worker removals | ~35–45 (validate/review/runtime/qualify micro-workers) |
| Token reduction for agents (entry path) | High — load capabilities first |
| Maintenance reduction (once physical merges land) | Medium–High |

## Deleted this release

- Untitled/ (accidental nested .git stub — not part of AIOS)
- core/packages/configs/runtime/.ai-os.yaml (duplicate of runtime/configs/)
- core/packages/configs/runtime/* duplicated YAML (replaced with pointer README)

## Compatibility

- All pipeline ids and worker ids unchanged
- Required capabilities preserved
- Framework Generator remains registered as optional `scaffold`

## Verification

```bash
npm run aios:capabilities:smoke
npm run aios:runtime-engine:smoke
npm run aios:qualification-framework:smoke
npm run aios:discovery:smoke
```
