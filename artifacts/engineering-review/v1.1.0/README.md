# Engineering Review — CURRENT

**Status:** `ENGINEERING_PATTERN_V1.1` (frozen)
**Board:** Engineering Excellence (v1.1.0 refresh: Engineering Standards Board)
**Run:** `run_engineering_review_20260802T154500Z` (supersedes `run_engineering_review_20260802T011833Z`)

## v1.1.0 change summary

Refreshed `duplicated-patterns.md` and `abstraction-opportunities.md` with findings from the Coding Standards repo audit (Money capture/edit form twin, repeated CTA/segmented-control class blobs, domain literal duplication across Zod + UI, repeated signed-amount formatting). All reuse decisions in this pack must additionally obey [Coding Standards](../../coding-standards/CURRENT/README.md) (no duplicated Tailwind blobs, no duplicated interfaces/utilities, constants homes) when applied. No component was created or renamed in this refresh — findings only; extraction remains a future Story per the existing Rule-of-Three discipline.

## Documents

1. [duplicated-patterns.md](./duplicated-patterns.md)
2. [abstraction-opportunities.md](./abstraction-opportunities.md)
3. [reusable-components.md](./reusable-components.md)
4. [reusable-hooks.md](./reusable-hooks.md)
5. [reusable-form-patterns.md](./reusable-form-patterns.md)
6. [reusable-layout-patterns.md](./reusable-layout-patterns.md)
7. [refactor-plan.md](./refactor-plan.md)
8. [engineering-score.md](./engineering-score.md)
9. [implementation-summary.md](./implementation-summary.md) (after apply)
10. [FREEZE.json](./FREEZE.json)
11. Companion pack: [Coding Standards](../../coding-standards/CURRENT/README.md)
