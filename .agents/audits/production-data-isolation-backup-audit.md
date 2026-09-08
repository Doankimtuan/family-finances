# Production Data Isolation & Backup/Recovery Audit

| Field        | Value                                                                               |
| ------------ | ----------------------------------------------------------------------------------- |
| Date         | 8 Sep 2026                                                                          |
| Role         | Production Reliability Engineer / Database Recovery Auditor                         |
| Scope        | Read-only production data isolation, backup, restore, and recovery readiness        |
| Code changes | Report only (this file)                                                             |
| Predecessor  | `.agents/audits/production-operations-readiness.md`                                 |
| Safety       | No INSERT/UPDATE/DELETE, no migrations, no restores, no setting changes, no deploys |

This audit independently re-verified the live project boundary. It does not assume `family-finances-2` is production merely because the name exists.

## Executive Summary

ViNha has **one active hosted database** and **no separately named production environment**.

That database is Supabase project **`family-finances-2`** (`bbzffxvgocjwsdbujvgn`, `ap-southeast-2`, `ACTIVE_HEALTHY`, Postgres 17). It currently holds **3 households**, **12 accounts**, **23 transactions**, **30 savings**, **21 investment holdings**, and an ENA holding that matches a committed UUID data-fix migration. Five `pg_cron` jobs run against it. Local `.env.local`, the Supabase CLI link, E2E/global setup, fixture scripts, and market cron all target this same project.

The repository **labels this project “development”** (`scripts/assert-development-supabase.mjs`). That label is false as an isolation boundary: two of the three households have **no** `@example.com` members, so they are not leftover named fixtures. The project is the **de facto production / sole live financial store**.

Normal developer commands can mutate it:

- `npm run dev` writes through the Next.js app to `family-finances-2`.
- `npm run test:e2e` runs `tests/e2e/global-setup.ts` → `scripts/e2e-auth-fixture.mjs setup`, which uses the **service-role** key to create Auth users, a household, accounts, Plan rules, and investment holdings.
- Several Playwright specs then run additional service-role fixtures that attach to `E2E_USER_EMAIL`’s household.

The organization plan is **`free`**. Official Supabase documentation states that downloadable/restorable daily backups, PITR, and “restore to a new project” are **paid-plan capabilities**. This repository has **no dump script, no dump artifact, and no restore runbook**. Backup existence was **not** confirmed in the Dashboard backup UI (no MCP backup-list tool). Operationally, there is **no credible, team-executable recovery path**.

**Answer to the blocking question:**

> Is it technically possible for a developer running a normal test/benchmark command to mutate production data?

**Yes** for the sole live database (`npm run test:e2e`, `npm run e2e:fixture:setup`, and most fixture scripts). Default **benchmark** commands currently **refuse** hosted targets unless override flags are set.

**Gate:** `DATA RECOVERY BLOCKED`

---

## Production Boundary

### What was inspected

| Source                                             | Result                                                          | Status                                         |
| -------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------- |
| MCP `list_projects`                                | Four org projects; only `family-finances-2` is `ACTIVE_HEALTHY` | VERIFIED                                       |
| MCP `get_project`                                  | `bbzffxvgocjwsdbujvgn`, region `ap-southeast-2`                 | VERIFIED                                       |
| MCP `get_organization`                             | Org plan = `free`                                               | VERIFIED                                       |
| Local `.env.local` `NEXT_PUBLIC_SUPABASE_URL` host | `bbzffxvgocjwsdbujvgn.supabase.co`                              | VERIFIED (hostname only; values not published) |
| `supabase/.temp/project-ref`                       | `bbzffxvgocjwsdbujvgn`                                          | VERIFIED                                       |
| `supabase/.temp/linked-project.json`               | `name=family-finances-2`                                        | VERIFIED                                       |
| `supabase/config.toml`                             | Absent                                                          | VERIFIED                                       |
| `supabase/functions/`                              | Absent; MCP `list_edge_functions` = `[]`                        | VERIFIED                                       |
| MCP `list_branches`                                | `[]`                                                            | VERIFIED                                       |
| `.github/workflows/`                               | Empty                                                           | VERIFIED                                       |
| Hosting config (`vercel.json`, Dockerfile)         | Absent                                                          | VERIFIED                                       |

### Project inventory (this org)

| Project             | Ref                    | Region         | Status           | Relationship to ViNha                                                                  |
| ------------------- | ---------------------- | -------------- | ---------------- | -------------------------------------------------------------------------------------- |
| `family-finances-2` | `bbzffxvgocjwsdbujvgn` | ap-southeast-2 | `ACTIVE_HEALTHY` | Sole live app database. Created 2026-08-01.                                            |
| `family-finances`   | `pcvckvfgfnvqahtuuadl` | ap-southeast-1 | `INACTIVE`       | Older namesake. Not used by current `.env.local` or CLI link. Residual collision risk. |
| `my-wedding`        | `lfremgnutasmckuwxeuk` | ap-southeast-1 | `INACTIVE`       | Unrelated.                                                                             |
| `Itinera`           | `aisaoygdvixlxlmlntaq` | ap-northeast-1 | `INACTIVE`       | Unrelated.                                                                             |

### Is `family-finances-2` production?

**Not by documented name. Yes as the only live financial database.**

Evidence it is **not** a declared production environment:

- `scripts/assert-development-supabase.mjs` hard-codes this ref/name/region as the **allowed development** target.
- Prior reports (`.agents/reports/v1-baseline-final-certification-23e2.md`, performance audit) call it the “development project”.
- There is no `.env.production` file, no host project, no production marker (`APP_ENV` / `SUPABASE_ENVIRONMENT` unset locally).

Evidence it **is** the production-boundary database:

- Only `ACTIVE_HEALTHY` ViNha project.
- Holds non-fixture financial rows (counts below).
- Hosts live `pg_cron` (month ritual + four market-price HTTP jobs).
- Local app, E2E, CLI, and service-role scripts all use it.
- ENA UUID data-fix migration still matches a live holding (`ena_holding_present = 1`).

The older project named `family-finances` is **not** current production. It is inactive. Treating it as a backup is **unsafe and unverified**.

### Environment targeting

