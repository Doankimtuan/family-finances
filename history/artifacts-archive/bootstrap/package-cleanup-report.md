# Package Cleanup Report — Sprint 0 Bootstrap

**Run:** `run_sprint0_bootstrap_20260801T234900Z`  
**Policy:** Remove only with no runtime/build/test/config usage. If uncertain → keep + recommend.

## Decisions

### KEEP (no removal)

All current root dependencies and devDependencies are kept. Supabase, TanStack Query, Zustand, and Zod are unused in product code today but are **approved stack** and required for Sprint 0 foundation wiring.

| Package | Reason |
|---------|--------|
| `next`, `react`, `react-dom` | Framework |
| `@supabase/ssr`, `@supabase/supabase-js` | Backend foundation |
| `@tanstack/react-query` | QueryProvider |
| `zustand` | UI state foundation |
| `zod` | Validation foundation |
| `tailwindcss`, `@tailwindcss/postcss` | Styling pipeline |
| `typescript`, `@types/*` | Strict TS |
| `eslint`, `eslint-config-next` | Lint |
| `vitest`, `playwright` | Testing |

### ADD (approved stack + DX)

| Package | Purpose |
|---------|---------|
| `@heroui/react` | HeroUI v3 components |
| `@heroui/styles` | HeroUI styles |
| `tailwind-variants` | Component variants |
| `@phosphor-icons/react` | Icons |
| `motion` | Animation |
| `next-themes` | Dark mode / system theme |
| `react-hook-form` | Forms |
| `@hookform/resolvers` | Zod resolvers for RHF |
| `recharts` | Charts (install only) |
| `date-fns` | Dates |
| `geist` | Geist font |
| `prettier` | Formatting |
| `eslint-config-prettier` | Disable conflicting ESLint rules |
| `eslint-plugin-unused-imports` | Fixes broken eslint config |
| `husky` | Git hooks |
| `lint-staged` | Staged file checks |
| `@testing-library/react` | Component tests |
| `@testing-library/dom` | DOM testing utils |
| `@testing-library/jest-dom` | Matchers |
| `jsdom` | Vitest environment |
| `@playwright/test` | E2E test runner |

### REMOVE

**None.** No obsolete, duplicated, or unsafe packages at root with zero justified keep reason.

### DEFER / RECOMMEND

| Item | Action |
|------|--------|
| `@vitest/coverage-v8` | Defer until coverage gate required |
| i18n provider packages | Defer; Tech Spec mentions i18n, not Sprint 0 provider list |
| `aios:*` scripts | Keep scripts; do not modify `ai-os/` |
| Root Gemini/AI env keys in example | Keep for strangler/edge continuity; not wired in product bootstrap |

## Post-cleanup package.json intent

- Minimal approved stack only
- npm lockfile generated (`package-lock.json`)
- No pnpm/yarn/bun lockfiles at root
- Scripts: add `typecheck`, `format`, `format:check`, `test:watch`, `prepare` (husky)

## Gate

This report precedes `package.json` mutation. Install proceeds only after this file exists.
