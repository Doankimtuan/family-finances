---
document: Pull Request Checklist
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

# Pull Request Checklist

Authors and reviewers must confirm before merge:

1. [ ] Implements an Implementation Plan story/task (IDs cited)
2. [ ] Does not redesign Product / Architecture / Design SoTs
3. [ ] Stack remains locked (no new UI kit / icon lib / CSS system)
4. [ ] Folder and import rules followed (`features/`, `shared/ui`, `modules/`)
5. [ ] No new files under root `components/`
6. [ ] No imports from `archive/legacy-v1`
7. [ ] Design tokens used; 440px AppViewport preserved; no sidebar
8. [ ] Forms = RHF + Zod; server re-validates
9. [ ] Server state via TanStack Query; Zustand UI-only
10. [ ] Async UX: Loading / Error / Empty / Retry / Offline defined
11. [ ] Money paths: online-only fail-closed; idempotency
12. [ ] BR-01: jars never labeled as Balance
13. [ ] Tests added/updated; AC mapping in description
14. [ ] A11y: keyboard, focus, labels
15. [ ] Security: no secrets client-side; authz server-side
16. [ ] This constitution and checklists reviewed
17. [ ] [Coding Standards](../../coding-standards/CURRENT/review-checklist.md) merge-fail gates pass (no magic strings, no duplicated literals/interfaces/utilities, no `rounded-[var(--radius-*)]` or unjustified arbitrary Tailwind, no `any`, no relative imports deeper than 2 levels)
