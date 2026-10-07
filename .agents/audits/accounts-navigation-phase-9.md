# Accounts Phase 9 — Credit Card Ownership Capability Wave

Inspected and implemented 2026-10-05. No database objects, policies, grants, or session behavior changed. This report contains no account, household, or membership IDs; financial values; credentials; cookies; raw responses; or request IDs.

## Existing ownership model

`accounts.owner_membership_id` identifies the owning `household_members` row for a personal account. The deployed `accounts_scope_owner_pair_check` requires household-scope accounts to have no owner ID and personal-scope accounts to have one. The owner foreign key includes both `household_id` and `owner_membership_id`, so an account cannot point to a membership in another household.

Accounts are readable by an active household member regardless of financial scope. The account select policy checks active membership in the account household. Readability does not establish an active personal owner and does not grant personal mutation capability.

`mapAccountRow()` delegates ownership fields to the existing `resolveFinancialCapabilities()` mapper:

- `isOwnedByMe` is true when the resource is personal and its owner membership ID equals the viewer's active membership ID. This identity comparison does not itself prove that the owner membership is active.
- `ownerStatus` is `former` when a personal resource has a non-null owner ID without active-owner evidence; otherwise it is `active`.
- `canMutate` is always true for household-scope accounts. For personal accounts it requires both an exact viewer/owner membership ID match and active owner status.
- A personal row with a null owner ID is invalid under the database constraint. The existing mapper fallback is `isOwnedByMe: false`, `canMutate: false`, and `ownerStatus: active`.

| Case                                                      | Readable?                                                                              | Active owner evidence? | `isOwnedByMe`                                                             | `canMutate` |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------- | ----------- |
| Household account/card, null owner ID                     | Yes, to active household members                                                       | Not applicable         | No                                                                        | Yes         |
| Viewer-owned personal card, active owner                  | Yes                                                                                    | Yes                    | Yes                                                                       | Yes         |
| Partner-owned personal card, active owner                 | Yes                                                                                    | Yes                    | No                                                                        | No          |
| Former/inactive owner with non-null owner ID              | Yes                                                                                    | No                     | No in the normal former-member case; still derived from exact ID equality | No          |
| Missing owner evidence with non-null owner ID             | Yes                                                                                    | No                     | Derived from exact ID equality                                            | No          |
| Personal row with null owner ID (invalid persisted shape) | Yes if its account row is visible                                                      | No                     | No                                                                        | No          |
| Embedded row from another household                       | Yes if the account row is visible; this relationship is prohibited by the composite FK | No                     | Derived from the account's owner ID                                       | No          |
| Embedded ID differs from account owner ID                 | Yes                                                                                    | No                     | Derived from the account's owner ID                                       | No          |
| Malformed `is_active` value such as a string              | Yes                                                                                    | No                     | Derived from the account's owner ID                                       | No          |

The last three cases preserve the mapper's current identity-derived `isOwnedByMe` behavior while ensuring invalid evidence cannot set `ownerStatus` to active or grant `canMutate`.

## Relationship and RLS proof

The deployed database reports:

- FK name: `accounts_owner_membership_fk`.
- Relationship: `(accounts.household_id, accounts.owner_membership_id)` references `(household_members.household_id, household_members.id)`.
- Cardinality: many accounts may refer to one membership; each account has at most one owner membership. The referenced key is unique, so the left embed is a nullable object.
- PostgREST hint: `household_members!accounts_owner_membership_fk`.
- RLS: enabled on both `accounts` and `household_members`.

The `accounts_select_member` policy requires an active membership in the account household. The `household_members_select_member` policy permits a caller to select membership rows only in a household where that caller is active. The existing `is_household_member()` security-definer function checks the caller's active membership; it does not return membership data or bypass the membership table's RLS for this query. The existing account update policy continues to call `can_mutate_financial_resource()`, which requires an active household membership and, for personal resources, requires that membership ID to equal the owner ID.

The application query uses `createSupabaseServerClient()`, which uses the normal cookie-authenticated Supabase server client and the configured public publishable/anon key. No service-role client, new security-definer function, policy, or grant was introduced. The existing active-owner mapper still receives the exact same evidence constraints as before: membership must exist, its ID must equal `accounts.owner_membership_id`, its household must equal the authorized household, and `is_active` must be the boolean `true`.

The repository has no generated Supabase `Database` type file and the server client is not parameterized with one. The embedded row therefore uses the existing Supabase `.overrideTypes()` API for a local result shape. Query relation errors still flow through the existing safe context loader and return unavailable; a successful read with null, mismatched, foreign-household, or malformed evidence becomes an empty active-owner set.

Catalog evidence proves the composite relationship and deployed policies. It does not replace an authenticated PostgREST runtime check; that check is still outstanding below.

## Prototype

The candidate selection is:

```text
accounts fields
+ owner_membership:household_members!accounts_owner_membership_fk(id, household_id, is_active)
```

Before the edit, I confirmed the deployed FK, target uniqueness, RLS policies, account ownership mapper, and the existing explicit-FK embed pattern in Savings. The Accounts capability rules come from Accounts' own mapper and policies; Savings semantics were not reused.

