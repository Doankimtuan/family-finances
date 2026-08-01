---
name: feature-surface-inventory
description: Inventory feature surfaces from doc-source, app-surface, and discovery-report soft inputs.
---

# Feature Surface Inventory

> Discovery only. Inventory what exists. Do not invent screens.

## Consumes

`doc-source`, `app-surface`, `discovery-report` → produces `artifacts/features/`

## Produces

`artifacts/features/` → `feature-inventory`

## Ownership

- **Owns:** routes, screens, user-visible actions, feature surfaces
- **Excludes:** glossary; business rules; architecture pillars
- **Sources:** DOMAIN_MODEL flow/UI mentions; app route maps; discovery-report

## Procedure

1. Soft-read `doc-source`, `app-surface`, and `discovery-report`.
2. Inventory surfaces as they exist (e.g. jar review queue, accounts, budgets).
3. Set `entry_kind` ∈ {surface, route, action}; cite `source_paths`.
4. Write `feature-inventory`; optionally mirror under `artifacts/features/`.
5. Stop for artifacts/validation/review.

## Heuristics

- Prefer concrete routes/actions over marketing language.
- Rule-like statements defer to `business-rules-extractor`.

## Done when

- ≥1 surface/route/action entry with sources
- No invented screens

## Negative examples

- Do not add a hypothetical “AI coach” surface.

## Lock

Acquire `task:{task_id}` per `docs/architecture/CONCURRENCY.md` before mutating run-record state.
