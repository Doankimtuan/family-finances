# REPO 23A — Repository Waste & Canonical Source Audit

**Verdict: REPOSITORY CLEANUP PLAN READY**

Audit-only run on 2026-08-25. No production source, test, or migration file was
deleted, moved, renamed, formatted, or edited. The two files created by this
audit are the only intended additions.

## 1. Safety checkpoint

| Check                                                | Result                                                                                                                      |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Branch                                               | `main`                                                                                                                      |
| HEAD                                                 | `a91cccda1589ff5cf58adc1e3b04e59998e4fb28`                                                                                  |
| Ahead/behind                                         | `ahead 117` of `origin/main`                                                                                                |
| Git status at checkpoint                             | 7 modified paths; 9 untracked paths                                                                                         |
| Git status when report was written                   | 15 modified paths; 12 untracked paths (the additional Together/output changes appeared during the audit and were preserved) |
| Tracked files                                        | 6,492                                                                                                                       |
| Untracked files                                      | 9 before this audit; 11 after the two audit reports                                                                         |
| Repository size excluding `node_modules` and `.next` | approximately 200 MB                                                                                                        |
| Unit discovery baseline                              | 158 files, 1,113 tests; not executed per brief                                                                              |
| E2E discovery baseline                               | 53 files, 157 tests; not executed per brief                                                                                 |
| Migration check                                      | passed: 131 frozen migrations, head `20260824233500`                                                                        |

Current dirty paths are not cleanup candidates: the migration manifest, three
tracked migration files, seven untracked migrations, the ownership harness,
three tracked Playwright images, and the pre-existing untracked development
replay report/script. Preserve them for a separate reconciliation decision.

Recommended safety point: create an annotated tag or branch from the current
state after the user reviews the dirty worktree, for example
`repo-23a-pre-cleanup-20260825`. This audit did not create it.

## 2. Root inventory

