---
document: Import Policy
coding_standards: v1.0.0
status: OFFICIAL_CODING_STANDARDS
run_id: run_coding_standards_20260802T150000Z
created_at: 2026-08-02T15:05:00Z
board: Engineering Standards Board
frozen: true
constitution_sot: artifacts/developer-constitution/CURRENT
---

# Import Policy

This document adds mechanical, lint-enforceable detail on top of the Constitution's [import-rules.md](../../developer-constitution/CURRENT/import-rules.md) (allowed/forbidden module boundary graph, which remains authoritative for architecture layering). This policy governs **import style**, not boundaries.

## Path aliases — mandatory

Use the `@/*` alias (configured in `tsconfig.json`) for any import that would otherwise cross a route-segment or feature boundary. This is already the dominant pattern (~644 uses) — keep it universal.

```ts
// Required
import { APP_PATH } from "@/modules/tenancy/application/app-path";
import { Button } from "@/shared/ui/button";

// Forbidden
import { APP_PATH } from "../../../modules/tenancy/application/app-path";
```

## Relative imports — maximum depth 2

A relative import may go up **at most two** directory levels (`../../x`). Anything deeper (`../../../x`) must be rewritten as an `@/` alias import.

| Depth | Example | Allowed? |
|-------|---------|----------|
| Same/sibling dir | `./mutate-actions` | Yes |
| 1 level | `../money-offline-banner` | Yes |
| 2 levels | `../../money-offline-banner` | Yes (interim; prefer `@/` for anything shared across route segments) |
| 3+ levels | `../../../money-offline-banner` | **No** — use `@/app/[locale]/(product)/money/money-offline-banner` |

## Import grouping

Group imports in this order, with a blank line between groups (enforced by editor/formatter config, not manually):

1. External packages (`react`, `next`, `zod`, `@heroui/*`, …)
2. `@/` alias imports, ordered `modules/*` -> `shared/*` -> local feature/`app/*` siblings
3. Relative imports (`./`, `../`, `../../`)
4. Type-only imports may be inlined (`import type { X } from "..."`) at their natural group position; do not create a separate type-import group unless the linter enforces one.

## No unused imports

Every import must be referenced in the file. `eslint-plugin-unused-imports` is already installed — do not disable it, do not add `// eslint-disable` for unused imports; delete the import instead.

## No barrel abuse

Do not create or extend a barrel file (`index.ts`) that re-exports an entire module's public surface across a Bounded Context boundary "for convenience" — this is forbidden by the Constitution's import graph (`import-rules.md`, rule 6). Named, explicit imports from the owning file are preferred within a module's own `application/index.ts` (already used for `modules/ledger/application`, `modules/plan/application`, `modules/inbox/application` — these are intra-module aggregation, which is fine; do not extend the same pattern to cross-module re-exports).

## Review gate

- Any import with 3+ `../` segments fails review.
- Any newly unused import fails review.
- Any new cross-Bounded-Context barrel re-export fails review (Constitution `import-rules.md` takes precedence).
