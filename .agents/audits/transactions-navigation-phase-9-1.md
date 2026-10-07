# Transactions Navigation Phase 9.1 — Safe Supabase MCP Preflight

Date: 2026-10-07

## Supabase project

Supabase MCP identified `family-finances-2`, project ref `bbzff…jvgn`, region `ap-southeast-2`, status `ACTIVE_HEALTHY`. The application-configured Supabase hostname and CLI linked ref match this project. Project identity is not ambiguous.

The organization plan is **Free**. The existing production/data-isolation audit identifies this as the shared live financial database.

## Read-only preflight

- The remote latest migration is `20261002160816_allow_crypto_fx_currency_codes`.
- The latest repository migration is `20261007033708_transaction_detail_rows`.
- The Phase 9 migration is not applied.
- Two existing migration versions diverge:
  - Repository `20260911055502_money_credit_card_raw_inputs.sql`; remote `20260911055706_money_credit_card_raw_inputs`.
  - Repository `20260925145853_plan_personal_jar_expenses.sql`; remote `20260925155410_plan_personal_jar_expenses`.
- These version differences were unexplained at the time of this preflight; no migration repair or version reconciliation had yet been attempted. See the subsequent database-operations update below.
- Read-only catalog inspection found no `public.get_transaction_detail_rows` function.
- RLS is enabled for both `public.transactions` and `public.accounts`. The existing `transactions_select_member` and `accounts_select_member` policies require an active membership. No policy changes were made.
- The existing `idx_transactions_transfer_group` index covers `(household_id, transfer_group_id)` for non-null transfer groups.

## Recovery preflight

