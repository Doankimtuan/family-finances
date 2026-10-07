# Transactions Phase 9 Rollback — Restore Pre-Phase-9 Detail Read Path

Date: 2026-10-07

## Rollback scope

Removed Phase 9 application use of `get_transaction_detail_rows` and its RPC-specific result type, mapper path, export, and application constant. The detail route again uses the request-cached `getTransactionReadResult(id)` loader. `getTransactionActivity(id)` and `getTransactionAuditChain(id)` reuse that result for the selected row.

The installed additive function and repository migration were left untouched. No migration history repair or new migration was performed.

## Database status

- `public.get_transaction_detail_rows` remains installed: **yes**.
- Normal Detail application usage: **no**.
- Read-only catalog inspection confirmed `RETURNS SETOF public.transactions`, `STABLE`, `SECURITY INVOKER`, and empty `search_path`; EXECUTE is granted to `authenticated`, not `anon` or `PUBLIC`.
- RLS remains enabled on `transactions` and `accounts`.
- Repository migration `20261007033708_transaction_detail_rows.sql` still maps to remote migration `20261007061514_transaction_detail_rows`.
- No DDL, migration-history, policy, grant, or financial-data writes occurred during rollback verification.

## Ordinary topology

```text
one request-cached selected transaction read
├ activity projection reuses the base row → hero
├ audit root reuses the base row → child reads after the hero
└ available tags load after the base row in their own boundary
```

Runtime instrumentation showed one selected-row transactions GET before the ordinary hero. Audit child queries for real related reversal/correction rows began after the hero; they are not a duplicate selected-row read. Tag inventory remained deferred. The Phase 9 RPC base plus separately cached audit-root GET is absent.

## Transfer topology

```text
selected transaction GET
↓
paired transfer-group GET
↓
complete-pair validation and activity projection
↓
Transfer hero
```

Runtime traces showed one selected-row GET and one pair GET. Transfer still skips audit and available-tag reads. `isCompleteTransferGroup()` and `createTransactionActivities()` remain in use, including selected-row inclusion validation.

## Correctness

The ordinary fixture test verifies amount, currency, date, account, category, jar, note, status, assigned tags, and ordinary activity correction/refund capability. Phase 9.1's same-run visible ordinary fingerprint comparison found the same fields and action presentation between its control and candidate; the rollback restores the canonical base-row projection used by that control.

Transfer tests cover both selected-leg orientations, source/destination identity, currency, date, status, source-note preference, destination-note fallback, selected-row inclusion, and malformed pairs. Both orientations produce the same source-first grouped activity.

## Performance

The matched Phase 9.1 comparison measured ordinary click-to-hero at **700 ms p50 / 759 ms p75** for the pre-Phase-9 control and **827 ms / 914 ms** for the Phase 9 candidate (+127 / +155 ms). Its traces attributed the extra ordinary selected-row read to the RPC base and audit loader using distinct cached helpers.

The rollback removes that extra path and the current runtime trace confirms one selected-row GET before hero. Five current ordinary smoke samples were **875, 1,114, 1,229, 1,510, and 1,847 ms** (p50 **1,229 ms**, nearest-rank p75 **1,510 ms**). These are not a matched reproduction of the Phase 9.1 benchmark: the current browser/instrumentation session had materially slower Auth and membership/session spans. They are recorded as environment-specific smoke values and are not used to claim a 700 ms rollback result. Exact historical timing reproduction was not required.

Transfer was lightly sampled after rollback: **1,203, 1,745, and 2,324 ms** (p50 **1,745 ms**, nearest-rank p75 **2,324 ms**). This is directionally slower than the Phase 9 RPC candidate, as expected, and is not a matched comparison.

## Phase regressions

- **Phase 1 Back:** app Back returned to the expense and Transfer filters; each observed return produced **0 new List RSC requests**. Five ordinary and four Transfer returns were observed.
- **Phase 5 List:** this rollback did not change the event scanner, transfer completion optimization, cursor, pagination, or filters.
- **Phase 6 session gate:** `requireProductSession()` remains before detail reads; no sequential `getUser`/membership path was restored.
- **Phase 7 progressive boundaries:** ordinary hero awaits only the base result and activity. Audit history and tag options remain in separate Suspense boundaries and start from the authorized base result. Transfer continues to skip both.

Browser verification showed ordinary amount presentation and the two-sided Transfer Detail. The browser logged 0 console errors and 14 existing `PressResponder was rendered without a pressable child` warnings. Transaction resource calls were GET-only; an initial normal Supabase Auth token refresh used POST. No financial-write action or financial-data mutation was executed.

## Validation

- Focused Detail/activity/audit/cache/session/Back tests: **54 passed across 6 files**.
- `npm run lint`: **passed**.
- `npm run test`: **1,792 passed, 5 failed** across 261 files. Existing failures: English/Vietnamese `money.savingsPage.summaryCaption` parity, one `money-ia-privacy` wrapping expectation, and three `phase-6-accounts-presentation` cases missing `NextIntlClientProvider`.
- `npm run typecheck`: blocked only by the two existing translator typing errors in untouched `app/[locale]/(product)/home/home-streaming-sections.tsx` at lines 99 and 340.
- Build was not run because the existing typecheck baseline fails.
- `git diff --check`: passed. Application search found no Phase 9 RPC helper/type/constant or runtime call; RPC references remain only in the preserved migration and its migration-contract test.

## Decision

The Phase 9 ordinary regression mechanism is removed: the application is back on the Phase 7/8 request-cached base-read topology and runtime traces confirm no duplicate selected-row read before hero. Transfer correctness, progressive boundaries, session gating, and app Back behavior remain intact. Historical timing was not reproduced in the slower current environment; the current smoke timings are retained above without treating them as a matched performance claim.

**TRANSACTIONS PHASE 9 ROLLBACK SUCCESS — READY FOR TRANSACTIONS CLOSEOUT**
