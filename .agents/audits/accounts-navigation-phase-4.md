# Accounts Phase 4 — Account Detail Progressive Rendering

Measured 2026-10-04. Scope: liquid Account Detail. Phase 1 session gating,
Phase 2 history-aware Back, Phase 3 Create forms, Accounts List, and card
presentation remain outside this phase's UI changes.

## Dependency classification

| Data                      | Hero / summary                                                                                         | Activity                                                          | Action / management                             | Used by liquid branch?                |
| ------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------- |
| `getAccount()`            | Account identity, actual ledger balance, currency, scope, owner state, archived state, and `canMutate` | —                                                                 | Capability gates management and actions         | Yes; critical                         |
| `getAccountType()`        | Selects the shared route branch after an authorized, non-archived account row is found                 | —                                                                 | —                                               | Yes; branch selection only            |
| Recent transactions       | —                                                                                                      | Five recent transaction rows, period, empty state, or local error | “View activity” appears when rows exist         | Yes; deferred                         |
| `listAccounts()`          | —                                                                                                      | —                                                                 | Credit Card Detail's linked-account action only | No for liquid; retained for cards     |
| Household currency        | Formatted current balance                                                                              | Transaction amounts use their transaction currencies              | —                                               | Yes; returned with `getAccount()`     |
| Selected-account balance  | Actual balance and health state                                                                        | —                                                                 | —                                               | Yes; authoritative ledger balance RPC |
| Selected owner membership | Ownership badge and owner status                                                                       | —                                                                 | `canMutate` and action visibility               | Yes; critical                         |
| Account options           | —                                                                                                      | —                                                                 | No liquid Detail consumer                       | No                                    |

The existing liquid hero already consumes the name, type, actual balance,
household currency, ownership badge, status, health warning, privacy control,
offline banner, quick actions, and management capability. The page still waits
for the complete selected-account result before rendering that hero.

## Previous architecture

After `requireProductSession()`, the shared route waited for translations,
`getAccount()`, recent activity, and `listAccounts()` before returning any
Account Detail UI. Recent activity is not needed to understand the account
summary. The liquid branch built the generic account options from
`listAccounts()` but never passed them to a liquid component.

The earlier source trace reported representative overlapping spans of about
879 ms for `getAccount()`, 904 ms for recent activity, and 1,012 ms for
`listAccounts()`. These are individual representative spans, not medians; the
three requests ran in parallel.

## New architecture

- The route starts `getAccount()` and `getAccountType()` together after the
  unchanged Phase 1 session gate.
- Both APIs use a request-scoped cached household/account context. The type
  lookup validates the selected row and account visibility before the route
  starts liquid activity. It does not provide any client capability.
- For liquid accounts, the activity read starts as soon as that authorized
  account context resolves, while selected-owner validation and the
  authoritative balance RPC continue. The hero still waits for both.
- Recent activity renders inside a local `Suspense` boundary with the shared
  skeleton primitives. Its empty and error states remain inside that section.
- The hero and detail root remain mounted when the activity section resolves.
- The card branch still uses its linked-account list and card-specific reads.
  It does not start the liquid activity promise.

```text
Before: session → parallel getAccount + activity + listAccounts → wait all → page

After:  session → authorized selected account context
                         ├─ selected owner + authoritative balance → hero
                         └─ recent activity → local Suspense section
        listAccounts → card branch only
```

## Unused work

`listAccounts()` is removed from the liquid Detail request path. For the
sampled shared liquid account, the control request graph had one household and
selected-account read, one recent-transaction read, one generic household and
account-list pair, one generic owner-membership lookup for the inventory's
personal accounts, and two balance RPCs (selected account and generic list).
The final graph keeps the selected-account reads, selected balance, and recent
activity; the generic list subtree disappears. For a selected personal
account, the selected owner-membership lookup remains required.

The control's selected-record request total of 10 is from the Phase 1 route
trace. After counts below are derived from the final source graph and the
React request cache; a fresh server fetch trace was not available for the
final arm. Optional owner lookups vary with account ownership and inventory.

