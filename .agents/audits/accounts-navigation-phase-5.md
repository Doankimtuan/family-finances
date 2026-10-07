# Accounts Phase 5 — Liquid Detail Balance-Wave Overlap

Measured 2026-10-05. Scope: the selected-account `getAccount()` path used by
Liquid Account Detail. The existing session gate, balance RPC and calculation,
recent activity, Accounts List, navigation, and card-specific loaders remain
unchanged.

## Previous critical path

The frozen Phase 4 source awaited the selected household/account context
before starting the selected balance RPC:

```text
session gate → account + household context → selected balance RPC → getAccount → hero
```

The account and household reads already ran together. The balance RPC was the
second remote wave.

## Security proof

Read-only inspection of the linked deployed schema confirmed that
`public.get_account_ledger_balances(uuid[])` is `SECURITY INVOKER`, executable
by `authenticated` and not `anon`, and unchanged by this phase. Its selected
IDs are constrained to the current active household. The active-household
helper requires an authenticated user with active membership. RLS is enabled
on accounts, transactions, and household membership data; the account and
transaction read policies require active household membership. The app's
server client uses the public Supabase key; service-role access is isolated to
the separate admin client and is not used by this query.

The RPC can return only rows visible in that active-household scope. A
missing, foreign, or archived account still fails the separate selected
account context check and `getAccount()` returns `null`; an early balance can
never authorize or render the hero. An ID outside the active household yields
no balance row rather than an existence-specific error. No foreign account
identifiers or financial values were queried for this audit, and no SQL, RLS,
grant, or RPC definition was changed.

An archived but well-formed ID can start the same scoped RPC before the
context read discovers `is_archived`; its result is discarded. Avoiding that
single safe read would put the account context back in front of the balance
wave.

## Implementation

`modules/ledger/application/queries/list-accounts.ts` now validates the route
ID as a UUID before starting remote work, starts the existing selected-account
balance helper alongside the cached household/account context, and waits for
the context before using the balance. The context remains authoritative for
existence, household visibility, supported type, archived behavior, scope,
owner membership, owner status, and `canMutate`. Personal-owner validation
still starts only after the trusted selected row supplies its owner ID.

There is still exactly one selected-account balance RPC. The current
`get_account_ledger_balances` implementation and `applyLedgerBalances` math are
reused. No global promise cache was introduced. Balance errors stay
unavailable; they do not become zero. If the authorized context fails, any
early balance result is discarded. Malformed IDs and denied sessions start no
balance read.

The shared route cannot know whether an ID is a card until the selected
account context resolves. Therefore the same `getAccount()` helper also starts
the card's selected-account RPC earlier. The card request graph, RPC count,
return model, and card-specific loaders were verified unchanged; only the
selected RPC's start time can move earlier.

## Overlap evidence

The benchmark used a frozen Phase 4 copy and a Phase 5 candidate in the same
local app environment, authenticated browser, locale, selected liquid
household account, and unthrottled session. Server spans measured session
gate, account/household context, selected balance RPC, and `getAccount()`;
browser marks measured the first readable hero and ready activity section.
Ten warm samples were collected for each arm. The dev process and browser were
already warm, so no first/cold-ish number is claimed. Percentiles use nearest
rank; times are milliseconds.

The control had no context/balance overlap in all 10 samples. The candidate had
positive measured overlap in all 10: **274–776 ms, median 287 ms, p75 302 ms**.
That is direct span intersection, not an inference from total duration.

| Stage                       | Frozen Phase 4 min / median / p75 / max | Phase 5 min / median / p75 / max |
| --------------------------- | --------------------------------------: | -------------------------------: |
| Session gate                |                 304 / 351 / 698 / 1,426 |            293 / 308 / 664 / 880 |
| Account + household context |                   277 / 364 / 636 / 696 |          279 / 305.5 / 725 / 852 |
| Selected balance RPC        |                   270 / 287 / 348 / 360 |            274 / 295 / 370 / 819 |
| Context ↔ balance overlap   |                           0 / 0 / 0 / 0 |            274 / 287 / 302 / 776 |
| `getAccount()` total        |                 562 / 654 / 975 / 1,050 |            287 / 368 / 823 / 866 |
| Click → readable hero       |         1,123 / 1,277.5 / 1,652 / 2,762 |      692 / 787.5 / 1,286 / 2,055 |
| Click → activity ready      |           1,329 / 1,469 / 1,854 / 2,970 |      983 / 1,114 / 1,580 / 2,943 |