| Question                                    | Answer                                                                                                                                                        | Status                                 |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| Which Supabase project is production?       | **Undefined in config.** De facto live store = `family-finances-2`.                                                                                           | VERIFIED / INFERRED                    |
| What do local development commands use?     | Hosted `family-finances-2` via `.env.local`. No local Docker stack config.                                                                                    | VERIFIED                               |
| What do E2E tests use?                      | Same URL + service-role from `.env.local`. No project allowlist in `assertE2EEnvironmentPolicy()`.                                                            | VERIFIED                               |
| What do benchmarks/load tests use?          | Same URL, but fail-closed unless `VINHA_PERF_ALLOW_HOSTED=1` and hostname match. Local flags currently `UNSET`.                                               | VERIFIED                               |
| What do scheduled jobs use?                 | `pg_cron` inside `family-finances-2`. Market jobs HTTP-post to an app URL stored in Vault (value not read).                                                   | VERIFIED (jobs) / UNVERIFIED (app URL) |
| Are credentials shared?                     | **Yes.** One `.env.local` supplies browser publishable key, server secret/service-role, DB password, E2E users, and market sync secrets for the same project. | VERIFIED                               |
| Can tests write to the live DB?             | **Yes.** `npm run test:e2e` is sufficient.                                                                                                                    | VERIFIED                               |
| Can local development write to the live DB? | **Yes.** `npm run dev` uses the same URL. A real login writes real rows.                                                                                      | VERIFIED                               |

### Live cardinality (aggregates only; no household names or amounts)

| Entity                                                       | Count        |
| ------------------------------------------------------------ | ------------ |
| Households (total)                                           | 3            |
| Named E2E/ownership/together/release/perf fixture households | 0            |
| Non-fixture-named households                                 | 3            |
| Households with `@example.com` members                       | 1            |
| Non-example members in that example.com household            | 0            |
| Household members                                            | 5            |
| Auth users                                                   | 37           |
| `@example.com` Auth users                                    | 31           |
| Accounts                                                     | 12           |
| Transactions                                                 | 23           |
| Jars                                                         | 10           |
| Jar period snapshots                                         | 9            |
| Goals / goal funding links                                   | 0 / 0        |
| Savings / saving cycles                                      | 30 / 31      |
| Loans / liabilities                                          | 0 / 0        |
| Investment holdings / operations / valuations                | 21 / 21 / 15 |
| Market sync runs                                             | 16           |
| Cron succeeded / failed (all stored run details)             | 73 / 0       |

Interpretation:

- Two households have **no** `@example.com` members → not leftover named test fixtures.
- One household is example.com-only with a **non-fixture name** → test pollution already mixed into the live project.
- 31 leftover `@example.com` Auth users vs 3 households → E2E/fixture cleanup has not been complete historically.

---

## Database Consumer Map

Credential types:

- **anon/publishable** — `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`); RLS-bound.
- **user session** — authenticated JWT via `@supabase/ssr` cookies.
- **service-role / secret** — `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`; bypasses RLS.
- **DB password** — `SUPABASE_DB_PASSWORD` present locally; `DATABASE_URL` unset.
- **direct Postgres** — CLI/MCP/SQL as platform `postgres` (this audit used MCP `execute_sql` SELECT-only).

| Consumer                                                   | Environment                              | Supabase Project                                              | Credential Type                                         | Read         | Write                                                  | Risk                        |
| ---------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------- | ------------ | ------------------------------------------------------ | --------------------------- |
| Next.js App Router (RSC/pages)                             | Local `.env.local` (intended prod later) | `family-finances-2`                                           | user session + publishable                              | Yes          | Yes (Server Actions / RPCs)                            | High — live data            |
| Browser client `createSupabaseBrowserClient`               | Browser bundle                           | same URL                                                      | publishable                                             | Yes          | Limited by RLS                                         | Medium                      |
| Server client `createSupabaseServerClient`                 | Node server                              | same                                                          | publishable + cookies                                   | Yes          | Yes                                                    | High                        |
| Route handler / `updateSession` (`proxy.ts`)               | Edge/Node                                | same                                                          | publishable + cookies                                   | Session only | Cookie refresh                                         | Low                         |
| API `POST /api/admin/market-price-sync`                    | Any reachable app URL                    | same                                                          | Bearer `MARKET_PRICE_SYNC_SECRET` then **service-role** | Yes          | Yes (prices/FX)                                        | High if URL leaked          |
| API `POST /api/admin/market-catalog-sync`                  | same                                     | same                                                          | catalog secret + service-role                           | Yes          | Yes                                                    | High                        |
| `createSupabaseAdminClient` (market sync, `deleteAccount`) | Server-only (`import "server-only"`)     | same                                                          | service-role                                            | Yes          | Yes                                                    | High; not in browser barrel |
| Health queries                                             | Product `/health`                        | same                                                          | user session via wrapped read-only client               | Yes          | No (BR-24 wrapper)                                     | Low                         |
| Playwright `npm run test:e2e`                              | Local app + hosted DB                    | `family-finances-2`                                           | publishable + service-role + E2E passwords              | Yes          | **Yes**                                                | **P0**                      |
| `scripts/e2e-auth-fixture.mjs`                             | E2E global setup/teardown                | same                                                          | service-role                                            | Yes          | Users, household, accounts, jars, investments, deletes | **P0**                      |
| `scripts/ownership-test-harness.mjs`                       | `e2e:fixture:*`, release/together specs  | same                                                          | service-role                                            | Yes          | Users/households/fixtures/cleanup                      | **P0**                      |
| `scripts/seed-e2e-fixtures.mjs`                            | Manual                                   | same                                                          | service-role                                            | Yes          | Mutates **E2E user’s household**                       | **P0**                      |
| `scripts/savings-lifecycle-fixture.mjs`                    | savings E2E                              | same                                                          | service-role                                            | Yes          | Savings/providers on E2E household                     | **P0**                      |
| `scripts/loans-fixture.mjs`                                | loans E2E                                | same                                                          | service-role                                            | Yes          | Loans on E2E household                                 | **P0**                      |
| `scripts/home-product-summary-fixture.mjs`                 | home E2E                                 | same                                                          | service-role                                            | Yes          | Home fixture rows on E2E household                     | **P0**                      |
| `scripts/inbox-populated-fixture.mjs`                      | inbox E2E                                | same                                                          | service-role                                            | Yes          | Inbox rows on E2E household                            | **P0**                      |
| `scripts/plan-valuation-fixture.mjs`                       | plan E2E                                 | same                                                          | service-role                                            | Yes          | Goals/valuations on E2E household                      | **P0**                      |
| `scripts/perf-10k-transaction-fixture.mjs`                 | Manual benchmark                         | localhost default; hosted only with flags                     | service-role                                            | Yes          | Dedicated `VINHA_PERF_BENCHMARK_DO_NOT_USE` household  | Medium (override)           |
| `scripts/perf-balance-benchmark.mjs`                       | Manual                                   | same guard                                                    | service-role                                            | Yes          | Read-only of perf household                            | Medium (override)           |
| Vitest `npm run test`                                      | Unit                                     | mocked in inspected financial command tests                   | none (mocked)                                           | No live      | No live                                                | Low                         |
| `pg_cron` (5 jobs)                                         | Hosted UTC                               | `family-finances-2`                                           | database owner / `net.http_post` + Vault                | Yes          | Yes (ritual + HTTP)                                    | High                        |
| Edge Functions                                             | n/a                                      | none deployed                                                 | n/a                                                     | No           | No                                                     | None                        |
| Supabase CLI (`supabase/.temp` link)                       | Developer machine                        | `family-finances-2`                                           | CLI token + DB                                          | Yes          | Yes if `db push` / query run                           | **P1**                      |
| MCP `execute_sql`                                          | This audit                               | `family-finances-2`                                           | platform SQL                                            | Yes          | **Capable**; this audit ran SELECT only                | High if misused             |
| Migration files / `migrations:validate`                    | Repo                                     | checksum of baseline file only                                | n/a                                                     | n/a          | Does not apply SQL                                     | Low                         |
| `scripts/assert-development-supabase.mjs`                  | Unused by npm scripts                    | Encodes `family-finances-2` as **allowed destructive target** | env URL                                                 | n/a          | Would **permit** live-DB destruction if wired          | High (mislabel)             |

