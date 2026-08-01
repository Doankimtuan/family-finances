---
name: business-rules-extractor
description: Extract observed business rules from doc-source and discovery-report soft inputs.
---

# Business Rules Extractor

> Discovery only. Extract rules as-is. Do not invent policy.

## Consumes

`doc-source`, `discovery-report` → produces `business/`

## Produces

`business/` → `business-rules`

## Ownership

- **Owns:** observed rules, invariants, policies
- **Excludes:** glossary; UI inventory; architecture pillars
- **Sources:** DOMAIN_MODEL consistency/allocation/jar logic; discovery-report

## Procedure

1. Soft-read `doc-source` and `discovery-report`.
2. Extract only rules/invariants present in sources.
3. Set `entry_kind` ∈ {rule, invariant, policy}; cite `source_paths`.
4. Write `business-rules`; optionally mirror under `business/`.
5. Stop for validation/review.

## Heuristics

- Prefer observed MUST/SHOULD language over new policy design.
- Do not “improve” the rule — extract as-is.

## Done when

- ≥1 rule/invariant/policy with sources
- No invented policies

## Negative examples

- Do not invent auto-resolve-all-queue-items as a new rule.

## Lock

Acquire `task:{task_id}` per `architecture/CONCURRENCY.md` before mutating run-record state.