The `getAccount()` median decreased by **286 ms (43.7%)** and p75 by
**152 ms (15.6%)** in the same-run comparison. Click-to-hero median decreased
by **490 ms (38.4%)** and p75 by **366 ms (22.2%)**. The balance RPC duration
itself did not improve; its start now overlaps context. The sanitized sample
arrays and request counts are in
[`accounts-navigation-phase-5-evidence.json`](./accounts-navigation-phase-5-evidence.json).

## Request counts

For the sampled household-owned liquid account, both arms made one `getUser`,
one active-membership read, one selected account read, one selected household
read, one selected balance RPC, and one recent-activity read. No selected
owner-membership request was needed for this household-owned account. The
count stayed the same; only the selected balance RPC moved alongside context.

The frozen and candidate card traces also had matching operation counts: one
selected-account balance RPC, the card branch's existing account-list batch
balance RPC, and the same card detail, installment, eligible-purchase, linked
account, and activity reads. No card loader or card-only UI path changed.

## Financial equivalence

- The hero still consumes the authoritative selected balance and currency.
- Focused query tests assert balance, account type, archived state, household
  scope, owner status, and mutation capability. Viewer-owned, partner-owned,
  and former-owner personal-account capabilities remain unchanged.
- The `LedgerAccount` model has no separate `openingBalance` or health-warning
  field; its `balance` remains produced by the existing ledger mapping.
- The live Account Detail balance matched the same account's Accounts row in
  the authenticated browser. Currency and household ownership were visible;
  management and quick-action buttons remained available. No mutation was
  submitted.

## Browser verification

The final workspace build was exercised in the authenticated browser on the
Vietnamese Accounts route. A liquid detail showed its identity, current
balance, currency, household ownership, management actions, and recent
activity. Detail → Accounts Back returned to the Accounts directory with **0
RSC, 0 `getUser`, 0 membership, and 0 account reads**. The browser was restored
to its starting Money overview afterward.

## Regression controls

- Phase 1 session gate and request-scoped session/member checks were not
  changed. Malformed IDs and denied sessions start no balance RPC.
- Phase 2 navigation code was not changed; real-browser Back retained its
  zero-read behavior.
- Phase 3 create flows and their files were not changed.
- Phase 4 activity remains deferred from the hero. The progressive route test
  still covers pending, empty, and error activity, and `listAccounts()` stays
  absent from the liquid route.
- Card route tests assert one call to `getAccount()` and unchanged calls to the
  card detail, installment, eligible-purchase, linked-account, and activity
  loaders. The isolated control/candidate traces showed matching card request
  counts.

## Validation

- Focused overlap, Account Detail, session, Back-navigation, and ledger balance
  tests: **49 passed across 5 files**.
- `npm run lint`: passed.
- `git diff --check`: passed.
- `npm run typecheck`: blocked by two existing translator type errors in
  `app/[locale]/(product)/home/home-streaming-sections.tsx` (lines 99 and 340).
  No Phase 5 file is reported.
- `npm run build`: production compilation succeeded, then TypeScript stopped
  on the same unrelated `HomeTranslator` errors. No unrelated files were
  changed to work around the baseline.

## Remaining bottleneck

The required session/active-membership gate and authorized account/household
context remain on the path to the hero. For personal accounts, selected owner
membership validation remains conditional on the trusted owner ID. The
selected balance RPC now runs alongside context. No further optimization was
started.

**ACCOUNTS PHASE 5 SUCCESS — PROCEED TO ACCOUNTS PHASE 6**