No consumer currently targets a dedicated production project, a local `supabase start` database, or a recovery clone.

---

## Credential Boundary Audit

| Check                                             | Classification | Evidence                                                                                                                                                                                                 |
| ------------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Service-role imported from client/browser factory | **SAFE**       | `admin.ts` uses `import "server-only"`. Platform barrel does **not** re-export admin.                                                                                                                    |
| Service-role in `NEXT_PUBLIC_*`                   | **SAFE**       | `getSupabaseEnv()` only reads URL + publishable/anon.                                                                                                                                                    |
| Production credentials committed to git           | **SAFE**       | `.gitignore` `.env*`; `git ls-files` tracks only `.env.local.example` and `.env.production.example`. Placeholders only.                                                                                  |
| Production credentials in test fixtures in git    | **SAFE**       | Unit tests stub `sb_publishable_test` / `sb_secret_modern`. No live JWT committed.                                                                                                                       |
| Production credentials in benchmark scripts       | **WARNING**    | Scripts read process env; they do not embed keys. Default hosted path is fail-closed.                                                                                                                    |
| Production credentials in local `.env.local`      | **WARNING**    | Present: publishable, `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_PASSWORD`, E2E/ownership passwords, market secrets. File is gitignored. Same file is the E2E/service-role source. |
| Scripts default to production                     | **BLOCKER**    | There is no other active project. Default URL **is** the live store.                                                                                                                                     |
| Scripts silently fall back to production          | **WARNING**    | No explicit fallback to another ref. They load `.env.local` via `@next/env`.                                                                                                                             |
| Shared credentials across environments            | **BLOCKER**    | One credential set for local, E2E, cron-adjacent secrets, and live data.                                                                                                                                 |
| `assert-development-supabase.mjs`                 | **WARNING**    | The only project-identity guard **allows** `family-finances-2` and is **not** called by npm/E2E/fixture scripts.                                                                                         |
| `assertE2EEnvironmentPolicy()`                    | **WARNING**    | Only checks email/password pairing. **No** project-ref check.                                                                                                                                            |
| Fixture `auth.admin.listUsers({ perPage: 1000 })` | **WARNING**    | Service-role enumerates **all** Auth users (including non-test) in the Node process.                                                                                                                     |
| Vault secrets                                     | **UNVERIFIED** | Names referenced in migrations; values not read (policy).                                                                                                                                                |

No secret **values** are included in this report.

---

## E2E / Benchmark Safety

### Can a normal command mutate the live database?

| Command                                         | Mutates `family-finances-2`?                           | Notes                                                                                          |
| ----------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `npm run test` (Vitest)                         | **No** (inspected command tests mock Supabase)         | Do not treat as a live-DB gate.                                                                |
| `npm run test:e2e`                              | **Yes**                                                | `globalSetup` always runs `e2e-auth-fixture.mjs setup`.                                        |
| `npm run test:e2e:smoke` / `e2e:auth-check`     | **Yes** if Playwright config loads (same globalSetup). |                                                                                                |
| `npm run e2e:fixture:setup` / `cleanup`         | **Yes**                                                | Ownership harness, service-role.                                                               |
| `npm run test:e2e:release`                      | **Yes**                                                | Calls ownership harness `release-23d-setup`.                                                   |
| `node scripts/seed-e2e-fixtures.mjs`            | **Yes**                                                | Writes into **E2E user’s existing household**.                                                 |
| `node scripts/savings-lifecycle-fixture.mjs`    | **Yes**                                                | Same household-resolution pattern. Invoked from `savings.smoke.spec.ts` `beforeAll`.           |
| `node scripts/perf-10k-transaction-fixture.mjs` | **Not by default**                                     | Throws unless local host or `VINHA_PERF_ALLOW_HOSTED=1` + exact hostname. Local flags `UNSET`. |
| `node scripts/perf-balance-benchmark.mjs`       | **Not by default**                                     | Same hosted refuse.                                                                            |
| `npx supabase db push` (not an npm script)      | **Yes if run**                                         | CLI linked to live project. No migrate-on-deploy job, but a developer can apply SQL.           |

**BLOCKER:** `npm run test:e2e` is a normal, documented command (`README.md`, `package.json`). It is technically sufficient to create Auth users and financial rows on the only live database.

### What E2E/fixtures can create or destroy

| Action                    | Evidence                                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Create users              | `e2e-auth-fixture` `auth.admin.createUser`; ownership harness `ensureUser`                                         |
| Create households         | e2e-auth-fixture; ownership harness `ensureHousehold`                                                              |
| Create transactions       | seed-e2e cash top-up; Playwright UI flows against live app; 10k fixture (guarded)                                  |
| Create accounts           | e2e-auth-fixture transfer/cash/settlement accounts                                                                 |
| Create jars / plan rules  | e2e-auth-fixture `jar_plans` upsert                                                                                |
| Create goals              | `plan-valuation-fixture.mjs`                                                                                       |
| Create savings            | `savings-lifecycle-fixture.mjs`                                                                                    |
| Create loans              | `loans-fixture.mjs`                                                                                                |
| Create investments        | e2e-auth-fixture holdings + valuations                                                                             |
| Modify financial data     | All of the above use service-role (RLS bypass)                                                                     |
| Reset / truncate whole DB | **No** repo script issues `TRUNCATE` of all tables. Baseline **grants** TRUNCATE to `service_role`/`postgres`.     |
| Run migrations            | Not part of Playwright. CLI can.                                                                                   |
| Cleanup                   | Teardown deletes fixture household/user **if** ownership checks pass. Historical residue: 31 `@example.com` users. |

