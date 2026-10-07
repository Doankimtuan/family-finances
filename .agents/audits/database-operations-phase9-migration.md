# Phase 9 — Owner-authorized additive migration

Date: 2026-10-07

## Owner exception

The owner explicitly accepts proceeding without a recoverable backup for only `supabase/migrations/20261007033708_transaction_detail_rows.sql`. This supersedes the backup prerequisite for this migration alone. Destructive statements, financial data mutations, and RLS changes remain prohibited. No recoverable backup is claimed.

## Preflight

Project: `family-finances-2`, sanitized ref `bbzff…jvgn`, region `ap-southeast-2`, `ACTIVE_HEALTHY`. Previously reconciled migration versions remain present. Remote head: `20261002160816_allow_crypto_fx_currency_codes`. The target function is absent, including all overloads. Transactions/accounts RLS is enabled; `idx_transactions_transfer_group` exists.

Exact source statement review: `CREATE OR REPLACE FUNCTION`, `COMMENT ON FUNCTION`, two `REVOKE EXECUTE` statements, and `GRANT EXECUTE`. The body performs only SELECTs. Contract: two UUID arguments, `SETOF public.transactions`, SQL, STABLE, SECURITY INVOKER, empty search path; selected row anchored by transaction and household before deriving the transfer group.

Preflight counts: transactions 161, accounts 12, households 3, household members 5. All public policy digest: `4e6a010528c96598e46464bce702923a`, computed as MD5 of newline-joined `row(schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check)::text`, ordered by schema, table, policy name. The same query will be used after migration.

Security and performance advisors were captured before DDL; existing warning categories match the previous project baseline. No unrelated finding is changed.

## Application and verification

Supabase MCP `apply_migration` succeeded with the exact source file, name `transaction_detail_rows`. Source SHA-256: `dd5263025683a4ba5197553ab039e156c85f0d1fa065372beacb23954a1a415e`. Remote history gained exactly one entry: `20261007061514_transaction_detail_rows` (2026-10-07 06:15:14 UTC). All previous entries remain intact.

MCP assigned a timestamp different from repository version `20261007033708`. This is a documented mapping for this exact migration, not a second pending migration. The repository filename is unchanged. No migration-history repair was performed; future CLI migration operations must account for this mapping before applying anything else.

Catalog verification passes: schema public, name `get_transaction_detail_rows`, owner postgres, SECURITY INVOKER (`prosecdef=false`), STABLE (`provolatile=s`), SETOF public.transactions, exactly `p_transaction_id uuid, p_household_id uuid`, and empty search path. Installed function-body MD5 `aeaa04950135cb28aba62d3d7e8c5511` matches the exact source body.

Actual privileges: authenticated EXECUTE true; anon EXECUTE false; PUBLIC EXECUTE false. An anonymous Data API RPC with null UUID arguments was denied with SQLSTATE `42501`. A read-only SQL call with null UUID arguments returned zero rows. No row payload was exported.

After migration: transactions 161, accounts 12, households 3, household members 5. All counts match preflight. Transactions/accounts RLS remains enabled. All public policies have identical digest `4e6a010528c96598e46464bce702923a` using the same query before and after.

Security advisors are identical after excluding observation timestamps: 2 [RLS tables without policies](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), 1 [mutable function search path](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable), 1 [anon-executable security-definer function](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), 75 [authenticated-executable security-definer functions](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), and [leaked-password protection disabled](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). No new warning was introduced. Existing findings were not changed.

Current [function security documentation](https://supabase.com/docs/guides/database/functions) and [PostgreSQL minor-release changelog](https://supabase.com/changelog/postgres-15-19-17-11-breaking-changes) were reviewed. The reviewed function does not use the extension/operator features affected by that release.

This checkpoint verifies the production migration, catalog, access restrictions, policies, and aggregate integrity. Authenticated transfer/ordinary-detail runtime verification, wrong-household checks, request topology, and performance benchmarking remain pending; no application deployment or optimization was performed in this checkpoint.

**PHASE 9 MIGRATION APPLIED — OWNER BACKUP EXCEPTION RECORDED; DATABASE CHECKS PASSED**
