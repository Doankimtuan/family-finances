# AIOS Release Notes — 0.6.1

**Date:** 2026-08-01  
**Phase:** Sprint 6 Specification Engineering Board HOLD remediation  
**Scope:** `pipelines/specification-engineering/` and its workers/skills/schemas/examples only  
**Non-goals:** Feature Workers, worker invocation, live Family Finances specs, redesign of Discovery / Product RE / Solution Architecture

## Summary

Closes Product Review Board Critical **C1–C4** and High residuals **H1–H8** that blocked Specification Engineering package readiness after v0.6.0 registration.

## Critical / High fixes

| ID | Fix |
|----|-----|
| C1 | Schema requires purpose/scope/actors/pre/post/workflow/business_rules/validation_rules/error_handling/edge_cases/dependencies/acceptance_criteria on non-gap spec entries (`UNKNOWN:` allowed) |
| C2 | Validator `spec-section-coverage` + smoke assert all 13 section kinds (or explicit gaps); samples regenerated |
| C3 | Full traceability matrix required on non-gap spec entries; validator `spec-traceability-matrix` |
| C4 / H8 | Declared consumes: `decision-records/`, `tech-stack/`, `migration/`, `folder-structure/` |
| H1 | [RACI.md](pipelines/specification-engineering/RACI.md) for milestone / depends_on / delivery-order / build-order |
| H2 | `repository/` ownership = human/pre-step soft input |
| H3 | Coverage via mandatory sections + `gap` entries (no new worker) |
| H4 | Enriched `SKILL.md` (Ownership, Heuristics, Done when, negatives, restate-not-rewrite) |
| H5 | Hardened smoke (skill input types, section/body/matrix, path bans) |
| H6 | Rubric on disk: `reviewers/specification-engineering-coverage-review/rubric/` |
| H7 | Produce-folder `examples/` + specialized TEMPLATEs |

## Medium / clarity

- Pipeline consumes list no longer dual-lists bare `architecture`
- `tasks/` folder documented as engineering-task-graph mirrors (≠ Core `task`)
- Restate-not-rewrite rule in skills
- Mermaid example in implementation sample `graph-edge`
- Typed `repository-notes.schema.json`
- Validator **0.2.0** · Reviewer **0.2.0** · Pipeline **0.1.1** · Workers/skills **0.1.1**

## Compatibility

- Pipeline id `specification-engineering` unchanged
- Four worker ids unchanged
- Discovery / Product RE / Solution Architecture untouched aside from coexistence
- Soft `goal` orchestration input retained (BC with other discovery-class skills)

## Verification

```bash
npm run aios:specification-engineering:smoke
npm run aios:discovery:smoke
npm run aios:product-re:smoke
npm run aios:solution-architecture:smoke
```

Core still does **not** invoke workers. No live project specifications were generated.
