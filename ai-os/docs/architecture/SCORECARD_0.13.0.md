# Architecture Scorecard — v0.13.0

**Date:** 2026-08-01  
**Focus:** Structural migration outcomes (Phases 2–5)

| Criterion | Target | Result |
|-----------|--------|--------|
| Top-level folders | ~50 → ~8 | **Pass** — `core`, `runtime`, `skills`, `artifacts`, `governance`, `docs`, `workspace` (+ thin `VERSION`/`AGENTS.md`/`README.md`) |
| Produce discoverability | Single `artifacts/` | **Pass** |
| Governance discoverability | Single `governance/` | **Pass** |
| Docs consolidation | Single `docs/` | **Pass** |
| Framework packages | Under `core/packages/` | **Pass** |
| Runtime focus | `runtime/` only | **Pass** |
| Capabilities preserved | 8 + scaffold | **Pass** — smokes green |
| Worker/pipeline ids | Unchanged | **Pass** |
| Micro-worker count reduction | Deferred 3B | **N/A (deferred)** |
| JSON vs Zod schemas | Documented split | **Pass** |

## Smoke battery

All registration smokes required green at 0.13.0 (workers not executed).

## Residual risks

| Risk | Status |
|------|--------|
| Hard-coded path misses | Mitigated via KnowledgeBase asserts + smoke battery |
| Phase 3B physical merges | Explicitly deferred |
| `skills/example-skill` registry orphan | Pre-existing reserved entry; not blocking |