The required authenticated, same-card PostgREST prototype was not completed before the source change. The local authenticated Brave tab could not be attached: CDP timed out at its focus-emulation step. A direct public-key request without a user JWT was denied with HTTP 401 / SQLSTATE `42501`, as expected for the RLS-protected table, and returned no account rows. That request does not prove authenticated embed payload or timing behavior. No alternating current/embed samples, authenticated response mapping timings, or payload comparison are claimed.

## Capability equivalence

The capability mapper remains the single source of business rules. `getAccount()` now builds the active-owner ID set only from the embedded row after strict runtime checks, then passes that set to the unchanged `mapAccountRow()` mapper. The selected account ID, name, type, currency, financial scope, owner membership ID, owner status, `isOwnedByMe`, `canMutate`, archive check, and household/account visibility filters remain in the same application path.

Regression coverage includes household ownership; viewer, partner, and former owners; missing and null owner IDs; another-household evidence; mismatched owner IDs; malformed `is_active`; relation-query failure; archived and out-of-context accounts; and the authoritative balance result. In the focused test run, all cases passed. There is no live before/after account-model capture, so runtime model equivalence remains unverified.

## Implementation

- `modules/ledger/application/queries/list-accounts.ts`: embeds owner evidence into the cached selected-account context and removes the selected-detail owner-membership query. The existing selected balance RPC still starts before account context resolves. The account list loader, which is outside this scope, still uses `listActiveMembershipIds()`.
- `tests/unit/account-detail-balance-overlap.test.ts`: covers strict evidence mapping, safe query failure, and no separate detail owner lookup.
- No migration, RPC, session change, create-flow change, billing formula change, or deferred-section change.

The context helper is shared by Credit Card and Liquid Account Detail, so a personal Liquid Detail also no longer needs its separate owner-membership read. Accounts List and Create continue to use their existing ownership paths.

## Request counts

For the personal-card critical path, the source-level request count changes from eight to seven:

| Critical operation                          | Before | Phase 9 source |
| ------------------------------------------- | -----: | -------------: |
| User and session membership                 |      2 |              2 |
| Selected account row and household currency |      2 |              2 |
| Selected balance RPC                        |      1 |              1 |
| Owner-membership follow-up                  |      1 |              0 |
| Card settings and billing months            |      2 |              2 |
| **Total**                                   |  **8** |          **7** |

This is a source-level count, not runtime telemetry. Household-owned accounts already skipped the old owner request, so no request-count reduction is claimed for them. The deferred payment-account `listAccounts()` read remains outside the hero and unchanged.

## Performance

The Phase 8.1 warm serial-control values below are historical context from its authenticated same-run control (`n=10`), not a Phase 9 comparison. Phase 9 p50/p75 and deltas were not collected.

| Metric               | Historical control p50 / p75 (ms) | Phase 9 p50 / p75 (ms) |         Delta |
| -------------------- | --------------------------------: | ---------------------: | ------------: |
| Session              |                     308.4 / 386.5 |           Not measured | Not available |
| Account context      |                     301.0 / 326.8 |           Not measured | Not available |
| Owner follow-up      |                     271.1 / 282.7 |           Not measured | Not available |
| Selected balance RPC |                     297.7 / 315.1 |           Not measured | Not available |
| `getAccount()`       |                     592.5 / 632.6 |           Not measured | Not available |
| Summary ready        |                   1542.8 / 1961.4 |           Not measured | Not available |
| Hero readable        |                   1683.9 / 2070.7 |           Not measured | Not available |

Phase 8.1 measured the Phase 8 summary-ready-to-readable-hero tail at 80 / 91 ms p50/p75. It was not remeasured for Phase 9. No latency improvement is claimed.

## Regression controls

- Selected balance RPC still starts while account context is pending; its query and returned balance are unchanged.
- Phase 8 route scheduling is unchanged: card settings/months start after the shared active-card context resolves and overlap the already-running full account/balance work. The focused route and progressive-rendering tests pass; no Phase 9 runtime overlap spans were collected.
- Credit-card summary formulas, settings/month reads, and deferred billing activity/installment/payment-account sections were not changed.
- Liquid Detail, ownership, session, and Back behavior were covered in the focused test set. All 157 tests across 17 files passed, including 24 Back-navigation tests.
- Accounts List and Create source paths were not changed.

Validation:

- Focused account, card, ownership, session, balance, and Back tests: **157 passed across 17 files**.
- `npm run lint`: passed.
- `npm run typecheck`: blocked by two existing `HomeTranslator` / `Translator` errors in `home-streaming-sections.tsx`; no Phase 9 type errors remain.
- Full `npm test`: 1,742 passed, 5 failed in unrelated existing checks (English/Vietnamese `money` key parity, the long-card-name `truncate` assertion, and three tests missing `NextIntlClientProvider`).
- Full `npm run format:check`: reports 195 pre-existing files outside this change set. The Phase 9 source, test, and report pass focused Prettier checks.
- Build and E2E were not run: the repository typecheck baseline fails, and authenticated browser automation was unavailable.
- `git diff --check` and focused ESLint passed for the changed source/test files.

## Remaining bottleneck

The post-collapse critical stage is not measured. The selected balance RPC and the account/context read now compete to finish without a separate owner span; the embed may change account-context latency or payload size. Do not optimize either until authenticated Phase 9 samples show which stage is last.

## Decision

**ACCOUNTS PHASE 9 PARTIAL — INVESTIGATE BEFORE PHASE 10**
