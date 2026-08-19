# Family Finance — Dependency & Release Hardening (16A)

Date: 2026-08-19  
Repository: `family-finances`  
Scope: dependency/supply-chain hardening, deterministic release smoke, and bounded broader E2E comparison

## 1. Executive summary

Prompt 16A is complete.

The production dependency audit was rerun from the current lockfile. Before remediation it reported 0 Critical, 4 High, and 0 Moderate package-level vulnerabilities. The affected production paths were Next.js 16.1.6, its optional sharp image dependency, its nested PostCSS copy, and the shared transitive nanoid package.

Remediation was intentionally narrow:

- upgraded `next` and `eslint-config-next` from `16.1.6` to `16.3.1`;
- kept React and React DOM at `19.2.3`;
- accepted Next's compatible sharp/PostCSS family updates brought by that framework upgrade;
- pinned the shared transitive `nanoid` path to `3.3.18` with npm `overrides`.

The final production and all-dependency audits both report 0 Critical, 0 High, and 0 Moderate vulnerabilities. No forced audit fix was used, no application code was changed, and no database migration was added.

The curated release gate stayed green before and after dependency changes: 11 passed, 0 failed, 0 skipped. Security regression stayed green: 197 focused tests passed and the full unit suite passed 901 tests across 120 files.

## 2. Pre-upgrade release baseline

### Repository/package baseline

| Item                | Baseline                                             |
| ------------------- | ---------------------------------------------------- |
| Package manager     | npm                                                  |
| Lockfile            | `package-lock.json`, lockfile version 3              |
| Package-manager pin | none in `package.json`, `.nvmrc`, or `.node-version` |
| Runtime used        | Node `v24.18.0`, npm `11.16.0`                       |
| Registry            | `https://registry.npmjs.org/`                        |
| Next.js             | `16.1.6`                                             |
| React / React DOM   | `19.2.3` / `19.2.3`                                  |
| sharp               | `0.34.5`, optional dependency of Next                |
| production PostCSS  | `8.4.31`, nested under Next                          |
| development PostCSS | `8.5.25`, used by Tailwind/Vite                      |
| nanoid              | `3.3.16`, shared by the PostCSS copies               |

There is one canonical npm lockfile. No pnpm, Yarn, or Bun lockfile was introduced.

### Green baseline gates

- Unit: 120 files, 901 tests passed.
- Typecheck: passed.
- Lint: passed.
- Production build: passed on Next 16.1.6.
- Supabase `db push --linked --dry-run`: remote database up to date.
- Focused RPC/ownership/Together/Inbox security regression: 197 tests passed.
- Critical release smoke: 11 passed, 0 failed, 0 skipped.

## 3. Parallel broader-E2E infrastructure issue

The 15C parallel run remains the authoritative reproduction of the broader infrastructure issue:

```text
shared Next dev server
→ parallel Playwright workers
→ HTTP 500 responses
→ malformed JSON parsing
→ “Unexpected non-whitespace character after JSON ...”
```

The documented 15C parallel result was 2 passed, 82 failed, and 28 not run across 112 tests. It was not treated as product evidence.

One attempted clean release launch in this prompt also hit an existing `.next/dev/lock` held by a long-running Next dev process before tests started. No product assertion ran in that attempt. The release gate was then run against a freshly started production `next start` server, avoiding shared dev-server reuse and the lock contention.

Classification: TEST INFRASTRUCTURE DEBT, deferred as P2. The shared parallel mode is not a release gate and was not used for before/after dependency evidence.

## 4. Stable broader-E2E comparison mode

Chosen mode: one fresh production Next server, Playwright workers set to 1, valid ownership fixture identity supplied, and no shared parallel workers.

Command shape:

```bash
next build
next start -p 3154
E2E_BASE_URL=http://localhost:3154 E2E_PORT=3154 \
  E2E_USER_EMAIL="$OWNERSHIP_TEST_A_EMAIL" \
  E2E_USER_PASSWORD="$OWNERSHIP_TEST_A_PASSWORD" \
  npm run test:e2e -- --workers=1
```

This mode produced product signals without the shared-server JSON corruption. Historical/fixture-dependent checks remain outside the V1 release contract and were classified rather than repaired in bulk.

### Stable comparison results

| Run                       | Passed | Failed | Skipped | Classification                                                                        |
| ------------------------- | -----: | -----: | ------: | ------------------------------------------------------------------------------------- |
| Before dependency changes |     67 |      3 |      42 | two stale/fixture-dependent Home shell checks; one Together fixture convergence check |
| After dependency changes  |     67 |      3 |      42 | same three known fixture/contract failures; no new dependency regression              |

