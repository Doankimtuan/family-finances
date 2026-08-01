# AIOS Release Notes — 0.9.1

**Date:** 2026-08-01  
**Phase:** Sprint 9 Framework Generator Board HOLD remediation  
**Scope:** `core/packages/pipelines/framework-generator/` and related core/packages/workers/skills/schemas/examples only

## Summary

Closes Product Review Board Critical **C1–C4** and High **H1–H6** after v0.9.0 registration.

| ID | Fix |
|----|-----|
| C1 | Recomputed **9 waves** — topologically valid partition of dependency graph |
| C2 | Added `generation-orchestrator` + `generation-reporter` with status/report/gate samples |
| C3 | Complete **RACI.md** for all entry kinds + overlap resolution table |
| C4 | Fixed corrupted `{g['title']}` in all sample payloads |
| H1 | Domain-specific **SKILL.md** per generator (procedure, heuristics, RACI) |
| H2 | Overlap documented; `worker-registration` owned by bootstrap only |
| H3 | Samples for `framework-generation-status`, `gate-framework-generation-report` |
| H4 | Validator **0.2.0** — RACI, generation-spec, mode coverage, gate type checks |
| H5 | Reviewer rubric **0.2.0** — criteria, pass threshold, veto conditions |
| H6 | Real testcase fixtures with input/expect blocks |
| M1–M7 | Typed `output_plan`, schema wrappers, shared capability template, `core/packages/configs/examples/`, partition examples |

## Workers added

| Worker | Output |
|--------|--------|
| `generation-orchestrator` | `framework-generation-status` |
| `generation-reporter` | `framework-generation-report`, `gate-framework-generation-report` |

## Compatibility

- Pipeline id `framework-generator` unchanged
- Original 10 generator worker ids unchanged
- Prior pipelines untouched

## Verification

```bash
npm run aios:framework-generator:smoke
npm run aios:validation-engine:smoke
npm run aios:review-engine:smoke
npm run aios:discovery:smoke
```

Generation was **not** executed.
