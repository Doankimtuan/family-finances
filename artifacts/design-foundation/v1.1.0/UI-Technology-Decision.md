---
document: UI Technology Decision
design_foundation: v1.1.0
status: OFFICIAL_DESIGN_SOURCE_OF_TRUTH
run_id: run_mobile_design_system_20260801T180000Z
created_at: 2026-08-01T16:01:24Z
board: Mobile Experience & Design System Board
product_sot: artifacts/product-definition/CURRENT
architecture_sot: artifacts/architecture-definition/CURRENT
technical_sot: artifacts/technical-specification/CURRENT
inherits: v1.0.0
supersedes_clauses: desktop-nav-layout-ui-kit
frozen: true
---
# UI Technology Decision

## Locked stack

| Layer | Decision |
|-------|----------|
| Framework | Next.js 16 App Router + TypeScript |
| Styling | Tailwind CSS v4 |
| Component foundation | HeroUI v3 (`@heroui/react` + `@heroui/styles`) |
| Accessibility | React Aria (as shipped with HeroUI / RAC) |
| Variants | `tailwind-variants` |
| Icons | `@phosphor-icons/react` |
| Animation | `motion` (`motion/react`) |
| Forms | React Hook Form |
| Validation | Zod |
| Ephemeral UI state | Zustand |
| Server state | TanStack Query |
| Charts | Recharts |
| Dates | date-fns |
| Theme | `next-themes` |
| Backend | Supabase Auth + PostgreSQL |

## Satisfies Architecture

Architecture Decision “Next + Tailwind + existing UI kit” is fulfilled by locking **HeroUI v3** at Design SoT. Domain module map unchanged.

## Forbidden

| Reject | Why |
|--------|-----|
| shadcn / Radix Themes as second system | Kit mixing |
| MUI / Ant / Bootstrap / Fluent | Enterprise look; conflict |
| lucide-react as default | Icon mixing (Phosphor locked) |
| framer-motion package name for new code | Prefer `motion/react` |
| Dual bun/npm for UI | npm lockfile SoT (Architecture) |

## Never introduce another UI library. Never mix component systems. Never mix icon systems.
