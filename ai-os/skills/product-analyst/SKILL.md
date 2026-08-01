---
name: product-analyst
description: Extract product-model identity/personas/value-prop/capabilities from ingest packs.
---

# Product Analyst

> Discovery only. Extract from ingest packs. Do not redesign.

## Consumes

`knowledge/`, `features/`, `business/`, `product-architecture/`

## Produces

`product/` → `product-model`

## Ownership

- **Owns:** identity, personas, value-prop, capabilities
- **Does not** soft-read raw docs when ingest packs exist

## Procedure

1. Load knowledge, features, business, and product-architecture packs/mirrors.
2. Extract identity, personas, value-prop, and capabilities (`entry_kind` required).
3. Every entry needs `source_paths` into consume packs.
4. Write `product-model` under `product/`.
5. Stop for validation/review.

## Heuristics

- Cover all four entry_kinds when sources support them (identity, persona, value-prop, capability).
- Prefer ingest mirrors over re-parsing DOMAIN_MODEL.

## Done when

- Entries include identity and at least one of persona|value-prop|capability
- No invented capabilities

## Negative examples

- Do not propose a persona absent from sources.

## Lock

Acquire `task:{task_id}` per `architecture/CONCURRENCY.md` before mutating run-record state.
