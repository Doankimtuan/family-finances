# Investments Performance Phase 2 — History-Aware Back and Browse State

## Implementation

- Replaced the Investments Detail top-bar link in ready, not-found, and error
  states with a guarded return action in
  `app/[locale]/(product)/money/investments/[id]/investments-return-navigation.tsx`.
- The action uses the Navigation API to verify the previous entry is a
  same-document entry for the current locale's Investments List. It calls the
  router's Back only after that check; direct entry, refresh, missing evidence,
  a different route, or an external entry replaces Detail with the canonical
  localized Investments List route.
- Search, Active/Closed tab, and asset-class filter now live in URL query
  parameters declared in `investment-constants.ts`. Native `history.replaceState`
  keeps these client-only changes out of server navigation while Next.js keeps
  `useSearchParams` synchronized. Search text and filters remain shareable.
- Scroll restoration reads the shell's actual scroll region. It keeps only a
  numeric scroll offset in memory, keyed by the browser history entry, and
  applies it in a layout effect once the list content is committed. No holdings,
  balances, or Supabase data enter browser storage.
- Changing tabs clears the asset filter and preserves search. Invalid tab/filter
  query values resolve to the canonical defaults. The empty Closed tab and
  zero-match search states continue to use the existing localized empty states.

No investment queries, RPCs, accounting, Supabase policy, or Phase 1 operation
files were changed.

## Tests and validation

- Focused Investments safe-return and overview suites: **15 tests passed**.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed in an isolated source copy so the running development
  server's `.next` output was left alone.
- `npm run format:check`: the repository-wide check reports 192 files outside
  this patch as unformatted. The changed implementation, test, and audit files
  pass a targeted Prettier check.
- Full `npm run test`: **1,810 passed, 6 failed** across 264 files. Failures are
  outside this change: English/Vietnamese savings message-key parity, account
  identity wrapping, three account-presentation renders missing i18n context,
  and a savings test whose “today” boundary is date-sensitive.

## Browser verification

Brave opened the local Investments route without credentials and was redirected
to `/en/login`. The E2E credential has not been rotated, so no authenticated
login or holdings access was attempted. Consequently, the List → Detail → Back
flow, four viewport checks, five-sample timing, and RSC request counts remain
unverified. No performance measurements are claimed.

**INVESTMENTS PHASE 2 PARTIAL — BROWSER VERIFICATION BLOCKED**
