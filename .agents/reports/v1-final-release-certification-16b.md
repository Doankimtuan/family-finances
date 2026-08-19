# Family Finance — V1 Final Release Certification (16B)

Date: 2026-08-19

Certification target: `main` at `f905270bda6dd675813641460be17b48a4cb9ea6`

## 1. Executive summary

Application and database correctness gates are green. The release smoke passed 11/11, the full unit suite passed 901 tests, typecheck/lint/build passed, migrations are aligned, financial integrity is clean, RPC ACL hardening is ready, and dependency audits are clean.

V1 is **NO-GO** because production operations are not yet defined or evidenced. The linked Supabase project is the configured development/test project, no production hosting target is declared in repository configuration, no production environment inventory can be confirmed, no backup/PITR and restore plan is recorded, and no production runtime monitoring target is identified.

No product feature, financial behavior, ownership model, or migration was added by 16B.

## 2. Final GO/NO-GO

**V1 RELEASE: NO-GO**

P0 remaining: **0**

P1 remaining: **4**

P2 accepted: **9**

Blocking P1 items:

- Production hosting target, runtime, and environment deployment configuration are unspecified.
- Production Supabase destination strategy is unspecified; the linked `family-finances-2` project is the development/test project used by prior certification.
- Backup/PITR availability, restore verification, and recovery ownership are not confirmed for the intended production database tier.
- Production operational monitoring and error visibility are not established for the eventual hosting target.

## 3. Release baseline

| Item                  | Result                                                                                                                                                                                         |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Branch                | `main`                                                                                                                                                                                         |
| Commit                | `f905270bda6dd675813641460be17b48a4cb9ea6`                                                                                                                                                     |
| Working tree          | Not clean; pre-existing 16A package/report changes and 14G evidence-image changes are present, along with ignored browser/test output. No production code or migration change was made by 16B. |
| Node                  | `v24.18.0`                                                                                                                                                                                     |
| npm                   | `11.16.0`                                                                                                                                                                                      |
| Supabase CLI          | `2.20.5`; linked migration commands work; project listing requires a separate CLI access token and was not used as identity evidence.                                                          |
| Supabase ref          | `bbzffxvgocjwsdbujvgn`                                                                                                                                                                         |
| Supabase project      | `family-finances-2`                                                                                                                                                                            |
| Supabase status       | `ACTIVE_HEALTHY`, region `ap-southeast-2`, PostgreSQL `17.6.1.155`                                                                                                                             |
| Local migrations      | 91 SQL files                                                                                                                                                                                   |
| Remote migration head | `20260818160000_rpc_acl_security_hardening_15b`                                                                                                                                                |
| Migration alignment   | PASS; `supabase migration list --linked` exact match and `supabase db push --linked --dry-run` reports remote up to date                                                                       |

Baseline commands:

- `npm run test`: PASS — 120 files, 901 tests.
- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS.
- `npm ci`: PASS; clean-install build PASS.
- `git diff --check`: PASS.

Unit output contains existing non-failing test warning noise from HeroUI `PressResponder` setup and intentional error-logging assertions; no test failed.

## 4. V1 production assumptions

These are accepted V1 product constraints, not release bugs:

- One active household per user.
- Maximum two adults; roles are Admin and Partner.
- Household and Personal financial scopes.
- Personal resources are visible to the household but mutable only by their owner.
- No ownership transfer.
- No private or hidden Personal finance.
- Personal goals are deferred.
- Plan is household-only.
- Health includes household-visible Personal resources.
- Household deletion is deferred.
- No children or dependents.
- No households larger than two active members.

## 5. Production environment

Production deployment configuration is **NOT READY** because no hosting target or production environment record exists in the repository. Local `.env.local` contains the development/test configuration; secret values were not printed.

