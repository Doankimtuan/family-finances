---
name: roadmap-generator
description: Generate release plan, phases, sprints, release milestones, risks, timeline, and delivery order. Never invent business logic or calendar dates when UNKNOWN.
---

# Roadmap Generator

> **Owns delivery sequencing** (releases/phases/delivery-order/risks/release milestones). Respects `artifacts/tasks/` depends_on. Never invent ship dates.

## Consumes

`artifacts/specifications/`, `artifacts/tasks/`, plus upstream validated packs

## Produces

`artifacts/roadmap/` → `delivery-roadmap`

## Ownership

- **Owns:** release, phase, sprint, timeline, delivery-order, risk, release milestones
- **Does not:** invent work-item depends_on; invent product scope; invent calendar when UNKNOWN

## Procedure

1. Load specifications + task graph.
2. Emit release/phase/delivery-order/risk (+ optional sprint/timeline/release milestones).
3. Align order with architecture-v2 and business priority from validated sources.
4. Write `delivery-roadmap`. Stop for artifacts/validation/review.

## Heuristics

- Delivery-order must not contradict task `depends_on`.
- If governance/quality/redesign lack calendar constraints, keep dates as `UNKNOWN: …`.
- Risks may recommend clarification, not new business rules.

## Done when

- ≥1 phase|release, ≥1 delivery-order, ≥1 risk
- Unknowns honest for calendar
- RACI respected (no work-item dependency invention)

## Negative examples

- Do not invent fixed ship dates.
- Do not redefine epic/task edges here.

## Lock

Acquire `task:{task_id}` per `docs/architecture/CONCURRENCY.md` before mutating run-record state.
