# Database Operations Gate — Phase 9

Date: 2026-10-07

## Project identity

Supabase MCP reports `family-finances-2`, sanitized ref `bbzff…jvgn`, region `ap-southeast-2`, status `ACTIVE_HEALTHY`. The configured application hostname and CLI-linked project reference matched this project. Organization plan: Free.

## Migration drift

| Repository version                            | Remote version                                | Evidence                                                                                                                                                                                                                                                                                                                                                                            | Classification                             |
| --------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `20260911055502_money_credit_card_raw_inputs` | `20260911055706_money_credit_card_raw_inputs` | Stored remote migration SQL matched the complete repository file after whitespace normalization (MD5 `61e8826332e6d008d7a52c7452b7c37b`). The expected function signature, result columns, body, volatility, invoker mode, search path, owner, and ACL matched the live catalog. No table, column, constraint, index, trigger, policy, or top-level data change exists in the file. | Equivalent migration, timestamp-only drift |
| `20260925145853_plan_personal_jar_expenses`   | `20260925155410_plan_personal_jar_expenses`   | Stored remote migration SQL matched the complete repository file after whitespace normalization (MD5 `f2babf6c955550c6556f85c9d5ab655f`). The four expected function signatures, bodies, security modes, volatility, search paths, owners, and ACLs matched the live catalog. No table, column, constraint, index, trigger, policy, or top-level data change exists in the file.    | Equivalent migration, timestamp-only drift |

The migration files and their stored remote statements were inspected in full. No extra remote SQL statements or material extra schema effects were found. DML inside function definitions was not run by the history repair.

## Reconciliation

Before execution, the exact metadata-only plan was recorded: mark remote versions `20260911055706` and `20260925155410` reverted, then mark repository versions `20260911055502` and `20260925145853` applied. The supported Supabase CLI `migration repair` command completed all four operations successfully. It changed migration history metadata only; it did not execute migration SQL.

Post-repair `list_migrations` shows the repository versions in place, the old remote stamps absent, and no unrelated migration versions changed. The Phase 9 migration remains pending. Rechecked function catalog/body fingerprints and RLS state were unchanged by reconciliation.

## Backup

**Not established.** No dump artifact was created, so size, checksum, readability, and object inventory are unavailable. No restore test was attempted.

The repository recovery policy requires an encrypted off-site logical dump before production DDL. A CLI dump dry-run unexpectedly emitted the database credential in its output. The CLI dump workflow was stopped immediately; the credential value is intentionally not recorded here. The credential must be rotated or replaced before a dump can safely use local Postgres tooling. No credential rotation was performed in this task. Supabase Auth/internal-schema inclusion and a secure off-site destination therefore remain unverified.

The repository policy calls for a later isolated recovery project and restore drill; it does not make that drill a prerequisite to the initial DDL gate. The missing encrypted off-site dump is itself sufficient to fail the gate.

## Pre-DDL gate

| Check                                                                                     | Result |
| ----------------------------------------------------------------------------------------- | ------ |
| Project identity confirmed                                                                | PASS   |
| Migration history reconciled; no unexplained drift remains                                | PASS   |
| Phase 9 migration remains unapplied                                                       | PASS   |
| `public.get_transaction_detail_rows(uuid, uuid)` absent                                   | PASS   |
| Transactions and accounts RLS enabled                                                     | PASS   |
| Existing transactions/accounts policy fingerprint unchanged from post-repair verification | PASS   |
| Recoverable external backup created and structurally validated                            | FAIL   |

Sanitized aggregate counts from the current read-only check: transactions `161`, accounts `12`, households `3`, household members `5`. These are not a before/after comparison; no DDL ran. No IDs, names, or amounts were queried or recorded.

**Pre-DDL gate: FAIL.** Phase 9 was not applied because the required backup is unavailable. No financial rows, Auth users, memberships, grants, or RLS policies were modified by this task. The only database mutation was the documented migration-history reconciliation.

## Advisors

Baseline MCP advisor results were collected; no post-DDL comparison exists because DDL was blocked. Findings are recorded here as existing project-wide baseline only; unrelated findings were not changed.

- Security: 2 RLS-enabled tables without policies (INFO), 1 mutable function search path (WARN), 1 anon-executable security-definer function (WARN), 75 authenticated-executable security-definer functions (WARN), and leaked-password protection disabled (WARN).
- Performance: 102 unindexed foreign keys (INFO), 2 RLS initialization-plan findings (WARN), and 15 unused indexes (INFO).

## Catalog / ACL / RLS

Phase 9 function catalog and ACL checks are **not applicable** because the migration was not applied. The function remains absent. Transactions and accounts RLS remain enabled; their recorded policy fingerprint is `423e467f69cec858f1b6e186f2b40e3c`, matching the post-reconciliation verification. No RLS changes were made.

## Data integrity

There are no before/after DDL counts because no DDL ran. The current aggregate read is listed above. Migration-history reconciliation did not alter financial rows.

## Handoff

Transactions Phase 9.1 runtime verification must remain paused. Resume after rotating/replacing the exposed database credential, creating an encrypted off-site logical dump, and structurally validating the artifact. Then rerun the pre-DDL gate before considering the Phase 9 migration.

**DATABASE OPERATIONS BLOCKED — RECOVERABLE BACKUP NOT ESTABLISHED**
