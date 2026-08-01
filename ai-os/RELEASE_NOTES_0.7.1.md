# AIOS Release Notes — 0.7.1

**Date:** 2026-08-01  
**Phase:** Sprint 7 Validation Engine Board HOLD remediation  
**Scope:** `pipelines/validation-engine/` and its workers/skills/schemas/examples only  
**Non-goals:** Execute validations, Feature Workers, redesign Discovery / Product RE / Solution Architecture / Spec Eng, invent missing info, mutate sources

## Summary

Closes Product Review Board Critical **C1–C5** and High residuals that blocked Validation Engine package readiness after v0.7.0 registration.

## Critical / High fixes

| ID | Fix |
|----|-----|
| C1 | Traceability / completeness / consistency (+ registry) soft-consume Product RE / SA / Spec Eng packs |
| C2 | Findings partitioned under `validation/<worker_id>/` with required `folder_mirror`; orchestrator merge contract |
| C3 | Worker-specific `SKILL.md` with rule catalogs, scoring weights, PASS/FAIL, Done-when |
| C4 | `quality-scores` requires all 9 dimensions + `score_value`; smoke asserts coverage |
| C5 | Gate packages emit `gate-validation-report`; worker reporter keeps `validation-report` |
| H1 | [RACI.md](pipelines/validation-engine/RACI.md) for overlapping validators |
| H2 | Order owned by `pipeline.waves`; orchestrator records plan/order + merges |
| — | Gold samples: circular + orphan fails; reporter summary/critical/high/medium/low/recommended-fix/decision |
| — | Specialized TEMPLATEs; hardened smoke |

## Medium / clarity

- `result` authoritative (no entry_kind pass/fail)
- Distinct worker `*-validator` vs gate `validators/*-schema-check`
- `extensions.validation_scope` for partial/incremental
- Validator **0.2.0** · Reviewer **0.2.0** · Pipeline **0.1.1** · Workers/skills **0.1.1**

## Compatibility

- Pipeline id `validation-engine` unchanged
- Ten worker ids unchanged
- Soft `goal` orchestration input retained
- SA `quality/TEMPLATE.md` untouched; scorecards remain under `quality/validation-scorecard/`
- Discovery / Product RE / Solution Architecture / Spec Eng untouched aside from coexistence

## Verification

```bash
npm run aios:validation-engine:smoke
npm run aios:discovery:smoke
npm run aios:specification-engineering:smoke
```

Core still does **not** invoke workers. Validations were **not** executed.
