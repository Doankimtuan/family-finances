# Transactions Phase 7 — Progressive Detail & Base-Read Reuse

Date: 2026-10-07

## Dependency classification

| Dependency                                                                                                                  | Hero                                                                   | Secondary/action-only                   | Remote read                                                             |
| --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| Product session and active membership                                                                                       | Authorization gate                                                     | —                                       | Auth and membership, using the Phase 6 gate                             |
| Authorized transaction base, including amount, currency, date, note, account/category/jar embeds, status, and assigned tags | Ordinary and Transfer summary/facts                                    | —                                       | One transaction read                                                    |
| Activity projection and capability inputs                                                                                   | Direction, sign, product context, status, correction/refund visibility | Commands still revalidate independently | Reuses the base result; its authorization assertion remains independent |
| Paired transfer group                                                                                                       | Both account sides and balanced summary                                | —                                       | One additional read for Transfer only                                   |
| Audit-chain root and reversal/correction children                                                                           | —                                                                      | History section                         | Reuses the base root; reads related rows only                           |
| Available tag inventory                                                                                                     | —                                                                      | Tag editor                              | One read for ordinary transactions                                      |

The transaction mapping remains authoritative. Account, category, jar, currency, status, note, and assigned-tag data come from that mapped base transaction. Transfer activity still requires a complete paired group before rendering.

## Previous architecture

The route awaited the selected transaction, activity projection, audit chain, and tag inventory before returning any Detail UI. For ordinary transactions, the page and activity loader each read the selected transaction, and the audit loader read it a third time before its child queries. Transfer activity added a sequential paired-group query while the page still waited for audit and tag data that Transfer Detail did not display.

## New architecture

```text
session gate
↓
request-cached authorized base transaction
├ activity projection → ordinary hero
│                    └ transfer pair → complete two-sided Transfer hero
├ audit chain → independent history boundary
└ tag options → independent tag-editor boundary
```

Audit and tag reads start after the base result identifies a valid ordinary transaction. They are not awaited by the page and are not started for Transfer. Separate Suspense boundaries keep failures local. `React.cache()` scopes the base result to the current server request; `getTransactionActivity()` and `getTransactionAuditChain()` retain their independent authorization checks.

Correction/refund visibility still derives from current activity and status. The commands continue to re-read authoritative state and verify session, membership, and capability before writing. No transaction write, correction/refund command, transfer RPC, database object, RLS policy, or migration changed in Phase 7.

## Request counts

Remote data reads for representative routes with no existing refund/correction history:

| Read                                           | Phase 6 ordinary | Phase 7 ordinary | Phase 6 Transfer | Phase 7 Transfer |
| ---------------------------------------------- | ---------------: | ---------------: | ---------------: | ---------------: |
| Selected/activity/audit-root transaction reads |                3 |                1 |                3 |                1 |
| Transfer paired-group read                     |                0 |                0 |                1 |                1 |
| Audit child reads                              |                2 |                2 |                2 |                0 |
| Available-tag inventory                        |                1 |                1 |                1 |                0 |
| **Total remote data reads**                    |            **6** |            **4** |            **7** |            **2** |

The audit root now reuses the base result. Transfer skips the unused history and tag reads. Auth/session operations are excluded from this data-read count; their existing request-scoped behavior remains unchanged. Each Detail navigation still uses one RSC request.

## Ordinary Detail performance

The frozen Phase 6 control and final Phase 7 candidate used the same authenticated local browser session and a 440×900 viewport. Results below use ten warm List → Detail navigations per route. Times are milliseconds. For ten samples, p50 is the average of the two center values; p75 is nearest rank (the eighth sorted value). Server spans overlap and are not added together.

| Metric                             | Phase 6 p50 / p75 | Phase 7 p50 / p75 |   Δ p50 / p75 |
| ---------------------------------- | ----------------: | ----------------: | ------------: |
| Base transaction read, server span |       308.5 / 336 |       281.5 / 284 |     −27 / −52 |
| Activity ready, server span        |         311 / 336 |         282 / 285 |     −29 / −51 |
| Hero readable, browser             |     1,158 / 1,170 |       728.5 / 734 | −429.5 / −436 |
| Audit-chain read, server span      |       615.5 / 667 |         337 / 500 | −278.5 / −167 |
| Tag-options read, server span      |       313.5 / 388 |         307 / 373 |    −6.5 / −15 |
| Tag editor ready, browser          |     1,158 / 1,170 |   1,053.5 / 1,373 | −104.5 / +203 |
| Initial route return, server span  |       970 / 1,004 |         587 / 605 |   −383 / −399 |

The financial hero is readable substantially earlier at both percentiles. The tag editor is a proxy for full Detail readiness on this representative ordinary transaction, which has no visible history rows. Its p75 is slower because it includes streamed secondary UI and browser response variability; that delay no longer holds the hero. Audit-chain completion is reported separately above.

## Transfer Detail performance

