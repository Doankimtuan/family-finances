---
document: Naming Conventions
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

# Naming Conventions

## Files and folders

- React components: `PascalCase.tsx`
- Hooks: `useThing.ts`
- Utilities: `camelCase.ts` or `kebab-case.ts` consistently within a folder
- Zod schemas: `thing.schema.ts`
- DTOs: `thing.dto.ts`
- Repositories: `thing.repository.ts`
- Server Actions: `thing.actions.ts`
- Tests: `thing.test.ts` / `thing.spec.ts` / Playwright under `tests/e2e`

## Domain language

Use Product glossary terms exactly:

- **Jar** — virtual intention, never “Balance”
- **Balance** — real ledger only
- **Inbox** — unresolved items
- **Month Ritual** — period close ritual
- **Together** — household membership surface

Do not rename Business Rules (`BR-*`), Requirements (`REQ-*`), or Acceptance Criteria (`AC-*`).

## Identifiers

- Prefer Design System / Screen Blueprint IDs when referring to UI inventory.
- Story/task IDs follow Implementation Plan (`ST-E##-###`, `T-…`).

## Abbreviations and constant namespaces

No abbreviations (`tmp`, `obj`, `data2`, `value1`); constant `as const` namespaces use `PascalCase` (`RoutePath`, `QueryKey`, `StorageKey`). Full detail and exceptions: [Coding Standards / naming-policy.md](../../coding-standards/CURRENT/naming-policy.md).
