# Accounts Phase 2 — History-Aware Back Navigation

Measured 2026-10-04. Scope stayed on Accounts return behavior; no account/card form was submitted and no financial state was changed.

## Implementation

- Added an Accounts-local return helper used by Create Account, Create Credit Card, Account Detail, and Credit Card Detail headers. The page-level Create close path now uses the same helper after resetting its unsaved form state. The sheet/dialog close path and successful-create destination remain unchanged.
- The helper uses `window.navigation` entry and activation evidence. It calls `router.back()` only when the previous entry is same-document, has a key, and matches the current locale’s Accounts origin/path. Otherwise it uses localized `router.replace(APP_PATH.MONEY_ACCOUNTS)`.
- Browser verification showed Next’s app-shell scroll reset to the top on same-document Back. Added entry-keyed in-memory scroll capture and a bounded restore after the Accounts entry renders. The observed scroll position returned from 446px to 446px.
- Added focused unit coverage for in-app eligibility, direct/external/refresh fallback, locale/path mismatch, missing Navigation API evidence, and entry-keyed scroll memory.

Phase 1’s session resolver and all Accounts data loaders were left intact. The existing Phase 1 changes in the working tree were preserved.

## Previous behavior

```text
Accounts A
→ Create / Detail B
→ Link to Accounts
→ Accounts C (new authenticated RSC/data load)
```

## New behavior

```text
Accounts A
→ Create / Detail B
→ history Back
→ restore the exact Accounts A entry, URL state, and scroll position
```

Direct, refreshed, or external entry uses `replace` to the current locale’s Accounts route so it stays inside the product without adding another history entry.

## History evidence

- For all four in-app Phase 2 routes, the browser reported a distinct current entry from the document activation entry; its previous entry key matched the Accounts source key, was same-document, and had the exact localized Accounts pathname.
- App Back restored the original Accounts key and index. Browser Forward returned to the same Create/Detail entry key; browser Back returned to Accounts again.
- Across the repeated four-route run, Phase 2’s Navigation API history remained at two entries. The Phase 1 Link control grew to 33 entries over the same repeated run.
- A query-state probe returned the exact original query string. This was a synthetic URL-state probe; Accounts does not currently interpret those query parameters as filters.
- The shell scroll region returned to its measured 446px position after Card Detail Back.
- Eight direct-entry checks covered both locales and all four route variants. Every Back replaced the direct route with localized Accounts in place. A refreshed Create entry had `currentEntry.key === activation.entry.key` and also used in-place fallback. A cross-origin entry was intercepted locally and safely replaced into Accounts.

## Network

Counts below are per Back action, consistent across the 16 measured actions in each arm. Phase 1 trace counts include the Accounts list reload; Phase 2 records the history restoration window only.

| Metric                       | Phase 1 app Back | Phase 2 history Back |
| ---------------------------- | ---------------: | -------------------: |
| Demand Accounts RSC          |                1 |                    0 |
| `auth.getUser` span          |                1 |                    0 |
| Active membership span       |                1 |                    0 |
| Accounts-route REST requests |                2 |                    0 |
| Accounts-route RPC requests  |                2 |                    0 |
| Total remote fetches         |                5 |                    0 |

Across 16 Back actions, Phase 1 produced 16 RSC requests and 80 remote fetches (16 auth, 32 REST, 32 RPC). Phase 2 produced zero in each category. The remote counts came from the local `VINHA_PERF_TRACE=1` server trace, not an inference from the client UI.

## Performance

The same-run comparison used isolated Phase 1 and Phase 2 source copies, Next.js development mode, the same authenticated read-only household, and one first pass plus three warm passes for each transition. The servers were restarted before the measurement run. No financial fixture or mutation action was used.

“Settled” means Phase 1 waited for the single Accounts RSC response to finish and two animation frames; Phase 2 waited for the original Accounts entry and useful marker to be restored, and for the measured scroll restoration where applicable. The first visible marker is reported separately because Phase 1 can show its cached Accounts list before the RSC reload completes.

### First, cold-ish pass

| Transition                    | Phase 1 RSC settled | Phase 2 entry restored |
| ----------------------------- | ------------------: | ---------------------: |
| Create Account → Accounts     |            1,130 ms |                  94 ms |
| Create Credit Card → Accounts |              834 ms |                 111 ms |
| Account Detail → Accounts     |              689 ms |                 114 ms |
| Credit Card Detail → Accounts |              712 ms |                 111 ms |

### Warm passes

| Transition                    |    Phase 1 samples (median) |  Phase 2 samples (median) |  Saved | Improvement |
| ----------------------------- | --------------------------: | ------------------------: | -----: | ----------: |
| Create Account → Accounts     |   810, 816, 843 ms (816 ms) | 132, 124, 110 ms (124 ms) | 692 ms |       84.8% |
| Create Credit Card → Accounts | 819, 1,206, 868 ms (868 ms) | 115, 121, 119 ms (119 ms) | 749 ms |       86.3% |
| Account Detail → Accounts     | 1,203, 688, 670 ms (688 ms) | 140, 139, 113 ms (139 ms) | 549 ms |       79.8% |
| Credit Card Detail → Accounts |   670, 677, 661 ms (670 ms) | 135, 110, 122 ms (122 ms) | 548 ms |       81.8% |

Warm first-visible marker medians were 120/115/135/115ms in Phase 1 and 124/119/139/122ms in Phase 2, respectively. This means the initial cached Accounts paint was already quick in the Phase 1 copy; the measurable savings are in completion of the authenticated Accounts reload and its remote reads. Phase 2 removes that reload entirely.

## Correctness and regression controls

- The same Create/Detail forward routes rendered before each Back action. No session gate, loader, balance, ownership, visibility, `canMutate`, billing, eligibility, or mutation code changed in Phase 2.
- EN and VI direct fallbacks were verified for all four route variants. Vietnamese screens retained `lang="vi"` and a named Back control.
- Chromium checks covered 390px, 440px, 768px, and 1280px, both light and dark themes, and reduced motion. The shell measured 390px at 390px and 440px at the other widths, with no horizontal overflow.
- All four Phase 2 controls retained a 44×44 effective target (the shared small IconButton has a 36×36 visual box with its existing 4px expansion). Enter and Space activated focused Back controls across Create and Detail routes.
- After Back, focus landed on `body` in both the Phase 1 link control and Phase 2 history control; the change did not alter the observed focus destination.
- The authenticated browser run was read-only. No Save/Create/Edit/Pay action or E2E fixture provisioning was run.

## Validation

- Focused navigation, Savings navigation, and Accounts route-session tests: **38 passed** across 3 files.
- `npm run lint`: passed.
- Prettier check on changed source/test files and `git diff --check`: passed.
- `npm run typecheck`: blocked by the existing `HomeTranslator` type incompatibilities in `app/[locale]/(product)/home/home-streaming-sections.tsx` at lines 99 and 340. No changed Phase 2 file appears in the diagnostics.
- Isolated `npm run build`: optimized compilation passed; type checking stopped on the same two Home errors. The build ran in a temporary source copy to avoid replacing the running app’s `.next` directory.

Sanitized per-sample browser evidence is in [`accounts-navigation-phase-2-evidence.json`](./accounts-navigation-phase-2-evidence.json). It contains no cookies, credentials, account/card IDs, names, balances, or response bodies.

## Remaining bottleneck

The next measured Accounts bottleneck remains `listAccounts()` gating the first useful Create Account and Create Credit Card controls for optional later form data. It was not changed in this phase.

**ACCOUNTS PHASE 2 SUCCESS — PROCEED TO ACCOUNTS PHASE 3**
