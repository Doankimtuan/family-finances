# Money Transactions Prefetch Optimization

Date: 2026-09-11  
Scope: authenticated `/en/money/transactions`, Chromium, production build, 440x900 baseline/post-change, 1280x900 functional check  
Status: **COMPLETE**

## 1. Executive Summary

The Transactions list had automatic Next Link prefetch enabled for repeated transaction-detail rows and tag-management links. A fresh 10-run production capture measured 14 post-hydration RSC prefetch requests per run: one tag-management route plus eight visible transaction-detail routes, with five duplicate route requests in the capture.

The narrow fix reuses `PRODUCT_LINK_PREFETCH` (`false`) at the three existing transaction link boundaries. Post-change captures measured zero post-hydration RSC requests in all 10 runs. Normal click navigation, keyboard navigation, filters, pagination, tag management, and browser history remained functional. The initial page load was unchanged within normal hosted-request variance.

Result: **MEANINGFUL WIN** for background network quietness and unnecessary server work.

## 2. Link Inventory

| Source                                | Destination                           | Initial viewport / repetition                                      | Before                          | After                              | Decision                                 |
| ------------------------------------- | ------------------------------------- | ------------------------------------------------------------------ | ------------------------------- | ---------------------------------- | ---------------------------------------- |
| `transaction-list-item.tsx:40-46`     | Transaction detail                    | Repeated per row; 25 rows rendered, first visible rows in viewport | Default                         | `prefetch={PRODUCT_LINK_PREFETCH}` | Disable repeated detail prefetch         |
| `transactions-filter-bar.tsx:100-106` | `/money/transactions/tags`            | Singular, visible                                                  | Default                         | `prefetch={PRODUCT_LINK_PREFETCH}` | Disable secondary tag-route prefetch     |
| `transaction-tag-ui.tsx:275-281`      | `/money/transactions/tags`            | Conditional archived-only state                                    | Default                         | `prefetch={PRODUCT_LINK_PREFETCH}` | Keep tag policy consistent               |
| `transactions-filter-bar.tsx:108-113` | `/money/transactions`                 | Conditional active-filter action                                   | Default                         | Unchanged                          | Keep; not part of observed amplification |
| `page.tsx:173-178`                    | Current list/filter URL               | Error state only                                                   | Default                         | Unchanged                          | Keep retry semantics                     |
| `page.tsx:194-207`                    | Clear filters or transaction creation | Empty state only                                                   | Default                         | Unchanged                          | Keep explicit empty-state actions        |
| `page.tsx:280-286`                    | List with next cursor                 | Conditional pagination action                                      | Default                         | Unchanged                          | Keep explicit pagination navigation      |
| `TopAppBar` shared component          | Money parent route                    | Singular back link                                                 | Already `PRODUCT_LINK_PREFETCH` | Unchanged                          | Existing shared policy                   |
| `MoneyCaptureAction`                  | Create flow                           | Floating action, not a Link                                        | N/A                             | Unchanged                          | No Link prefetch behavior                |

No account/category navigation, edit/correct/refund links, or other transaction detail links are rendered by the initial Transactions list. Those links remain owned by their detail/action surfaces.

## 3. Baseline Browser Network

Protocol:

- `npm run build`
- `VINHA_PERF_TRACE=1 npm run start -- -p 3101`
- Authenticated Chromium, 440x900, 10 repeated `page.goto` navigations
- 1.5 seconds of post-hydration observation per run

| Measure                                     |                                                        Baseline |
| ------------------------------------------- | --------------------------------------------------------------: |
| Initial document requests per run           |                                                               1 |
| Post-hydration RSC requests per run         |                                               14 in all 10 runs |
| Prefetch header (`Next-Router-Prefetch: 1`) |                                               Present on all 14 |
| Unique prefetched route patterns            |                             9: tag management + 8 detail routes |
| Duplicate route prefetches                  |                                                       5 per run |
| RSC-only transferred bytes                  | Not observable; responses were chunked without `Content-Length` |
| Warm response-start median, runs 2-10       |                                                          596 ms |
| Warm content-complete median, runs 2-10     |                                                          608 ms |

The first-run cold/auth variance was retained in raw capture but excluded from warm medians. The initial document request and server-side Supabase requests were not counted as Link prefetch requests.

## 4. Root-Cause Proof

The baseline RSC requests were classified as automatic Link prefetch because each had all of the following characteristics:

- RSC request shape (`?_rsc=...`).
- `Next-Router-Prefetch: 1` request header.
- Non-navigation fetch (`request.isNavigationRequest() === false`).
- Destination matched a visible transaction detail link or tag-management link.
- Requests appeared after the Transactions document had hydrated.

