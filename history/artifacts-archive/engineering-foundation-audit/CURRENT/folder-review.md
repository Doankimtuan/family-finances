# Folder Architecture Review — Engineering Foundation Audit

**Board:** Engineering Foundation Audit Board  
**Date:** 2026-08-03  
**Status:** APPROVED & FROZEN  
**Target Specification Version:** Specification v2.1  

---

## 1. Folder Structure Overview & Evaluation

The repository utilizes a hybrid Next.js App Router and Domain-Driven Design (DDD) modular folder architecture.

```
family-finances/
├── app/                  # Next.js App Router (Locale routing, pages, layouts)
├── modules/              # DDD Bounded Contexts (ledger, plan, inbox, health, etc.)
│   ├── <bounded-context>/
│   │   ├── application/  # App Services, DTOs, Commands, Queries, Constants
│   │   ├── domain/       # Core Domain Entities & Business Invariants
│   │   └── infrastructure/# Database Repositories, External Adapters
├── shared/               # Cross-cutting UI, Forms, Utils, Hooks, Theme, Patterns
│   ├── ui/               # Atomic Design System primitives
│   ├── form/             # React Hook Form wrappers & Zod integration
│   ├── utils/            # Shared helper functions & formatters
│   ├── hooks/            # Cross-cutting React hooks
│   └── constants/        # Global cross-cutting constants (governed by README)
├── infrastructure/       # Global Database / Supabase setup
├── packages/             # Monorepo/internal packages (if applicable)
├── scripts/              # Build, validation, and maintenance scripts
├── tests/                # Unit, Integration, and E2E Playwright test suites
└── archive/              # Retired legacy code (read-only)
```

---

## 2. Detailed Audit Findings by Directory

| Directory | Purpose / Ownership | Audit Finding | Verdict / Recommendation |
|---|---|---|---|
| `app/` | Next.js App Router pages & layouts (`app/[locale]/(product)/...`). | Clean separation. Renders presentation views by calling module Application Services. | **PASSED** — Keep clean. |
| `modules/` | 8 Bounded Contexts (`ledger`, `plan`, `inbox`, `home`, `health`, `tenancy`, `platform`, `shared-kernel`). | Perfect DDD bounded context separation. Zero cross-domain database coupling. | **PASSED** — Pristine structure. |
| `shared/` | Cross-cutting UI primitives, Form components, Utils, Hooks, Theme. | Reusable shared components live cleanly inside `shared/ui/` and `shared/ui/form`. | **PASSED** — Excellent. |
| `features/` | Empty placeholder directory (contains only `.gitkeep`). | Structural noise. Legacy artifact from pre-v2 rewrite. | **TRIAGED** — Keep empty `.gitkeep` or document as superseded by `modules/`. |
| `components/` | Empty placeholder directory (contains only `.gitkeep`). | Structural noise. Legacy artifact superseded by `shared/ui/` and `modules/`. | **TRIAGED** — Documented as superseded by `shared/ui/`. |
| `archive/` | Retired legacy v1 code. | Read-only legacy archive. Import policy strictly blocks imports from `archive/`. | **PASSED** — Isolated. |

---

## 3. Structural Recommendations

1. **Keep `modules/` as Single Source of Domain Truth**: All feature development MUST occur inside `modules/<bc>/` rather than introducing unmapped components into `features/` or `components/`.
2. **Preserve `shared/` Scope Boundary**: `shared/` must contain ONLY cross-cutting, domain-agnostic UI primitives, utility functions, and form wrappers.
