---
name: discover-registry-audit
description: Reserved discovery skill for worker discover-registry-audit. Emits discovery-report artifacts only.
---

# Discover Registry Audit

> **Status:** `reserved` · Discovery pipeline only · No Feature Worker / repo-write work.

## Roles

`executor` only.

## Inputs

| Name | Artifact type | Required |
|------|---------------|----------|
| goal | goal | yes |

## Outputs

| Name | Artifact type | Primary |
|------|---------------|---------|
| primary | discovery-report | yes |

## Procedure

1. Load declared inputs only (goal + any prior discovery-report refs).
2. Inventory the scoped surface for this skill (see worker `discover-registry-audit` README).
3. Write staging `discovery-report` (`draft`) validating `schemas/discovery-report.schema.json`.
4. Finalize payload + `meta.json` (`ready`).
5. Stop — validators/reviewers run outside this skill.

## Reserved policy

This skill may be claimed by Discovery Workers when:
- the skill package exists on disk (this directory), and
- the plan sets `acceptReservedSkills: true`, or the orchestration gate profile is advisory with an explicit reserved-skill exception recorded on the run.

Missing package path ⇒ fail in `preparing` (never silent skip).

## Done when

- [ ] Primary output is `discovery-report` with `report_kind` matching this skill
- [ ] Side effects ⊆ `runtime-write`
- [ ] Trace filled per TRACEABILITY.md
