# Money → Savings navigation — Phase 3

Initial usable Create improved from the Phase 1 warm median of **1,108 ms to 626.7 ms**: **481.3 ms / 43.4% earlier**. Mode, name, and ownership controls work while server options continue loading. Full data readiness is measured separately at **1,695.3 ms**; no claim is made that the reads themselves became faster.

Phase 1 session resolution and Phase 2 return navigation remain intact. Warm Create → Savings restoration is **42.0 ms**, with zero RSC requests, authentication, membership resolution, or Savings reloads in all four isolated benchmark Back windows. No Phase 4 work was performed.

## Dependency analysis

The actual wizard has **Setup → Review**, not a basic Step 1 followed by separate provider/account steps. Setup already includes every financial choice. The optimization releases its independent upper controls; it does not introduce a new step or allow Review without valid financial selections.

| Data                                                      | Initial usable Setup                                                    | Remaining Setup / Review                                                                          | Submit                                                                                                         |
| --------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Authenticated user and active membership                  | Required before any controls; existing parallel session helper          | Request-cached permission context                                                                 | Server action re-authorizes independently                                                                      |
| Locale and translations                                   | Required for header, labels and controls                                | Same EN/VI routing and messages                                                                   | Typed errors use existing translations                                                                         |
| Creation mode                                             | Interactive immediately; live/historical choice                         | Changes funding requirements and start-date rules                                                 | Schema and RPC validate mode, historical dates and funding semantics                                           |
| Saving name                                               | Editable immediately; empty until catalog default arrives unless edited | Retained in review; untouched name receives existing provider default                             | Server validates non-empty product name                                                                        |
| Financial scope                                           | Household/personal choice works immediately                             | Retained in review                                                                                | Ownership derives from current server membership                                                               |
| Provider and packages                                     | Deferred; saving-type tiles also depend on real providers               | Required for saving type, provider/package defaults, limits, estimates and maturity configuration | Current package snapshot and provider match are resolved again on server; existing DB checks retained          |
| Liquid account rows                                       | Deferred                                                                | Required for funding and settlement selectors; no fabricated options                              | Current household-scoped, unarchived accounts are read again; eligible types and account compatibility checked |
| Owner membership / ownership mapping / `canMutate`        | Deferred                                                                | Required before exposing selectable accounts; partner/former-owner restrictions retained          | Existing DB eligibility helper checks current mutation capability                                              |
| Ledger balances                                           | Deferred                                                                | Existing balances shown in account choices; same balance RPC retained                             | Displayed balance is never an authorization input or RPC argument; see balance limitation below                |
| Household base currency                                   | Deferred with the unchanged account read model                          | Retained in that read model; existing Create display formatting unchanged                         | RPC resolves current household currency and compares product currency                                          |
| Principal, dates, renewal, settlement and maturity target | Dependent region waits locally                                          | Existing Setup validation and Review estimates                                                    | Existing schemas, command and RPC remain authoritative                                                         |
| No eligible accounts / unavailable read model             | Decision deferred                                                       | Existing account-recovery surface replaces the pending form; no Review/Confirm path               | Server independently rejects invalid accounts                                                                  |

The account loader still performs accounts + household currency, then active-owner membership + balance RPC, then mapping and eligibility filtering. Nothing was removed from this shared financial model. All of it is necessary before presenting its account options, but none is necessary to edit mode, name or ownership. A narrower query was unnecessary for this phase.

## Previous architecture

```text
Create click → authenticated session
                 ↓
            await accounts and catalog in parallel
                 ↓
            map all options / decide eligibility
                 ↓
            release whole Create wizard
```

The Phase 1 Create entry had one demand RSC navigation and seven remote calls. Its initial usable and full-ready milestones coincided at about 1,108 ms warm. Representative older account timing was about 786 ms after the gate; provider timing about 282 ms.

## New architecture

```text
Create click → existing authenticated session gate
                 ↓
           start ONE server data promise
                 ├→ accounts + currency → owners + balances → eligibility
                 └→ provider catalog with packages
                 ↓
           release Create header + Setup progress + mode/name/ownership
                 ↓
           local Suspense skeleton for dependent controls
                 ↓
           stream resolved options through React use(promise)
                 ↓
           seed untouched defaults in the SAME mounted RHF form
                 ↓
           normal Setup validation → Review → unchanged server action
```