| Variable                                            | Client/server                                  | Required                                                                               | Purpose                                                                  | Secret?                     | Local status           | Production status                                                            |
| --------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | --------------------------- | ---------------------- | ---------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                          | Client and server                              | Yes                                                                                    | Supabase API project URL                                                 | No                          | Present                | Unknown; must be set for chosen production project                           |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`              | Client                                         | Yes, or anon fallback                                                                  | Browser Supabase client key                                              | No, public by design        | Present                | Unknown                                                                      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`                     | Client                                         | Optional fallback                                                                      | Legacy browser client key                                                | No, public by design        | Absent                 | Optional; do not configure both without an explicit policy                   |
| `SUPABASE_SERVICE_ROLE_KEY`                         | Server only                                    | Optional for account deletion/admin tooling; not required by the core read/write paths | Supabase Auth Admin API                                                  | Yes                         | Present locally        | Unknown; never expose to browser                                             |
| `NEXT_PUBLIC_MAINTENANCE_MODE` / `MAINTENANCE_MODE` | Client-visible flag / server fallback          | Optional                                                                               | Planned maintenance shell                                                | No                          | Absent                 | Optional                                                                     |
| `APP_URL` / `SITE_URL`                              | Not consumed by application code               | No                                                                                     | None; redirects derive the browser origin                                | No                          | Not consumed           | Supabase Site URL and redirect allowlist must be configured outside the repo |
| OAuth provider configuration                        | Supabase dashboard/provider configuration      | Only for exposed providers                                                             | Google and Apple OAuth buttons are exposed by the UI                     | Provider secrets are secret | Not represented in env | Unverified for production                                                    |
| Locale/timezone settings                            | Application defaults and household preferences | No deployment env                                                                      | `en`/`vi`; household locale `en-VN`/`vi-VN`; timezone `Asia/Ho_Chi_Minh` | No                          | Code-defined           | Same contract                                                                |

## 6. Secrets/configuration

Test-only configuration is separated from normal browser/runtime code:

- `OWNERSHIP_TEST_A_EMAIL`
- `OWNERSHIP_TEST_A_PASSWORD`
- `OWNERSHIP_TEST_B_EMAIL`
- `OWNERSHIP_TEST_B_PASSWORD`
- `SUPABASE_SECRET_KEY` when used by fixture setup/cleanup
- `SUPABASE_SERVICE_ROLE_KEY` when used by fixture setup/cleanup or account deletion
- `SUPABASE_DB_PASSWORD`
- `E2E_PORT`
- `E2E_BASE_URL`
- `E2E_USER_EMAIL` / `E2E_USER_PASSWORD`

The release fixture uses service-role access only for controlled setup/cleanup. Browser actions use normal password authentication.

Secret audit:

- No tracked `.env` file.
- `.env.local`, `.playwright-cli`, and `test-results` are ignored.
- No tracked service-role/secret key value, database password, private key, or token pattern was found in the scoped source scan.
- No `NEXT_PUBLIC_` variable contains a privileged key.
- Generated screenshots contain no inspected secret values.

Status: **PASS for repository hygiene; production configuration remains incomplete.**

## 7. Supabase project/database strategy

The current linked project is `family-finances-2` (`bbzffxvgocjwsdbujvgn`). Prior 15C documentation identifies it as the configured development project. No separate production Supabase ref or explicit decision to promote this project to production is recorded.

Production Supabase strategy: **NOT READY**.

Required decision before deployment:

1. Confirm whether this project is promoted to production or a separate production project is created.
2. Record the production ref, purpose, region, ownership, and access policy.
3. Apply and verify the release migration head only against that chosen production destination.

## 8. Migration certification

PASS.

- Local and remote histories are aligned through `20260818160000`.
- `supabase db push --linked --dry-run`: remote database is up to date.
- Release-critical migrations are present remotely, including Inbox, Plan, ownership, Together, ACL hardening, Savings compatibility, investment, and EMI contract migrations.
- No migration was added or changed by 16B.
- This migration head is the V1 release schema baseline.

## 9. Financial integrity

PASS. The read-only bounded live snapshot returned zero violations for:

- ownership scope/owner contract;
- cross-household ownership;
- duplicate active memberships;
- household capacity;
- Admin continuity;
- loan remaining-principal bounds;
- active goal funding links;
- Inbox source integrity;
- saving-cycle date ordering;
- goal legacy funded-value consistency.