| Remote operation                                 |                               Before control |                      After Phase 4 | Critical after?                  |
| ------------------------------------------------ | -------------------------------------------: | ---------------------------------: | -------------------------------- |
| `getUser`                                        |                                            1 |                                  1 | Yes; Phase 1 gate                |
| Active session membership                        |                                            1 |                                  1 | Yes; Phase 1 gate                |
| Selected household/account reads                 |                                       2 REST | 2 REST, shared by type and summary | Yes                              |
| Selected owner-membership lookup                 | 0 for sampled shared account; 1 for personal |            Same conditional lookup | Yes for personal ownership state |
| Selected balance RPC                             |                                            1 |                                  1 | Yes; authoritative hero balance  |
| Recent transactions                              |                                       1 REST |                             1 REST | No; local Suspense               |
| Generic `listAccounts()` household/account reads |                                       2 REST |                                  0 | No; removed for liquid           |
| Generic account owner lookup                     |                  1 REST in sampled inventory |                                  0 | No; removed for liquid           |
| Generic list balance RPC                         |                                            1 |                                  0 | No; removed for liquid           |
| Total remote operations, sampled shared account  |                                           10 |                   6 source-derived | —                                |

The `getAccountType()` and `getAccount()` calls do not issue duplicate
household/account reads: the shared loader is wrapped in React `cache()` for
the current RSC request. `listRecentTransactions()` retains its own existing
household/session gate and account filter. No new RPC, browser fetch, or
cross-request financial cache was added.

## Files changed

- `app/[locale]/(product)/money/accounts/[id]/page.tsx` — branches by the
  authorized account type, starts liquid activity before the balance result
  completes, and streams the activity section locally. Existing Phase 1/2
  route changes already present in this file were preserved.
- `modules/ledger/application/queries/list-accounts.ts` — shares the
  selected household/account read between `getAccount()` and the new type
  lookup, keeping the selected owner and balance reads in `getAccount()`.
- `modules/ledger/application/index.ts` — exports the type lookup for the
  application route.
- `tests/unit/accounts-detail-progressive-rendering.test.tsx` — covers the
  authorized hero during pending activity, activity starting while balance is
  pending, empty/error activity, unavailable accounts, the card branch, and
  former-owner read-only capabilities.
- `.agents/audits/accounts-navigation-phase-4.md` and
  `.agents/audits/accounts-navigation-phase-4-evidence.json` — this sanitized
  implementation, measurement, and validation record.

## Performance

The primary comparison used a frozen pre-Phase-4 source and final source on the
same authenticated browser, same selected liquid account, same app process,
390 × 844 CSS-pixel viewport, Vietnamese route, and no CPU or network
throttling. The first sample in each arm followed a source swap while the dev
server and browser were already warm; it is not a cold-process measurement.
Three warm repetitions followed. A browser `MutationObserver` recorded the
first non-zero layout box for the real hero and activity section after the
Accounts row click. Times are rounded to the nearest millisecond.

| Milestone                    |            Control first / warm samples (median) |     Phase 4 first / warm samples (median) | Warm median delta |
| ---------------------------- | -----------------------------------------------: | ----------------------------------------: | ----------------: |
| A — useful financial hero    |        1,908 / 1,697, 1,750, 1,722 ms (1,722 ms) | 2,109 / 2,082, 1,722, 1,722 ms (1,722 ms) |      <1 ms (0.0%) |
| B — activity ready           |        1,908 / 1,697, 1,750, 1,722 ms (1,722 ms) | 2,109 / 2,082, 1,722, 1,722 ms (1,722 ms) |      <1 ms (0.0%) |
| C — full liquid detail ready | Same as A; page released only after awaited data |          Same as A/B in this repeated set |      <1 ms (0.0%) |

The first Phase 4 pass was 201 ms slower; the warm median differed by less
than one millisecond. That is not a measurable hero improvement. Activity and
hero arrived together in these paired repetitions. The same detail-root and
hero DOM nodes remained through activity resolution. The dev browser timings
vary enough that the paired result does not support a speedup claim.

The architectural change is verified: generic list work is absent from the
liquid branch, and activity is no longer awaited by the hero. The acceptance
criterion for a measurable earlier summary is not demonstrated by the paired
warm median, so this phase is partial pending investigation of the remaining
critical path.

## Financial correctness

- The hero still waits for `getAccount()` to return the selected account's
  current ledger balance, household currency, selected owner state, scope,
  archived state, and `canMutate` value.
