# Database Operations — Credential Rotation & Backup Gate

Date: 2026-10-07
Evidence captured: 2026-10-07 05:58:08 UTC

## Credential incident

The earlier Supabase CLI database-dump dry-run emitted the PostgreSQL database password in its output. Its value is omitted. No evidence indicates that a publishable/anon key, Supabase secret/service-role key, or JWT signing secret was exposed. None of those API credentials was rotated.

## Consumer inventory

| Consumer                | Finding                                                                                                                                                 | Update required                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Local `.env.local`      | `SUPABASE_DB_PASSWORD` is present; gitignored. Repository source has no runtime reference; it is for local Postgres/backup tooling.                     | Yes, after reset                    |
| Supabase CLI link       | Local link metadata identifies the project; no password stored there.                                                                                   | No                                  |
| Vercel production       | Environment-variable inventory has no `SUPABASE_DB_PASSWORD` or `DATABASE_URL`; runtime uses Supabase URL/API credentials and other app secrets.        | No                                  |
| Repository CI           | No `.github` workflows and no repository source reference. GitHub-hosted settings are unverified because the GitHub connector is unavailable.           | No repository consumer found        |
| Supabase Edge Functions | MCP lists no deployed functions. CLI secret listing could not run because the CLI is not authenticated.                                                 | No deployed function consumer found |
| Supabase scheduled jobs | Six in-database jobs; an aggregate-only check found zero commands matching a raw DB credential/connection-string pattern. Vault contents were not read. | No                                  |

The web app uses the Supabase URL plus publishable/session credentials for normal traffic and separate server-only secret/service-role credentials for privileged API calls. The raw PostgreSQL password is not used by application code. After reset, update only the local `.env.local` DB-password entry; do not send the new value in chat.

## Pre-rotation connectivity baseline

- Project `family-finances-2`, sanitized ref `bbzff…jvgn`, region `ap-southeast-2`: `ACTIVE_HEALTHY`.
- Supabase MCP read-only SQL and migration-history reads succeeded.
- Production homepage returned HTTP 200. An existing authenticated session loaded Money, Transactions List, and a transaction Detail route without application errors. No financial values or identifiers are recorded here.
- The local development server was not running; production was used for the authenticated baseline.
- Aggregate counts: transactions `161`, accounts `12`, households `3`, household members `5`. This task performed no writes.

## Rotation

**New local credential verified.** The user reports updating `.env.local` with the new database password. A protected, read-only Postgres `select 1` using the value loaded directly from `.env.local` succeeded. The value was not logged or placed in command arguments. An initial check used an inherited shell override and failed authentication; loading the value from `.env.local` in isolation succeeded. Clear or refresh that inherited override before future local database tooling. The previous exposed credential was not retried, so its rejection was not independently verified; the Dashboard reset itself was not observed.

The documented Supabase [database password reset page](https://supabase.com/docs/guides/troubleshooting/how-do-i-reset-my-supabase-database-password-oTs5sB) remains the supported reset path. No ad-hoc SQL or alternate privileged role was used.

Post-update read-only checks show the project remains `ACTIVE_HEALTHY`; migration history is unchanged; aggregate counts match the baseline; and production Money and Transactions List pages loaded without a login prompt or generic application error. The production app has no raw database-password consumer. The transaction Detail route was verified in the pre-update baseline, but was not reloaded after the update because the fresh production list exposed no detail link.

## Backup and storage

**No backup was created.** No approved off-site destination is configured. The local macOS CloudStorage directory has no provider folders; `age`, `gpg`, `rclone`, and `aws` are unavailable. No encrypted artifact exists, so format, size, checksum, readability, and inventory are unavailable.

Tool versions: Supabase CLI `2.20.5`; `pg_dump` / `pg_restore` `18.4`; remote PostgreSQL `17.6`. The CLI dump help was inspected; its earlier dry-run printed the credential and will not be used. Any future dump must use a protected password mechanism, custom archive format, encryption at rest, and an approved off-site destination.

Managed-schema coverage (`auth`, `storage`, `realtime`, extensions, and migration metadata) is **not assessed** because no archive exists. This task establishes neither an application nor a complete Supabase project backup. Restore drill: **NOT YET PERFORMED**; repository policy treats the isolated drill as a later task, not a prerequisite to initial Phase 9 DDL.

## Migration and RLS baseline

The earlier timestamp drift remains reconciled. Remote history includes repository versions `20260911055502` and `20260925145853`, with no unexpected versions. Latest remote migration is `20261002160816_allow_crypto_fx_currency_codes`; Phase 9 `20261007033708_transaction_detail_rows` remains pending.

Transactions and accounts RLS remain enabled. A fresh policy digest using concatenated `pg_policies` fields is `8ce02df241a932ce70e095dae84e7e21`; it cannot be compared with the earlier recorded `423e467f69cec858f1b6e186f2b40e3c` because that digest's query was not preserved. This task applied no DDL or RLS changes. `public.get_transaction_detail_rows(uuid, uuid)` remains absent. Aggregate counts match the prior baseline.

## Pre-DDL decision

**BLOCKED.** The new local database credential is accepted, but there is no encrypted off-site backup or approved storage destination. Phase 9 was not applied. No API keys, Auth users, memberships, financial rows, or RLS policies were changed.

To resume, identify/connect the approved off-site destination. Then create and encrypt the logical dump, upload it, validate the archive and required object inventory, record its checksum, and rerun the read-only pre-DDL gate. Do not share the database password in chat.

**DATABASE BACKUP GATE BLOCKED — ENCRYPTED OFF-SITE BACKUP NOT ESTABLISHED**

## Subsequent owner exception — 2026-10-07

The owner explicitly accepted applying only `20261007033708_transaction_detail_rows.sql` without a recoverable backup. That migration has now been applied through Supabase MCP and verified; see [the migration checkpoint](database-operations-phase9-migration.md). The backup gate itself remains unmet. The exception does not authorize destructive, financial-data-mutating, or RLS-changing statements, or any other migration.