No production data was mutated by the certification queries. Controlled E2E fixture data was created and cleaned by the existing test harness.

## 10. Security/RLS/RPC certification

| Check                                                  | Result                                                                       |
| ------------------------------------------------------ | ---------------------------------------------------------------------------- |
| RLS on exposed public tables                           | PASS — 47/47 enabled, 0 disabled                                             |
| Anonymous SECURITY DEFINER execution                   | PASS — 1 intentional allowlist entry only                                    |
| Intentional anonymous allowlist                        | `get_invitation_preview(uuid)` only; token-scoped preview, no financial data |
| Anonymous financial helpers                            | PASS — 0                                                                     |
| Public executable internal helpers                     | PASS — 0                                                                     |
| Authenticated executable internal-helper manifest      | PASS — all 18 manifest helpers false                                         |
| Trigger bypass                                         | NONE                                                                         |
| RPC security                                           | READY                                                                        |
| Protected RPC manifest                                 | COMPLETE                                                                     |
| Default ACL for future postgres-owned public functions | PASS — postgres/service-role execution only                                  |

Live catalog snapshot: 85 public `SECURITY DEFINER` functions; anon execute 1; public execute 0; authenticated execute 63. The 63 authenticated advisor notices are the classified Class B application RPCs and Class E RLS helpers, not internal-helper exposure.

## 11. Supabase advisors/Auth hardening

Current security advisor output is the source of truth:

| Finding                                                  | Count | Classification                                                              |
| -------------------------------------------------------- | ----: | --------------------------------------------------------------------------- |
| Intentional anonymous invitation preview                 |     1 | Explained allowlist; accepted                                               |
| Authenticated SECURITY DEFINER application/RLS functions |    63 | Explained Class B/E allowlist; accepted                                     |
| Mutable search path on `savings_simple_interest`         |     1 | P2; immutable, non-SECURITY-DEFINER helper with anon/auth execute false     |
| Leaked-password protection informational notice          |     1 | P2 optional Auth hardening; not release-blocking without a tier requirement |

Security advisor status: **READY WITH EXPLAINED ALLOWLIST AND ACCEPTED P2 HARDENING**.

Performance advisors currently report 114 notices: 90 unindexed foreign keys, 23 unused indexes, and 1 Auth RLS init-plan notice. These are accepted P2 scale debt; no blind index change was made.

Leaked-password protection should be enabled in the production Auth configuration if the chosen tier supports it. If unavailable, retain the documented acceptance rationale.

## 12. Dependency certification

PASS.

- `npm audit --omit=dev`: 0 vulnerabilities.
- `npm audit`: 0 vulnerabilities.
- Critical: 0.
- High: 0.
- Moderate: 0.
- `npm ls --depth=0`: valid tree with no invalid or extraneous root packages.
- No dependency upgrade was made by 16B.

## 13. Critical release smoke

PASS against a clean production server started with `next start` on port 3152.

`tests/e2e/v1-critical-flow.release.spec.ts`:

```text
11 passed
0 failed
0 skipped
```

The same 11 critical tests passed again inside the stable broader serial run.

Smoke fixture safety:

- dedicated A/B identities;
- controlled household;
- normal browser password auth;
- service role only for setup/cleanup;
- controlled financial data cleaned after the run;
- no developer accounts used.

Browser diagnostics collected by the smoke suite had zero console errors, page errors, and non-aborted failed requests. Next emitted standard React streaming `destination stream closed early` messages during browser navigation teardown; these were abort noise, not failed browser assertions or failed requests.

## 14. Stable broader E2E

Stable mode: one fresh production `next start` server, Playwright workers set to 1, dedicated identity supplied.

Current result:

```text
68 passed
2 failed
42 skipped
```

The two failures are the known historical Home-shell checks. The supplied valid fixture identity lands on onboarding, so `/en/home` and `/vi/home` do not expose the legacy expected product BottomNav assertion. The Together authenticated lifecycle passed this run. Compared with 16A’s 67/3/42 final baseline, there is no new real product regression; the known Together fixture failure did not reproduce this run.