| Path                      | State                                 |   Size | Classification    | Finding                                                                                 |
| ------------------------- | ------------------------------------- | -----: | ----------------- | --------------------------------------------------------------------------------------- |
| `.agents`                 | 353 tracked / 3 untracked             | 4.7 MB | CONSOLIDATE       | Keep instructions and reusable skills; reduce reports/evidence.                         |
| `.commandcode`            | 15 tracked                            |  32 KB | REVIEW_MANUALLY   | Tracked settings contain accumulated command permissions; retain only if team-shared.   |
| `.cursor`                 | 3 tracked                             |  12 KB | KEEP_ENGINEERING  | Canonical rule pointers, including no-magic-strings.                                    |
| `.env.local`              | local only                            |   4 KB | GITIGNORE_LOCAL   | Correctly ignored; never expose or commit values.                                       |
| `.env.local.example`      | tracked                               |   4 KB | KEEP_ENGINEERING  | Safe local configuration template.                                                      |
| `.env.production.example` | tracked                               |   4 KB | KEEP_ENGINEERING  | Safe deployment configuration template.                                                 |
| `.github`                 | tracked                               |   4 KB | KEEP_ENGINEERING  | CI invokes migration validation, lint, typecheck, unit, and E2E smoke gates.            |
| `.git`                    | local metadata                        |      — | KEEP_ENGINEERING  | Required Git metadata; do not include in cleanup commits.                               |
| `.gitignore`              | tracked                               |   4 KB | KEEP_ENGINEERING  | Add ignores for tracked-generated roots proposed below.                                 |
| `.husky`                  | 1 tracked / generated local files     |  72 KB | KEEP_ENGINEERING  | Keep tracked ignore/config surface; generated `_` files are local state.                |
| `.next`                   | ignored                               | 5.5 GB | DELETE_GENERATED  | Safe rebuild output; not tracked.                                                       |
| `.playwright-cli`         | ignored                               |  13 MB | DELETE_GENERATED  | Local browser-tool state; already ignored.                                              |
| `.playwright-mcp`         | ignored                               | 368 KB | DELETE_GENERATED  | Local browser-tool state; already ignored.                                              |
| `.prettierignore`         | tracked                               |   4 KB | KEEP_ENGINEERING  | Formatting boundary.                                                                    |
| `.prettierrc`             | tracked                               |   4 KB | KEEP_ENGINEERING  | Formatting configuration.                                                               |
| `AGENTS.md`               | tracked                               |   8 KB | KEEP_ENGINEERING  | Repository constitution and safety rules.                                               |
| `README.md`               | tracked                               |   4 KB | KEEP_ENGINEERING  | Current repository entry point.                                                         |
| `app`                     | tracked                               | 2.0 MB | KEEP_RUNTIME      | Current Next.js routes and UI.                                                          |
| `archive`                 | tracked                               | 5.9 MB | DELETE_HISTORICAL | Legacy v1 source/backups; no active imports found. Retain externally/tagged first.      |
| `artifacts`               | tracked                               |  15 MB | CONSOLIDATE       | Keep `current`, branding, and current design inputs; remove superseded packs later.     |
| `components`              | tracked scaffold                      |   4 KB | DELETE_HISTORICAL | Empty scaffold; current shared UI is under `shared`.                                    |
| `docs`                    | tracked                               |  32 KB | CONSOLIDATE       | Keep current domain note; move/delete implementation-history report.                    |
| `eslint.config.mjs`       | tracked                               |   4 KB | KEEP_ENGINEERING  | Current lint rules.                                                                     |
| `features`                | tracked scaffold                      |    0 B | DELETE_HISTORICAL | Empty scaffold with no runtime consumer.                                                |
| `global.ts`               | tracked                               |   4 KB | KEEP_RUNTIME      | Current global runtime hook.                                                            |
| `history`                 | tracked                               |  15 MB | DELETE_HISTORICAL | Immutable development history; move outside the product repository.                     |
| `i18n`                    | tracked                               |  24 KB | KEEP_RUNTIME      | Locale configuration.                                                                   |
| `index.json`              | tracked                               |   4 KB | KEEP_ENGINEERING  | Knowledge-base pointer; update only in a later docs consolidation.                      |
| `infrastructure`          | tracked scaffold                      |   4 KB | CONSOLIDATE       | Deployment note is useful, but empty scaffold can be removed after preserving the note. |
| `messages`                | tracked                               | 496 KB | KEEP_RUNTIME      | English/Vietnamese product messages.                                                    |
| `modules`                 | tracked                               | 1.9 MB | KEEP_RUNTIME      | Bounded contexts and platform runtime.                                                  |
| `node_modules`            | ignored                               | 857 MB | DELETE_GENERATED  | Local install; safe to recreate.                                                        |
| `next-env.d.ts`           | ignored                               |   4 KB | DELETE_GENERATED  | Next-generated file.                                                                    |
| `next.config.ts`          | tracked                               |   4 KB | KEEP_RUNTIME      | Next runtime configuration.                                                             |
| `output`                  | 294 tracked / 1 untracked / 2 ignored |  25 MB | DELETE_GENERATED  | Playwright screenshots, fixture state, and audit output; scripts recreate it.           |
| `packages`                | tracked scaffold                      |   4 KB | DELETE_HISTORICAL | Explicitly unused MVP workspace scaffold.                                               |
| `package-lock.json`       | tracked                               | 412 KB | KEEP_ENGINEERING  | Reproducible dependency lockfile.                                                       |
| `package.json`            | tracked                               |   4 KB | KEEP_ENGINEERING  | Current scripts and dependencies.                                                       |
| `playwright.config.ts`    | tracked                               |   4 KB | KEEP_ENGINEERING  | Current E2E configuration.                                                              |
| `postcss.config.mjs`      | tracked                               |   4 KB | KEEP_ENGINEERING  | Current Tailwind/PostCSS configuration.                                                 |
| `public`                  | tracked                               | 1.9 MB | KEEP_RUNTIME      | All current brand/platform assets have runtime or generator references.                 |
| `proxy.ts`                | tracked                               |   4 KB | KEEP_RUNTIME      | Current request/session proxy.                                                          |
| `screenshots`             | tracked                               |  13 MB | DELETE_HISTORICAL | Prompt and before/after evidence; no runtime references.                                |
| `scripts`                 | 21 tracked / 1 untracked              | 212 KB | CONSOLIDATE       | Keep operational/generator scripts; retire phase-specific one-offs.                     |
| `shared`                  | tracked                               | 468 KB | KEEP_RUNTIME      | Shared UI, patterns, motion, i18n, and utilities.                                       |
| `skills-lock.json`        | tracked                               |   4 KB | KEEP_ENGINEERING  | Skill installation lock.                                                                |
| `styles`                  | tracked                               |  24 KB | KEEP_RUNTIME      | Global styles/design tokens.                                                            |
| `supabase`                | 124 tracked / 7 untracked / 1 ignored | 1.3 MB | MIGRATION_DEFER   | Audit only; do not change or delete migrations in 23A.                                  |
| `test-results`            | ignored                               |  16 KB | DELETE_GENERATED  | Test runner output; already ignored.                                                    |
| `tests`                   | tracked                               | 1.3 MB | KEEP_ENGINEERING  | Current unit/integration/E2E coverage; consolidate names only after mapping.            |
| `tsconfig.json`           | tracked                               |   4 KB | KEEP_ENGINEERING  | TypeScript configuration.                                                               |
| `tsconfig.tsbuildinfo`    | ignored                               | 484 KB | DELETE_GENERATED  | Compiler cache.                                                                         |
| `types`                   | tracked scaffold                      |    0 B | DELETE_HISTORICAL | Empty scaffold; current types live beside their modules.                                |
| `vitest.config.ts`        | tracked                               |   4 KB | KEEP_ENGINEERING  | Unit-test configuration.                                                                |