- `getAccount()` continues using the existing selected-account balance RPC
  and owner-membership validation. It does not use an Accounts List balance
  or the recent transaction array to calculate the displayed balance.
- Unknown, archived, malformed, or out-of-household account IDs return the
  existing unavailable state. If the authorized account context is
  unavailable, the route starts no activity or optional card loaders.
- A recent-activity failure is rendered inside the activity section and does
  not replace an already authorized hero. An empty list uses the existing
  empty state; no activity is fabricated.
- The first summary keeps former-owner personal accounts read-only. The
  existing mutation commands and their fresh server authorization were not
  changed. No financial action was submitted in the browser.

## Browser verification

- Real-browser Account Detail checks passed at 390, 440, 768, and 1280 px;
  document and body widths matched the viewport with no horizontal overflow.
- Direct English and Vietnamese detail entry rendered the correct locale,
  summary, and activity. A real liquid account with recent transactions
  rendered its rows; empty and error outcomes are covered in unit tests.
- The activity fallback uses shared skeleton primitives and semantic tokens.
  At 390 px its observed section height was about 310 px; resolved activity
  was about 339 px, a 29 px content expansion with no collapse or overflow.
- The final paired runs retained the same detail-root and hero DOM nodes while
  activity resolved. The activity boundary remained local to the lower page.
- Dark and light token rendering, reduced-motion preference, visible keyboard
  focus, and opening then Escape-closing Account Settings were checked. No
  mutation was performed.
- Account Detail → Accounts returned through the existing Phase 2 history
  helper. The observed Back restoration issued no RSC, `getUser`, membership,
  or Accounts data reload request.
- Lightweight Phase 3 smoke checks opened both Create routes and found the
  enabled account-name field. Neither form was submitted.

## Regression controls

- Phase 1: `requireProductSession()` remains before account loaders; its
  request-cached parallel user and membership resolution is unchanged.
- Phase 2: `AccountsReturnTopAppBar` still delegates to the existing
  history-aware Accounts helper; that helper was not changed in this phase.
- Phase 3: Create form sources were not changed; direct route smoke checks and
  the existing form/session suite passed.
- Credit Card Detail retains `listAccounts()` for linked-account options and
  retains its card detail, installment, eligible-purchase, and recent-activity
  loaders. Its same-session spot-check did not regress: the frozen control's
  four click-to-full samples were 3,092, 2,635, 2,437, and 1,898 ms; Phase 4
  samples were 3,053, 2,249, 1,794, and 1,834 ms. Warm median was 2,437 ms
  control and 1,834 ms Phase 4. The liquid-only activity scheduling change
  does not execute for cards.

## Validation

- Focused Account Detail/session/navigation/forms/ledger/ownership/card suite:
  **147 tests passed across 18 files**.
- `npm run lint`: passed.
- `npx prettier --check` on the Phase 4 source, test, report, and evidence
  files: passed. `git diff --check` and evidence JSON parsing also passed.
- `npm run typecheck`: remains blocked by two existing
  `HomeTranslator`/`Translator` incompatibilities in
  `app/[locale]/(product)/home/home-streaming-sections.tsx` at lines 99 and 340. No Phase 4 file is reported.
- `npm run test`: 252 files passed; **1,718 tests passed and 5 failed**. The
  five known baseline failures are English/Vietnamese parity for
  `money.savingsPage.summaryCaption`, one existing Money IA privacy assertion
  expecting `break-words` instead of the current `truncate`, and three
  Credit Card presentation tests without `NextIntlClientProvider`. These same
  failures were documented in the Phase 3 audit and are outside this change.
- Production build was not rerun because the current baseline typecheck fails
  on the unrelated Home translator incompatibilities. Earlier isolated phase
  builds stopped at those same errors after compilation.

## Remaining bottleneck

The selected-account `getAccount()` path, including the Phase 1 session gate,
selected owner check, and authoritative balance RPC, still gates the hero. The
paired browser sample did not separate those server waits from RSC delivery
and browser hydration. The next larger Accounts bottleneck already measured in
Phase 3 is the optional Credit Card linked-account selector (`listAccounts()`;
2,087 ms warm median in that run). Investigate the critical path before
starting another implementation phase.

**ACCOUNTS PHASE 4 PARTIAL — INVESTIGATE BEFORE PHASE 5**
