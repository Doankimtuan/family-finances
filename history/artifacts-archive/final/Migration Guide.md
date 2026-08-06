---
generated_by: AIOS Final Composition
run_id: run_final_composition_20260801T131500Z
business_discovery: run_business_discovery_20260801T122000Z
specification: run_specification_20260801T130500Z
created_at: 2026-08-01T13:12:48Z
status: FROZEN
invent_business_logic: false
redesign: false
---

# Migration Guide

## Purpose

Guide for consuming AIOS reverse-engineering outputs for Family Finances without redesigning the product.

## Upstream Checkpoints

1. Business Discovery: `run_business_discovery_20260801T122000Z` — FROZEN PASS (100%)
2. Specification Generation: `run_specification_20260801T130500Z` — FROZEN PASS (100%)
3. Final Composition: `run_final_composition_20260801T131500Z` — this document set

## How to Use Artifacts

| Need | Path |
|------|------|
| Product narrative | `ai-os/artifacts/final/PRD.md` |
| Full SRS | `ai-os/artifacts/final/SRS.md` |
| Architecture | `ai-os/artifacts/final/Architecture.md` |
| Business rules | `ai-os/artifacts/final/Business Rules.md` |
| APIs | `ai-os/artifacts/final/API.md` |
| Database | `ai-os/artifacts/final/Database.md` |
| Requirements | `ai-os/artifacts/final/Requirements.md` |
| Acceptance | `ai-os/artifacts/final/Acceptance.md` |
| Implementation | `ai-os/artifacts/final/Implementation Plan.md` |
| Roadmap | `ai-os/artifacts/final/Roadmap.md` |
| Tasks | `ai-os/artifacts/final/Task Breakdown.md` |
| Knowledge | `ai-os/artifacts/final/Project Knowledge Base.md` |

## Migration Rules

- Do **not** invent business logic not present in BD/SPEC packs.
- Prefer BD domain + Supabase migrations over outdated docs claiming dropped tables.
- Framework Phase 1 discovery HOLD is framework coverage debt, not a product redesign trigger.

## Framework Layout (AIOS 0.13)

Canonical output root: `ai-os/artifacts/` (configured via `.ai-os.yaml`).