## 3. `.agents` audit

Keep:

- `.agents/instructions/PROJECT.md` and `.agents/README.md`.
- `.agents/skills/**`; these are reusable skills discovered by the agent
  system. Do not duplicate or rewrite them during cleanup.
- `.agents/design-system.md`, which `PROJECT.md` identifies as the current
  design-system reference.
- A small final/reference report set: the latest domain final gates, the
  release integration final gate, the production-foundation report and
  manifest, the brand final report, and the current development replay report
  once its dirty-worktree status is resolved.

Consolidate/delete candidates:

- 124 report files are mostly prompt-phase records. Retain approximately 10–12
  final/reference reports; move or delete the intermediate audits,
  implementation notes, and repeated validation reports after checking that
  no current decision exists only there.
- The 15 nested report evidence images and the three root `tmp-*.png` files are
  safe evidence cleanup candidates; no active code references them.
- `accounts-ux.md`, `auth-onboarding-ux.md`, and `money-ux.md` are unreferenced
  UX notes. Compare them with `artifacts/current` and the canonical design
  inputs, then consolidate or delete.
- Do not delete skills based on low import counts; the skill loader discovers
  them by directory convention.

## 4. `artifacts` audit

Keep as active source input/current reference:

- `artifacts/current/**` (838 files): the implementation-facing knowledge base.
- `artifacts/branding/CURRENT/**` (9 files): approved brand source and
  validation assets.
- `artifacts/information-architecture/CURRENT/**` (13 files),
  `artifacts/ux-redesign/CURRENT/**` (17 files), and
  `artifacts/design-system-evolution/CURRENT/**` (25 files): explicitly named
  by the UI constitution.
- `artifacts/screen-blueprints/**/CURRENT/**` (37 files): current screen
  blueprints referenced by the current product experience documentation.

Consolidate/delete after a reference check:

- `design-calibration` (33 files, 1.2 MB): current-looking calibration pack,
  but not referenced by runtime or canonical project instructions. Preserve
  any still-needed design tokens/evidence in the design-system current pack.
- `finalization` (7 files), `implementation-verification` (7 files), and
  `redevelopment-audit` (13 files): historical gate/cleanup records. Keep only
  durable decisions not already in `artifacts/current` or this audit.
- `savings-0821` (9), `savings-e2e` (4), `savings-prompt-083` (10), and
  `savings-prompt-083-audit` (5): prompt-specific evidence and iteration
  packs; current Savings behavior already has a current domain package and
  tests.

Observed documentation debt: many files under `artifacts/current` still link
to retired paths such as `artifacts/implementation-planning/CURRENT` and
`artifacts/business-blueprint/**/CURRENT`. This is a link-repair/consolidation
task, not a reason to delete current content blindly.

## 5. Generated/local directories

Safe local deletion, outside the cleanup commit if desired:

- `.next`, `node_modules`, `test-results`, `.playwright-cli`,
  `.playwright-mcp`, and compiler state.
- `output/**` after confirming no desired evidence is the sole copy of a
  release decision. Scripts recreate fixture state and screenshots.
- Root `screenshots/**` and `.agents` temporary/evidence images after the
  final reports have been reviewed.

`.next`, `node_modules`, test results, Playwright state, env files, `.DS_Store`,
and TypeScript build state are already ignored. Add `/output/`, `/screenshots/`,
and narrowly scoped `.agents` evidence patterns to `.gitignore` in a separate
engineering change. The tracked 294 `output` files and 128 root screenshots
must be removed from Git explicitly; ignore rules alone do not untrack them.

