# ViNha Production Operations & Deployment Readiness Audit

| Field           | Value                                                                                     |
| --------------- | ----------------------------------------------------------------------------------------- |
| Date            | 8 Sep 2026                                                                                |
| Scope           | Read-only operations / deployment readiness                                               |
| Predecessor     | Functional Regression Gate — `FUNCTIONAL REGRESSION PASS`                                 |
| Code changes    | None (report only)                                                                        |
| Linked database | Supabase `family-finances-2` (`bbzffxvgocjwsdbujvgn`, `ap-southeast-2`, `ACTIVE_HEALTHY`) |
| Git             | `main` at `246f78da`, **ahead 1** of `origin/main`; large uncommitted working tree        |
| Hosting config  | No `vercel.json`, Dockerfile, or CI deploy workflow in the repository                     |

## 1. Executive Summary

ViNha is **not operationally ready for production**.

The product has passed functional, performance, and P1 security work in the **working tree**. That is not the same as being able to deploy, observe, roll back, and recover a production system.

What exists today:

- A hosted Postgres/Auth project (`family-finances-2`) that local development, E2E credentials, cron, and prior audits all treat as the live database.
- Application scripts (`next build` / `next start`) and a Husky pre-commit lint-staged hook.
- Forward-only SQL migrations, RLS, financial RPCs, and running `pg_cron` jobs.
- Maintenance, error, and offline **UI shells**.
- Server-only service-role usage and gitignored `.env*` files.

What does **not** exist:

- A documented production hosting project or deploy path.
- CI that runs the required minimum (install, typecheck, lint, tests, production build).
- A dedicated production environment separate from local/E2E.
- A documented backup, restore, rollback, incident, cron, or secret-rotation procedure.
- A process health endpoint, error tracker, or APM.
- Evidence that database backups exist, have a retention policy, or have ever been restored.

`family-finances-2` already holds household financial rows and runs financial/market cron. Local `.env.local` points at that same project. Deploying “production” onto this database without an operations envelope would mix developer/E2E mutation with live household data, with no tested recovery path.

**Gate:** `PRODUCTION OPERATIONS BLOCKED`

This audit does **not** reopen the functional regression verdict. It answers a different question: whether the team can put ViNha into production and recover if something goes wrong.

## 2. Current Production Architecture

```text
Developer laptop / Cursor
  └── GitHub  Doankimtuan/family-finances  (origin/main)
        └── CI: MISSING  (.github/workflows/ is empty)
              └── Hosting: UNDEFINED  (no Vercel/Docker/runtime config in repo)
                    └── Next.js 16  (`next build` / `next start`)
                          └── Supabase JS (anon/publishable in browser; service role server-only)
                                └── Hosted Postgres + Auth  family-finances-2
                                      ├── RLS + RPCs
                                      ├── pg_cron (UTC)
                                      └── Vault (referenced by market-price cron)
```

Observed components:

| Layer            | Current state                                                                                          | Classification |
| ---------------- | ------------------------------------------------------------------------------------------------------ | -------------- |
| Git repository   | `https://github.com/Doankimtuan/family-finances.git`; default branch `main`                            | Present        |
| CI               | `.github/workflows/` exists and contains **zero** workflow files                                       | Missing        |
| Application host | No `vercel.json`, `.vercel/`, Dockerfile, Fly/Railway config. `next.config.ts` is empty of deploy opts | Undefined      |
| Runtime          | Next.js 16.3.1 App Router; `proxy.ts` for locale + session refresh + maintenance                       | Present        |
| Database         | `family-finances-2` ACTIVE_HEALTHY; CLI link `supabase/.temp/project-ref` = `bbzffxvgocjwsdbujvgn`     | Present        |
| Abandoned DB     | Older project `family-finances` (`pcvckvfgfnvqahtuuadl`) is `INACTIVE`                                 | Residual       |
| Edge Functions   | None deployed                                                                                          | Missing        |
| Observability    | `modules/platform/observability/` is an empty `.gitkeep`; no Sentry                                    | Missing        |

The Architecture & Engineering Quality Audit file named in the brief is **not present** under `.agents/audits/` (same gap as the functional regression gate). Performance, security, P1 remediation, and functional-regression reports were read.

## 3. Deployment Pipeline

Mapped path as it exists **in the repository**:

```text
Git repository
→ CI                    MISSING
→ build                 `npm run build` (`next build`) — local/script only
→ migration             Manual / out-of-band against hosted Supabase
→ deployment            UNDEFINED (no host, trigger, or branch policy)
→ application runtime   `npm start` (`next start`) if someone runs it
→ Supabase              Hosted `family-finances-2` (already live)
→ scheduled jobs        pg_cron on that database (already live)
```

