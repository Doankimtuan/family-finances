---
name: product-knowledge-ingest
description: Extract glossary/entity/fact knowledge-notes from doc-source and discovery-report soft inputs.
---

# Product Knowledge Ingest

> Discovery only. Extract what exists. Do not redesign. Do not invent features.

## Consumes

`doc-source` (docs), `discovery-report` (soft) → produces `knowledge/`

## Produces

`knowledge/` → artifact type `knowledge-notes`

## Ownership

- **Owns:** glossary terms, entity definitions, domain facts
- **Excludes:** business rules (→ business-rules-extractor); pillars/boundaries (→ product-architecture-observer); UI routes/actions (→ feature-surface-inventory)
- **Sources:** docs/DOMAIN_MODEL.md glossary/entity sections; published discovery-report artifacts

## Procedure

1. Soft-read `doc-source` and any published `discovery-report` inputs. Never treat AIOS `architecture/` as product input.
2. Extract only glossary/entity/fact statements already present in sources.
3. Set `entry_kind` ∈ {glossary, entity, fact}; require `source_paths` on every entry.
4. Write `knowledge-notes` staging artifact; optionally mirror under `knowledge/`.
5. Stop for validation/review.

## Heuristics

- Prefer explicit definitions (“X is …”) over inferred wishes.
- If a statement is a rule/invariant, leave it for `business-rules-extractor`.

## Done when

- ≥1 entry with `entry_kind` + `source_paths`
- No invented capabilities; redesign flag not set

## Negative examples

- Do not invent a “smart allocation AI” capability.
- Do not copy AIOS TRACEABILITY.md into knowledge notes.

## Lock

Acquire `task:{task_id}` per `architecture/CONCURRENCY.md` before mutating run-record state.