## 6. Scripts audit

| Script                                                                             | Recommendation             | Evidence                                                                                                        |
| ---------------------------------------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `setup-agent-skills.sh`                                                            | KEEP                       | Referenced by `.agents/README.md` and project instructions.                                                     |
| `validate-migration-freeze.mjs`                                                    | KEEP                       | `package.json`, CI, and migration manifest use it.                                                              |
| `ownership-test-harness.mjs`                                                       | KEEP                       | `package.json`; current ownership E2E support.                                                                  |
| `generate-brand-assets.mjs`                                                        | KEEP                       | `public/README.md`; canonical asset generator.                                                                  |
| `g1-seed-e2e-fixtures.mjs`                                                         | KEEP                       | Current deterministic E2E fixture utility; retain if G1 flows remain supported.                                 |
| `assert-development-supabase.mjs`                                                  | KEEP / resolve dirty state | New untracked destructive-operation guard; referenced by the current development replay work.                   |
| `f5-verify-browser.mjs`, `f6-verify-browser.mjs`                                   | CONSOLIDATE                | No package/CI reference; fold useful checks into Playwright projects or delete after coverage mapping.          |
| `home-14c1-fixture.mjs`, `home-compact-cta-check.cjs`, `verify-home-dashboard.mjs` | CONSOLIDATE / DELETE       | Phase-specific browser gates with no package/CI reference; current Home smoke coverage exists.                  |
| `inbox-18c1-fixture.mjs`                                                           | CONSOLIDATE                | Historical Inbox populated fixture; current Inbox specs and fixture support should be canonical.                |
| `investments-ownership-negative-12b1.mjs`                                          | CONSOLIDATE                | One-off ownership probe; preserve behavior in a shared security harness if still required.                      |
| `loans-11e-fixture.mjs`, `loans-11e-verify-browser.mjs`                            | CONSOLIDATE                | Historical Loans gate; current Loans E2E should own behavior.                                                   |
| `market-valuation-market04.mjs`                                                    | CONSOLIDATE                | Historical market valuation probe with no package/CI reference.                                                 |
| `plan-13b1-fixture.mjs`                                                            | CONSOLIDATE                | Historical Plan fixture; retain behavior only if not covered by current tests.                                  |
| `plan-redesign-screenshots.mjs`, `plan-refinement-screenshots.mjs`                 | DELETE candidate           | Screenshot-only scripts with no package/CI reference; current browser verification should use Playwright specs. |
| `savings-13e2-fixture.mjs`                                                         | CONSOLIDATE                | Historical Savings lifecycle fixture; compare against current lifecycle E2E.                                    |

Definite script deletion candidates: 4 screenshot/verification one-offs after
the coverage check. Nine additional scripts are consolidation candidates, not
automatic deletions.

## 7. Tests and specifications

Discovery found 158 unit files / 1,113 tests and 53 Playwright files / 157
tests. No full suite was run. `vitest.config.ts` includes only
`tests/unit/**/*.{test,spec}.{ts,tsx}`; E2E discovery includes current smoke,
release, fixture, visual, and phase-named specs.

No test is a safe deletion candidate from static inspection alone. The
following 15 phase/prompt-named specs are consolidation or rename candidates,
not deletions until behavior is mapped:

- `home-product-summary-14c1.smoke.spec.ts` → `home-dashboard.smoke.spec.ts`
- `inbox-18c1-populated.smoke.spec.ts` → `inbox-queue.smoke.spec.ts` and
  `inbox-decisions.smoke.spec.ts`
- `investments-12c1.smoke.spec.ts` → `investments.smoke.spec.ts`
- `investments-asset-picker-ui01.smoke.spec.ts` →
  `investments.smoke.spec.ts` or a canonical `investments-asset-picker.spec.ts`
- `investments-market-valuation-ui02.smoke.spec.ts` →
  `investments.smoke.spec.ts` or a canonical market valuation spec
- `money-hardening-16b.smoke.spec.ts` → `money-hub.smoke.spec.ts` plus the
  release flow
- `plan-13b1-privacy-valuation.smoke.spec.ts` → a canonical Plan valuation
  privacy spec
- `plan-13c-action-sheet.smoke.spec.ts` → canonical Plan interaction specs
- `plan-goals-f3-safety.smoke.spec.ts` and `plan-goals-g1-fixture.smoke.spec.ts`
  → `plan-goals-recurring.smoke.spec.ts` plus fixture support
