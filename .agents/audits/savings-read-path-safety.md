# Savings read-path safety

| Field                       | Value                                                      |
| --------------------------- | ---------------------------------------------------------- |
| Date                        | 8 Sep 2026                                                 |
| Predecessor                 | [rsc-performance-profile.md](./rsc-performance-profile.md) |
| Scope                       | Remove hidden writes from the Savings GET/RSC path         |
| Data mutations in this task | None (code + mocked tests only)                            |

## Executive summary

Visiting Savings was not read-only. The route layout mounted a client component that, after hydration, POSTed `syncSavingsLifecycleAction` and ran mutation RPCs (`backfill_legacy_savings_accounts`, `detect_matured_savings`, `enqueue_savings_maturity_cascade`). Those RPCs can `INSERT`/`UPDATE` savings rows and enqueue Inbox items.

The Savings GET tree is now read-only. Lifecycle maintenance still exists as an explicit command (`syncSavingsLifecycle`) and server action (`syncSavingsLifecycleAction`). It is no longer invoked by rendering or hydrating the page.

## Previous behavior

```text
GET /vi/money/savings
  ├── layout.tsx mounts SavingsLifecycleSync (client, renders null)
  ├── page.tsx reads listSavings (read-only queries)
  └── after hydrate
        useEffect (once)
          └── syncSavingsLifecycleAction (server action POST)
                ├── backfillLegacySavingsAccounts
                │     └── RPC backfill_legacy_savings_accounts
                └── detectMaturedSavings
                      ├── RPC detect_matured_savings
                      └── RPC enqueue_savings_maturity_cascade
```

The RSC render itself did not write. A real browser visit did, because hydration ran the effect. Prefetch without hydration did not write. The previous page-render unit test mocked `SavingsLifecycleSync` away and never rendered the layout, so it could not catch this.

## Mutation call graph

Inspected from imports and call sites (not guessed):

```text
app/[locale]/(product)/money/savings/layout.tsx
  └── SavingsLifecycleSync                         [REMOVED]
        └── syncSavingsLifecycleAction              [KEPT, no longer auto-called]
              └── syncSavingsLifecycle               [NEW command]
                    ├── backfillLegacySavingsAccounts
                    │     └── supabase.rpc(SAVINGS_RPC.BACKFILL_LEGACY)
                    └── detectMaturedSavings
                          ├── supabase.rpc(SAVINGS_RPC.DETECT_MATURED)
                          └── supabase.rpc(SAVINGS_RPC.ENQUEUE_MATURITY_CASCADE)
```

Related explicit callers that remain (not on GET):

- `detectMaturedSavingsAction` — detect + Inbox enrichment
- `backfillLegacySavingsAction` — legacy backfill only
- `acknowledgeSavingsMaturityAction` — calls `detectMaturedSavings` before a confirmed money action

### What caused the sync to execute

Mounting `SavingsLifecycleSync` in the Savings layout. Its `useEffect` ran once after hydrate and called the server action.

### Whether it ran automatically after Savings page hydration

Yes. A real authenticated browser visit to any Savings layout child (`/money/savings`, `/money/savings/[id]`, `/money/savings/new`, …) triggered the writes.

### Mutation RPCs and tables

| RPC                                | Can mutate                                                                                                                           |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `backfill_legacy_savings_accounts` | `INSERT` into `savings` and `saving_cycles` from legacy `savings_accounts` (idempotent skip when a matching snapshot already exists) |
| `detect_matured_savings`           | `UPDATE saving_cycles` (status `matured`, accrued interest); `UPDATE savings` (status `matured`); `produce_inbox_item` → Inbox rows  |
| `enqueue_savings_maturity_cascade` | `produce_inbox_item` for 30/14/7/3/1-day cascade reminders                                                                           |

Idempotency is owned by the SQL (legacy snapshot key; Inbox produce uniqueness; matured cycles are no longer `active`).

### Why this belonged to the Savings read path

It was treated as “visit Savings → keep household lifecycle current.” The UI already derives matured presentation from cycle `end_date` without that write (`deriveMaturityPresentationState`). Persisted status / Inbox still required the RPCs.

### Existing reusable boundary

Yes, without a new scheduler:

