---
name: acceptance-criteria-generator
description: Reserved product reverse-engineering skill for acceptance-criteria-generator (alias: acceptance-criteria-extractor).
---

# Acceptance Criteria Extractor

> Discovery only. Extract what exists. Do not redesign. Do not implement features.

## Consumes

`requirements/`, `product/`, `workflow/`

## Produces

`acceptance/` → artifact type `acceptance-criteria`

## Procedure

1. Load requirements/, product/, and workflow/.
2. For each requirement, extract observable Given/When/Then criteria with requirement_id.
3. Write acceptance-criteria under acceptance/. Worker id is historical; behave as extractor.
4. Stop for validation/review. Do not invent features.

## Lock

Acquire `task:{task_id}` per `architecture/CONCURRENCY.md` before mutating run-record state.