### Fixture isolation quality

**Better than unconstrained wipes, not sufficient as a production boundary.**

- `e2e-auth-fixture` cleanup: requires fixture metadata on the Auth user and refuses households with another member; deletes by household id + name prefix.
- Ownership harness cleanup: refuses if the named household contains a non-dedicated user.
- **Weaker:** `savings-lifecycle-fixture`, `seed-e2e-fixtures`, `home-product-summary-fixture`, `inbox-populated-fixture`, `plan-valuation-fixture`, `loans-fixture` resolve `household_id` from `E2E_USER_EMAIL`’s **active membership**. If that email is ever a member of a real household, service-role writes go there. There is no project-ref guard and no “fixture-owned household only” assertion on those scripts.

Current membership snapshot: the one example.com household has **zero** non-example members, so today’s `E2E_USER_EMAIL` (`@example.com`) is **unlikely** to be inside the two non-example households. That is **not** a control. It is an accident of current data.

Shared-database effects still apply: Auth user churn, schema/migration risk, cron interaction, and service-role accidents.

---

## Backup Availability

| Capability                                              | Status                                 | Evidence                                                                                                                                                                                                               |
| ------------------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Org plan                                                | VERIFIED `free`                        | MCP `get_organization`                                                                                                                                                                                                 |
| Automated daily backups (Pro/Team/Enterprise)           | **INFERRED unavailable**               | [Database Backups](https://supabase.com/docs/guides/platform/backups): “We automatically back up all Pro, Team, and Enterprise Plan projects on a daily basis.” Free-tier guidance is CLI `db dump` + off-site copies. |
| Downloadable backups                                    | **INFERRED unavailable**               | [Production Checklist](https://supabase.com/docs/guides/deployment/going-into-prod): “Database backups are not available for download for Free Plan projects.”                                                         |
| PITR                                                    | **INFERRED unavailable**               | PITR is a paid add-on; requires Pro+ and Small compute. Org is free.                                                                                                                                                   |
| Backup frequency                                        | **UNVERIFIED** in Dashboard            | No MCP `list_backups`. Dashboard backup UI was not opened.                                                                                                                                                             |
| Retention                                               | **UNVERIFIED** / **UNDEFINED** in repo | No policy file.                                                                                                                                                                                                        |
| Independent off-site copy                               | **VERIFIED absent**                    | No dump script, no dump artifact (`**/*dump*` empty), no `pg_dump` wrapper. `archive/backups` mentioned in `.gitignore` as unused local tarball pattern.                                                               |
| Evidence backups completed                              | **UNVERIFIED**                         | Cannot list backup objects.                                                                                                                                                                                            |
| Financial tables included if a dump were taken          | **INFERRED yes**                       | They live in `public` on this Postgres. No dump exists to prove it.                                                                                                                                                    |
| Functions/RPCs/RLS/cron/extensions in a platform backup | **UNVERIFIED**                         | Would depend on backup type (logical vs physical). Not operable today.                                                                                                                                                 |
| Restore-to-new-project                                  | **INFERRED unavailable**               | [Clone project](https://supabase.com/docs/guides/platform/clone-project): paid plans + physical backups.                                                                                                               |

Do **not** treat “Supabase automatically backs it up” as operationally proven. For this org/plan, official docs recommend **manual dumps**. None are present.

Free-plan additional risk (docs): inactive projects **may be paused** after 7 days. `family-finances` is already `INACTIVE`. That project is **not** a verified backup of `family-finances-2`.

---

## Restore Capability

| Question                                              | Answer                                                                                                                                                                                                                | Status                |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| Can a backup be created?                              | Logical dump **could** be created with `supabase db dump` / `pg_dump` using existing CLI link + DB password. **Not documented, not scheduled, not stored.** Platform daily backups: not a free-plan operator feature. | INFERRED / UNVERIFIED |
| Can a backup be restored into a **separate** project? | Dashboard “Restore to a new project” is paid-plan. Manual: create a new project and replay a dump. **No recovery project exists** (`list_branches` empty; no second active ViNha project).                            | INFERRED              |
| Can restore be done without overwriting production?   | Only if the target is a **new** project. In-place Dashboard restore (paid) would **overwrite** the live project — forbidden as a first drill.                                                                         | INFERRED              |
| Recovery validation procedure                         | **Missing**                                                                                                                                                                                                           | VERIFIED (no runbook) |
| Who performs recovery?                                | **Unnamed**                                                                                                                                                                                                           | VERIFIED missing      |
| Credentials required                                  | Unspecified. Realistically: org owner, DB password, and/or Management API token. Service-role is not sufficient to clone a project.                                                                                   | UNVERIFIED            |
| How long would recovery take?                         | **UNVERIFIED**. No drill, no size-based estimate beyond “small DB, but process is undefined.” Likely hours-to-days of improvisation, not a timed RTO.                                                                 | UNVERIFIED            |
| Automated vs manual                                   | **100% manual / undefined**                                                                                                                                                                                           | VERIFIED              |
| Rebuild from git migrations instead of restore?       | **Not a viable DR path** (ENA UUID data migrations; version drift).                                                                                                                                                   | VERIFIED              |

**Backup existence ≠ restore capability ≠ recovery validation.** Today the team has none of the three in an operable form.

---

## Restore Drill Design

**Do not execute this drill against `family-finances-2` as the restore target.**

Pattern required: `Production Backup → Isolated Recovery Project → Validation`.

Never: `Production Backup → Production`.

### 1. Backup source

Until the org is on a paid plan with verified Dashboard backups:

1. Freeze mutating test/dev writes (or accept a fuzzy freeze-time).
2. Take a **logical dump** of `family-finances-2` with the Supabase CLI (`supabase db dump` for schema + data; include `auth` if the CLI/role allows, otherwise dump `auth` via a documented privileged path).
3. Store the dump **off-site**, encrypted, with a timestamp and project ref `bbzffxvgocjwsdbujvgn`.
4. Record row-count checksums (the aggregates in this audit as the baseline method — not amounts).

If/when the org is Pro+: use Dashboard backup listing as the source of truth, plus one independent dump.

### 2. Isolated recovery target

Create a **new** Supabase project, e.g. `vinha-recovery`, in the same region (`ap-southeast-2`) if residency matters. Do not reuse `family-finances` (`pcvckvfgfnvqahtuuadl`) until its contents are proven and it is clearly empty/disposable.

Do not link local `.env.local` to the recovery project except from a dedicated `.env.recovery` that is never used by E2E.

### 3. Restore procedure (manual, later)

1. Create recovery project; wait until `ACTIVE_HEALTHY`.
2. Restore schema+data from the dump (or paid “restore to new project”).
3. **Immediately disable** `pg_cron` jobs and `pg_net` calls on the copy (docs: cloned cron/pg_net can fire against production URLs).
4. Rotate recovery API keys; do not copy production Vault secrets that point at the live app.
5. Do not point DNS or Vercel at the recovery project.

### 4. Schema verification

- Compare `supabase_migrations.schema_migrations` versions to the dump manifest.
- Confirm `get_account_ledger_balances` exists.
- Confirm public table list matches production (count of relations, not row dumps).

### 5. RLS verification

- `relrowsecurity = true` on all `public` tables (production currently: all listed tables RLS on).
- `market_sync_locks` / `market_sync_runs`: RLS on, zero policies (intentional lockout) should survive.

### 6. RPC/function verification

- `get_account_ledger_balances` invoker.
- `create_saving_with_transfer` definer overloads present.
- `run_month_ritual_autolock_worker_all` definer present — **do not run it** on the copy until cron is disabled.

### 7. Cron verification

- Job names/schedules match. Then **unschedule or deactivate** them on the copy.

### 8. Auth-related dependency verification

- Auth user count matches dump.
- Session cookies from production must **not** work against recovery (different project JWT secret).
- Confirm leaked-password / Auth settings are out of scope except “copy is isolated”.

### 9. Financial data integrity checks

Use the checklist in the next section (counts/checksums only).

### 10. Application smoke tests

Point a **throwaway** `.env.recovery` Next server at the copy. Log in as a **recovery-only** test user. Do not use production passwords in CI logs. Confirm one household cannot read another.

### 11. Cleanup

- Pause or delete the recovery project after evidence is archived.
- Destroy dump copies per retention policy.
- Never `db reset` production.
- Never restore the drill dump back onto `family-finances-2`.

---

## Financial Integrity Validation

Use these checks on a **recovery copy**. Do not dump production amounts or names into tickets.

### Accounts

- Count = production count (today: 12).
- Every account `household_id` exists in `households`.
- `opening_balance` checksum: `sum(opening_balance)` grouped by `household_id` (publish hashes, not sums, if tickets leave the org).
- Recompute live balances via `get_account_ledger_balances` per household; compare to a pre-restore checksum file.

### Transactions

- Count = 23 (today).
- Every row has `household_id` matching its `account_id`’s household.
- Transfer pairs: `transfer_group_id` / linked in/out types remain paired (count of unmatched transfers = 0).
- `sum(amount)` by `household_id` + `type` as checksums.

### Jars

- Count = 10.
- All `jars.household_id` valid.
- `jar_plans` 1:1 with active jars used by Plan.
- `jar_period_rule_snapshots` count = 9; no snapshot with unknown `jar_id`.

### Goals

- Count = 0 today; still assert FK integrity when non-zero.
- `goal_funding_links` / `goal_contributions` household match.

### Savings

- Count = 30; cycles = 31.
- Principal/maturity/status columns present; checksum `sum(principal)` by household.
- Cycle `saving_id` FK complete.
- No cycle without a saving.

### Loans / Debts

- Count = 0 today.
- When present: balance vs payment sum checksum; household match.

### Investments

- Holdings = 21; operations = 21; valuations = 15.
- Confirm holding `b65855cb-7d05-4dda-9693-6b9e9e3bacfe` still exists if that correction remains canonical (ENA).
- Valuation `holding_id` FK complete.
- Do not require live Coingecko/vnstock for integrity of **stored** quantities/basis.

### Household isolation

- Two-user proof on the copy: member of household A cannot `select` household B rows with the **publishable** key + user JWT.
- Service-role **will** see all rows; never use it as the isolation test.

Redaction rule: reports may include counts, hashes, and redacted UUIDs. Never include household display names, emails, or money amounts in this audit series.

---

## Migration Recovery Analysis

### Repo vs hosted history

| Version              | Name                                          | In git  | On `family-finances-2` |
| -------------------- | --------------------------------------------- | ------- | ---------------------- |
| `20260825125516`     | `v1_baseline`                                 | Yes     | Yes                    |
| `20260825143000`     | `inbox_read_state_acl_23e1`                   | Yes     | Yes                    |
| `20260826045858`     | `market_price_sync_cron_and_gold_provider`    | Yes     | Yes                    |
| `20260826100000`     | `savings_existing_deposit_import`             | Yes     | Yes                    |
| `20260828095754`     | `market_price_sync_cron_and_gold_provider`    | Yes     | Yes                    |
| `20260905070501`     | `query_performance_hotpaths`                  | Yes     | Yes                    |
| `20260905090000`     | `investment_input_currency`                   | Yes     | Yes                    |
| `20260905152817`     | `category_income_without_jar`                 | Yes     | Yes                    |
| `20260905173951`     | `request_dedup_and_rls_hotpaths`              | Yes     | Yes                    |
| `20260906041517`     | `correct_card_billing_backfill`               | Yes     | Yes                    |
| `20260906061835`     | `allow_corrected_card_installment_sources`    | Yes     | Yes                    |
| `20260906074729`     | `correct_ena_opening_position`                | Yes     | Yes                    |
| `20260906074856`     | `correct_ena_opening_position`                | Yes     | Yes                    |
| `20260906080114`     | `migrate_inbox_after_transaction_correction`  | Yes     | Yes                    |
| `20260906080415`     | `restrict_correction_inbox_trigger_execution` | Yes     | Yes                    |
| `20260908034845`     | `savings_enable_rollover_rules`               | Yes     | Yes                    |
| `20260908040736`     | `reuse_savings_maturity_inbox_item`           | Yes     | Yes                    |
| `20260908105528`     | `category_jar_optional`                       | Yes     | Yes                    |
| **`20260908114845`** | `get_account_ledger_balances`                 | **Yes** | **No**                 |
| **`20260908115411`** | `get_account_ledger_balances`                 | **No**  | **Yes**                |

Repo migration file count: **19**. Hosted `schema_migrations` rows: **19**. Histories are **not** the same set.

### Audit questions

| Question                                                         | Answer                                                                                                                                                             | Status                |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------- |
| Which of `20260908114845` / `20260908115411` exists in the repo? | Only `20260908114845`.                                                                                                                                             | VERIFIED              |
| Which exists on the hosted database?                             | Only `20260908115411`.                                                                                                                                             | VERIFIED              |
| Is migration history synchronized?                               | **No.** Same RPC name, different version stamps.                                                                                                                   | VERIFIED              |
| Can a fresh database be created from repo migrations?            | **Schema: mostly.** **Data: no** — ENA migrations `RAISE` unless specific UUIDs/quantities exist.                                                                  | VERIFIED              |
| Can production schema be reconstructed from migrations?          | **Not bit-identical** because hosted applied `20260908115411` not in git. Function is `CREATE OR REPLACE` so bodies may match; **unverified without a dump diff**. | INFERRED              |
| Data migrations that cannot safely replay                        | `correct_ena_opening_position` (both timestamps). Household-specific UPDATE of holding/operation/event UUIDs.                                                      | VERIFIED              |
| ENA UUID/data migrations present?                                | **Yes.** Holding `b65855cb-…`, operation `bd5329af-…`, event `08113a21-…`. Live holding count = 1.                                                                 | VERIFIED              |
| Deterministic?                                                   | SQL files are ordered timestamps. ENA + dual market-cron names are **not** greenfield-deterministic.                                                               | VERIFIED              |
| Manual production changes not in git?                            | Hosted-only migration version `20260908115411` is exactly that class of drift. Other undocumented SQL: **UNVERIFIED**.                                             | VERIFIED (this case)  |
| Schema drift?                                                    | **Yes** (migration history). Physical column drift beyond that: **UNVERIFIED** (no `db diff` run; would be mutating-adjacent / noisy).                             | VERIFIED / UNVERIFIED |

`npm run migrations:validate` only freezes the **V1 baseline file checksum**. It does not compare repo files to `schema_migrations`.

`20260906041517_correct_card_billing_backfill` is primarily a `CREATE OR REPLACE` of `correct_transaction` (DEFINER), not a table wipe. Still not a reason to replay blindly on a new production.

Separate:

- **Schema reconstruction** — incomplete due to version stamp drift.
- **Data reconstruction** — cannot be done from git; requires a dump/backup of live rows.
- **Production migration history** — 19 hosted versions including `20260908115411`.
- **Migration drift** — repo `20260908114845` vs host `20260908115411`.

---

## RPO / RTO

### RPO (how much financial data could be lost)

**UNVERIFIED as a measured number.**

| Current evidence                                      | Implication                                                                                                              |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Free plan; no dump; no verified Dashboard backup      | A project delete, unrecoverable corruption, or bad unbounded service-role delete could lose **all** live financial rows. |
| Docs: project delete removes associated backups in S3 | Even hypothetical platform copies are not a guarantee after deletion.                                                    |
| PITR not available                                    | Cannot rewind “to 5 minutes ago”.                                                                                        |
| Last-write is continuous (app + cron + tests)         | Without dumps, RPO is “since forever / entire database”.                                                                 |

**Likely range if defensible:** **unbounded / total database loss** for the worst class of incident; **minutes-to-hours of unrecoverable writes** even in a disk-failure story without PITR. Not a contractual RPO.

**What to measure:** first successful off-site dump timestamp; backup listing after a paid-plan upgrade; restore-drill lag.

### RTO (how long to restore app + database)

**UNVERIFIED.**

| Current evidence                                          | Implication                                                                      |
| --------------------------------------------------------- | -------------------------------------------------------------------------------- |
| No host runbook, no recovery project, no dump             | Restoration cannot start with a known artifact.                                  |
| Small data volume (tens of rows per domain, not millions) | Restore **time** of Postgres itself would likely be short **if** a dump existed. |
| Cron/Vault/app URL rewiring is undocumented               | Application RTO dominated by **people figuring out steps**, not restore I/O.     |

**Likely range if defensible:** **same day only if** a dump and a spare project already exist; **otherwise days**. Not an SLO.

**What to measure:** timed restore drill on an isolated project.

---

## Minimum Safe Environment Model

Do not add unused infrastructure. The smallest safe model:

| Environment     | Purpose                   | Database                                                                                        | Who may write                      |
| --------------- | ------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------- |
| **Production**  | Real household finances   | Dedicated project (either **new Pro project**, or **freeze `family-finances-2` as production**) | Application + controlled cron only |
| **Development** | Developer experimentation | `supabase start` local **or** a separate hosted **dev** project                                 | Developers                         |
| **Test/E2E**    | Disposable fixtures       | Local or dedicated test project; never production                                               | CI/dev test commands               |
| **Recovery**    | Restore drills            | Ephemeral clone/dump target                                                                     | Operators during a drill           |

**Smallest change that actually reduces risk:**

1. Treat `family-finances-2` as production **starting now**.
2. Stop pointing `.env.local` E2E/service-role fixtures at it.
3. Add `supabase/config.toml` and run E2E against local (or one disposable hosted test project).
4. Put restorable backups in place (paid plan **or** scheduled encrypted `db dump`).
5. Create a recovery project **only when drilling**, not as always-on idle spend.

Do not keep using `family-finances` (`pcvckvfgfnvqahtuuadl`) as implicit production. It is inactive and unverified.

`scripts/assert-development-supabase.mjs` must **not** continue to encode the live financial project as the allowed destructive target.

---

## Production Safety Policy

### SAFE

May run against any environment, including production:

- `npm run lint`, `typecheck`, `test` (Vitest with mocks)
- `npm run format` / `format:check`
- `npm run migrations:validate` (file checksum only)
- `scripts/setup-agent-skills.sh`
- `scripts/generate-brand-assets.mjs`
- Read-only SQL aggregates / `EXPLAIN` with explicit production-read-only control
- `supabase migration list` / MCP `list_migrations` / `list_projects`

### TEST-ONLY

Must target a disposable database (local or dedicated test project):

- `npm run test:e2e` and all Playwright projects
- `npm run e2e:fixture:setup` / `cleanup` / `ownership:test-harness`
- `npm run test:e2e:release` / `test:e2e:smoke` / `e2e:auth-check`
- `scripts/e2e-auth-fixture.mjs`
- `scripts/seed-e2e-fixtures.mjs`
- `scripts/savings-lifecycle-fixture.mjs`
- `scripts/loans-fixture.mjs`
- `scripts/home-product-summary-fixture.mjs`
- `scripts/inbox-populated-fixture.mjs`
- `scripts/plan-valuation-fixture.mjs`
- `scripts/perf-10k-transaction-fixture.mjs` `setup` / `cleanup`
- Any script that calls `auth.admin.createUser` or `from(...).insert/delete`

### PRODUCTION-READ-ONLY

Allowed against production with named operator + logged ticket:

- MCP/CLI `SELECT` / `EXPLAIN ANALYZE`
- Dashboard advisors, logs, backup **listing**
- Row-count checksums for recovery validation
- Reading cron **status** (not rescheduling)

Forbidden even in this class: `listUsers` dumps in tickets, selecting `vault.decrypted_secrets`, selecting household names/emails/amounts into chat logs.

### PRODUCTION-MUTATING

Requires explicit operational control (two-person or written change ticket; backups confirmed first):

- `supabase db push` / `apply_migration` / any DDL
- `INSERT`/`UPDATE`/`DELETE` on financial tables
- Restore **onto** production
- `TRUNCATE`, `db reset`, seed, fixture setup/cleanup
- Enabling/disabling PITR, plan changes, Auth config, Vault, cron schedule changes
- `perf-10k` hosted path (`VINHA_PERF_ALLOW_HOSTED=1`)
- Rewiring `assert-development-supabase` allowed refs
- Creating/deleting Supabase projects
- Account deletion via service-role (`deleteAccount`) in production (product feature, still mutating)

---

## Findings

### DATA-001 — Normal E2E commands mutate the sole live financial database

- **Severity:** P0
- **Evidence:** `playwright.config.ts` `globalSetup` → `scripts/e2e-auth-fixture.mjs setup` uses `SUPABASE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_SUPABASE_URL` = `bbzffxvgocjwsdbujvgn.supabase.co`. `assertE2EEnvironmentPolicy()` does not check project ref. Live DB has 3 households and 30 savings.
- **Risk:** Test setup/teardown can create/delete Auth users and financial rows on the same Postgres that holds real household data. Service-role bypasses RLS. Historical residue: 31 `@example.com` users.
- **Recommendation:** Point E2E at local or a dedicated test project. Fail-closed if URL host is `bbzffxvgocjwsdbujvgn.supabase.co` unless an explicit break-glass flag is set (and that flag must not default on).
- **Verification status:** VERIFIED

### DATA-002 — No operationally restorable backup

- **Severity:** P0
- **Evidence:** Org plan `free`. Supabase docs: daily downloadable backups and restore-to-new-project are paid-plan features; free projects should `db dump`. Repo has no dump script/artifact/runbook. Dashboard backup list not accessible via MCP.
- **Risk:** Project incident, destructive SQL, or mistaken fixture wipe has no demonstrated recovery of financial data.
- **Recommendation:** Immediate encrypted logical dump stored off-site. Then upgrade for platform backups/PITR **or** automate dumps with tested restore to a **separate** project.
- **Verification status:** INFERRED (plan + docs) + VERIFIED (no dump/runbook) + UNVERIFIED (Dashboard UI)

### DATA-003 — Production boundary is undefined and mislabeled “development”

- **Severity:** P1
- **Evidence:** `assert-development-supabase.mjs` allows `family-finances-2`. `.env.local` and CLI link use that ref. Two households have no `@example.com` members. Cron is active. No production env file/host.
- **Risk:** Operators and scripts treat live financial data as a sandbox. The only identity guard would **permit** destructive ops against that sandbox.
- **Recommendation:** Declare production explicitly. Recode the development guard to **deny** `bbzffxvgocjwsdbujvgn` once it is frozen as production.
- **Verification status:** VERIFIED

### DATA-004 — Fixture scripts bind to `E2E_USER_EMAIL` household with service-role

- **Severity:** P1
- **Evidence:** `seed-e2e-fixtures.mjs`, `savings-lifecycle-fixture.mjs`, `home-product-summary-fixture.mjs`, `plan-valuation-fixture.mjs`, `loans-fixture.mjs` resolve `household_id` from the E2E user’s active membership, then insert/update/delete with the admin client.
- **Risk:** If that user is ever a member of a real household, tests write real financial data. No project-ref guard.
- **Recommendation:** Fixtures may only mutate households they created, with name prefix + membership allowlist (as e2e-auth-fixture/ownership harness partially do), on a test project.
- **Verification status:** VERIFIED

### DATA-005 — Migration history drift plus non-replayable ENA data migrations

- **Severity:** P1
- **Evidence:** Host `20260908115411` vs repo `20260908114845`. ENA migrations hard-code UUIDs and `RAISE` on mismatch; live holding still present.
- **Risk:** `db push` from git applies a “new” migration that is already live under another version. A greenfield restore-from-migrations **cannot** reconstruct production data and can **fail** on ENA. Git is not a backup.
- **Recommendation:** Align version stamps in a controlled, non-destructive way. Keep household-specific data fixes **out** of the portable chain. DR = dump/restore, not migration replay.
- **Verification status:** VERIFIED

### DATA-006 — Restore-to-isolated-environment is not available as a product feature on this plan

- **Severity:** P1
- **Evidence:** Clone/restore-to-new-project docs require paid plan + physical backups. `list_branches` = `[]`. No recovery project.
- **Risk:** Even after taking a dump, there is no rehearsed target. In-place restore (if later enabled) would threaten the only copy.
- **Recommendation:** Provision a recovery target **before** the first real incident. Never restore onto `family-finances-2` as the first test.
- **Verification status:** INFERRED (docs) + VERIFIED (no branch/recovery project)

### DATA-007 — Local development writes to the live database

- **Severity:** P1
- **Evidence:** `npm run dev` loads `.env.local` host `bbzffxvgocjwsdbujvgn.supabase.co`. No `config.toml` local stack.
- **Risk:** A developer logging in as themselves (or clicking through product flows) mutates live savings/investments/transactions.
- **Recommendation:** Local stack or separate dev project as the default `NEXT_PUBLIC_SUPABASE_URL`.
- **Verification status:** VERIFIED

### DATA-008 — Development guard is unused and would allow the live project

- **Severity:** P2
- **Evidence:** `assert-development-supabase.mjs` is not referenced by `package.json` or other scripts. It requires `--confirm-development` and region `ap-southeast-2`, then **passes** for `family-finances-2`.
- **Risk:** Wiring it in “as a safety check” would rubber-stamp destruction of the live store.
- **Recommendation:** Invert the allowlist after production is declared. Call it from every mutating script.
- **Verification status:** VERIFIED

### DATA-009 — Test Auth residue on the live project

- **Severity:** P2
- **Evidence:** 37 Auth users, 31 `@example.com`; 0 named fixture households; 1 unnamed example.com-only household.
- **Risk:** Cleanup is incomplete. User-list APIs in fixtures scan everyone. Confusion during incident response.
- **Recommendation:** After environment split, delete leftover test users **on the test project only**. Do not bulk-delete on production without a backup.
- **Verification status:** VERIFIED (counts only)

### DATA-010 — Inactive `family-finances` project remains in the org

- **Severity:** P2
- **Evidence:** MCP `list_projects` status `INACTIVE` for `pcvckvfgfnvqahtuuadl`.
- **Risk:** Name collision, mistaken CLI link, false sense that “the other project is the backup”.
- **Recommendation:** Document contents or delete/archive after a dump of `family-finances-2`. Do not restore production onto it blindly.
- **Verification status:** VERIFIED

### DATA-011 — No recovery documentation

- **Severity:** P2
- **Evidence:** README rollback sentence refers to git pre-cleanup branches. `artifacts/.../failure-recovery.md` is **ledger command** recovery, not DB restore. `scripts/README.md` lists fixtures, not dumps.
- **Risk:** Another engineer cannot recover the system without tribal knowledge.
- **Recommendation:** One restore runbook following the drill in this document.
- **Verification status:** VERIFIED

### DATA-012 — Benchmark hosted override can still hit the live host

- **Severity:** P2
- **Evidence:** `VINHA_PERF_ALLOW_HOSTED=1` + `VINHA_PERF_ALLOWED_HOST=bbzffxvgocjwsdbujvgn.supabase.co` would allow a 10k insert household on the live project. Flags currently `UNSET` (default refuse). Dedicated household name is a mitigator, not isolation.
- **Recommendation:** Allowlist must not include the production hostname. Keep default fail-closed.
- **Verification status:** VERIFIED

### DATA-013 — Service-role TRUNCATE grant exists in baseline

- **Severity:** P3
- **Evidence:** `v1_baseline.sql` grants `TRUNCATE` on financial tables to `service_role` / `postgres`.
- **Risk:** A mistaken script can empty tables without RLS stopping it.
- **Recommendation:** Do not add truncate utilities. Consider revoking TRUNCATE from `service_role` in a future hardening migration (out of scope here).
- **Verification status:** VERIFIED

### DATA-014 — Secret material is on the developer workstation and readable by local tools

- **Severity:** P3
- **Evidence:** `.env.local` exists, gitignored, contains secret/service-role and DB password. Workspace search can open it.
- **Risk:** Not a git leak; still a laptop/agent-tool exposure.
- **Recommendation:** Standard workstation encryption; never paste `.env.local` into chats/tickets.
- **Verification status:** VERIFIED (presence only; values omitted)

---

## Required Remediation Order

1. **Stop the bleeding.** Treat `family-finances-2` as production. Do not run `test:e2e`, fixture setup/cleanup, or `db push` against it. (DATA-001, DATA-003, DATA-007)
2. **Take an off-site logical dump now** (encrypted). Record counts. This is the only backup the team can actually possess on the free plan. (DATA-002)
3. **Split environments.** Local or dedicated test project for E2E; production credentials never in Playwright globalSetup. Invert `assert-development-supabase`. (DATA-001, DATA-004, DATA-007, DATA-008)
4. **Make restore real.** Paid-plan backups/PITR **or** automated dumps + a recovery project + one executed drill (not onto production). (DATA-002, DATA-006)
5. **Fix migration history** so git and `schema_migrations` match; keep ENA-style data fixes out of portable replay. (DATA-005)
6. **Write the restore runbook** and name an owner. (DATA-011)
7. **Clean test residue** only after (2) and only on non-production, or with a proven dump. (DATA-009)
8. **Decide the fate of inactive `family-finances`.** (DATA-010)

Do not start with extra CI jobs, a second always-on staging app, or in-place production restore.

---

## Evidence appendix

### Files inspected (primary)

- `package.json`, `playwright.config.ts`, `next.config.ts`, `.gitignore`, `README.md`, `tests/README.md`, `scripts/README.md`
- `.env.local.example`, `.env.production.example` (and local `.env.local` **host/presence only**)
- `modules/platform/supabase/{env,admin,browser,server,route-handler,index,read-only,update-session}.ts`
- `scripts/{assert-development-supabase,e2e-auth-fixture,ownership-test-harness,seed-e2e-fixtures,savings-lifecycle-fixture,loans-fixture,home-product-summary-fixture,inbox-populated-fixture,plan-valuation-fixture,perf-10k-transaction-fixture,perf-balance-benchmark,validate-migration-freeze}.mjs`
- `tests/e2e/{global-setup,global-teardown,support/env,fixtures/v1-release,fixtures/together-lifecycle}.ts` plus savings/home/inbox/plan specs that shell out to fixtures
- `supabase/migrations/*` (19 files), especially ENA pair and `20260908114845_get_account_ledger_balances.sql`
- `supabase/.temp/{project-ref,linked-project.json}`
- `.agents/audits/{production-operations-readiness,security-hardening-audit,performance-supabase-audit}.md`
- `artifacts/current/architecture/financial-invariants/failure-recovery.md`
- `app/api/admin/market-{price,catalog}-sync/route.ts`
- `modules/tenancy/application/delete-account.ts`

### Commands / inspections executed (read-only)

- MCP: `list_projects`, `get_project` (×2), `get_organization`, `list_migrations`, `list_branches`, `list_edge_functions`, `search_docs` (backups/PITR), `execute_sql` (**SELECT/aggregates only**)
- Local: env hostname/presence probe (no secret print), `git ls-files` / `git check-ignore` for env files, directory listing of `supabase/.temp`
- **Not executed:** test suite, `db push`, dumps, restores, INSERT/UPDATE/DELETE, Dashboard backup mutation, Vault reads

### Focused tests executed

None. This audit did not need a test run.

### Official documentation used

- https://supabase.com/docs/guides/platform/backups
- https://supabase.com/docs/guides/deployment/going-into-prod
- https://supabase.com/docs/guides/platform/clone-project

---

## Final Verdict

DATA RECOVERY BLOCKED

The sole live ViNha database is shared by local development, E2E/service-role fixtures, and cron; it holds real (non-fixture) household financial rows; and there is no team-verifiable, restorable backup or isolated restore path. Remaining remediation is understood, but the current data/recovery situation is not safe.

**Recommended next step:** freeze mutating test/CLI commands against `family-finances-2`, take an encrypted logical dump off-site, then split E2E onto a disposable database before any further fixture or migration work.
