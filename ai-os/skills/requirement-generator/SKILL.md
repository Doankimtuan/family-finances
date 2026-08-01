---
name: requirement-generator
description: Extract requirement-spec SHALL/MUST statements (role_alias=requirement-extractor; id retained for BC).
---

# Requirement Extractor

> Worker id `requirement-generator` retained for backward compatibility. **Mission verb: extract.** Do not invent requirements.

## Consumes

`artifacts/product/`, `artifacts/workflow/`, `artifacts/business/`

## Produces

`artifacts/requirements/` → `requirement-spec`

## Ownership

- **Owns:** SHALL/MUST requirements extracted from validated packs
- **Does not** invent requirements or redesign behavior

## Procedure

1. Load product, workflow, and business packs only.
2. Extract requirements with `entry_kind=shall` and SHALL/MUST language.
3. Cite `source_paths`; write `requirement-spec` under `artifacts/requirements/`.
4. Stop for artifacts/validation/review.

## Heuristics

- Each requirement must be traceable to an observed capability/rule/step.
- Prefer one capability → one requirement.

## Done when

- ≥1 SHALL/MUST entry with sources
- No invented requirements

## Negative examples

- Do not write “The system SHALL add AI forecasting” unless sourced.

## Lock

Acquire `task:{task_id}` per `docs/architecture/CONCURRENCY.md` before mutating run-record state.