The shared parallel Next dev-server mode remains excluded from release evidence and is accepted P2 test-infrastructure debt.

## 15. Domain certification

| Domain                 | Status | Evidence                                                                                         |
| ---------------------- | ------ | ------------------------------------------------------------------------------------------------ |
| Money/account creation | PASS   | Critical smoke account creation and receipt                                                      |
| Income/expense         | PASS   | Critical smoke records both and verifies history                                                 |
| Transfer               | PASS   | Critical smoke verifies neutral receipt; 15C/ledger evidence covers two legs and balance effects |
| Savings                | PASS   | Critical smoke create/list/detail plus 15C restored compatibility helper/backfill path and ACL   |
| Investments            | PASS   | Critical smoke verifies quantity and unit-price semantics                                        |
| Loans/debt             | PASS   | Critical smoke verifies loan and liability details; EMI contract remains deployed                |
| Goals/Plan             | PASS   | Critical smoke verifies Plan, Goals, and detail; Plan remains household-only                     |
| Health                 | PASS   | Critical smoke verifies Health and insights; read-only contract retained                         |
| Inbox                  | PASS   | Critical smoke verifies decision to terminal state; canonical six-kind taxonomy retained         |
| Together               | PASS   | Stable serial lifecycle passed; 14G former-member/admin/rejoin evidence retained                 |

No new financial behavior was introduced. Health has no mutation API. Personal activity is not silently included in household Plan calculations.

## 16. Auth/onboarding

Auth shell, login/register, OAuth entry, invalid-credential mapping, sign-out, and redirect guards pass the available unit and browser evidence. The critical smoke exercises authenticated onboarding/home entry with the dedicated fixture.

A blank, never-used first-user browser run was not independently captured in 16B; onboarding bootstrap behavior remains covered by the existing create-household unit contract, route smoke, and deterministic release fixture. This is retained as P2 evidence debt, not treated as a new product failure.

Production Auth configuration remains part of the P1 deployment prerequisite: email confirmation policy, password policy, Site URL, allowed callback URLs, and actual Google/Apple provider enablement must be verified in the chosen production Supabase project.

## 17. Responsive/accessibility/localization

Status: **PASS for the release spot-check evidence**.

- Critical shell checks cover the intentional single-column layout at 390, 440, 768, and 1280 widths.
- 14G evidence covers Together at 390, 440, 768, and 1280 plus former-member and owner-unavailable states.
- Critical release surfaces cover Home, Money, create form, Plan, Health, Inbox, and Together through the release and stable lifecycle suites.
- Existing browser checks cover labels, accessible names, keyboard-capable controls, dialog/focus behavior, and non-color status.
- English and Vietnamese message catalogs load in unit tests; critical auth and Together paths retain localized copy.
- No raw localization key was observed in the release-critical evidence.

Minor historical visual/formatting debt remains outside the release gate.

## 18. Deployment platform/toolchain

Deployment platform: **NOT READY**.

Repository inspection found no Vercel, Netlify, Render, Railway, Fly, Docker, GitHub Actions, Sites, or other hosting configuration. The available runtime contract is only:

- build: `npm run build`;
- start: `npm run start` / `next start`;
- package manager: npm with `package-lock.json`.

Node/npm are not pinned by `package.json`, `.nvmrc`, `.node-version`, or platform config. Development/CI used Node `24.18.0` and npm `11.16.0`; production runtime is unknown. Select and document a supported production Node major compatible with CI before deployment.

## 19. Backup/recovery

Backup/recovery: **NOT READY**.

No production tier, Supabase backup/PITR setting, restore test, recovery owner, or recovery-time decision is recorded. The minimum required production checklist is:

- confirm Supabase backup/PITR availability for the chosen tier;
- record the migration history and release schema head;
- verify restore access or a documented support-assisted restore path;
- retain the previous frontend commit/deployment for rollback;
- preserve production environment/secret recovery procedures;
- define who decides between frontend rollback, forward-fix migration, and database restore.

Development data reset is acceptable only before production launch. After launch, destructive database reset is not an ordinary deployment mechanism.

## 20. Monitoring/error visibility

