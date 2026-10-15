# Investments Phase 1 & 2 Verification Closeout

Date: 2026-10-11

## Credential remediation and logging

**Security gate: not cleared.** The latest credential-hygiene audit records the
E2E password as unrotated and the local secret as unchanged. The task context
also says the password remains unrotated. The local secret value was not read,
printed, or compared in this closeout; its update therefore remains
unverified. The exposed password was not reused, and no password change was
attempted because the account's disposability is unconfirmed.

`next.config.ts` still sets `logging.serverFunctions` to `false`, and its
contract test passes. No authenticated browser or database checks were run.

## Authentication and investment fixture availability

The prior Phase 1.1 check authenticated to the configured E2E household but
found zero active investment holding links. Its stored browser state was
expired. The Phase 0 performance report used an existing read-only holding, but
no safe reusable identity or authenticated session for that context is
confirmed here. The security gate prevented further account discovery. The
standard Playwright fixture setup was not run because it creates Auth users and
financial records. No shared-database fixture writes or Auth/membership
mutations were made.

**Safe active-holding context: not established.**

## Phase 1 — HTTP topology and timing

The Phase 0 report contains one actual read-only Buy-route trace: 14
investment-table reads, plus one accounts-helper request. That control trace
included one selected holding row, one broad portfolio rowset, two lots reads,
two instrument reads, two price reads, two FX reads, three valuation reads, and
one operations/history read. It predates Phase 1 and is not a matched benchmark.

| Measurement                                 | Phase 0 control                                    | Phase 1 candidate                                                                                                    |
| ------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Operation-route Supabase HTTP trace         | One read-only Buy trace; 14 investment-table reads | Not captured; no authenticated holding route was available                                                           |
| Buy/Sell query shape                        | Broad portfolio plus selected holding and accounts | Source review: selected holding, peer identity options, and accounts start concurrently; no portfolio/history loader |
| Update Price query shape                    | Broad portfolio, selected holding, accounts        | Source review: selected holding loader; no portfolio, peer-options, or accounts loader                               |
| Actual candidate read count / request waves | Not applicable                                     | Not measured; source-derived counts are not reported as runtime results                                              |
| Warm samples and p50/p75                    | No matched 10-sample arm                           | Not collected                                                                                                        |

The Phase 0 Buy route marker was approximately 1,263 ms in one direct sample;
its overlapping portfolio, selected-holding, and accounts spans were 1,194 ms,
1,334 ms, and 935 ms. These are single-sample control observations, not
p50/p75. The candidate has no runtime timing results. The earlier Phase 1
source estimate is not used as an HTTP count or performance claim.

Static review shows Buy/Sell, peer-option, and account reads are started in the
same top-level `Promise.all`; the existing dependent selected-holding read
wave remains. The new peer query uses `assertMoneyActionAllowed()`, the
authenticated Supabase server client, an explicit household predicate, and
only `id`, `name`, and `symbol`. Full portfolio/activity reads are skipped for
Buy/Sell/Update Price; Income and Convert retain their existing portfolio
path. No data mutation, RPC/accounting semantics, schema, or RLS change was
introduced.

The form change supplies fee-selector options separately. Mutation commands,
Sell authority, account ownership checks, valuation rules, and financial
payload behavior remain in their existing server paths. Focused tests cover
the route read requirements and operation previews/semantics. Browser
verification of selected holding, peer selector, account references,
read-only/writable states, actual request counts, and financial behavior is
still outstanding. Runtime proof of no new query wave is also unavailable.

## Phase 2 — navigation timing and browse-state restoration

There are no authenticated Phase 2 candidate measurements. Five warm Back
samples, candidate List RSC counts, the List → Detail → app Back path, and
browser checks for direct entry, refresh, cross-module entry, and history safety
were not collected.

For context only, the pre-Phase-2 browser report recorded a 1,328 ms warm median
for Detail → app Back, with one 802 ms List RSC response of 40,095 decoded
bytes. Browser-history Back had a 38 ms warm median (32–39 ms range) and no
RSC request was observed in five samples. Those are prior-implementation
references, not Phase 2 candidate results; p75 was not recorded.

The implementation and unit coverage establish these behaviors without
claiming browser proof:

- The Detail return action uses Back only when Navigation API evidence points
  to the same-document, same-origin, current-locale Investments List; direct,
  refreshed, cross-module, external, or unsupported-history cases replace to
  the canonical localized List.
- Search, Active/Closed tab, and asset filter are URL-backed. Unit tests cover
  restoration, preserving search on tab change, resetting the filter, and
  defaults for invalid tab/filter values.
- Scroll restoration stores only a numeric offset in memory by history-entry
  key; a unit test covers restoration for the same entry.
- Locale fallback is covered for English and Vietnamese in unit tests.

The unit suite does not replace real-browser evidence. Authenticated scroll
restoration, all requested route transitions, actual List RSC count, five warm
Back timings, and viewport checks remain unverified.

## Validation and known full-suite failures

- Focused Investments and security suites: **53 tests passed** across seven
  files.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed in an isolated temporary source copy; the active
  workspace `.next` output was left untouched.
- Full `npm run test`: **1,812 passed, 5 failed** across 264 files. The five
  failures are the recurring English/Vietnamese savings-message key parity
  mismatch, account identity wrapping expectation, and three account
  presentation tests missing `NextIntlClientProvider`.
- These five failure categories match the earlier Phase 1 full-suite run. The
  date-sensitive savings case present in the Phase 1.1/earlier Phase 2 reports
  passed this run. No clean pre-Phase-1 baseline exists, so the failures are
  known and outside the touched Investments files, but cannot be proven to
  predate Phase 1.
- Targeted formatting checks pass. The latest repository-wide format check
  reported 192 unrelated files; it was not rerun for this closeout.

No financial mutations, fixture writes, credential changes, schema changes,
or RLS changes were made. No new performance optimization or Phase 3 work was
started.

## Remaining blockers and recommendation

Before runtime verification, rotate the exposed E2E password through the
supported account flow, update the local secret, and confirm both without
printing the values. Then establish a safe authenticated context with an
existing active holding; do not create shared-database fixtures. Only after
those gates pass should the matched Phase 1 request/timing comparison and
Phase 2 browser/RSC checks resume. Do not start Phase 3 before that evidence is
available.

Retain the Phase 1 and Phase 2 implementations. Defer runtime verification;
this closeout found no targeted regression, but cannot establish runtime
performance or browser behavior.

**INVESTMENTS PHASE 1 & 2 PARTIAL — KEEP IMPLEMENTATION, DEFER RUNTIME VERIFICATION**
