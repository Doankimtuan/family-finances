# Configuration Audit — Sprint 0 Bootstrap

**Run:** `run_sprint0_bootstrap_20260801T234900Z`

## Present

| Config | Path | Notes |
|--------|------|-------|
| TypeScript | `tsconfig.json` | `strict: true`; paths `@/*` → `./*`; excludes `archive`, `ai-os`, `tests` |
| Next.js | `next.config.ts` | Empty config object |
| ESLint | `eslint.config.mjs` | Next vitals + TS; imports missing `eslint-plugin-unused-imports` |
| PostCSS | `postcss.config.mjs` | `@tailwindcss/postcss` |
| Git ignore | `.gitignore` | Ignores `node_modules`, `.next`, `.env*`, etc. |
| Env example | `.env.local.example` | Supabase public keys + Gemini edge keys |
| Env local | `.env.local` | Present (gitignored) |
| Next types | `next-env.d.ts` | Present |

## Missing

| Config | Required for | Action |
|--------|--------------|--------|
| `package-lock.json` | npm SoT | Generate via `npm install` |
| Prettier | Formatting | Add `.prettierrc` + `.prettierignore` |
| Vitest | Unit tests | Add `vitest.config.ts` |
| Playwright | E2E | Add `playwright.config.ts` |
| Husky | Git hooks | Add `.husky/` + `prepare` script |
| lint-staged | Pre-commit | Add to `package.json` |
| Tailwind config file | Optional on v4 | Prefer CSS `@theme` in `styles/` — no duplicate `tailwind.config.js` |

## Gaps / bugs

| Issue | Severity | Fix |
|-------|----------|-----|
| `eslint-plugin-unused-imports` not in package.json | High | Add dep |
| No `typecheck` script | Medium | Add `tsc --noEmit` |
| `tsconfig` include missing `providers/`, `features/`, `types/` | Medium | Expand include |
| No Prettier | Medium | Add |
| Vitest has no config / no smoke test | Medium | Add |
| Playwright script without `@playwright/test` / config | Medium | Add |
| `app/globals.css` has no design tokens | High (design) | Move to `styles/` + tokens |
| Empty `supabase/` at root | Low | Keep; clients in modules/platform |

## Absolute imports / aliases

| Alias | Mapping | Status |
|-------|---------|--------|
| `@/*` | `./*` | Present — keep as SoT |

## Duplicated configs

None at root. Do not add legacy `tailwind.config.js` if CSS `@theme` covers tokens.

## Environment variables (names only)

| Name | Role | Bootstrap |
|------|------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Required for client factory |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Preferred public key | Preferred |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Fallback public key | Fallback |
| `GEMINI_API_KEY` | Edge AI (legacy continuity) | Not wired in Sprint 0 UI |
| `AI_WORKER_SECRET` | Edge worker | Not wired |
| `GEMINI_MODEL` | Model id | Not wired |

## Target scripts after bootstrap

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint .",
  "typecheck": "tsc --noEmit",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "prepare": "husky"
}
```