| Question                       | Finding                                                                                         |
| ------------------------------ | ----------------------------------------------------------------------------------------------- |
| Hosting platform               | **Undefined.** Repo has no host config. Cron HTTP jobs succeed against _some_ app URL in Vault. |
| Application runtime            | Next.js Node server (`next start`) assumed; not pinned in host config                           |
| Build command                  | `npm run build`                                                                                 |
| Production start command       | `npm start`                                                                                     |
| Deployment trigger             | **Undefined.** No GitHub Action, no verified git-integration host                               |
| Deployment branch              | Informal `main`; no branch protection evidence in-repo; GitHub CLI not available here           |
| Environment variables          | `.env.local.example` / `.env.production.example`; actual host env **unverified**                |
| Migration execution strategy   | **Manual.** Hosted `schema_migrations` is updated independently of git origin                   |
| Rollback mechanism             | README mentions pre-cleanup **git** branches only. Not an application/DB rollback               |
| Deployment health verification | **Missing.** No `/api/health`; no post-deploy check                                             |

Undocumented / manual steps (inferred from repo + hosted state):

1. Apply SQL with Supabase CLI or MCP (`list_migrations` shows versions not matching origin).
2. Create Vault secrets (`market_sync_app_url`, `market_price_sync_secret`) — comments in migration SQL, not a runbook.
3. Set application env (including market sync secrets) on whatever host the cron URL points at.
4. Deploy the Next app by an unpublished method.
5. Confirm cron HTTP actually reached the new host (SQL `cron.job_run_details` “succeeded” only means `net.http_post` queued).

**Release artifact problem.** `origin/main` is behind local `main`, and the working tree still contains uncommitted P1 security and performance work (`requireProductSession`, create-saving key lifecycle, `get_account_ledger_balances` client, slim Plan hub). There is **no identified production commit**. Deploying `origin/main` would ship without those remediations while the database already has later RPCs.

## 4. CI/CD

### What runs today

| Gate               | Where                                                                    | Result                                       |
| ------------------ | ------------------------------------------------------------------------ | -------------------------------------------- |
| Dependency install | Developer machine / unspecified CI                                       | Not automated                                |
| Lint               | Husky `npx lint-staged` on commit                                        | Staged files only; not a full `npm run lint` |
| Typecheck          | `npm run typecheck` — manual                                             | Not in CI                                    |
| Unit tests         | `npm run test` — manual                                                  | Not in CI                                    |
| Production build   | `npm run build` — manual                                                 | Not in CI                                    |
| E2E                | `npm run test:e2e` — local; `process.env.CI` is referenced in Playwright | No CI sets `CI`                              |
| Migration freeze   | `npm run migrations:validate`                                            | Baseline checksum only; not in CI            |

`.github/` exists; `workflows/` is empty. Playwright sets `forbidOnly` and retries when `CI` is true, so CI was anticipated and never wired.

`next.config.ts` does not set `typescript.ignoreBuildErrors`. A host that runs `next build` would still typecheck application `tsconfig` includes. That is **not** a substitute for CI: tests, lint, and `tests/` (excluded from `tsconfig`) would not run, and a broken main branch can be pushed with no check.

Migrations are **not** validated or applied as part of any deployment workflow. A broken application can reach `main`. Whether it can reach a production URL is **unverified** because hosting is undefined.

Deployment is **not automatic** in-repo. If an external git-connected host exists, it is **undocumented** (partially automatic at best).

**Verdict:** FAIL — required minimum is not met.

## 5. Environment & Secrets

### Environment separation

| Environment | Evidence                                                                                        | Status      |
| ----------- | ----------------------------------------------------------------------------------------------- | ----------- |
| Local       | `.env.local` exists (gitignored). `NEXT_PUBLIC_SUPABASE_URL` host is `bbzffxvgocjwsdbujvgn`     | Uses hosted |
| Test / E2E  | `E2E_USER_*` and `OWNERSHIP_TEST_*` in local env; Playwright `globalSetup` creates hosted users | Uses hosted |
| Preview     | No Vercel/GitHub environment config                                                             | Missing     |
| Production  | No `.env.production` file; example file only; no host project                                   | Undefined   |

Local development is **not** a local Supabase stack. There is no `supabase/config.toml`. Docker local stack was already reported down in the performance audit. The CLI is linked to `family-finances-2`.

