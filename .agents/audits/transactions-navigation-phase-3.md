# Transactions Phase 3 — Transfer-Aware Add Reference Loading

Date: 2026-10-06

## Decision

No production code changed. The route starts four references unused by Transfer, but the Add mode selector is local state and has no existing server-backed path to request missing references when a Transfer user switches to Expense or Income. Skipping them safely would require a new server read action/boundary or changing the mode switch into a server navigation. The latter would also rerun the uncached currency/account loader; the former adds a new read architecture for references that do not block the first Transfer fields. Keep the current switchable reference set.

## Transfer dependency proof

`MoneyTransactionAddPage` passes accounts, currency, both category sets, jars, and transaction tags to `MoneyCaptureEntry`. In Transfer mode, `MoneyCaptureEntry` mounts only `TransferCaptureFlow`; its props are accounts, currency, and an optional initial source account. Its account fields render account choices and balances; amount, date, note, preview, confirmation, and receipt use no category, jar, or transaction-tag data.

Transfer therefore consumes:

- Household currency for amount entry and formatting.
- The account option model for source and destination choices, ownership/capability presentation, balances, and source/destination filtering.

Transfer does not consume:

- Expense categories.
- Income categories.
- Jars.
- Transaction tags.

No receipt or confirmation dependency on those references was found in the Transfer component tree.

## Initial-mode semantics

The page accepts the values in `MONEY_CAPTURE_MODE_OPTIONS`: `expense`, `income`, and `transfer`. A single matching `mode` query value selects the initial mode. Missing, invalid, or non-string values fall back to Expense. The browser verified all three values, an invalid value, and no `mode` value; English and Vietnamese direct Transfer routes both selected Transfer.

Mode changes after initial render call local `setMode`; they do not update the URL or request server data. The existing mode switch works because the page starts and resolves all references regardless of initial mode.

## Previous request topology

Control: the Phase 2 source state present at task start, as documented in `transactions-navigation-phase-2.md`. No separate Phase 2 commit snapshot exists in this already-dirty working tree; the relevant production source files remained unchanged through the Phase 3 review, so control and final source are identical. Counts below are server reference-query invocations per direct Transfer page render, excluding the shared session/membership gate.

| Read               |                                          Phase 2 |      Phase 3 final source |
| ------------------ | -----------------------------------------------: | ------------------------: |
| Household currency |                                                1 |                         1 |
| Accounts           |                                                1 |                         1 |
| Owner eligibility  | 0 or 1, only when account rows contain owner IDs |    0 or 1, same condition |
| Balance RPC        |                        1 when account rows exist | 1 when account rows exist |
| Expense categories |                                                1 |                         1 |
| Income categories  |                                                1 |                         1 |
| Jars               |                                                1 |                         1 |
| Transaction tags   |                                                1 |                         1 |

These are source counts from the server calls in `new/page.tsx` and their query implementations. Supabase reads run on the server, so they are not visible in the browser's request list. No server query counter was available in this environment. The four category/metadata reads are unconditional today; the account owner lookup short-circuits when there are no owner IDs, and the balance RPC short-circuits when there are no accounts.

## New request topology

Unchanged from Phase 2. Direct Transfer still starts both category reads, jars, and transaction tags. They remain deferred behind independent Suspense resolvers and do not block the initial Transfer form. No duplicate delayed read was added because no source change was made.

Expense and Income remain switchable without a second request: their category sets and optional metadata are already started once by the route. Starting Transfer without those references would leave the current local mode switch with no safe way to resolve them.

## Cross-mode behavior

Real-browser checks on the authenticated local app verified:

- Transfer → Expense showed the category control and account control.
- Transfer → Income showed the category control and account control.
- Expense optional details exposed the jar control and transaction-tag selector.
- Currency remained supplied by the same route prop; Transfer source and destination choices remained available.
- Mode selection itself performs only local state changes. There is no client fetch, route transition, or mutation in the mode handler.
- No transaction write was submitted.

The current server-backed choices preserve mode switching with one set of reads. Skipping them for direct Transfer would need a new server loading boundary/action or a URL navigation change; neither exists in this flow.

## Performance

Environment: authenticated local app, Next development server, Vietnamese Transfer route. One first route sample was followed by five warm direct Transfer navigations, resetting through Expense between samples. The browser session and server stayed warm. Times are elapsed from navigation start. The form marker was the first visible `money-transfer-form`; account readiness was the first explicit enabled check of both account fields. Full route completion is the browser navigation promise resolving, used as a proxy for the full RSC/document tail.

