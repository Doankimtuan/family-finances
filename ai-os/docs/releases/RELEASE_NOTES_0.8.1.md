# AIOS Release Notes — 0.8.1

**Date:** 2026-08-01  
**Phase:** Sprint 8 Review Engine Board HOLD remediation  
**Scope:** `core/packages/pipelines/review-engine/` and related core/packages/workers/skills/schemas/examples only

## Summary

Closes Product Review Board Critical **C1–C5** and High residuals after v0.8.0 registration.

| ID | Fix |
|----|-----|
| C1 | Per-reviewer consumes for Product RE / SA / Spec Eng / VE / registry packs |
| C2 | Entry_kind RACI; removed architecture-reviewer scalability/extensibility overlap |
| C3 | Rule catalogs, dedupe key, NO-GO rule, statement vs finding |
| C4 | Orchestrator dual emit documented + sample-secondary-payload (review-scores) |
| C5 | governance-decision folder_mirror partitions across governance/decisions/recommendations/improvements/governance |
| H1 | Skill manifest descriptions restored |
| H2 | Gold critical/high/NO-GO samples; 9 reviewer fixtures in governance/reviews/examples/ |
| H5 | Validator/reviewer **0.3.0**; hardened smoke |
| H7 | `pipeline/` alias; Validation Engine PASS handoff documented |

## Compatibility

- Pipeline id `review-engine` and 11 worker ids unchanged
- Soft `goal` input retained
- Other pipelines untouched aside from coexistence smoke whitelist

## Verification

```bash
npm run aios:review-engine:smoke
npm run aios:validation-engine:smoke
npm run aios:discovery:smoke
```

Reviews were **not** executed.
