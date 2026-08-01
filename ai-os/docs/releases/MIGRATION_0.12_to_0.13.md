# Migration 0.12.0 → 0.13.0

**Date:** 2026-08-01  
**Type:** Structural (folder domains + reference rewrite)  
**Not included:** Physical micro-worker MERGE/DELETE (Phase 3B — deferred)

## Summary

Reorganized AIOS from ~50 mixed top-level folders into six domains while preserving all capability, worker, pipeline, and artifact-type **ids**.

## Target layout

```text
ai-os/
  core/              # TS engine + packages/
    packages/        # workers, validators, reviewers, pipelines, registry, …
  runtime/           # execution / @Run
  skills/            # skill packages (unchanged top-level)
  artifacts/         # all produce packs
  governance/        # qualification, policies, reviews, decisions, quality
  docs/              # architecture, capabilities, releases, guides
  workspace/         # local scratch
  VERSION, AGENTS.md
```

## Path mapping

| Old | New |
|-----|-----|
| `workers/` | `core/packages/workers/` |
| `validators/` | `core/packages/validators/` |
| `reviewers/` | `core/packages/reviewers/` |
| `pipelines/` | `core/packages/pipelines/` |
| `registry/` | `core/packages/registry/` |
| `contracts/` | `core/packages/contracts/` |
| `schemas/` (JSON) | `core/packages/schemas/` |
| `templates/` | `core/packages/templates/` |
| `roles/` | `core/packages/roles/` |
| `configs/` (non-runtime) | `core/packages/configs/` |
| `scripts/` | `core/packages/scripts/` |
| `framework-generator/` | `core/packages/scaffold/` |
| produce packs (`features/`, `validation/`, …) | `artifacts/<pack>/` |
| `qualification/`, `policies/`, `reviews/`, … | `governance/<pack>/` |
| `architecture/` | `docs/architecture/` |
| `capabilities/` | `docs/capabilities/` |
| `RELEASE_NOTES_*.md` | `docs/releases/` |

**Important:** Zod schemas remain at `core/schemas/`. JSON Schema files are at `core/packages/schemas/`.

**Product architecture:** physical pack is `artifacts/product-architecture/` (never AIOS `docs/architecture/`).

## Compatibility

| Surface | Preserved? |
|---------|------------|
| Worker ids | Yes |
| Pipeline ids | Yes |
| Artifact type ids | Yes |
| Capability ids | Yes |
| `@Run` commands | Yes |
| Runtime configs path | `runtime/configs/.ai-os.yaml` |

## Verification

```bash
npm run aios:capabilities:smoke
npm run aios:discovery:smoke
npm run aios:product-re:smoke
npm run aios:solution-architecture:smoke
npm run aios:specification-engineering:smoke
npm run aios:validation-engine:smoke
npm run aios:review-engine:smoke
npm run aios:framework-generator:smoke
npm run aios:qualification-framework:smoke
npm run aios:runtime-engine:smoke
```

## Phase 3B (deferred)

Physical GENERALIZE/MERGE of micro-validators, micro-reviewers, and runtime/qualification subsystems remains deferred until Runtime expands `capability → workers[]` without user-facing worker ids.
