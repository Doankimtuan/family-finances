---
name: acceptance-criteria-generator
description: Extract acceptance-criteria GWT linked to requirements (role_alias=acceptance-criteria-extractor; id retained for BC).
---

# Acceptance Criteria Extractor

> Worker id `acceptance-criteria-generator` retained for backward compatibility. **Mission verb: extract.** Do not invent features.

## Consumes

`artifacts/requirements/`, `artifacts/product/`, `artifacts/workflow/`

## Produces

`artifacts/acceptance/` → `acceptance-criteria`

## Ownership

- **Owns:** Given/When/Then criteria linked via `requirement_id`

## Procedure

1. Load requirements plus product and workflow context.
2. Extract observable GWT criteria (`entry_kind` ∈ given|when|then|gwt).
3. Require `requirement_id`; cite `source_paths`; write under `artifacts/acceptance/`.
4. Stop for artifacts/validation/review.

## Heuristics

- Criteria must be falsifiable from current behavior.
- Do not invent features to make criteria pass.

## Done when

- ≥1 criterion with requirement_id + sources
- No invented features

## Negative examples

- Do not invent “Then an email is sent” if sources never mention email.

## Lock

Acquire `task:{task_id}` per `docs/architecture/CONCURRENCY.md` before mutating run-record state.