Transfer Milestone A was counted only when the complete two-sided route card was visible. It is also the full Detail in the current Transfer UI; there are no tag or history sections on that route.

| Metric                             | Phase 6 p50 / p75 | Phase 7 p50 / p75 |   Δ p50 / p75 |
| ---------------------------------- | ----------------: | ----------------: | ------------: |
| Base transaction read, server span |         314 / 318 |       290.5 / 341 |   −23.5 / +23 |
| Paired-group read, server span     |         291 / 343 |       284.5 / 292 |    −6.5 / −51 |
| Activity/hero ready, server span   |       605.5 / 675 |         587 / 617 |   −18.5 / −58 |
| Complete two-sided hero, browser   |     1,161 / 1,267 |   1,047.5 / 1,076 | −113.5 / −191 |
| Full Transfer Detail, browser      |     1,161 / 1,267 |     1,053 / 1,082 |   −108 / −185 |
| Initial route return, server span  |   1,002.5 / 1,054 |       937.5 / 972 |     −65 / −82 |

One direct full-page sample (not used for the warm percentiles) was 1,012 ms hero / 1,331 ms tag-editor-ready for ordinary Detail, and 1,517 / 1,525 ms for Transfer. The frozen control's single cold-ish observations were 1,124 ms ordinary Detail and 1,206 ms Transfer. These singletons are directional only; the repeated matched warm runs drive the comparison.

## Browser tail and correctness

- In seven ordinary samples with both events captured, the hero became visible **219–332 ms before** the RSC stream finished. Transfer's complete summary became visible **12–116 ms after** RSC completion across ten samples.
- The ordinary summary and facts kept the same financial fields and capability presentation: event direction/sign, currency/date, account/category/jar, note/status, assigned tags, and correction/refund visibility. No raw values are recorded here.
- All ten Transfer samples showed both account sides and the balanced summary. The loader still requires the complete posted transfer pair, equal amount/currency/date, distinct accounts/rows, and inclusion of the selected transaction. An incomplete pair returns unavailable activity; it does not render one side.
- Valid empty audit results still hide the history section. Audit read errors now render a localized unavailable alert instead of a false “no history.” The failure test covers child-query errors.
- Focused audit-chain tests cover a valid empty chain, correction links, reversal links, and child-read failure while confirming the base root is reused.
- If tag inventory fails, assigned tags remain in the editor and tag changes are disabled. The page-level failure test covers this behavior.

## Error isolation

| Failure                                        | Result                                                                            |
| ---------------------------------------------- | --------------------------------------------------------------------------------- |
| Base transaction error/not found               | Existing error/not-found route state; no partial financial summary                |
| Activity or required transfer pair unavailable | Existing safe error path; no fabricated amount or one-sided transfer              |
| Audit root/child query error                   | `null` chain becomes a local history-unavailable alert                            |
| Tag inventory error                            | Local tag-unavailable alert; assigned tags remain visible and editing is disabled |

## Phase regressions

- **Phase 1 Back:** ten ordinary and ten Transfer app-Back actions restored the prior list with **0 List RSC requests** on every return.
- **Phase 6 session gate:** Detail still uses `requireProductSession()`. Session/product-gate tests confirm unauthenticated List/Add/Detail routes redirect before route data loads; the parallel gate implementation was not changed.
- **List/Add:** browser smoke reached Transactions List and Add. No submission was made. No Phase 7 change was made to list-page behavior or transaction writes.
- **Responsive/accessibility:** real-browser checks at 390, 440, 768, and 1280 px found no horizontal overflow in light or dark themes. English and Vietnamese routes loaded. Reduced-motion preference was checked; the tag sheet opened with search focus and Escape returned focus to its trigger.

## Validation

- Focused Detail/activity/transfer/audit/tag/correction/refund/ownership/session/navigation tests: **59 passed across 12 files**.
- `npm run lint`: **passed**.
- `npm run typecheck`: **blocked by two existing translator-type errors** in untouched `app/[locale]/(product)/home/home-streaming-sections.tsx` at lines 99 and 340. No Phase 7 file errors were reported.
- `npm run test`: **1,773 passed, 5 failed across 261 files**. The failures are unrelated baseline issues: English-only `money.savingsPage.summaryCaption` key parity, three account-presentation tests missing `NextIntlClientProvider`, and one existing money-privacy wrapping expectation.
- Build was not run because the baseline typecheck is already blocked by the untouched Home translator errors, and the authenticated dev server uses the shared `.next` output.

## Remaining bottleneck

Transfer still waits for its authorized base read followed by the required paired-group read. The pair span is about **285 ms p50 / 292 ms p75** in the final matched run. Do not optimize it in this phase. Ordinary audit/tag spans remain secondary and can delay full secondary completion, but they no longer determine first useful Detail.

## Decision

**TRANSACTIONS PHASE 7 SUCCESS — PROCEED TO TRANSACTIONS PHASE 8**
