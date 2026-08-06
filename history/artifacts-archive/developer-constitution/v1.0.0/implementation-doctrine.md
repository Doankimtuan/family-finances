---
document: Implementation Doctrine
developer_constitution: v1.0.0
status: OFFICIAL_IMPLEMENTATION_CONSTITUTION
run_id: run_developer_constitution_20260801T230000Z
created_at: 2026-08-01T16:38:51Z
board: Developer Constitution Board
frozen: true
product_sot: artifacts/product-definition/CURRENT
architecture_sot: artifacts/architecture-definition/CURRENT
technical_sot: artifacts/technical-specification/CURRENT
design_foundation_sot: artifacts/design-foundation/CURRENT
design_system_sot: artifacts/design-system/CURRENT
screen_blueprints_sot: artifacts/screen-blueprints/CURRENT
implementation_plan_sot: artifacts/implementation-plan/CURRENT
rewrite_readiness_sot: artifacts/rewrite-readiness/CURRENT
---

# Implementation Doctrine

## Purpose

Engineers implement frozen Sources of Truth. They do not invent product, architecture, or design.

## Mobile Native doctrine

1. Design and build for a phone first.
2. Desktop is **not** a separate application.
3. Desktop renders the mobile application inside a centered **AppViewport** with maximum width **440px**.
4. Do not create desktop layouts, sidebar navigation, or enterprise dashboards.
5. Overlays (sheets, dialogs) must stay within the viewport canvas.

## Component layering (do not skip)

```text
Primitive  (shared/ui)
    ↓
Pattern    (shared/patterns)
    ↓
Feature    (features/*)
    ↓
Page       (app/**)
```

- Pages compose Features.
- Features compose Patterns and call `modules/*/application` public APIs.
- Patterns compose Primitives.
- Do not skip layers (e.g. Page must not assemble raw HeroUI primitives when a Pattern exists).

## Dual ownership: modules vs features

| Layer | Owns |
|-------|------|
| `modules/*` | Bounded contexts: domain, application, infrastructure (Architecture SoT) |
| `features/*` | Feature UI composition only |
| `shared/ui` | Reusable primitives only |
| `app/**` | Routes, layouts, route-level data loading, Server Actions adapters |

## Async UX law

Every async user-facing operation **must** define:

- Loading
- Error
- Empty
- Retry
- Offline behavior

No silent failures. Money writes offline **fail closed** (BR-15 / REQ-018).

## SoT obedience

- Implement Screen Blueprints and Design System component IDs.
- Follow Implementation Plan stories/tasks for Sprint scope.
- Do not reopen Rewrite Readiness conditions by inventing alternate stacks.