Monitoring/error visibility: **NOT READY** for production certification.

The application has typed error categories and safe server logging, and Supabase logs are queryable. However, no production hosting target, deployment health check, server-exception sink, or Auth/financial alert destination is configured in the repository. Do not add a large observability stack in 16B; choose the hosting/platform-native visibility and record the operational owner before GO.

Financial operation logging remains safe by contract: no passwords, tokens, service-role keys, or complete private financial payloads are logged. Diagnostic context is limited to safe operation/error categories and existing identifiers.

## 21. Repository hygiene

The worktree is intentionally not clean and must not be auto-reset:

- Production/package change: staged `package.json` and `package-lock.json` from 16A.
- Report change: staged `dependency-release-hardening-16a.md` from 16A.
- Evidence artifacts: staged/unstaged Together screenshots under `output/playwright/`.
- 16B report: this file, created as the certification artifact.
- No production application code or migration change from 16B.
- No commit was created by 16B.

The generated browser CLI state is ignored. `.env.local` is ignored and untracked. Secret scan and `git diff --check` pass.

## 22. Remaining P0/P1/P2

### P0 — 0

No authentication-boundary, financial-correctness, secret-exposure, ACL/RLS, migration, or critical-smoke P0 remains.

### P1 — 4

1. Define the production hosting target, runtime, deployment command, and production environment inventory.
2. Define the production Supabase project strategy; the linked project is development/test.
3. Confirm backup/PITR and a viable restore/recovery procedure for real user data.
4. Establish production monitoring, deployment health checks, and safe Auth/financial error visibility.

### P2 — 9 accepted

1. `savings_simple_interest` mutable search-path advisor notice; helper is immutable, non-SECURITY-DEFINER, and not client-executable.
2. Optional leaked-password protection pending production-tier decision.
3. Supabase performance-advisor backlog: 114 notices.
4. Shared parallel Next dev-server Playwright instability.
5. Historical broader E2E fixture debt: 2 known failures and 42 skips in the stable run.
6. Repository-wide Prettier backlog, explicitly outside release scope.
7. Node/npm runtime pinning and CI/production compatibility documentation.
8. Fresh disposable local-schema replay was not available in this checkout.
9. Fresh blank-user onboarding evidence and accepted V1 scope deferrals (ownership transfer, personal goals/Plan, hidden finance, household deletion, dependents, and >2 members).

## 23. Release checklist

### Code

- [x] Unit suite — 120 files / 901 tests.
- [x] Typecheck.
- [x] Lint.
- [x] Production build.

### Security

- [x] RPC ACL regression and protected RPC manifest.
- [x] RLS representative certification; 47/47 public tables enabled.
- [x] Security advisors classified with explained allowlist and accepted P2 notices.
- [x] Production and full dependency audits clean.
- [x] Repository secret scan.

### Database

- [x] Migrations aligned.
- [x] Bounded integrity checks zero violations.
- [ ] Backup/PITR and restore strategy confirmed for production.
- [ ] Production project/destination confirmed.

### Browser

- [x] Critical production-server smoke — 11/0/0.
- [x] Browser diagnostics — no unexplained console/page/request errors.
- [x] Responsive spot-check evidence at 390/440/768/1280.
- [x] English/Vietnamese critical-copy check.

### Operations

- [ ] Production environment variables inventoried and configured on the chosen host.
- [ ] Deployment platform and supported Node runtime confirmed.
- [x] Frontend rollback and forward-fix/DB rollback policy defined in this report.
- [ ] Monitoring and error visibility confirmed.
- [ ] Production Auth URLs/provider/password settings confirmed.

## 24. Deployment steps

Do not execute until the four P1 items are closed.