The intermediate Next-only run was 68/2/42 because the Together fixture happened to converge. The final nanoid comparison returned to the exact baseline 67/3/42; this variance is the known broader fixture-state debt, not a dependency failure. The 11 release tests embedded in the broader run passed in every completed comparison.

Known stable-mode failures:

1. Two `chrome.smoke.spec.ts` Home checks expect product BottomNav but the valid identity lands on onboarding.
2. `together-lifecycle.authenticated.spec.ts` sometimes finds one Admin row instead of two because the historical shared fixture is not fully reset/converged.

These are classified as stale/optional fixture-dependent coverage. They are not new failures, not server corruption, and not release blockers.

## 5. Current dependency audit

The pre-upgrade production audit was run with `npm audit --omit=dev --json`; the result was not reused from 15A.

| Package-level finding | Installed path              | Severity | Direct/transitive | Production/dev                | Current applicability                                                                                   |
| --------------------- | --------------------------- | -------- | ----------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------- |
| `next` 16.1.6         | root `next`                 | High     | direct            | production                    | App Router, Proxy/Middleware, and Server Actions are in use; affected framework family required upgrade |
| `sharp` 0.34.5        | optional dependency of Next | High     | transitive        | production                    | Next image pipeline dependency; inherited libvips advisory, patched by the Next family upgrade          |
| `postcss` 8.4.31      | `next/node_modules/postcss` | High     | transitive        | production/build              | Next build/compiler path; patched by the Next family upgrade                                            |
| `nanoid` 3.3.16       | shared PostCSS dependency   | High     | transitive        | production/build and dev/test | build-time generator path; patched with an intentional lockfile override                                |

Package-level baseline counts: Critical 0, High 4, Moderate 0.

## 6. Advisory applicability matrix

The audit grouped multiple advisory records under the `next` package. The following High advisories were present in the pre-upgrade production graph:

| Advisory            | Package/range      | Path                | Classification                                                                     | Resolution                       |
| ------------------- | ------------------ | ------------------- | ---------------------------------------------------------------------------------- | -------------------------------- |
| GHSA-2v37-7h3g-55p8 | nanoid `<3.3.18`   | PostCSS → nanoid    | C/F: build-time transitive production path; safe patch                             | override to `3.3.18`             |
| GHSA-q4gf-8mx6-v5v3 | Next `<16.2.3`     | root Next           | A/F: App Router Server Components DoS exposure                                     | Next `16.3.1`                    |
| GHSA-8h8q-6873-q5fj | Next `<16.2.5`     | root Next           | A/F: Server Components DoS exposure                                                | Next `16.3.1`                    |
| GHSA-26hh-7cqf-hhc6 | Next `<16.2.6`     | root Next           | A/F: Proxy/Middleware bypass family; auth-boundary risk                            | Next `16.3.1`                    |
| GHSA-mg66-mrh9-m8jx | Next `<16.2.5`     | root Next           | E/F: Cache Components DoS; Cache Components not enabled, patched anyway            | Next `16.3.1`                    |
| GHSA-c4j6-fc7j-m34r | Next `<16.2.5`     | root Next           | E/F: WebSocket-upgrade SSRF; no custom server/WebSocket upgrade path               | Next `16.3.1`                    |
| GHSA-492v-c6pp-mqqv | Next `<16.2.5`     | root Next           | A/F: Proxy/Middleware route-parameter bypass family                                | Next `16.3.1`                    |
| GHSA-267c-6grr-h53f | Next `<16.2.5`     | root Next           | A/F: App Router segment-prefetch bypass family                                     | Next `16.3.1`                    |
| GHSA-36qx-fr4f-26g5 | Next `<16.2.5`     | root Next           | E/F: Pages Router i18n bypass; application uses App Router                         | Next `16.3.1`                    |
| GHSA-6gpp-xcg3-4w24 | Next `<16.2.11`    | root Next           | A/F: Turbopack single-locale Proxy/Middleware bypass family                        | Next `16.3.1`                    |
| GHSA-m99w-x7hq-7vfj | Next `<16.2.11`    | root Next           | A/F: App Router Server Actions DoS                                                 | Next `16.3.1`                    |
| GHSA-89xv-2m56-2m9x | Next `<16.2.11`    | root Next           | E/F: custom-server Server Actions SSRF; deployment uses `next start`               | Next `16.3.1`                    |
| GHSA-p9j2-gv94-2wf4 | Next `<16.2.11`    | root Next           | E/F: attacker-controlled rewrite hostname SSRF; no affected rewrite contract found | Next `16.3.1`                    |
| GHSA-6g55-p6wh-862q | PostCSS `<=8.5.11` | nested Next PostCSS | C/F: build-only source-map file disclosure                                         | Next `16.3.1` → PostCSS `8.5.23` |
| GHSA-r28c-9q8g-f849 | PostCSS `<=8.5.17` | nested Next PostCSS | C/F: build-only source-map path traversal                                          | Next `16.3.1` → PostCSS `8.5.23` |
| GHSA-f88m-g3jw-g9cj | sharp `<0.35.0`    | Next optional sharp | B/F: transitive production image pipeline risk                                     | Next `16.3.1` → sharp `0.35.3`   |

