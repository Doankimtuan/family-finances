# AIOS Release Notes — 0.5.1

**Date:** 2026-08-01  
**Phase:** Sprint 4 Product RE Board HOLD remediation  
**Scope:** `core/packages/pipelines/product-re/` only (Solution Architecture unchanged)  
**Non-goals:** Feature Workers, worker invocation, business-rule changes, unrelated module redesign

## Summary

Closes Product Review Board Critical **C3-R** and High residuals **H1–H4**, plus Medium items M1–M8 that blocked Product RE activation readiness after the registration-recovery PASS.

## Critical / High fixes

| ID | Fix |
|----|-----|
| C3-R | Soft inputs use `doc-source`, `app-surface`, `discovery-report` — never `goal` |
| H1-R | Each Product RE `SKILL.md` rewritten with ownership, heuristics, done-when, negatives |
| H2-R | Smoke asserts non-goal `artifact_type` and soft/folder type maps |
| H3-R | Keep generator worker ids (BC); document `mission_verb=extract` |
| H4-R | Wave-0 exclusive ownership / exclusion rules in skills |

## Medium fixes

- `artifacts/gaps/` working folder + gap worker `produces: ["gaps"]`
- Produce-folder `examples/` for artifacts/product/workflow/requirements/acceptance/gaps
- Specialized artifacts/knowledge/features/business `template.schema.json`
- `soft_discovery_handoff` only on ingest workers
- Hard graph edges: workflow←artifacts/features/architecture ingest; gap←all ingest+transforms (21 edges)
- Ingest `entry_kind` enums + validator `ingest-entry-kind-known`
- product-analyst sample includes `value-prop`
- Documented folder-template vs runtime `entries[]` mirror rule

## Compatibility

- Worker ids `requirement-generator` / `acceptance-criteria-generator` unchanged
- Product RE pipeline id unchanged (`product-re` → 0.2.1)
- Discovery + Solution Architecture pipelines untouched

## Verification

```bash
npm run aios:product-re:smoke
npm run aios:discovery:smoke
npm run aios:solution-architecture:smoke
```

Core still does **not** invoke workers.