| Marker                                            | First route sample | Five warm samples                |   Warm p50 / p75 |
| ------------------------------------------------- | -----------------: | -------------------------------- | ---------------: |
| A: Transfer form and independent fields visible   |           2,014 ms | 1,032; 943; 1,004; 1,109; 855 ms | 1,004 / 1,032 ms |
| B: Source and destination account choices enabled |           2,231 ms | 1,053; 968; 1,041; 1,145; 883 ms | 1,041 / 1,053 ms |
| C: Full current-mode Transfer UI ready            |           2,231 ms | 1,053; 968; 1,041; 1,145; 883 ms | 1,041 / 1,053 ms |
| Full navigation completion proxy                  |           2,231 ms | 1,053; 968; 1,041; 1,145; 883 ms | 1,041 / 1,053 ms |

The first sample was not a cold run: the authenticated session and local server were already warm. In a separate targeted DOM check, amount, date, and note were visible and enabled at the first form observation; account fields had also resolved by then. The 20–40 ms warm A-to-B gap is within browser-runner observation overhead and is not a clean measure of account-query latency. The navigation-completion proxy matched B in these warm samples; this is not a direct Flight-segment trace. The Phase 2 report's single 1,147 ms direct-route sample does not specify the mode, so it is not used as a paired Transfer control. Since Phase 3 source is unchanged, no latency improvement is claimed.

## Request reduction

| Read               | Phase 2 | Phase 3 | Reduction |
| ------------------ | ------: | ------: | --------: |
| Expense categories |       1 |       1 |         0 |
| Income categories  |       1 |       1 |         0 |
| Jars               |       1 |       1 |         0 |
| Transaction tags   |       1 |       1 |         0 |

No read reduction was implemented. This is the accepted no-reduction outcome: preserving local mode switching with the current architecture costs less than adding a read action/boundary or turning mode selection into a server navigation that would restart account/currency reads.

## Financial correctness

No transfer action, command, RPC, validation, or reference failure behavior changed. The existing server path remains `recordTransferAction` → the transfer command → `record_owned_account_transfer`; account references remain presentation choices only. Failed reference reads retain their existing `null` normalization and are not replaced with fabricated choices.

## Phase 2 regression

The direct Transfer route rendered the amount/date/note form and account selectors. The Expense and Income forms remained usable after local switching. The existing focused capture and transfer tests cover draft preservation while account/category references resolve; they are included in the full test run below. The responsive Transfer smoke found no horizontal overflow at 390, 440, 768, or 1280 px; the app frame was 390, 440, 440, and 440 px respectively.

The direct-route checks passed for English Transfer, Vietnamese Transfer, Expense, Income, invalid mode, and missing mode. The Expense optional jar and transaction-tag controls were present. No new console errors were recorded during the final route and mode checks; the tab contained 10 earlier development errors from a transient compile/retry, including a stale parse error. No transaction writes occurred.

## Phase 1 regression

The current browser pass navigated Transactions List → Detail → app Back and returned to the List. The Phase 1 evidence already measured zero additional List RSC requests on app Back; the current browser bridge did not expose a fresh server-side List RSC counter. The return-navigation helper, Transactions List, and Detail loader were unchanged.

## Validation

- `npm run test`: 1,757 passed and 5 failed across 3 unrelated existing test files. Failures are English/Vietnamese message-key parity (`savingsPage.summaryCaption`), account identity wrapping, and three account presentation tests missing `NextIntlClientProvider` context. No Add/Transfer, ownership, session, or return-navigation tests failed.
- Focused capture, Transfer, category/jar/tag, ownership, account, session, and Phase 1 return-navigation suites: 118 passed across 17 files.
- `npm run lint`: passed.
- `npm run typecheck`: failed on the existing `Translator<AppMessages, "home">` / `HomeTranslator` mismatches in `home-streaming-sections.tsx` lines 99 and 340; these are unrelated to Add/Transfer.
- `npm run format:check`: failed on 196 existing files, including the Phase 2 transactions audit and pre-existing skill/artifact files. The new Phase 3 report is checked separately.
- Production build: not run because the shared Next development server is active and uses `.next`.

## Remaining bottleneck

The next measured Transactions candidate is the Transactions List's category/jar/tag filters blocking the first useful rows, already identified in Phase 0. It remains out of scope here.

**TRANSACTIONS PHASE 3 COMPLETE — MODE-SPECIFIC READ REDUCTION NOT WORTH THE ARCHITECTURAL COST**