P0 policy was applied to the auth-bypass-capable Next advisories because they could affect an authentication boundary. They were fixed before release certification. No P0 dependency finding remains.

## 7. Next.js

### Analysis

Installed Next `16.1.6` was affected by multiple advisories. The official Next.js July 2026 security release identifies `16.2.11` as the patched active-LTS line for the July security set. However, npm metadata showed that `16.2.11` still pins PostCSS `8.4.31` and sharp `^0.34.5`, while npm's current audit remediation for the complete production graph resolved to Next `16.3.1`.

Selected version: `16.3.1`, the current stable non-major release and the smallest version identified by the current npm audit remediation that cleared the complete production audit without unsupported dependency overrides for Next's own PostCSS/sharp dependencies.

Official references used:

- [Next.js July 2026 security release](https://nextjs.org/blog/july-2026-security-release)
- [Next.js 16.3 release information](https://nextjs.org/blog/next-16-3)
- [Next.js release v16.3.1](https://github.com/vercel/next.js/releases/tag/v16.3.1)
- [Next.js security advisories](https://github.com/vercel/next.js/security/advisories)

### Compatibility and validation

- React 19 support remains valid: Next `16.3.1` declares React `^19.0.0` and React DOM `^19.0.0` peer compatibility.
- React and React DOM stayed at `19.2.3`; no React upgrade was accepted automatically.
- Server Actions, Proxy/Middleware auth redirects, Supabase SSR/session handling, dynamic routes, and route rendering were exercised by the release smoke.
- Hydration/runtime browser diagnostics remained clean for the curated release flow.
- Production build passed with no release-significant Next, peer, or deprecated-API warning.

Status: UPDATED.

## 8. sharp

`sharp` was not a declared direct dependency. It was Next's optional production image-pipeline dependency, installed at `0.34.5` before the framework upgrade. The repository also has a non-release asset-generation script importing sharp; that script remains tooling-only and was not made into a new production dependency.

Next `16.3.1` resolves sharp to `0.35.3` and updates the platform/libvips packages. The production build passed, and the release smoke completed all image-independent route/rendering and browser diagnostics without a new runtime error.

Status: UPDATED through the Next family.

## 9. PostCSS

PostCSS had two paths:

- production/build: Next's nested `postcss@8.4.31`;
- dev/test: root `postcss@8.5.25` through Tailwind/Vite.

Next `16.3.1` updates its nested production copy to `8.5.23`. The root dev copy was already `8.5.25`. No styling-system migration or application CSS change was made. Build and release smoke passed.

Classification: build-only/tooling for the reported source-map advisories; patched because a compatible remediation was available.

Status: UPDATED through the Next family.

## 10. nanoid

`nanoid@3.3.16` was transitive and shared by both PostCSS copies. It is used in the build/source-map generator path, not as a user-controlled application identifier or financial/security identity.

The safe patch `3.3.18` was applied with the minimal root npm override:

```json
"overrides": {
  "nanoid": "3.3.18"
}
```

No application ID architecture was changed and no unused direct nanoid dependency was added.

Status: UPDATED.

## 11. Other advisories

No additional Critical or High production advisories remained after the Next and nanoid changes. The final all-dependency audit also reported zero vulnerabilities, so no Moderate/Low dev-only finding required acceptance.

## 12. Package/lockfile changes

Changed direct package declarations:

```diff
- next: 16.1.6
+ next: 16.3.1
- eslint-config-next: 16.1.6
+ eslint-config-next: 16.3.1
+ overrides.nanoid: 3.3.18
```

Expected lockfile changes include:

- Next and `@next/*` platform/compiler packages `16.1.6 → 16.3.1`;
- sharp and platform/libvips packages `0.34.5 → 0.35.3` / corresponding `1.2.x → 1.3.x` packages;
- nested Next PostCSS `8.4.31 → 8.5.23`;
- nanoid `3.3.16 → 3.3.18`;
- matching Next ESLint plugin packages.

Lockfile sanity:

- `npm ls --depth=0` passes with no invalid or extraneous package report.
- No duplicate Next framework version exists in the installed tree.
- No git, GitHub, or URL dependency was introduced; packages resolve from the npm registry.
- No new direct production package was added.
- npm reported existing install-script packages (`@swc/core`, `esbuild`, watcher/resolver packages, and fsevents); no new application install script was introduced.
- No license delta or restrictive-license finding was identified in the changed production family during this bounded review.

## 13. Critical release smoke before/after

| Gate                                         | Before | After Next | Final after nanoid |
| -------------------------------------------- | -----: | ---------: | -----------------: |
| `tests/e2e/v1-critical-flow.release.spec.ts` | 11/0/0 |     11/0/0 |             11/0/0 |

Format is passed/failed/skipped. The final clean production-server run was 11 passed, 0 failed, 0 skipped.

## 14. Stable broader E2E before/after

| Run         | Passed | Failed | Skipped | New real product failures |
| ----------- | -----: | -----: | ------: | ------------------------: |
| Before      |     67 |      3 |      42 |                         0 |
| Final after |     67 |      3 |      42 |                         0 |

The three failures remain the known stale/optional fixture-dependent checks listed in section 4. No HTTP 500/JSON corruption appeared in the serial production-server comparison. The parallel shared-server mode remains excluded from the comparison.

## 15. Security regression

Focused regression: 11 test files, 197 tests passed.

Covered:

- RPC ACL hardening 15B;
- protected RPC ownership manifest;
- ownership schema/RLS/RPC tests;
- Together lifecycle unit contract;
- Inbox producer, gateway, integration, and decision tests.

Full unit suite: 120 files, 901 tests passed.

Security status remains:

- P0-001: CLOSED;
- RPC security: READY;
- Protected RPC manifest: COMPLETE;
- unintended anonymous SECURITY DEFINER functions: 0;
- trigger bypass: NONE.

## 16. Final dependency audit

| Advisory count |                  Before | After | Applicability                                    | Resolution                                                        |
| -------------- | ----------------------: | ----: | ------------------------------------------------ | ----------------------------------------------------------------- |
| Critical       |                       0 |     0 | no Critical package advisory                     | none remaining                                                    |
| High           | 4 package-level records |     0 | Next/sharp/PostCSS/nanoid production/build paths | Next `16.3.1`, sharp `0.35.3`, PostCSS `8.5.23+`, nanoid `3.3.18` |
| Moderate       |                       0 |     0 | none in production audit                         | none remaining                                                    |

Commands and results:

- `npm audit --omit=dev --json`: exit 0, 0 vulnerabilities.
- `npm audit --json`: exit 0, 0 vulnerabilities.

## 17. Remaining accepted risk

No accepted Critical/High dependency risk remains.

The only accepted dependency-adjacent risk is operational: the repository has no pinned Node/npm version, so reproducibility relies on the canonical npm lockfile and CI/runtime toolchain policy. Pinning a toolchain is outside this prompt because it would be a release-process change rather than a vulnerability remediation.

## 18. Remaining test-infrastructure debt

P2 debt remains for the broader historical Playwright suite:

- parallel workers against a shared Next dev server can corrupt HTTP/JSON responses;
- some historical authenticated tests depend on optional generic fixtures;
- three serial comparison failures are stale/fixture-dependent and outside the V1 release gate;
- repository-wide Prettier backlog remains pre-existing and unrelated to this dependency change.

The stable serial production-server mode is sufficient for dependency comparison and release evidence. No broad E2E rewrite was made.

## 19. P0/P1/P2 status

| Priority                            | Status              | Evidence                                                            |
| ----------------------------------- | ------------------- | ------------------------------------------------------------------- |
| P0 dependency findings              | 0 remaining         | final production audit clean; auth-boundary Next advisories patched |
| P1-006 dependency advisories        | CLOSED              | all current Critical/High findings fixed; final audits clean        |
| P2 broader parallel E2E debt        | OPEN / non-blocking | serial production-server comparison available                       |
| P2 historical optional E2E coverage | OPEN / non-blocking | classified; not part of V1 release contract                         |

## 20. Release-hardening verdict

**READY.**

Dependency release hardening is complete. The framework upgrade was non-major and React-compatible. The critical financial release smoke stayed 100% green, the stable broader comparison showed no new real product failure, security remained READY, the protected RPC manifest remained COMPLETE, and the final production audit is clean.

Can proceed to final release certification: **YES**.

## 21. Recommended next prompt

Prompt 16B — Final Release Certification & Production Checklist