The direct transaction click produced a separate non-prefetch RSC navigation request. Filter and pagination actions were not included in the baseline post-hydration count.

This distinguishes the amplification from the initial server query, hydration document load, explicit navigation, or database mutations.

## 5. Implementation

Changed only these files:

- `app/[locale]/(product)/money/transactions/transaction-list-item.tsx`
- `app/[locale]/(product)/money/transactions/transactions-filter-bar.tsx`
- `app/[locale]/(product)/money/transactions/transaction-tag-ui.tsx`

Each change imports and reuses `PRODUCT_LINK_PREFETCH` from `shared/constants/navigation`. No query, cursor, ordering, filter, detail loader, action, schema, RLS, Auth, or global Next prefetch behavior changed.

## 6. Functional Validation

Authenticated browser checks passed at 440x900 and 1280x900:

- Transaction row click opened the correct detail URL.
- Keyboard focus plus Enter opened the correct detail URL.
- Back and forward returned to the expected list/detail URLs.
- Tag-management link opened `/en/money/transactions/tags`.
- Expense filter and clear-filter links preserved expected behavior.
- Pagination link loaded the next cursor when present.
- No hydration warnings were emitted.
- No horizontal overflow was observed.
- Modifier-click retained the normal anchor path; headless Chromium did not open a new tab for the synthetic Control-click.

No financial data was mutated.

## 7. Network Before vs After

| Measure                                 |      Before |                                               After |
| --------------------------------------- | ----------: | --------------------------------------------------: |
| Initial document requests per run       |           1 |                                                   1 |
| Post-hydration RSC requests, runs 1-10  |     14 each |                                              0 each |
| Automatic detail-route prefetch         |     Enabled |                                            Disabled |
| Tag-management prefetch                 |     Enabled |                                            Disabled |
| Warm response-start median, runs 2-10   |      596 ms |                                              582 ms |
| Warm content-complete median, runs 2-10 |      608 ms |                                              608 ms |
| RSC-only transferred bytes              | Unavailable | 0 post-hydration requests; no comparable byte total |

Remaining requests are the initial document/server render and explicit user-initiated navigation. No automatic detail or tag-management RSC request remained in the post-change protocol.

## 8. Navigation Tradeoff

A single explicit first-row click sample measured:

- Before: 72 ms to detail route.
- After: 93 ms to detail route.

This is not a decision-grade latency sample, but it shows the expected tradeoff: the detail route is fetched on demand instead of being available from the prefetch cache. The measured increase was small and all keyboard/history behavior passed.

## 9. Result Classification

**MEANINGFUL WIN**

The change removed 14 automatic RSC requests per measured list navigation without changing the initial document request count or user-visible navigation contract.

## 10. Remaining Money Bottlenecks

- The Transactions initial read remains a separate server-rendered request with the existing 50-row lookahead and embedded payload.
- Warm content-complete median remained about 608 ms in this comparison; this change should not be credited with initial-render acceleration.
- RSC response bytes were not isolated because the local server returned chunked responses without `Content-Length`.
- Existing MONEY hub and credit-card findings remain separate from this client navigation phase.

## 11. Recommended Next Step

Choose **D. TRANSACTIONS PAYLOAD/PAGINATION BENCHMARK**: measure the existing 50-row lookahead and payload before considering any query or pagination change.

## 12. Raw Evidence

Commands and outcomes:

```text
npm run build                         PASS
npm run typecheck                     PASS
npm run lint                          BLOCKED by existing output/*.mjs lint errors
npm run test                          1,445 passed, 4 unrelated failures
```

The four failing assertions were in app-shell, market-valuation, welcome-preview, and transaction-detail source-shape tests; none referenced the changed link boundaries. The targeted transaction UI/prefetch tests passed.

Baseline route sample:

```text
/en/money/transactions/tags
/en/money/transactions/[id] x8 unique detail routes
Next-Router-Prefetch: 1
post-hydration RSC count: 14
```

Post-change route sample:

```text
initial document: 1 per run
post-hydration RSC count: 0 in all 10 runs
explicit click: one non-prefetch RSC request to /en/money/transactions/[id]
```

Working-tree note: the pre-existing `list-credit-cards.ts` change and `money-performance-investigation.md` audit were left untouched. The requested `money-credit-card-household-read-reuse.md` source file was not present in the workspace.

Database changes: **NONE**  
Financial data mutations: **NONE**  
Infrastructure changes: **NONE**
