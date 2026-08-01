# AIOS Release Notes — 0.13.0

**Date:** 2026-08-01  
**Phase:** Structural migration Phase 2–5 (folder domains)

## Summary

Reorganized AIOS from ~50 mixed top-level folders into domain roots while preserving all worker/pipeline ids and capabilities.

## Layout

| Domain | Path |
|--------|------|
| Core packages | `core/packages/` |
| Runtime | `runtime/` |
| Skills | `skills/` |
| Artifacts | `artifacts/` |
| Governance | `governance/` |
| Docs | `docs/` |
| Workspace | `workspace/` |

## Compatibility

- Worker ids, pipeline ids, artifact types unchanged
- JSON schemas live in `core/packages/schemas/` (Zod remains `core/schemas/`)
- Capability model unchanged (paths under `docs/capabilities/`)

## Verification

```bash
npm run aios:capabilities:smoke
npm run aios:discovery:smoke
npm run aios:runtime-engine:smoke
npm run aios:qualification-framework:smoke
# …full battery in MIGRATION_0.12_to_0.13.md
```
