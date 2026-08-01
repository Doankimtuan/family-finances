---
name: specification-generator
description: Transform validated project knowledge into implementation-ready software specifications with full traceability. Never invent business logic or redesign. Mark missing info as UNKNOWN.
---

# Specification Generator

> Never invent business logic. Never redesign. Never change requirements. **Restate Product RE with pointers — do not rewrite.** Mark gaps `UNKNOWN: …`. Package readiness for execute phase.

## Consumes

`artifacts/knowledge/`, `artifacts/repository/` (soft human/pre-step), `artifacts/features/`, `artifacts/business/`, `artifacts/product-architecture/` (logical `docs/architecture/`), `artifacts/architecture-v2/`, `governance/decision-records/`, `artifacts/tech-stack/`, `artifacts/migration/`, `artifacts/folder-structure/`, `artifacts/requirements/`, `governance/quality/`, `artifacts/redesign/`, `artifacts/workflow/`, `artifacts/acceptance/`

## Produces

`artifacts/specifications/` → `project-specification`

## Ownership

- **Owns:** all 13 specification section kinds (+ conflict/gap)
- **Does not:** invent APIs/tables/rules; redesign architecture; overwrite Product RE / SA packs; author `artifacts/repository/` (human/pre-step)
- **Must:** purpose/scope/actors/pre/post/workflow/business_rules/validation_rules/error_handling/edge_cases/dependencies/acceptance_criteria on every non-gap section; full traceability matrix; `UNKNOWN:` when missing

## Procedure

1. Load declared consume packs (soft packs may be absent → UNKNOWN).
2. Emit one entry per required section kind (or explicit `gap` naming the missing kind).
3. Restate artifacts/requirements/acceptance/business with pointers — do not duplicate sprawl.
4. Cross-reference architecture-v2 + decision-records + artifacts/tech-stack/migration/folder-structure for docs/architecture/module/deployment/coding-standards.
5. Write `project-specification` under `artifacts/specifications/`. Stop for artifacts/validation/review.

## Heuristics

- Prefer pointing at `artifacts/requirements/` / `artifacts/acceptance/` over copying prose.
- If SA pack missing, emit section with `UNKNOWN:` body fields rather than inventing.
- `conflict` when upstream packs disagree; never pick a winner by inventing.

## Required sections

project-overview, functional, non-functional, architecture, module, feature, api, database, ui, security, deployment, coding-standards, testing-strategy

## Done when

- All 13 section kinds present **or** explicit `gap` entries for missing kinds
- Every non-gap entry has full body fields + full traceability matrix (UNKNOWN allowed)
- No invented business logic; `extensions.restate_not_rewrite=true` recommended

## Negative examples

- Do not invent API fields absent from artifacts/features/workflow.
- Do not treat AIOS `docs/architecture/` as product architecture.
- Do not rewrite Product RE requirements as if Spec Eng owns them.

## Lock

Acquire `task:{task_id}` per `docs/architecture/CONCURRENCY.md` before mutating run-record state.