- Application commands already existed: `backfillLegacySavingsAccounts`, `detectMaturedSavings`
- Server actions already existed: `syncSavingsLifecycleAction`, `detectMaturedSavingsAction`, `backfillLegacySavingsAction`
- Admin cron HTTP exists only for market prices/catalog, not savings
- `pg_cron` jobs exist for month-ritual autolock and market sync; none invoke savings lifecycle

No new cron/migration was added. Savings lifecycle is now a reusable command that those later boundaries can call.

## New behavior

```text
GET /vi/money/savings
  ├── read-only listSavings (+ auth/membership)
  ├── render UI
  └── X  no lifecycle mutations

Explicit mutation boundary
  syncSavingsLifecycle()
    └── syncSavingsLifecycleAction()   // existing server action, now a thin adapter
  also still: detectMaturedSavingsAction, backfillLegacySavingsAction,
              acknowledgeSavingsMaturityAction → detectMaturedSavings
```

Savings list/detail UI still uses date-derived maturity presentation, so the screen stays truthful before detection has run.

## Safety invariants

- Savings GET/RSC (page, layout, loading) is read-only.
- No lifecycle mutation runs during page rendering or hydration.
- Lifecycle functionality remains available through `syncSavingsLifecycle` / `syncSavingsLifecycleAction`.
- No hosted database was written while making this change. Tests mock the Supabase/RPC boundary.

## Files changed

| File                                                              | Why                                                                                  |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `modules/savings/application/commands/sync-savings-lifecycle.ts`  | Explicit compose command (backfill then detect/cascade).                             |
| `modules/savings/application/index.ts`                            | Export the command.                                                                  |
| `app/[locale]/(product)/money/savings/savings-actions.ts`         | Action delegates to the command; no longer composes RPCs itself.                     |
| `app/[locale]/(product)/money/savings/layout.tsx`                 | Read-only pass-through. No client sync mount.                                        |
| `app/[locale]/(product)/money/savings/savings-lifecycle-sync.tsx` | Deleted. This was the hydrate write trigger.                                         |
| `tests/unit/savings-page-no-write-on-render.test.ts`              | Test A: page+layout render is read-only; GET tree must not mention mutation markers. |
| `tests/unit/savings-lifecycle-sync.test.ts`                       | Test B: command composition + action adapter.                                        |
| `tests/unit/savings-commands.test.ts`                             | Test B: explicit command hits the three RPCs (mocked client).                        |
| `tests/unit/savings-lifecycle-sync-component.test.tsx`            | Deleted with the client component.                                                   |

## Tests

Focused Savings/lifecycle unit tests (mocked mutation boundary, no hosted DB):

```text
tests/unit/savings-page-no-write-on-render.test.ts     2 passed
tests/unit/savings-lifecycle-sync.test.ts             6 passed
tests/unit/savings-commands.test.ts                   11 passed
tests/unit/savings-inbox-workflow.test.ts               5 passed
tests/unit/savings-domain.test.ts                     31 passed
tests/unit/savings-renewal-policy.test.ts             13 passed
tests/unit/savings-row-mapper.test.ts                   4 passed
```

Result: **72 passed**.

Typecheck: `npx tsc --noEmit` — **passed**.

Targeted ESLint on changed TS files — **passed**.

Full repository test suite: not run (change is Savings-local).

Browser verification: not run. The removed component rendered `null`; UI contracts are unchanged. Safety rules forbid using production credentials or writing household data.

## Remaining considerations

- Nothing currently schedules `syncSavingsLifecycle` for all households. Cascade reminders and maturity Inbox items will not appear from a Savings page visit. They still appear when `detectMaturedSavings` / `syncSavingsLifecycle` is invoked explicitly (including before a confirmed maturity money action).
- A later ops task can hang the command on the existing admin-cron HTTP pattern (`/api/admin/market-price-sync`) or a `pg_cron` worker. That needs a household loop and a privileged client — out of scope here, and it would require a migration to schedule.
- `detectMaturedSavingsAction` still enriches Inbox payloads; `syncSavingsLifecycle` preserves the previous compose path and does **not** add that enrichment.
- Do not re-mount a hydrate effect on Savings (or Home/Money) to “fix” Inbox lag.
