# Transactions Phase 1 — History-Aware Detail Return Navigation

## Previous behavior

```text
List A → Detail B → fixed Link → new List C
```

The fixed Link discarded the existing list entry and caused one new Transactions List RSC request per app Back. The frozen pre-change run reproduced that behavior before editing.

## New behavior

```text
List A → Detail B → history Back → exact List A
```

The Detail TopAppBar Back now uses the Navigation API to prove that the immediately previous entry is a same-document entry for the localized Transactions List route. It then calls the existing router Back behavior, preserving the original URL and list state. The query string is left to history; the helper does not reconstruct it.

The same return behavior is used by the existing error-state “Back to transactions” links. No transaction query, loader, session, transfer, or financial mutation code changed.

## Safety and fallback

If Navigation API activation/current-entry evidence is missing, the current entry is the activation entry (direct load or refresh), the previous entry is cross-document, or the previous same-document route is not the localized Transactions List path, the helper replaces the current entry with the localized list route. It never treats an arbitrary same-origin page as a safe predecessor. The in-place replace avoids adding an unnecessary Detail/list entry pair.

Real-browser checks confirmed direct entry in both `/vi` and `/en`, refresh, and an external predecessor all land on the matching in-product Transactions List. The external case did not return to the external origin.

## History evidence

- Expense: source index 0 → Detail index 1 → restored source index 0; same entry key, exact URL, and row set.
- Transfer-filtered list: same source/detail/restored indexes and key; `type=transfer` and the two-row result remained.
- Expense-filtered list: `type=expense`, selected filter, URL, and row count remained.
- Account statement: `/vi/money/transactions?account=[redacted]` returned to the same index 2 entry, key, URL, and 25-row set.
- Browser Forward returned to the same Detail entry. Repeated Detail → app Back → Forward cycles kept history length at two entries.
- Scroll restoration returned to the same list entry and visible anchor; the measured anchor moved 13 px (source scroll top 795 px, returned anchor top 782 px). Browser history already restores the list, so no custom scroll code was added.
- Search and any supported list state remain on the original history entry; unit coverage verifies a combined account/search/type/category/jar/tag/cursor query is not rebuilt or dropped.

No raw history keys, account identifiers, transaction identifiers, financial values, cookies, or response bodies are retained. Sanitized browser measurements are in [transactions-navigation-phase-1-evidence.json](transactions-navigation-phase-1-evidence.json).

## Network

| Metric                  |                                             Frozen control app Back |                                     Phase 1 app Back |
| ----------------------- | ------------------------------------------------------------------: | ---------------------------------------------------: |
| Transactions List RSC   |                                                        1 per return |                                         0 per return |
| `getUser`               |                                     Server-side counter unavailable | 0 destination route reads; no List RSC/route request |
| Membership              |                                     Server-side counter unavailable | 0 destination route reads; no List RSC/route request |
| Transaction rows        |                   List route re-ran; per-loader counter unavailable | 0 destination route reads; no List RSC/route request |
| Filter categories/jars  |                  List route re-ran; per-loader counters unavailable | 0 destination route reads; no List RSC/route request |
| Transaction tags        |                   List route re-ran; per-loader counter unavailable | 0 destination route reads; no List RSC/route request |
| Total destination reads | Individual server reads were not exposed by browser instrumentation | 0 destination route reads; no List RSC/route request |

The browser CDP trace directly recorded the control’s one List RSC and Phase 1’s zero List RSC requests on each successful return. Two unrelated static shell requests (`/manifest.webmanifest` and `/icon-192.png`) appeared in the aggregate capture; no route or transaction-data request occurred on return. Server-side per-loader counters were unavailable, so the report does not invent individual control counts. The Phase 0 audit likewise notes that runtime auth and membership HTTP counts were unavailable.

## Performance

Same authenticated browser, backend, locale, and development environment; each row has one cold-ish and five warm fresh-tab samples. The metric is app Back activation to the restored visible list; warm p50 is reported.

| Return                 | Control p50 | Phase 1 p50 |    Saved | Improvement |
| ---------------------- | ----------: | ----------: | -------: | ----------: |
| Expense Detail → List  |    1,285 ms |      107 ms | 1,178 ms |       91.7% |
| Transfer Detail → List |    1,289 ms |       71 ms | 1,218 ms |       94.5% |

Warm samples:

- Expense control: 1,257 / 2,090 / 1,173 / 1,334 / 1,285 ms; Phase 1: 104 / 107 / 117 / 105 / 115 ms.
- Transfer control: 1,283 / 1,209 / 1,289 / 1,370 / 1,306 ms; Phase 1: 70 / 71 / 71 / 74 / 73 ms.

The filtered Expense, account-statement, and Transfer returns also emitted zero List RSC requests and restored the source entry.

## Regression

The requested real-browser smoke flow completed: Money → Transactions List → Add Transaction → browser Back → Expense Detail → app Back → Transfer Detail → app Back. Add still opens its existing form route, browser Back returns to the list, both Detail types render, and each app Back restores the existing source list. No financial mutation was submitted.

The TopAppBar control remains a localized button (“Back” / “Quay lại”), keyboard activation worked, its focus-visible styling remained present, and its existing expanded touch target remained in place. Only the Detail return behavior and error-state return links changed. Expense, income, transfer pairing, correction/refund flows, ownership, tags, transaction status, and ledger behavior were not modified.

## Validation

- Focused navigation tests: 13 passed.
- Relevant transaction/list/transfer/session/ownership suites: 12 files, 77 tests passed.
- Repository suite: 255 files passed; 3 files failed (5 tests) in unrelated i18n/account files outside this Phase 1 touch set: EN/VI message-key parity, account presentation expecting `break-words`, and three account-presentation renders missing `NextIntlClientProvider`.
- ESLint: passed.
- Typecheck: still fails only in unrelated `home-streaming-sections.tsx` translator typing at lines 99 and 340, matching the Phase 0 baseline. No transaction navigation type error was reported.
- Build: not run; the authenticated development server is using the shared default `.next` output, as in Phase 0. Running `next build` would contend with that session.
- `git diff --check`: passed for the implementation files.

## Remaining bottleneck

The next measured Transactions bottleneck is Add Transaction: Phase 0 measured the full form waiting for its account/reference model before independent controls become usable. That is Phase 2 work and was left unchanged.

## Decision

**TRANSACTIONS PHASE 1 SUCCESS — PROCEED TO TRANSACTIONS PHASE 2**
