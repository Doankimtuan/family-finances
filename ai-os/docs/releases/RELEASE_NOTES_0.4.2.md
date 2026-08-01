# AIOS Release Notes — 0.4.2

**Date:** 2026-08-01  
**Phase:** Product Reverse Engineering remediation (Sprint 4 FAIL → legalized pipeline)  
**Scope:** Product RE workers, I/O folders, schemas, core/packages/validators/reviewers, pipeline registration  
**Non-goals:** Feature Workers, worker invocation from Core, product redesign

## Summary

Sprint 4 Product RE is brought to the Discovery v0.4.1 bar: phase contracts legalize `core/packages/pipelines/product-re/`, ingest wave 0 fills consume folders, typed payload schemas replace the untyped entry bag, skills declare real consume inputs, and `artifacts/product-architecture/` replaces colliding `docs/architecture/` consume.

## Critical fixes (Review Board)

| ID | Fix |
|----|-----|
| C1 | Phase gate updated in `core/packages/contracts/worker-port.md`, `AGENTS.md`, `folder-structure.md`, `MIGRATIONS.md` for Product RE |
| C2 | Product architecture consume moved to `artifacts/product-architecture/`; AIOS `docs/architecture/` templates removed |
| C3 | Skill manifests, sample-input, and case-01 aligned with worker consumes |
| C4 | Typed schemas + `if/then` on `product-re-payload.schema.json`; per-type schema files |
| C5 | Ingest workers + soft discovery handoff; gap synthesizer |

## High fixes

- Worker-specific SKILL procedures; lock wording `task:{task_id}`
- Validator upgraded to schema-valid + type checks (v0.2.0)
- Generator ids retained for BC; titles/missions/role_alias use extractor language
- Narrowed downstream consumes; specialized I/O templates + domain fixtures
- Honest checklists; docs/pipeline primary outputs listed in extensions

## Compatibility

- Worker ids `requirement-generator` and `acceptance-criteria-generator` unchanged
- `product-re-payload.schema.json` remains the umbrella schema (now stricter + more types)
- Discovery pipeline and `npm run aios:discovery:smoke` unchanged in intent (allows coexisting product-re packages)

## Verification

```bash
npm run aios:discovery:smoke
npm run aios:product-re:smoke
```

Core still does **not** invoke workers.