That hosted project is the same database prior audits measured (households, accounts, transactions, savings). Cron jobs run against it. Treating it as both sandbox and production is an environment-boundary failure.

Inactive project `family-finances` (`pcvckvfgfnvqahtuuadl`) remains in the org. Name collision risk if someone retargets env vars.

`.env.production.example` does not include `MAINTENANCE_MODE` / `NEXT_PUBLIC_MAINTENANCE_MODE`, E2E keys (good), or AI worker keys. `.env.local.example` documents optional AI/market secrets; production example omits several names used locally.

Unsafe default: `getSupabaseEnv()` fail-closes on placeholders — good. Maintenance flag defaults off — good.

### Secret inventory (names only)

| Name                                                                     | Intended home                         | Client-visible?                       | In git?                                    |
| ------------------------------------------------------------------------ | ------------------------------------- | ------------------------------------- | ------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`                                               | Public                                | Yes (by design)                       | Examples only                              |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public                                | Yes (by design)                       | Examples only                              |
| `SUPABASE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY`                      | Server                                | No — `admin.ts` imports `server-only` | Gitignored                                 |
| `SUPABASE_DB_PASSWORD`                                                   | Present in local env; not in examples | Must stay server-only                 | Gitignored                                 |
| `MARKET_PRICE_SYNC_SECRET` / `MARKET_CATALOG_SYNC_SECRET`                | Server + Vault (price URL)            | No — Bearer check in route            | Gitignored                                 |
| `E2E_USER_EMAIL` / `E2E_USER_PASSWORD`                                   | Local/CI test                         | N/A                                   | Gitignored                                 |
| `OWNERSHIP_TEST_A/B_*`                                                   | Fixture harness                       | N/A                                   | Placeholders in example                    |
| `COINGECKO_API_KEY` / `VNSTOCK_API_KEY`                                  | Local env (not in examples)           | Must stay server-only                 | Gitignored                                 |
| `GEMINI_API_KEY` / `AI_WORKER_SECRET`                                    | Optional; commented in local example  | N/A                                   | Not required                               |
| Vault `market_sync_app_url` / `market_price_sync_secret`                 | Supabase Vault                        | No                                    | Not in source (values not read this audit) |

`.gitignore` ignores `.env*` except the two example files. No Sentry DSN, OAuth client secret, or signing key appears in tracked source.

Service-role is not in the platform barrel (`modules/platform/supabase/index.ts` does not export admin). Call sites are server commands (market sync, account deletion).

**Residual:** `logActionFailure` still prints `householdId` / resource IDs with raw errors (security audit SEC-05; not remediations in P1 pass). UI error shells do not render `error.message` or `digest`.

**Verdict:** secrets are not committed and service-role is server-only (**PASS** for exposure). Environment **separation** is **FAIL**.

## 6. Supabase Production

Identified live project: **`family-finances-2`** / `bbzffxvgocjwsdbujvgn` / `ap-southeast-2` / `ACTIVE_HEALTHY` / Postgres 17.

| Check                             | Result                                                                                                                                                   |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Production project identification | **Ambiguous.** This is the only healthy project named for the app, but it is also the local/E2E database. No document names it “production”.             |
| Migrations deterministic?         | SQL files are ordered timestamps. Two household-specific data fixes are **not** portable.                                                                |
| Applied in order on host          | 19 versions on host, matching filenames except ledger-balance version drift (section 7).                                                                 |
| Local-only state                  | ENA opening-position migrations hard-code holding/operation/event UUIDs.                                                                                 |
| RLS                               | Prior security audit: all public tables RLS enabled. Not re-audited; no reason to reopen.                                                                |
| RPCs                              | Hosted: `get_account_ledger_balances`, `create_saving_with_transfer` (overloads), `investment_active_household`, `run_month_ritual_autolock_worker_all`. |
| Edge Functions                    | None.                                                                                                                                                    |
| Extensions                        | `pg_cron`, `pg_net`, `supabase_vault`, `pgcrypto`, `uuid-ossp`, `pg_stat_statements`, `hypopg`, `index_advisor`, `plpgsql`.                              |
| Indexes                           | PK + household/account hot-path indexes present, including `transactions_household_idempotency_unique`.                                                  |

`npm run migrations:validate` only freezes the V1 baseline checksum. It does not compare repo files to `supabase_migrations.schema_migrations`.

## 7. Migration Safety

### Repo vs hosted

| Version          | Name                          | In repo                                                                    | On host |
| ---------------- | ----------------------------- | -------------------------------------------------------------------------- | ------- |
| `20260908114845` | `get_account_ledger_balances` | Yes (`supabase/migrations/20260908114845_get_account_ledger_balances.sql`) | **No**  |
| `20260908115411` | `get_account_ledger_balances` | **No**                                                                     | Yes     |

Same function name, **different version stamps**. A later `supabase db push` from this working tree would try to apply `20260908114845` as a new migration even though the function already exists from `20260908115411`. SQL is `CREATE OR REPLACE`, so it may not destroy data, but the histories have already diverged.

Duplicate names already applied (same name, different timestamps):

- `market_price_sync_cron_and_gold_provider` — `20260826045858` and `20260828095754`
- `correct_ena_opening_position` — `20260906074729` and `20260906074856`

The second market-price file is a forward retry (Vault-gated `cron.schedule`). The second ENA file is another in-place rewrite of the same holding.

### Risk classification

| Migration                                                          | Risk                                  | Why                                                                                                                                                                                                 |
| ------------------------------------------------------------------ | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `20260825125516_v1_baseline`                                       | Accepted baseline                     | Frozen; `migrations:validate` checksum. Not a new production risk.                                                                                                                                  |
| `20260906074729` / `20260906074856` `correct_ena_opening_position` | **High — irreversible, non-portable** | Updates specific investment holding/operation/event UUIDs. `RAISE` if neither old nor new quantity/basis matches. A **new** production project replaying history **fails here**. No down migration. |
| `20260906041517` `correct_card_billing_backfill`                   | Medium — data rewrite                 | Name indicates hosted backfill; not a greenfield-safe pattern.                                                                                                                                      |
| `20260908105528` `category_jar_optional`                           | Low                                   | Constraint replace + `CREATE OR REPLACE` RPC; additive.                                                                                                                                             |
| `20260908114845` / hosted `20260908115411` ledger balances         | Medium — process                      | `CREATE OR REPLACE` invoker SQL; version drift is the issue.                                                                                                                                        |
| Market cron pair                                                   | Low if Vault present                  | Skips scheduling when Vault secrets missing (`RAISE NOTICE`). Already scheduled on this host.                                                                                                       |

No recent `DROP TABLE` / unbounded `TRUNCATE` of financial tables was found in forward migrations (GRANT `TRUNCATE` to `postgres`/`service_role` in baseline is privilege, not a migration action).

**There is no migrate-on-deploy step.** Schema on `family-finances-2` is already ahead of `origin/main`.

**Compatibility:** new app + old schema is unsafe if the app calls `get_account_ledger_balances` before that RPC exists. Old app + new schema is generally safer for `CREATE OR REPLACE` RPCs, except ENA data rewrites which change stored quantities.

## 8. Backup & Recovery

| Capability                        | Status         | Evidence                                                                                                                   |
| --------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Automatic backups                 | **Unverified** | Not represented in repo. Project plan/tier not returned by `get_project`. This audit did not open the dashboard backup UI. |
| Point-in-time recovery            | **Unverified** | No in-repo setting or documentation.                                                                                       |
| Backup retention                  | **Undefined**  | No policy file.                                                                                                            |
| Documented restore                | **Missing**    | No runbook. README rollback sentence refers to **git** pre-cleanup branches.                                               |
| Tested restore                    | **Missing**    | Not claimed anywhere; not executed (read-only audit).                                                                      |
| Recovery owner                    | **Missing**    | No owner named.                                                                                                            |
| Recovery expectations / RPO / RTO | **Missing**    | —                                                                                                                          |

Domain artifacts `artifacts/current/architecture/financial-invariants/failure-recovery.md` and the product copy describe **command/ledger** recovery (idempotent writes, outbox). They are not operational restore procedures.

Rebuild-from-migrations is **not** a viable DR path because of the ENA UUID data migrations.

**Do not assume** Supabase platform backups are configured, retained, or sufficient. Absence of evidence is recorded as Unverified + Missing documentation, not as “backups exist.”

## 9. Rollback

### After application deployment only

No host rollback (previous Vercel deployment, image tag, etc.) is configured in-repo. Practical rollback would be “redeploy an older git SHA” — **undefined** without a host. README’s pre-cleanup branches are historical repo snapshots, not production releases.

### After database migration

Schema policy is **forward-only** (`scripts/validate-migration-freeze.mjs`). There are no down migrations.

ENA corrections and billing backfills are **not safely reversible** from SQL in-repo.

| Failure point                       | Realistic action today                          | Documented? |
| ----------------------------------- | ----------------------------------------------- | ----------- |
| App deploy bad, schema unchanged    | Redeploy previous app if a host keeps history   | No          |
| Migration applied, app incompatible | Forward-fix the app, or restore DB (unverified) | No          |
| Data-fix migration wrong            | Manual SQL compensation                         | No          |

Expand/contract (old app compatible with new schema) is not a written strategy. The ledger RPC is additive; the ENA rewrite is not.

## 10. Health & Observability

### Health checks

No `/api/health`, `/healthz`, or `readyz` route exists.

`APP_PATH.HEALTH` is the **financial Health** product surface (`/health`), not a probe. `PROJECT.md` even forbids Supabase clients there (BR-24).

`proxy.ts` matcher excludes `api`, so a future lightweight `/api/health` would sit outside i18n/maintenance — it does not exist yet.

**Gap class:** Missing capability. Severity P2 (example in the brief). Not an immediate data-loss blocker; it does block automated deploy verification.

### Error tracking

| Signal                           | Present?                                              |
| -------------------------------- | ----------------------------------------------------- |
| Sentry / similar                 | **No** (no dependency, no env, no init)               |
| APM                              | **No**                                                |
| Structured logger                | **No** — `console.error` objects (`logActionFailure`) |
| Request correlation IDs          | **No**                                                |
| `instrumentation.ts`             | **No**                                                |
| `modules/platform/observability` | Empty                                                 |

ESLint allows `console.error` only (`eslint.config.mjs`). That is the production log channel.

### What users see

`app/[locale]/error.tsx` and `app/[locale]/(product)/error.tsx` render `SystemErrorScreen`: translated title/body, Retry, Home. They accept `error.digest` in the type and **do not display it**. No `app/global-error.tsx`.

`/maintenance` and `/offline` shells exist. Maintenance is env-driven (`NEXT_PUBLIC_MAINTENANCE_MODE` or `MAINTENANCE_MODE`). The public flag requires a rebuild to change if only `NEXT_PUBLIC_*` is set. Not in `.env.production.example`. No incident runbook.

### Log sensitivity

`LedgerFailureContext` / `SavingsFailureContext` include `householdId`, `accountId`, `transactionId`, `savingsId`. `logActionFailure` prints `operation`, `error`, `context`. Financial **amounts** are not systematically logged; identifiers are.

## 11. Cron / Scheduled Jobs

Database timezone: **UTC** (`show timezone`). Job table has no timezone column; schedules are UTC.

| Job                                  | Schedule (UTC)          | Owner                                       | Failure visibility                                                                 | Retry           | Idempotent                                                  |
| ------------------------------------ | ----------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------- | --------------- | ----------------------------------------------------------- |
| `month_ritual_autolock_daily`        | `0 1 * * *` (08:00 ICT) | Undocumented (code: `postgres` via pg_cron) | `cron.job_run_details`; SQL success = worker returned                              | None configured | Likely — autolock per household; unique snapshots elsewhere |
| `market_price_sync_coingecko_daily`  | `0 4 * * *`             | Undocumented                                | SQL success ≠ HTTP success (`net.http_post` queues). App writes `market_sync_runs` | None            | Sync runs keyed (`run_key` column exists)                   |
| `market_price_sync_vnstock_weekdays` | `30 8 * * 1-5`          | Undocumented                                | Same HTTP caveat                                                                   | None            | Same                                                        |
| `market_price_sync_fmarket_weekdays` | `0 11 * * 1-5`          | Undocumented                                | Same                                                                               | None            | Same                                                        |
| `market_price_sync_vang_today_daily` | `0 12 * * *`            | Undocumented                                | Same                                                                               | None            | Same                                                        |

Recent `cron.job_run_details` rows (sampled) are `status=succeeded`, `return_message=1 row` — expected for `net.http_post` returning a request id.

`market_sync_runs` currently shows **16 rows, all `succeeded`**. That proves _some_ application endpoint with a matching Bearer secret is reachable. It does **not** identify the host. Catalog sync (`/api/admin/market-catalog-sync`) has **no** cron job.

Vault: migration comments instruct `vault.create_secret` for URL and price secret. Listing Vault **names** was blocked by policy in this audit; cron SQL still references those two names. Values were not read.

`month_ritual_autolock_worker_all` is `SECURITY DEFINER`, loops **all** `households`, no per-household exception handler — one throw aborts the rest of the batch. Failures would appear in `cron.job_run_details` if the statement errors; there is no pager, inbox, or log drain documented.

AI worker cron: env comments only; no Edge Function; not running.

**Silent failure risk:** market jobs can SQL-succeed while HTTP 401/500 never creates a `market_sync_runs` row. Month-ritual is in-process SQL and is more honest.

## 12. Runtime Failure Handling

| Failure                             | Application behaviour                                            | User outcome                          |
| ----------------------------------- | ---------------------------------------------------------------- | ------------------------------------- |
| Supabase unconfigured               | `requireSupabaseEnv()` throws `SupabaseConfigurationError`       | Locale/product error shell + retry    |
| Query/RPC error                     | Domain `log*Failure` + fail-closed `null` / `Result` error codes | Empty/error UI, not stack traces      |
| `get_account_ledger_balances` error | `loadAccountLedgerBalances` → `null`; position fails closed      | No fabricated balances                |
| Auth missing                        | `requireProductSession` → login (working tree)                   | Safe                                  |
| Malformed market sync body          | 400 `"Invalid market price sync input"`                          | Admin-only                            |
| Unexpected throw in RSC             | `error.tsx` → `SystemErrorScreen`                                | Retry / Home; no digest shown         |
| Planned downtime                    | `shouldRedirectToMaintenance` in `proxy.ts`                      | Maintenance shell; auth paths allowed |

Admin sync routes return generic 401/500 JSON, not exception text.

This is **adequate application fail-closed behaviour**. It is not production observability.

## 13. Security Operational Readiness

Baseline: P1 security remediations are in the **working tree** (product layout session, create-saving key). They are **not** on `origin/main`. Shipping origin would reintroduce SEC-01/SEC-02.

Operational/security risks that this gate adds (not a full re-audit):

| Risk                                                               | Severity | Notes                                                                          |
| ------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------ |
| Local/E2E/service-role against the live hosted DB                  | P1       | Ownership harness and E2E setup/teardown can mutate the same project cron uses |
| Auth leaked-password protection off                                | P2       | SEC-08; hosted Auth config, still open                                         |
| Role parse fail-open (DB CHECK mitigates)                          | P2       | SEC-03                                                                         |
| Identifiers in `console.error`                                     | P2       | SEC-05                                                                         |
| Maintenance/public env baked at build if only `NEXT_PUBLIC_*` used | P2       | Can strand a bad build without a runtime flag if misconfigured                 |
| Market cron hits `/api/admin/*` outside proxy maintenance matcher  | P3       | Intended for jobs; secret-gated                                                |

RLS, RPC household derivation, and service-role server-only boundary are **not** undermined by a missing CI host — they **are** undermined if production is this shared database and developers run fixture cleanup against it.

## 14. Documentation / Runbooks

| Procedure                   | Status      | Closest artifact                                       |
| --------------------------- | ----------- | ------------------------------------------------------ |
| How to deploy ViNha         | **Missing** | `package.json` scripts; README is knowledge-base + E2E |
| App rollback                | **Missing** | README: pre-cleanup git branches                       |
| Migration rollback          | **Missing** | Forward-only freeze script                             |
| Restore production database | **Missing** | —                                                      |
| Production down / incident  | **Missing** | UI shells only (`/maintenance`, `/error`, `/offline`)  |
| Inspect/recover cron        | **Missing** | SQL comments in migrations                             |
| Rotate production secrets   | **Missing** | —                                                      |

`scripts/README.md` covers agent-skills setup, migration freeze, and E2E fixtures — not operations.

## 15. Production Readiness Matrix

| Area                     | Status | Severity | Evidence                                                                                                                                   | Blocking? |
| ------------------------ | ------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| Deployment               | FAIL   | P1       | No host config, no trigger, no release SHA; cron implies _some_ app URL exists but is undocumented                                         | Yes       |
| CI/CD                    | FAIL   | P1       | Empty `.github/workflows`; Husky lint-staged only; tests/lint/typecheck/build not gated                                                    | Yes       |
| Environment separation   | FAIL   | P1       | `.env.local` URL is `family-finances-2`; E2E/ownership harness target that DB                                                              | Yes       |
| Secrets                  | PASS   | P2       | `.env*` gitignored; service-role `server-only`; residual ID logging (SEC-05)                                                               | No        |
| Supabase                 | PASS   | P2       | Healthy project, RLS/RPC/extensions present; project is not named/isolated as production                                                   | No        |
| Migrations               | FAIL   | P1       | Host vs repo version drift; ENA UUID data migrations; no migrate-on-deploy                                                                 | Yes       |
| Backups                  | FAIL   | P1       | Unverified platform backups; no retention policy                                                                                           | Yes       |
| Recovery                 | FAIL   | P1       | No restore runbook; rebuild-from-migrations broken by ENA fixes; untested                                                                  | Yes       |
| Rollback                 | FAIL   | P1       | No app rollback; forward-only schema; irreversible data SQL                                                                                | Yes       |
| Health check             | FAIL   | P2       | No process/DB probe endpoint                                                                                                               | No        |
| Error tracking           | FAIL   | P1       | No Sentry/APM; console-only; host log drain unverified                                                                                     | Yes       |
| Observability            | FAIL   | P2       | Empty observability module; no correlation IDs                                                                                             | No        |
| Cron                     | PASS   | P2       | Five jobs active; month-ritual SQL-visible; market HTTP success decoupled from SQL success; no runbook/alerting                            | No        |
| Runtime failure handling | PASS   | P2       | Fail-closed queries; opaque error shells; maintenance exists but undocumented                                                              | No        |
| Performance safety       | PASS   | P2       | Working tree uses SQL balances + request-local cache + slim Plan upcoming; remaining fan-out is optimization, not a current-volume blocker | No        |
| Documentation            | FAIL   | P1       | All six operational procedures missing                                                                                                     | Yes       |

## 16. Blocking Findings

### OPS-01 — No production deployment path

- **Severity:** P1
- **Evidence:** Empty GitHub workflows; no Vercel/Docker/host file; `next.config.ts` empty; `.vercel/` absent; git remote exists but deploy target is undefined. Market cron proves an undocumented app URL in Vault.
- **Impact:** The team cannot repeatably ship a known commit. `origin/main` lacks current security/performance work.
- **Remediation:** Choose a host, document build/start/env, pin the production git SHA, deploy from CI or a documented git integration. Do not invent extra pipeline stages.
- **Requires:** Infrastructure + documentation. Small CI workflow optional but recommended (see OPS-02).

### OPS-02 — CI does not meet the required minimum

- **Severity:** P1
- **Evidence:** `.github/workflows/` empty; `package.json` has `lint` / `typecheck` / `test` / `build`; only Husky lint-staged runs automatically; Playwright expects `CI` but nothing sets it.
- **Impact:** A broken build, type error in tests, or failing financial unit test can be pushed to `main` with no gate. Host `next build` (if any) would not run Vitest.
- **Remediation:** One GitHub Action on `main`/`pull_request`: `npm ci`, `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`. Optionally `migrations:validate`. No need for a matrix of extra tools.
- **Requires:** Infrastructure (CI).

### OPS-03 — Local, E2E, and live database are the same project

- **Severity:** P1
- **Evidence:** `.env.local` `NEXT_PUBLIC_SUPABASE_URL` contains `bbzffxvgocjwsdbujvgn`; CLI `project-ref` matches; E2E `globalSetup` creates hosted users; ownership harness mutates that project; cron and household financial rows already live there.
- **Impact:** Fixture cleanup, failed experiments, or a mistaken harness run can damage real household data. There is no preview/production split.
- **Remediation:** Provision a dedicated production project (or freeze this one as production and stop pointing local/E2E at it). Point local at a local stack or a separate staging project. Move E2E fixtures off production.
- **Requires:** Infrastructure + environment configuration. No application redesign.

### OPS-04 — Migration history is not a safe production control plane

- **Severity:** P1
- **Evidence:** Hosted `get_account_ledger_balances` version `20260908115411` vs repo `20260908114845`. `correct_ena_opening_position` hard-codes holding `b65855cb-…` and `RAISE`s on a greenfield database. No deploy job applies migrations.
- **Impact:** New environments cannot replay history. Host and git will keep drifting. Rollback is forward-fix only.
- **Remediation:** Align version stamps with hosted history; keep household-specific data fixes **out** of the portable chain (one-off SQL, not committed as required replay). Add “apply pending migrations” as an explicit, reviewed production step.
- **Requires:** Documentation + careful migration process. Do not rewrite ENA data in this audit.

### OPS-05 — Backup and restore are unverified and undocumented

- **Severity:** P1
- **Evidence:** No backup policy, restore runbook, retention, owner, or restore test. Platform backups were not confirmed. Migration replay cannot replace restore (OPS-04).
- **Impact:** A bad migration, accidental fixture wipe, or project incident has no demonstrated recovery path for financial data.
- **Remediation:** Confirm hosted backup/PITR in the dashboard, write a restore procedure, and perform one non-production restore drill. Name an owner and RPO.
- **Requires:** Infrastructure (Supabase plan/settings) + documentation. Do not run a production restore as the first test.

### OPS-06 — No application or schema rollback procedure

- **Severity:** P1
- **Evidence:** README git-branch rollback only; forward-only freeze; irreversible data migrations; no host deployment history in-repo.
- **Impact:** After a bad app+migration deploy, operators have no approved action other than improvisation.
- **Remediation:** Document (1) revert app SHA on the host when schema is compatible, (2) forward-fix when not, (3) restore from backup for data disasters. Prefer expand/contract for future DDL.
- **Requires:** Documentation (+ hosting from OPS-01).

### OPS-07 — Production failures cannot be detected reliably

- **Severity:** P1
- **Evidence:** No Sentry/APM; no health probe; logs are `console.error` with no drain documented; market cron SQL success hides HTTP failure; month-ritual has no alert on throw.
- **Impact:** Users can sit on the error shell while operators have no ticket, no health check, and no cron alert.
- **Remediation:** Add a lightweight `/api/health` (process only, or a trivial `select 1` with a tight timeout). Attach host logs. Add one error tracker. Alert if `cron.job_run_details` is `failed` or market `market_sync_runs` goes stale.
- **Requires:** Small code + infrastructure + documentation. Do not build a full observability platform.

## 17. Non-Blocking Findings

### P2

| ID      | Finding                                                                                                                                                    |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OPS-N1  | No `/api/health` (classified P2 by itself; bundled into OPS-07 as a blocker only because **nothing else** detects outages).                                |
| OPS-N2  | No request correlation IDs; empty `modules/platform/observability`.                                                                                        |
| OPS-N3  | `logActionFailure` logs household/resource IDs (SEC-05).                                                                                                   |
| OPS-N4  | Market cron: `pg_cron` success ≠ HTTP/app success; catalog sync has an API and no schedule.                                                                |
| OPS-N5  | Month-ritual worker_all aborts the household loop on first exception; timezone UTC is implicit.                                                            |
| OPS-N6  | Maintenance mode is implementable but undocumented; `NEXT_PUBLIC_MAINTENANCE_MODE` missing from production example.                                        |
| OPS-N7  | Hosted Auth leaked-password protection still off (SEC-08).                                                                                                 |
| OPS-N8  | Inactive `family-finances` project left in the org.                                                                                                        |
| OPS-N9  | No `app/global-error.tsx` (locale `error.tsx` covers product routes).                                                                                      |
| OPS-N10 | Remaining Plan/Home fan-out and unused React Query provider — **known optimization**, not a production blocker at current cardinality (performance audit). |
| OPS-N11 | `supabase/config.toml` absent — local stack not a first-class environment.                                                                                 |

### P3

| ID      | Finding                                                                                                      |
| ------- | ------------------------------------------------------------------------------------------------------------ |
| OPS-N12 | Duplicate migration **names** (market cron, ENA) already applied — confusing, currently stable on this host. |
| OPS-N13 | `/api/v1` README is a scaffold; only admin market routes exist under `app/api`.                              |
| OPS-N14 | Architecture-engineering audit file still missing from `.agents/audits/`.                                    |
| OPS-N15 | Market admin routes excluded from maintenance redirect (usually desirable).                                  |

## 18. Recommended Remediation Order

Prioritized by production risk, not by elegance:

1. **Decide the production database.** Either promote `family-finances-2` and remove local/E2E/service-role mutation against it, or create a new production project and leave this one as staging. (OPS-03)
2. **Confirm backups and write a restore drill** on a copy, not as a surprise. (OPS-05)
3. **Pick a host and document deploy + env vars** from a **single git SHA** that includes P1 security remediations. (OPS-01)
4. **Add the small CI gate** (install, typecheck, lint, test, build). (OPS-02)
5. **Reconcile migration versions** and stop putting household-specific data rewrites in the forward chain. (OPS-04)
6. **Write rollback rules** (app revert vs DB restore vs forward-fix). (OPS-06)
7. **Health endpoint + error tracker + cron failure check.** (OPS-07, OPS-N1, OPS-N4)
8. Enable Auth leaked-password protection and redact log context IDs. (OPS-N7, OPS-N3)

Do not start with a large observability rewrite, extra CI jobs, or a health check that scans the ledger.

## 19. Final Verdict

PRODUCTION OPERATIONS BLOCKED

ViNha can run as a Next.js app against a healthy Supabase project, and the working tree’s financial/security behaviour passed the functional gate. It cannot yet be **operated** as production: there is no identified release, no CI gate, no environment split, no demonstrated backup/restore, no rollback, and no reliable way to see that production is down.

Re-run this gate after OPS-01–OPS-07 have evidence in the repository or hosting console — not after more feature work.