- `phase-f7-responsive.smoke.spec.ts` → `ui-foundation-visual.spec.ts` or a
  canonical responsive contract spec
- `prompt-02-1-headers.smoke.spec.ts` → `shell.smoke.spec.ts`
- `savings-g1-fixture.smoke.spec.ts` and `savings-lifecycle.13e2.spec.ts` →
  `savings.smoke.spec.ts` plus a canonical lifecycle spec
- `v1-critical-flow.release.spec.ts` remains the surviving cross-domain release
  coverage, not a replacement for every domain-specific invariant.

Coverage-preservation rule for 23B: delete only after each candidate has a
surviving test named in the mapping above and the surviving test still asserts
the same user-visible or financial contract. Current obsolete test/spec count:
**0 confirmed**.

## 8. Documentation and public assets

Keep `docs/domain/vietnam-credit-card-installments.md` as durable current
domain context if the product still supports that tracker. The
`docs/implementation-reports/**` file is an implementation record and is a
delete/move candidate because its current behavior is already represented in
source, migrations, tests, and current artifacts.

All 15 `public` files are runtime assets or documented generator outputs. The
brand source, generated lockup/mark/app icon, favicon set, PWA icons, and
manifest have runtime or generator references. No public deletion candidate
was found.

## 9. Tooling/configuration folders

- `.cursor`: keep; the rules point to canonical `.agents` instructions and the
  no-magic-strings policy.
- `.commandcode`: review tracked `settings.json` and taste files. They contain
  project guidance and accumulated permissions, but are not runtime code. Keep
  only team-shared configuration; move personal permissions to ignored local
  state.
- `.playwright-cli` and `.playwright-mcp`: local state, already ignored, safe
  to remove.
- `.husky`: keep the tracked ignore/config surface; generated `_` internals are
  not a product source of truth.
- `.github/workflows/ci.yml`: keep; it is the active CI contract.

No credential values were read into this report.

## 10. Dependency audit

Candidate cleanup, not uninstallation in 23A:

- `lodash-es`: no active source/test/script import found outside generated or
  historical trees. Remove in a dependency-only change after `npm run lint`,
  `npm run typecheck`, and unit discovery/targeted tests pass.
- `@testing-library/dom`: no direct import found; it is also a transitive
  dependency of `@testing-library/react`. Remove the direct declaration only
  if the lockfile remains correct and CI still resolves the peer dependency.

Keep the remaining dependencies based on active config/import evidence:
HeroUI, Hugeicons, Supabase, React/Next, RHF/Zod, Motion, Recharts,
internationalized date, React Aria portal, next-intl/themes, Geist, Tailwind,
Vitest, Playwright, ESLint, Prettier, Husky, and Testing Library.

## 11. Dead source and compatibility routes

High-confidence orphan candidates, pending one final import/build check:

- `app/[locale]/(product)/money/accounts/[id]/credit-card-statements-section.tsx`
- `app/[locale]/(product)/money/accounts/[id]/credit-card-cashback-section.tsx`
- `modules/ledger/ui/installment-card.tsx`
- `app/[locale]/(product)/plan/plan-destination-stub.tsx`

No active import or route reference was found for these files. The search was
cross-checked against app/modules/shared/tests; do not delete until a clean
typecheck/build confirms there is no convention-based route use.

Compatibility still intentionally supported by current tests:

- `/money/cards` and `/money/cards/[id]` redirect to `/money/loans` and are
  asserted by `money-products.smoke.spec.ts`.
- `/money/add` is a user-facing capture alias asserted by
  `money-capture.smoke.spec.ts`.
- `APP_PATH.MONEY_CARDS`, `moneyCardPath`, and `RoutePath` have no active
  consumers beyond their declarations. Consolidate/remove those unused API
  aliases together with the compatibility-route decision, not independently.

Because production has not launched, `/money/cards` compatibility is a valid
removal candidate, but only after choosing a clean cutover: remove the route,
the stale path aliases, and its redirect assertions in one change. Keep
`/money/add` unless product navigation explicitly drops that capture entry.

## 12. Supabase migrations — audit only

- 131 migration files are present.
- The manifest has 131 entries through `20260824233500`.
- Manifest status counts: 121 tracked-clean, 3 tracked-modified, 7 untracked.
- `npm run migrations:validate` passes because the manifest currently models
  those dirty states; this is not evidence that the worktree is release-clean.
- No migration was edited or deleted by 23A.

Proposed 23E baseline strategy:

