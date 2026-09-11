# Home Account/Ledger One-Wave Read Model

Date: 2026-09-11  
Scope: Home `getRealPosition` only  
Status: COMPLETE — prototype accepted and implemented behind the existing Home application contract.

## 1. Executive summary

The measured account/ledger candidate removes Home's dependent account wave:

| Measure                     | Existing | Candidate |
| --------------------------- | -------: | --------: |
| HTTP calls                  |        3 |         1 |
| Remote waves                |        2 |         1 |
| Response bytes              |    2,427 |     1,934 |
| Direct median span, n=20    | 405.0 ms |  202.2 ms |
| Raw-input equivalence       |        — |     20/20 |
| Final financial equivalence |        — |     20/20 |

The candidate is accepted. It is implemented only for Home, preserves the existing application mapping and total calculation, and is deployed only to the linked development Supabase project. No production deployment or financial data mutation was performed.

## 2. Architecture map

Before:

```text
Home -> assertMoneyActionAllowed
     -> accounts GET
     -> household_members GET + get_account_ledger_balances RPC
     -> existing account mapper + existing total calculation
```

After:

```text
Home -> assertMoneyActionAllowed
     -> get_home_account_ledger_raw_inputs RPC
     -> existing account mapper + existing ownership mapping + existing total calculation
```

Household context remains a parallel Home read. Savings, investment, household context, inbox, and other Home paths were not changed in this phase.

## 3. Existing financial contract

- Include active, non-archived liquid accounts: `cash`, `checking`, `savings`, `ewallet`, `brokerage`, and `other`.
- Exclude archived accounts and credit-card accounts from real position.
- Include `opening_balance` in every account position.
- Include transaction statuses `pending_mapping`, `posted`, `partially_refunded`, `fully_refunded`, and `reversed`.
- Credit transaction types are `income`, `debt_borrowing`, `debt_receivable_payment`, `transfer_in`, `investment_sell_proceeds`, and `investment_income`.
- Debit transaction types are `expense`, `debt_lending`, `liability_payment`, `loan_interest`, `transfer_out`, `investment_buy`, and `investment_fee`.
- Transfers remain neutral at the household total when both legs are present; the account-level signs remain unchanged.
- Unknown transaction types contribute zero, matching the existing ledger RPC.
- Financial ownership remains `household` or member-owned through `financial_scope` and `owner_membership_id`; inactive ownership is preserved as an inactive capability by the existing mapper.
- Null ownership means household ownership. Missing/invalid balance values are not accepted into the numeric balance map.
- Account ordering remains `created_at asc`.
- Account balances and the total stay in the household's base-currency minor-unit domain. Currency resolution remains the existing household-context read with the existing default; the candidate does not convert or persist formatted money.
- The public `RealPosition` shape and `totalBalance` reduction are unchanged.

## 4. Raw inputs

The candidate returns only the inputs needed by the existing application layer:

`account_id`, `account_name`, `account_type`, `opening_balance`, `is_archived`, `financial_scope`, `owner_membership_id`, `owner_membership_is_active`, and `balance`.

The RPC performs the same ledger arithmetic as the existing `get_account_ledger_balances` RPC, but resolves the active household and account ownership in the same read. It does not return the Home total or final capability model.

## 5. Candidate designs and decision

| Candidate                                         | Result   | Reason                                                                                    |
| ------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------- |
| A. Keep current GET + membership GET + ledger RPC | Rejected | Measured two-wave dependency remains.                                                     |
| B. One SQL-invoker raw-input RPC                  | Accepted | One call/one wave; exact application contract preserved; measured win.                    |
| C. RPC returns final `RealPosition`               | Rejected | Moves presentation/application financial policy into SQL and duplicates the app contract. |
| D. Server-side parallel orchestration only        | Rejected | Parallelizes dependent reads but cannot remove the extra calls; smaller gain than B.      |

## 6. Selected read model

Migration: `supabase/migrations/20260911035150_home_account_ledger_raw_inputs.sql`.

Function: `public.get_home_account_ledger_raw_inputs()`.

It is `LANGUAGE SQL`, `STABLE`, `SECURITY INVOKER`, and fixes `search_path` to `public`. The Home loader calls the RPC once, then reuses `mapAccountRow`, `applyLedgerBalances`, the liquid-account filter, and the existing sum.

## 7. Security model

- The RPC is `SECURITY INVOKER`; it relies on the caller's RLS context.
- Execution is revoked from `public` and granted to `authenticated`.
- The query is scoped through `public.investment_active_household()` and filters accounts to that household.
- Owner-membership activity is returned only for an owner membership in the same active household.
- No service-role client or bypass-RLS path was added.

## 8. SQL plan

Read-only `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` against the linked development database, with a fresh authenticated subject:

| Measure             |   Result |
| ------------------- | -------: |
| Actual rows         |        7 |
| Planning time       | 0.034 ms |
| Execution time      | 7.425 ms |
| Function-scan total | 7.368 ms |
| Shared hit blocks   |    1,362 |
| Reads/writes        |    0 / 0 |

The API-level plan exposes the function scan wrapper rather than expanding the function body; the direct benchmark and RLS probes cover the function's result and access behavior.

## 9. Raw equivalence

The direct benchmark ran 20 authenticated samples for both shapes against the same linked development project and compared normalized raw rows:

