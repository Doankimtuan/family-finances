# Dependency Audit — Sprint 0 Bootstrap

**Run:** `run_sprint0_bootstrap_20260801T234900Z`  
**Package manager:** npm (Architecture lockfile SoT)  
**Lockfile at audit:** none (`package-lock.json` missing)  
**node_modules at audit:** absent

## Summary

Root `package.json` is a rewrite skeleton. Declared runtime deps except Next/React have **zero product imports**. Approved UI stack packages are **missing**. No dual UI kits at root. Legacy packages live only under `archive/legacy-v1` (read-only).

---

## Dependencies

| Package | Version | Classification | Evidence |
|---------|---------|----------------|----------|
| `next` | 16.1.6 | **Used** | Framework; layout/pages |
| `react` | 19.2.3 | **Used** | Framework |
| `react-dom` | 19.2.3 | **Used** | Framework |
| `@supabase/ssr` | ^0.8.0 | **Unused** (keep — approved stack) | No product imports yet; required for Sprint 0 provider |
| `@supabase/supabase-js` | ^2.56.0 | **Unused** (keep — approved stack) | Same |
| `@tanstack/react-query` | ^5.90.21 | **Unused** (keep — approved stack) | Required for QueryProvider |
| `zod` | ^4.3.6 | **Unused** (keep — approved stack) | Forms/validation foundation |
| `zustand` | ^5.0.11 | **Unused** (keep — approved stack) | UI state foundation |

## DevDependencies

| Package | Version | Classification | Evidence |
|---------|---------|----------------|----------|
| `tailwindcss` | ^4 | **Used** (config) | `postcss.config.mjs` |
| `@tailwindcss/postcss` | ^4 | **Used** (config) | PostCSS plugin |
| `typescript` | ^5 | **Used** (build) | `tsconfig.json` |
| `eslint` | ^9 | **Used** (config) | `eslint.config.mjs` |
| `eslint-config-next` | 16.1.6 | **Used** (config) | ESLint extends |
| `@types/node` | ^20 | **Used** (types) | TypeScript |
| `@types/react` | ^19 | **Used** (types) | TypeScript |
| `@types/react-dom` | ^19 | **Used** (types) | TypeScript |
| `vitest` | ^3.0.0 | **Unused** (keep — approved) | Script `test`; no config yet |
| `playwright` | ^1.50.0 | **Unused** (keep — approved) | Script `test:e2e`; prefer `@playwright/test` for runner |

## Config-only gap (broken until install)

| Package | Classification | Evidence |
|---------|----------------|----------|
| `eslint-plugin-unused-imports` | **Missing** (required by config) | Imported in `eslint.config.mjs` but not in `package.json` |

## Missing approved stack

| Package | Role |
|---------|------|
| `@heroui/react` | UI (HeroUI v3) |
| `@heroui/styles` | HeroUI CSS |
| `tailwind-variants` | Variants |
| `@phosphor-icons/react` | Icons |
| `motion` | Animation |
| `next-themes` | Theme |
| `react-hook-form` | Forms |
| `@hookform/resolvers` | RHF + Zod |
| `recharts` | Charts |
| `date-fns` | Dates |
| `geist` | Typography (Geist font) |
| `prettier` | Formatting |
| `eslint-config-prettier` | ESLint/Prettier |
| `husky` | Git hooks |
| `lint-staged` | Staged lint |
| `@testing-library/react` | Unit testing |
| `@testing-library/dom` | Unit testing |
| `@testing-library/jest-dom` | Matchers |
| `jsdom` | Vitest environment |
| `@playwright/test` | E2E runner |

## Deprecated / Unsafe / Legacy-only at root

| Finding | Result |
|---------|--------|
| Deprecated packages | None detected at root |
| Unsafe packages | None detected at root |
| Legacy-only at root | None — legacy stack retired to `archive/legacy-v1` |
| Duplicated packages | None |
| Conflicting UI kits | None at root |

## Recommendations (uncertain → keep)

| Item | Recommendation |
|------|----------------|
| `playwright` vs `@playwright/test` | Keep `playwright` browsers package; add `@playwright/test` for config/runner |
| `aios:*` scripts | Keep; do not touch `ai-os/` |
| Zod v4 | Keep; approved validation library |
| Coverage package | Defer `@vitest/coverage-v8` until coverage gate required |
