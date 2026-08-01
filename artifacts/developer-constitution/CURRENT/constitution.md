---
document: Constitution
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

# Developer Constitution

## Status

**Official Implementation Constitution** — version `v1.0.0`.

This document is the **implementation law** of the repository. Every engineer and every AI agent must obey it. No Sprint may violate it.

## Precedence

1. **Product Definition, Architecture Definition, Technical Specification, Design Foundation, Design System, Screen Blueprints, Implementation Plan** define *what* and *why*. They are frozen Sources of Truth. This constitution must not redesign them.
2. **This constitution** defines *how* code is written, structured, reviewed, and merged.
3. If an implementation conflicts with this constitution, **the constitution wins**.
4. If a proposed constitution rule would contradict a frozen product, architecture, or design *decision*, the frozen SoT wins; stop and clarify — do not guess.

## Authority over implementation

- Mandatory for every future Sprint, PR, engineer, and AI agent.
- Rewrite Readiness (`GO WITH CONDITIONS`) remains in force for day-0 bootstrap (HeroUI, `shared/ui`, AppViewport). The constitution does not waive those conditions.

## Technology lock

| Concern | Locked choice |
|---------|---------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| UI | HeroUI v3 (`@heroui/react` + `@heroui/styles`) |
| Accessibility | React Aria (via HeroUI / RAC) |
| Variants | tailwind-variants |
| Animation | Motion |
| Icons | Phosphor React (`@phosphor-icons/react`) |
| Forms | React Hook Form |
| Validation | Zod |
| UI state | Zustand (UI only) |
| Server state | TanStack Query |
| Backend | Supabase |
| Database | PostgreSQL |
| Theme | next-themes |
| Charts | Recharts |
| Date | date-fns |

### Forbidden

- Additional UI frameworks or kits
- Alternative icon libraries
- CSS frameworks other than Tailwind
- CSS Modules
- Styled Components
- Emotion
- Redux (or other global state libraries for server data)
- Class components
- Root `components/` growth
- Regenerating or depending on retired control-plane trees

Missing packages listed in Rewrite Readiness (HeroUI, Phosphor, Motion, RHF, next-themes, Recharts, date-fns, tailwind-variants) **must** be installed as Sprint 1 day-0 obligations — not as constitution gaps.

## Non-negotiable product locks (restated, not redesigned)

- **BR-01:** Real ledger ≠ virtual jars. Never label jar intention as bank “Balance”.
- **BR-15 / REQ-018:** Online-only money mutations; fail closed offline.
- **REQ-019:** Keyboard support for capture, Inbox resolve, Month Ritual.
- **IA:** Home · Money · Plan · Inbox · Together (+ Health via Home chip). No Categories primary nav. No sidebar.
- **Canvas:** Mobile Native; desktop = phone-in-monitor; max application width **440px**.

## Document map

| File | Law covered |
|------|-------------|
| [implementation-doctrine.md](./implementation-doctrine.md) | Doctrine, layering, SoT obedience |
| [coding-standards.md](./coding-standards.md) | React, Next.js, TypeScript, forms, state |
| [architecture-rules.md](./architecture-rules.md) | Modules, API, DB, repositories |
| [design-rules.md](./design-rules.md) | Tokens, HeroUI, viewport |
| [folder-rules.md](./folder-rules.md) | Repository tree |
| [import-rules.md](./import-rules.md) | Import graph |
| [naming-conventions.md](./naming-conventions.md) | Names |
| [testing-policy.md](./testing-policy.md) | Tests |
| [security-policy.md](./security-policy.md) | Security |
| [accessibility-policy.md](./accessibility-policy.md) | A11y |
| [performance-policy.md](./performance-policy.md) | Performance |
| [ai-agent-rules.md](./ai-agent-rules.md) | AI agents |
| [code-review-checklists.md](./code-review-checklists.md) | Review checklists |
| [pull-request-checklist.md](./pull-request-checklist.md) | PR gate |
| [glossary.md](./glossary.md) | Terms |