1. Resolve the current dirty migration/manifest worktree and create the
   pre-cleanup tag/branch.
2. Capture a schema-only development snapshot and compare it with a clean
   replay of all 131 recorded migrations. Reconcile the three modified and
   seven untracked entries before any squash decision.
3. Confirm no production project has been provisioned and record that decision
   in the release checklist. Do not infer it from repository state.
4. Generate one canonical V1 baseline migration from the agreed schema,
   including tables, constraints, indexes, RLS, grants, RPCs, and seed/catalog
   requirements. Preserve exact function signatures and security properties.
5. Apply the baseline to a reset development database, replay the current
   behavioral contract tests, and compare schema/RPC/RLS results against the
   pre-baseline snapshot.
6. Retain the 23A migration history in the safety tag or external archive until
   replay, application, and security checks pass. Then replace the active
   migration set with the baseline plus forward migrations and update the
   validator/manifest in a dedicated 23E gate.

This is a later high-risk batch. It is not safe to delete individual applied
migrations merely because development data may be destroyed.

## 13. Target repository

```text
app/                 current Next routes and screens
artifacts/
  current/           only implementation-facing knowledge base
  branding/CURRENT/  approved brand source
  information-architecture/CURRENT/
  ux-redesign/CURRENT/
  design-system-evolution/CURRENT/
  screen-blueprints/*/CURRENT/
docs/domain/         durable current domain notes only
messages/ i18n/      localization
modules/             bounded contexts and platform
public/              current runtime assets
scripts/             shared operational/generator/migration tools
shared/ providers/   shared runtime/UI foundations
styles/              design tokens/global styles
supabase/migrations/ frozen or later V1 baseline plus forward migrations
tests/               current behavioral coverage and reusable fixtures
AGENTS.md README.md package*.json *.config.* .github/ .husky/ .cursor/
```

The target deliberately omits `archive`, `history`, root `screenshots`, tracked
`output`, empty scaffolds, prompt-phase reports, and old artifact packs.

## 14. Ordered cleanup plan

| Batch | Scope                                                           |                                              Files |                                    Approx. reduction | Risk                                                      | Required validation                                           |
| ----- | --------------------------------------------------------------- | -------------------------------------------------: | ---------------------------------------------------: | --------------------------------------------------------- | ------------------------------------------------------------- |
| A     | Local/generated state and ignore rules                          |                    local; 294 tracked output files | 25 MB tracked output plus 5.5 GB local rebuild state | Near-zero if evidence is reviewed                         | `git status`, ignore checks, one fixture setup/list check     |
| B     | Historical archive, history, screenshots, old reports/artifacts |      approximately 3,850 historical/evidence files |                                  approximately 40 MB | Low after tag; medium if an undocumented decision is lost | reference scan, final-report review, link scan                |
| C     | Phase scripts and empty scaffolds                               |            4 deletion candidates; 9 consolidations |                                 approximately 0.2 MB | Low/medium                                                | package/CI/reference scan, targeted E2E discovery             |
| D     | Phase-specific tests/specs                                      | 0 confirmed deletions; 15 consolidation candidates |                                           negligible | Medium/high                                               | coverage mapping, then targeted unit/E2E runs                 |
| E     | Orphan source and compatibility aliases                         |                  4 orphan files plus route aliases |                                           negligible | Medium                                                    | typecheck, lint, route discovery, targeted redirects          |
| F     | Migration baseline/squash                                       |                          all 131 migrations, later |                                 approximately 1.3 MB | High                                                      | schema-only replay, RPC/RLS/security checks, release sign-off |

Do A and B only after the safety tag. Do C–E in separate small commits. Do F
as a dedicated migration gate; never combine it with historical file deletion.

## 15. Summary

- Total tracked files: **6,492**.
- Candidate deletion files observed: **approximately 4,160**, subject to the
  per-file checks above; this is not an authorization to delete.
- Candidate consolidation workstreams: **6**.
- Approximate removable tracked size: **66.9 MB**, plus rebuildable local state.
- Confirmed obsolete tests/specs: **0**; phase-named review candidates: **15**.
- Definite obsolete script candidates: **4**; additional consolidation
  candidates: **9**.
- Historical/evidence files observed: **approximately 3,860**.
- Migration recommendation: **defer individual deletion; prepare a guarded
  23E canonical V1 baseline only after dirty-state reconciliation and clean
  schema/RPC/RLS replay**.

`REPOSITORY CLEANUP PLAN READY`