1. Choose and record the production hosting target and supported Node/npm runtime.
2. Choose and record the production Supabase project/ref; do not use the development project by accident.
3. Confirm database backup/PITR and recovery access.
4. Configure only the production environment variables listed in section 5; keep service-role credentials server-only.
5. Configure Supabase Site URL, allowed callback URLs, email behavior, and only the OAuth providers exposed by the UI.
6. Verify local/remote migration state for the chosen production project; apply pending migrations only through the approved migration process.
7. Run `npm ci` and `npm run build` in the deployment environment.
8. Deploy the frontend using the chosen platform’s documented runtime/start command.
9. Run the production-safe read smoke and inspect application, Auth, Postgres, and deployment logs.
10. Run the critical release smoke only against the dedicated release-test household if write validation is explicitly approved.
11. Record migration head, deployment commit, smoke result, advisor result, and release owner sign-off.

## 25. Post-deployment smoke plan

Plan status: **READY**, pending a production URL and approved release-test policy.

Read-only smoke for a normal user account:

- login and session refresh;
- Home;
- Money read;
- Plan read;
- Health read;
- Inbox read;
- Together read;
- 404, unauthorized redirect, generic error, and offline shell.

Do not create uncontrolled financial records. Any write smoke must use the dedicated release-test household and the existing setup/cleanup harness, never a real user household.

## 26. Rollback triggers

Rollback or stop rollout on any of the following:

- authentication or session boundary failure;
- household creation failure;
- financial write returning unexpected 5xx or malformed success;
- balance, transfer-leg, savings, investment, loan, or goal inconsistency;
- critical migration error or unexpected schema drift;
- new anonymous RPC execution or RLS regression;
- security advisor regression exposing a privileged function;
- production deployment/build health failure;
- no viable database recovery path after an incident.

Frontend rollback is a previous deployment/commit rollback. Database rollback is not assumed to be automatic: use a tested explicit rollback migration only where safe, otherwise use a forward-fix migration or approved database restore.

## 27. Final release baseline versions

| Component           | Release baseline                                            |
| ------------------- | ----------------------------------------------------------- |
| Next.js             | `16.3.1`                                                    |
| React               | `19.2.3`                                                    |
| React DOM           | `19.2.3`                                                    |
| sharp               | `0.35.3`                                                    |
| PostCSS             | `8.5.25` root; `8.5.23` nested under Next                   |
| nanoid              | `3.3.18` via npm override                                   |
| Node                | `24.18.0` used for certification; production not yet pinned |
| npm                 | `11.16.0` used for certification                            |
| Supabase PostgreSQL | `17.6.1.155` on linked project                              |
| Release schema head | `20260818160000_rpc_acl_security_hardening_15b`             |

## 28. Final verdict

```text
PROMPT 16B COMPLETE

V1 RELEASE: NO-GO

P0 remaining: 0
P1 remaining: 4
P2 accepted: 9

Unit/typecheck/lint/build: PASS
Critical release smoke: PASS
Critical smoke: 11/0/0
RPC security: READY
Protected RPC manifest: COMPLETE
Supabase security: READY
Dependency audit: READY
Financial integrity: PASS
Migrations: READY
Production environment: NOT READY
Production Supabase strategy: NOT READY
Backup/recovery: NOT READY
Deployment platform: NOT READY
Secrets hygiene: PASS
Post-deployment smoke plan: READY

Remaining blockers:
- Define production hosting/runtime and production environment configuration.
- Define the production Supabase project/destination strategy.
- Confirm backup/PITR and recovery procedure for real user data.
- Establish production monitoring and error visibility.

Accepted post-release debt:
- One non-privileged mutable-search-path helper advisor notice.
- Optional leaked-password protection.
- Performance-advisor backlog.
- Parallel shared-dev-server E2E instability.
- Historical stale/fixture-dependent E2E failures and skips.
- Repository-wide formatting backlog.
- Unpinned Node/npm production runtime.
- No disposable local-schema replay evidence.
- Blank-user evidence gap and explicitly deferred V1 scope.

Release schema baseline:
20260818160000_rpc_acl_security_hardening_15b

Release dependency baseline:
Next 16.3.1; React/React DOM 19.2.3; sharp 0.35.3; PostCSS 8.5.25 root / 8.5.23 nested; nanoid 3.3.18; Node 24.18.0 certification runtime; npm 11.16.0 certification toolchain.

Recommended action:
FIX BLOCKERS BEFORE DEPLOY
```