The route remains a Server Component. Both reads start on the server after authorization, before translation awaits. There are no browser data fetches, API routes, client request chains, new dependencies, or cross-user caches.

A small local Suspense consumer reads the stable server promise and hands its resolved options to the already-mounted interactive form. Its one effect performs this handoff; it does not fetch data or derive form values. React Hook Form's reactive `values` / `keepDirtyValues` apply incoming defaults while preserving early edits. Controlled mode/scope edits mark themselves dirty. Defaults are seeded once so refreshed options do not silently substitute a selected account. The existing explicit success reset opts out of dirty-value preservation.

The existing MotionStep, Setup/Review transitions, header Back and Cancel handlers remain in place. No full wizard remount occurs when valid data arrives. An additional early Cancel while data is still pending restores the exact prior Savings entry in **36.2 ms**, with no new demand RSC navigation. Previously started Create reads can finish in the background; existing route-loading prefetches are recorded separately. Pending Review remains disabled because the actual Setup requires package, principal, date and eligible account choices. A fast advance attempt leaves the local dependency skeleton visible; the route remains interactive. Empty/unavailable accounts produce the same recovery copy and Accounts destination as before.

## Files changed in this phase

| File                                                                | Reason                                                                                                                                                                                         |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/[locale]/(product)/money/savings/new/page.tsx`                 | Start the existing parallel read promise without awaiting it; retain exact session/redirect gate; move the existing option mapping into one local server helper; pass translated recovery copy |
| `app/[locale]/(product)/money/savings/new/create-saving-wizard.tsx` | Local Suspense data handoff, early independent controls, persistent RHF defaults/edits, unchanged eligibility recovery and submit behavior                                                     |
| `tests/unit/create-saving-wizard.test.tsx`                          | Adapt the existing 12 workflow tests to streamed promise props; retain provider selection, Review/Back, submission/reset, retries and invalidated-account expectations                         |
| `tests/unit/savings-create-streaming.test.tsx`                      | Delayed options, exact input-node/name/mode/scope retention, canonical live defaults, empty-account recovery                                                                                   |
| `tests/unit/savings-create-data.test.ts`                            | Eligibility exclusions, unavailable data, non-blocking page release, one read each, rejected-session redirects without options loading                                                         |
| `tests/unit/savings-create-authority.test.ts`                       | Fresh household/account checks on repeated submit, displayed balances excluded from mutation input, current package validity, RPC rejection and unauthenticated rejection                      |
| This report and companion evidence JSON                             | Measurements, validation, scope and limitations                                                                                                                                                |

Shared session helpers, shared loaders, Create server action/command, SQL/RLS, Savings list, Detail, activity, bottom navigation and Phase 2 navigation source were not changed by Phase 3. The scoped patch was reviewed against snapshots taken before this phase; earlier/user working-tree changes were preserved. Current HEAD is `daf24246821def5ac2b392144498cdb5f653d169` with local changes. No commit was created by this phase.

## Performance

Same local production profiling methodology: instrumented disposable Next 16.3.1 / React 19.2.3 build, hosted Supabase in `ap-southeast-2`, headed Chromium, 440×900 viewport, normal motion, quiet host after validation completed. One cold-ish pass then three warm repetitions, with 1.2 s idle spacing. The cold pass includes Money → Savings before Create; warm passes start at restored Savings.

A is captured from the actual click until mounted, enabled name/mode controls are visible, using two animation frames. Every pass then types a name and changes mode before options resolve. B is recorded independently by the data-ready observer with two frames, rather than waiting for the interaction script to finish. Wizard/input node identity and entered values are checked after B.

| Metric                     |                        Before | Phase 3 warm median |                                                Delta |
| -------------------------- | ----------------------------: | ------------------: | ---------------------------------------------------: |
| Initial usable Create (A)  |                      1,108 ms |            626.7 ms |                                   −481.3 ms / −43.4% |
| Full Create data ready (B) |     About 1,108 ms, same as A |          1,695.3 ms |           +587.3 ms across runs; reads not optimized |
| Session gate               |          About 306 ms Phase 1 |            584.9 ms |                        +278.9 ms; resolver unchanged |
| Create page release span   | Previously included all reads |            586.3 ms |                Now ends just after gate/translations |
| Account loader duration    |   About 786 ms representative |          1,056.8 ms | Old value is representative, not a comparable median |
| Account ready from click   |      Previously page-blocking |          1,661.4 ms |                                    Completes after A |
| Catalog loader duration    |   About 282 ms representative |            285.0 ms |                                    Catalog unchanged |
| Catalog ready from click   |      Previously page-blocking |            891.2 ms |                                    Completes after A |
| Create → Savings app Back  |               40.3 ms Phase 2 |             42.0 ms |                       +1.7 ms; same entry, no reload |

All samples, in milliseconds:

| Pass       | Initial A |  Full B | Gate span | Account span | Catalog span | Back visible |
| ---------- | --------: | ------: | --------: | -----------: | -----------: | -----------: |
| cold-ish 0 |     689.7 | 1,425.5 |     629.5 |        714.0 |        619.7 |         43.0 |
| warm 1     |     626.7 | 1,471.8 |     584.9 |        834.7 |        303.2 |         41.3 |
| warm 2     |     642.1 | 1,699.4 |     593.3 |      1,056.8 |        285.0 |         43.0 |
| warm 3     |     459.5 | 1,695.3 |     420.8 |      1,229.8 |        274.3 |         42.0 |

The reads were slower in this run, particularly session and accounts, while initial interaction still improved. These are cross-phase local/hosted-network measurements, not a simultaneous controlled A/B or a deployment SLA. B is deliberately reported rather than hidden behind the faster A. The prototype run was discarded after form-preservation corrections; the table uses the final production build only.

## Network and request deduplication

| Remote operation per Create demand navigation | Phase 1/2 total | Phase 3 total | Blocks initial A?          | Completes after A?     |
| --------------------------------------------- | --------------: | ------------: | -------------------------- | ---------------------- |
| Auth `/auth/v1/user`                          |               1 |             1 | Yes                        | No                     |
| Active membership REST (`user_id`, active)    |               1 |             1 | Yes                        | No                     |
| Accounts REST                                 |               1 |             1 | No                         | Yes                    |
| Household base-currency REST                  |               1 |             1 | No                         | Yes                    |
| Account-owner membership REST                 |               1 |             1 | No                         | Yes                    |
| `get_account_ledger_balances` RPC             |               1 |             1 | No                         | Yes                    |
| Provider REST with embedded packages          |               1 |             1 | No                         | Yes                    |
| **Total remote HTTP**                         |           **7** |         **7** | **2 mandatory gate calls** | **5 dependency calls** |
| **Demand RSC navigation**                     |           **1** |         **1** | One streamed response      | No second navigation   |

Every cold/warm pass asserts one auth operation, one active membership resolution, one uncached Supabase client construction, one session resolver, one account loader, one catalog loader, and seven actual remote HTTP calls. No refresh call occurred. Accounts/currency/catalog start as soon as the gate is ready, often before A; completing after A does not mean they are initiated by the browser. Owners/balances remain the existing second server wave.

All four measured in-app Back windows have zero RSC (including prefetch), zero remote calls and zero Savings loader executions. Direct-entry and refreshed-Create fallback perform the expected single demand navigation to Savings with four remote calls; existing loading-segment prefetches can also occur without remote data loading. The evidence distinguishes prefetch from demand.

## Correctness and browser verification

| Required case                                 | Evidence                                                                                                                                                                                                                      |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Valid eligible household                      | Existing full wizard tests pass; EN and VI live Setup → Review → internal Back work with real server options; Confirm is enabled after valid setup, never clicked in the live browser                                         |
| No eligible accounts / unavailable read model | Delayed empty-account test displays the original recovery surface and no Review/Confirm; loader-null behavior retained                                                                                                        |
| Another household/user                        | Shared account query still scopes by current household; missing household-scoped account rejects submit before RPC; partner-personal and former-owner non-mutable options are excluded; deployed SQL helper checked read-only |
| Cannot mutate                                 | Picker retains `canMutate` filtering; command retains DB rejection; deployed SQL uses current active membership and personal owner identity                                                                                   |
| Balance changes while open                    | Repeated command test with different extra displayed-balance values performs fresh account checks and never forwards those values to RPC. Existing balances remain display-only; see limitation below                         |
| Invalid provider/package                      | Missing current package and provider/package mismatch reject before mutation; existing provider/package selection tests pass                                                                                                  |
| Unauthorized user                             | Page tests retain EN/VI Login/Onboard gates without starting reads; command rejects unauthenticated caller; real unauthenticated direct Create redirects to Login                                                             |
| Early edits / no remount                      | Unit checks retain name, mode and scope. Four benchmark passes retain exact wizard/input DOM nodes and typed name. VI browser test retains typed name and historical mode after streaming                                     |
| Fast advance                                  | Pending Review is disabled; native click attempt leaves the Setup/local loader intact. Valid setup advances normally after options arrive                                                                                     |
| Phase 2 Back                                  | Header Enter in EN and Space in VI restore previous Savings history key; four benchmark Back samples retain zero RSC/remote work; all 12 navigation unit tests remain passing                                                 |
| Direct/reloaded Create                        | EN direct entry and reload both replace to localized Savings rather than leaving the product or restoring an unsafe entry                                                                                                     |
| Responsive / accessibility                    | EN light and VI dark/reduced-motion checked at 390/440/768/1280 with no document overflow; pending/ready screenshots inspected; keyboard header Back verified                                                                 |

Read-only Supabase function inspection confirmed deployed `savings_is_eligible_liquid_account` and `can_mutate_financial_resource` enforce household, active/unarchived liquid type and current mutation capability. The deployed 14-argument `create_saving_with_transfer` resolves current identity/household and currency, validates mode/dates/provider/account eligibility, and posts its ledger transfer atomically. Definition hashes are recorded in the evidence. No SQL or policy was modified.

**Balance limitation:** neither the existing Create command nor the inspected deployed create RPC has an insufficient-funds check. The wizard's displayed balance is not a validation requirement and is not sent as authority. Phase 3 preserves this behavior; it does not claim fresh-balance rejection when no such existing rule exists. A concurrent live balance mutation was not performed. If a non-negative funding-balance rule is required, that is a separate financial policy/command task, not an initial-render shortcut.

Validation:

- `npm run lint`: passed.
- `npm run typecheck`: only existing Home translator TS2322 failures at `home-streaming-sections.tsx:99,340`; no new type errors.
- `npm run test`: **245 files / 1,628 tests passed; 4 files / 6 tests failed**. Failures match the prior phase: i18n parity (1), Money account wrapping (1), missing NextIntl context in account presentation (3), and date-sensitive historical-opening assertion (1). All 12 existing Create workflow tests and all 14 new Phase 3 tests pass.
- Production profiling build: passed in the disposable copy with only its baseline TypeScript build gate ignored; this is not a clean strict repository build claim. Repository config is unchanged.
- Repository format check retains 194 pre-existing issues. Changed source/tests/report/evidence pass targeted Prettier checks.
- Evidence self-check: all four samples; A/B independently recorded; first UI precedes all five dependency completions; one demand navigation/seven remote calls; exact input/wizard retention; Back zero-work; scoped browser safety assertions passed.
- Broad mutating financial E2E fixtures were not run. Command tests use mocked DB boundaries; real-browser verification is authenticated/read-only and never presses Confirm. Live Supabase operations were SELECTs of function definitions only.

## Remaining measured bottleneck

The unchanged **584.9 ms session gate** now dominates initial arrival; page release is 586.3 ms. Full dependent readiness is still dominated by the unchanged account pipeline at 1,056.8 ms after that gate. Catalog at 285.0 ms remains shorter. These waits were measured and left alone. No Detail/activity optimization, caching redesign, GraphQL change or Phase 4 work was started.

Companion: [machine-readable evidence](money-savings-navigation-phase-3-evidence.json). It contains timing/network metadata and assertions, not credentials, cookies, token bodies or financial row data. Local profiling/auth files and the temporary server/browser are cleaned up after reporting.

**PHASE 3 SUCCESS — PROCEED TO PHASE 4**