The organization is on the Free plan. Current [Supabase backup documentation](https://supabase.com/docs/guides/platform/backups) describes automatic daily backups for Pro, Team, and Enterprise plans and recommends Free projects maintain CLI dumps and off-site copies. PITR is also a paid capability.

The repository's production/data-isolation audit records no dump script, dump artifact, restore runbook, or confirmed backup; backup listing is not available through the connected Supabase MCP tools. Therefore:

- Daily backup availability: unavailable on this plan, per Supabase documentation.
- PITR: unavailable on this plan, per Supabase documentation.
- Latest known recoverable backup: none confirmed.
- Required recoverable-backup precondition: **failed**.

## Migration review

The exact Phase 9 migration was reviewed. Its statements are limited to:

- `CREATE OR REPLACE FUNCTION`
- `COMMENT ON FUNCTION`
- `REVOKE EXECUTE`
- `GRANT EXECUTE`

The function source declares `RETURNS SETOF public.transactions`, `STABLE`, `SECURITY INVOKER`, and an empty `search_path`. It accepts only the selected transaction ID and household ID. The selected row is anchored by both values before its transfer group is derived. The file contains no data DML, table alteration, policy, trigger, Auth, or row-ownership change.

## Stop decision

The mandatory preflight fails on both unexplained migration-version drift and the repository-required confirmed recovery capability. The migration was **not applied**. No baseline financial row counts were collected, advisors were not run, and no post-migration, authenticated, anonymous, wrong-household, browser, request-topology, or benchmark calls were made.

No financial records were modified. No migration repair was performed. Runtime and performance results remain unverified.

At the time of this preflight, the next action was to resolve migration-history drift and establish a confirmed recoverable backup. Do not apply Phase 9 while either gate remains unmet.

## Subsequent database-operations update — 2026-10-07

The two migration pairs were proven equivalent from the complete stored migration statements and live catalog, then reconciled using the supported metadata-only migration-repair command. Post-repair history and affected function/RLS state were verified. Details and fingerprints are recorded in [the database operations gate report](database-operations-phase9-gate.md).

The backup gate remains failed. A CLI dump dry-run unexpectedly printed the database credential, so that CLI path was stopped and the credential was not recorded. Rotate or replace it before creating the required encrypted off-site dump. No backup was created, no Phase 9 DDL was applied, and no financial data or RLS state was changed. Phase 9.1 runtime verification remains blocked until the dump exists and passes structural validation.

## Existing application checks

The prior Phase 9.1 source/mock regression run remains the available application evidence: 81 focused tests passed across 9 files, including 22 transfer-pair cases. Lint passed. The full test suite had 1,794 passed and 5 unrelated baseline failures; typecheck had 2 existing errors in untouched Home code. These checks do not substitute for database runtime verification.

**TRANSACTIONS PHASE 9.1 BLOCKED — RECOVERABLE BACKUP NOT ESTABLISHED**

## Subsequent owner-authorized migration — 2026-10-07

The owner waived the recoverable-backup prerequisite for the exact Phase 9 additive migration only. Supabase MCP applied the source migration as remote version `20261007061514_transaction_detail_rows`. Catalog, execute privileges, anonymous denial, unchanged counts, unchanged public policies, and unchanged security findings passed verification. See [the migration checkpoint](database-operations-phase9-migration.md) for the owner exception and repository/remote version mapping. The backup remains unavailable; authenticated runtime verification and same-run benchmarking remain pending.

## Production runtime verification — 2026-10-07

This section supersedes the prior “runtime verification … pending” status. No schema, migration history, function, grant, policy, membership, financial row, or production source code was changed during this verification.

### Permanent migration state

- Repository migration: `20261007033708_transaction_detail_rows.sql`.
- The same migration is recorded by Supabase MCP as `20261007061514_transaction_detail_rows`; this mapping remains intact and is not a second migration. No later migration appeared.
- `public.get_transaction_detail_rows` exists, is `STABLE`, `SECURITY INVOKER`, and has `search_path=""`. Authenticated EXECUTE is true; anon and PUBLIC EXECUTE are false. `transactions` and `accounts` RLS remain enabled.
- Post-run aggregate counts are transactions 161, accounts 12, households 3, household members 5. The policy digest matches the migration checkpoint: `4e6a010528c96598e46464bce702923a`.
- The backup exception remains limited to the additive function migration. No recovery artifact was created or assumed.

### Authenticated RLS and Transfer correctness

The positive checks ran in the normal authenticated application session through the existing server Supabase client. The installed RPC returned both rows for the selected valid Transfer, included the selected row, and passed the complete-pair validation. Both source-leg and destination-leg detail routes rendered the same grouped source/destination meaning, currency, date, status, note presentation, action state, and audit-ID presentation. No raw account names, transaction identifiers, note text, or amounts were saved here.

The wrong-household probe used the same authenticated session and a random nonexistent household UUID; it returned zero rows. The anonymous EXECUTE denial was already verified at the migration checkpoint as SQLSTATE `42501`; it was not repeated. The route still passes through the canonical money-action/session gate before using the household context. No inactive-member session was available, so membership was not changed. RPC failure was not injected into the live function; its no-fallback error path remains covered by the application contract checks.

For note semantics, the saved Transfer’s source note was selected from both detail orientations. The production activity projection was also exercised against in-memory row copies for both selected orientations: a source note wins when present, and destination note is the fallback when the source note is absent. Those copies were not written to the database.

### Transfer request topology and payload

The frozen control source used the selected-row transaction GET followed by the transfer-pair GET. The permanent candidate used `POST /rpc/get_transaction_detail_rows`.

| Transfer base-read evidence                |                                 Control |     Phase 9 candidate |
| ------------------------------------------ | --------------------------------------: | --------------------: |
| Detail transaction requests                |                                  2 GETs |            1 RPC POST |
| Rows returned across those reads           |               1 + 2 (3 row appearances) | 2 (2 row appearances) |
| Sanitized response body bytes              |                     666 + 1,317 = 1,983 |                 1,317 |
| Successful-path selected/pair GET fallback | Selected GET + pair GET are the control |                     0 |
| Audit and available-tag inventory reads    |                                       0 |                     0 |

Runtime spans show the candidate path proceeds through one RPC base read, mapping, pair validation, activity projection, and hero render. No selected-row or pair GET followed successful RPC validation. Common list/event-loader traffic was present in both isolated app copies and is not counted as the detail base-read topology.

### Same-run performance

Control and candidate were isolated source copies using the same Supabase project, authenticated browser profile, Transfer, ordinary Expense, locale (`vi`), Brave session, 440×900 viewport, and local Next development mode. Warm samples were interleaved. p50 uses the median; p75 uses nearest-rank. Timing is local development-runtime evidence, not a production SLA.

#### Transfer, 10 warm observations per arm

| Metric                          | Control p50 / p75 | Phase 9 p50 / p75 | Candidate minus control |
| ------------------------------- | ----------------: | ----------------: | ----------------------: |
| Session gate span               |      273 / 319 ms |    269.5 / 279 ms |           −3.5 / −40 ms |
| Selected-row base read          |    268.5 / 282 ms |      264 / 356 ms |           −4.5 / +74 ms |
| Transfer-pair read              |    270.5 / 274 ms |          Not used |                       — |
| Activity projection span        |    270.5 / 274 ms |          0 / 0 ms |                       — |
| Server hero-ready span          |    544.5 / 561 ms |      268 / 359 ms |        −276.5 / −202 ms |
| Route-return span               |      847 / 938 ms |    554.5 / 653 ms |        −292.5 / −285 ms |
| RSC response complete           |    878.5 / 924 ms |      615 / 705 ms |        −263.5 / −219 ms |
| Click → complete two-sided hero |    928 / 1,006 ms |    709.5 / 795 ms |        −218.5 / −211 ms |

The candidate materially improves the complete Transfer hero: about 219 ms at p50 and 211 ms at p75, with the detail base topology reduced from two reads and three row appearances to one RPC and two row appearances.

One cold-ish candidate sample was 4,628 ms to hero / 4,366 ms RSC while the control hero was 1,089 ms; the candidate local dev server was compiling. The control RSC marker was unavailable on that navigation. These cold-ish values are recorded as noisy and excluded from the warm comparison. One pre-fix instrumentation capture and one browser capture without timing markers were also excluded; the latter was replaced.

### Ordinary Detail correctness and performance

The same existing ordinary Expense rendered equivalent sanitized visible fields in control and candidate: ordinary activity, hero, currency/date/account/category/jar/note/status, assigned tags, and correction/refund action presentation. No financial values were retained. Both arms returned one selected row for their authoritative base read.

There is a material candidate regression. The ordinary candidate’s deferred audit calls `getTransactionReadResult(id)` after the base RPC. That read uses a different cached loader from `getTransactionDetailReadResult(id)`, so the audit root performs a separate selected-row GET; runtime request traces show the one-row audit-root response alongside the one-row RPC. Reversal/correction audit reads and tag inventory remain secondary work. This violates the “base row remains shared” requirement and leaves the ordinary page with an unnecessary second selected-row read. No optimization was made in this verification task.

| Ordinary Detail metric | Control p50 / p75 (n=5) | Phase 9 p50 / p75 (n=5) | Candidate minus control |
| ---------------------- | ----------------------: | ----------------------: | ----------------------: |
| Click → hero           |            700 / 759 ms |            827 / 914 ms |          +127 / +155 ms |
| Click → RSC complete   |          994 / 1,315 ms |        1,342 / 1,508 ms |          +348 / +193 ms |
| Click → tags ready     |        1,058 / 1,341 ms |        1,181 / 1,213 ms |          +123 / −128 ms |
| RSC decoded bytes      |         15,535 / 15,535 |         15,642 / 15,642 |       +107 / +107 bytes |

The ordinary hero appeared before tags in 4/5 candidate observations and tied the first tag marker in 1/5; all five control observations showed the hero first. The DOM timing hook did not independently timestamp audit completion. The reconnect produced one failed timing capture, which was replaced; the first five valid control observations were used chronologically, and one later surplus control observation was excluded to keep the requested `n=5`.

### Phase regressions and read-only integrity

- **Phase 1 Back:** filtered Transfer List → Transfer Detail → app Back restored `type=transfer`, with 0 new List RSC requests. Ordinary Detail Back also restored `type=expense` with 0 new List RSC requests. The page and nested UI had no scrollable region at this viewport, so scroll restoration was not applicable.
- **Phase 5 List:** the filtered list rendered the existing grouped Transfer legs; no List source changed.
- **Phase 6 session gate:** the canonical product/money session gate remains before database reads; no manual sequential `getUser`/membership path was introduced.
- **Phase 7 progressive Detail:** the ordinary hero remains independent of deferred tag/audit work, with the candidate timing above. The candidate’s separate audit-root GET is the remaining read-sharing failure.
- Database resource traces contained GET/HEAD and the expected STABLE read-only RPC POST. One normal Supabase Auth token-refresh POST also occurred; no financial write endpoint or action was used. End-of-run aggregate counts and policy digest match the migration checkpoint.

### Validation

The focused Vitest run passed: 85 tests across 10 files. Lint passed. The existing full suite reported 1,794 passed and 5 baseline failures. Typecheck remains blocked by 2 pre-existing translator typing errors in the untouched Home module. No application source was edited for this runtime-only task; the benchmark instrumentation lived only in disposable local copies and was removed after evidence collection.

### Decision

Phase 9 is beneficial for Transfer Detail but fails the mandatory ordinary no-material-regression and shared-base-read criteria. Follow the specified rollback order: revert application usage first; retain the installed database function until a separate, reviewed migration decides otherwise. Do not start Phase 10.

**TRANSACTIONS PHASE 9.1 COMPLETE — REVERT PHASE 9 FOR PERFORMANCE**