- Existing rows: 7 account rows, 1 active owner-membership row, 7 ledger-balance rows.
- Candidate rows: 7 raw-input rows.
- Existing response bytes: 2,427 per sample.
- Candidate response bytes: 1,934 per sample.
- Raw-input matches: 20/20; mismatches: none.

## 10. Final financial equivalence

Both normalized shapes were passed through the existing `mapAccountRow` and `applyLedgerBalances` application functions before comparison. Final financial contract matches were 20/20 with no mismatches. The candidate does not calculate or replace the final Home total in SQL.

## 11. RLS matrix

| Identity                                    | Active memberships | Existing rows | Candidate rows |           RPC | Result                        |
| ------------------------------------------- | -----------------: | ------------: | -------------: | ------------: | ----------------------------- |
| Primary member                              |                  1 |             7 |              7 |           200 | Expected household data only  |
| Ownership A / non-member                    |                  0 |             0 |              0 |           200 | No data exposed               |
| Ownership B / active zero-account household |                  1 |             0 |              0 |           200 | Empty household remains valid |
| Anonymous                                   |                  — |             — |              — | 401 / `42501` | Denied                        |

Cross-household comparison found no shared foreign account rows. No production data was changed.

## 12. Direct benchmark

All values are milliseconds unless stated otherwise; n=20.

| Shape     |   Min | Median |   P75 |   P95 |   Max | Calls | Waves | Errors |
| --------- | ----: | -----: | ----: | ----: | ----: | ----: | ----: | -----: |
| Existing  | 393.2 |  405.0 | 441.3 | 459.4 | 790.1 |     3 |     2 |      0 |
| Candidate | 195.7 |  202.2 | 206.1 | 228.8 | 234.8 |     1 |     1 |      0 |

The candidate is faster in every reported percentile and reduces the measured median span by 50.1%.

## 13. Decision gate

PASS. The candidate wins the direct latency, call-count, wave-count, payload, raw-equivalence, final-equivalence, and RLS gates.

## 14. Implementation

Changed for this phase:

- `supabase/migrations/20260911035150_home_account_ledger_raw_inputs.sql`
- `modules/ledger/application/ledger-shared-constants.ts`
- `modules/ledger/application/queries/load-account-ledger-balances.ts`
- `modules/ledger/application/queries/get-real-position.ts`
- focused ledger/request-cache unit tests
- `scripts/home-account-ledger-one-wave-benchmark.mjs`

The old account list and detail paths still use their existing loaders. No Savings, Investment, household-context, or Home UI contract was redesigned.

## 15. Live verification

The local production build was served on port 3131 with `VINHA_PERF_TRACE=1`. Ten authenticated Home navigations completed and rendered the Home markers. Server traces showed one successful `POST /rest/v1/rpc/get_home_account_ledger_raw_inputs` per Home load and no Home `GET /rest/v1/accounts`, owner-membership GET, or legacy ledger-balance RPC. The browser-side Supabase request list is empty because these reads execute server-side; the server trace is the authoritative request evidence.

## 16. Home fetch inventory

From the existing Home inventory, the account family was 3 calls across 2 waves. After the change it is 1 call in 1 wave. The deterministic Home request count is therefore 14 → 12. Other previously optimized families and remaining Home reads are unchanged.

## 17. Browser performance

The pre-change control and post-change runs used the same local production-like server, authenticated account, locale, route, and Playwright flow. The first sample in each post-change batch included server/auth warm-up, so the comparison below uses the nine subsequent warm samples and is labeled as such.

| Metric                            | Before, n=9 | After, n=9 warm | Change |
| --------------------------------- | ----------: | --------------: | -----: |
| Navigation response start, median |    243.4 ms |        234.9 ms |  -3.5% |
| Home load event, median           |    709.4 ms |        580.4 ms | -18.2% |
| Overview marker, median           |    1,096 ms |        1,102 ms |  +0.5% |
| Dashboard marker, median          |      313 ms |          319 ms |  +1.9% |

The browser result is directionally consistent for overall completion, but the direct server benchmark is the decision gate because the Home page has unrelated parallel reads and auth/server warm-up noise. The ten-sample saved post-change batch, including its first warm-up sample, is in `output/playwright/home-account-after-warm-browser.json`.

## 18. Remaining bottlenecks and next action

Remaining Home work is outside this accepted account wave: auth/session and membership resolution, the common first wave, inbox HEAD, and other product reads. There is no measured evidence in this phase that another rewrite is worth the risk.

Decision: **D — stop Home optimization for this wave.**

## 19. Recommendation

Keep the one-wave Home account/ledger read model. Re-measure only when a new trace identifies a concrete bottleneck or the Home contract changes. Do not add a second speculative consolidation wave now.

## 20. Raw evidence and commands

- Direct benchmark: `VINHA_HOME_ACCOUNT_BENCH=1 node scripts/home-account-ledger-one-wave-benchmark.mjs`.
- Browser evidence: `output/playwright/home-account-after-warm-browser.json` and the server `VINHA_PERF_TRACE=1` trace.
- Migration dry-run showed only `20260911035150_home_account_ledger_raw_inputs.sql`; linked development migration push completed successfully.
- Read-only plan query used `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` with a fresh authenticated JWT subject.
- Focused unit tests: 3 files, 26 tests passed.
- `npm run typecheck` passed.
- `npm run build` passed.
- `supabase db lint --linked --level error --fail-on error` still reports four pre-existing unrelated migration errors; no candidate-specific error was reported.
