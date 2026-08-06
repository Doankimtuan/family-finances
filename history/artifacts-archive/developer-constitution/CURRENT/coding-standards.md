---
document: Coding Standards
developer_constitution: v1.1.0
status: OFFICIAL_IMPLEMENTATION_CONSTITUTION
run_id: run_developer_constitution_20260802T151500Z
created_at: 2026-08-02T15:15:00Z
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

# Coding Standards

**Detail law:** this document covers Next.js/React/TypeScript/Forms/State/Errors framework-level rules. For constants, magic strings, Tailwind class discipline, `enum` vs `as const`, naming, folder splitting, and React anti-pattern detail, see the companion [Coding Standards pack](../../coding-standards/CURRENT/README.md) — it does not override anything below, it adds mechanical detail this document leaves unspecified.

## Next.js

1. Default to **Server Components**.
2. Use `"use client"` only when interactivity, browser APIs, or client libraries require it.
3. Prefer **Server Actions** for mutations when appropriate; keep validation and authorization server-side.
4. Avoid unnecessary client state.
5. Do not fetch data inside deeply nested components.
6. Keep data loading near **route boundaries** (`page.tsx`, layouts, loaders).
7. Use Suspense boundaries strategically for non-blocking shells.

## React

1. Functional components only. No class components.
2. No prop drilling across multiple layers — lift state into providers or compose via context interfaces.
3. Favor composition over inheritance.
4. Single responsibility per component.
5. Do not define components inside components.
6. Prefer composing children over render-prop sprawl for static structure.

## TypeScript

1. `strict` mode required.
2. No `any`.
3. No `unknown` casts without a justified, local narrowing.
4. Prefer explicit types on public APIs, DTOs, and domain models.
5. Use discriminated unions for state/result types.
6. Domain models in `modules/*/domain` must be strongly typed.
7. See [Coding Standards / typescript-policy.md](../../coding-standards/CURRENT/typescript-policy.md) and [enums-policy.md](../../coding-standards/CURRENT/enums-policy.md) for inference, `Readonly`, utility-type, and `enum`-vs-`as const` detail.

## Forms

1. All forms use **React Hook Form** + **Zod**.
2. Validation schemas are the single source of validation truth.
3. Never duplicate validation logic in UI and server — share Zod schemas.
4. Server must re-validate every input.

## State management

1. **TanStack Query** for server state (fetch, cache, mutate, invalidate).
2. **Zustand** for UI state only (drawers open, wizard step, ephemeral flags).
3. Do not duplicate server data inside Zustand.
4. Do not introduce Redux or alternate global stores.

## Errors and observability

1. Map errors to user-safe messages; log structured details server-side.
2. Propagate `request_id` where Architecture Observability requires it.
3. Never swallow errors in empty `catch` blocks.
