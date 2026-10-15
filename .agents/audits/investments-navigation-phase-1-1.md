# Investments Performance Phase 1.1 — Authenticated Runtime Verification

Date: 2026-10-11

## Result

**INCONCLUSIVE — authenticated route verification was blocked by the absence of an active investment holding in the configured E2E household.** No control/candidate operation comparison was run, and no timing or request reduction is claimed.

## Authentication environment

- Started the current Phase 1 application locally on port 3110 and used a fresh, isolated headless Chromium context at 440×900 with reduced motion. The locale was English. The personal Brave profile was not used.
- Signed in through the repository login UI with the configured E2E credentials. Authentication reached an active household, and the Investments List rendered. The loaded List contained zero active holding detail links, so there was no eligible selected holding for Buy, Sell, Detail, or Update Price verification.
- An existing `output/playwright/.auth/user.json` state was inspected without printing token material. It belonged to the repository's disposable E2E fixture identity and its access token was expired. It was not used.
- The repository's standard Playwright global setup was not run. It invokes `scripts/e2e-auth-fixture.mjs setup`, which creates an Auth user, household, accounts, holdings, and valuations. Creating those records is prohibited for this task.
- The local Next.js development server logged the login action arguments, including the configured credentials. The server was stopped immediately after this was observed. Rotate the configured E2E password before reusing it. No credentials or token values are included in this report.

## Control and candidate setup

The intended control was the pre-Phase-1 implementation at `HEAD`; the candidate was the current Phase 1 working tree. Both would use the same local environment and Supabase project, authenticated identity, English locale, 440×900 viewport, and reduced-motion setting.

Only the candidate application was started, for the sign-in and Investments List availability check. No control copy, matched arms, request interceptor, or timing harness was started because the authenticated household had no active holding. The List route returned successfully, but its server-side Supabase reads were not instrumented and are excluded from the operation comparison.

## Actual Supabase request counts

No operation-route Supabase HTTP requests were captured. `Not collected` means no measurement was made; it does not mean zero requests.

| Remote read        |       Control |     Candidate |
| ------------------ | ------------: | ------------: |
| Holdings           | Not collected | Not collected |
| Peer options       | Not collected | Not collected |
| Lots               | Not collected | Not collected |
| Instrument         | Not collected | Not collected |
| Price              | Not collected | Not collected |
| FX                 | Not collected | Not collected |
| Valuations         | Not collected | Not collected |
| Operations/history | Not collected | Not collected |
| Accounts           | Not collected | Not collected |
| Total              | Not collected | Not collected |

### Request waves

No operation request waves were captured. The list-only visit cannot establish selected-holding dependencies or distinguish required reads from redundant reads for Buy/Sell or Update Price.

## Warm benchmark

There was no representative active-holding route to benchmark. No cold route sample or 10 interleaved warm samples were collected.

| Metric                   | Control p50/p75 | Candidate p50/p75 |
| ------------------------ | --------------- | ----------------- |
| Session gate             | Not measured    | Not measured      |
| Selected holding ready   | Not measured    | Not measured      |
| Account references ready | Not measured    | Not measured      |
| Peer options ready       | Not measured    | Not measured      |
| Route return             | Not measured    | Not measured      |
| RSC response complete    | Not measured    | Not measured      |
| Click → first useful UI  | Not measured    | Not measured      |
| Browser tail             | Not measured    | Not measured      |

## Correctness and route checks

- **Buy/Sell:** Not browser-verified. There was no active holding to compare identity, asset type, ownership, `canMutate`, quantity, prices, current value, cost basis, fee selector order, eligible accounts, Sell shortcuts, or read-only/error state.
- **Update Price:** Not browser-verified for the same reason. No selected holding was available to inspect the manual or automatic-pricing state.
- **Income/Convert:** No browser checks were run. The focused operation-page test confirms these modes retain the existing portfolio path. The operation-form tests also pass for the existing fee and conversion behavior.
- **Other smoke paths:** The authenticated Investments List loaded. List→Detail, Detail→Back, List→Create, Buy/Sell, and Update Price were not exercised in the browser because there was no active holding. No financial action was submitted.
- Existing focused tests cover the route read requirements, fee selector options, Sell preview, manual valuation preview, FIFO and weighted-average behavior, and `UNIT_PRICE` / `TOTAL_VALUE` semantics. No changes were made to financial commands, accounting, FX, valuation, account ownership enforcement, or mutation authority.

## Security and data integrity

- No financial operation was submitted. No account, holding, lot, price, valuation, or balance data was created or modified by this verification.
- No fixture setup or cleanup, schema change, RLS change, or Auth user creation/update/deletion was run. The login provider may update its routine sign-in timestamp as part of authentication.
- The authenticated browser context was ephemeral and closed after the check. The stale stored fixture state was not used.
- The development server emitted the login action arguments to its temporary output; rotate the configured E2E password before reuse. No financial data was exposed by that log.

## Validation

- Focused investment tests: **36 passed** across four suites.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed; Next.js generated all 111 static pages/routes.
- `npm run test`: **1,798 passed, 6 failed** across 262 files. Failures were in untouched tests: one English/Vietnamese message-key parity check, three account-presentation tests missing `NextIntlClientProvider`, one account-card wrapping expectation, and one date-sensitive savings-domain case for a historical opening dated today. A clean pre-change full-suite baseline was not run, so these failures are not confirmed baseline failures.

## Blockers

The authenticated household has no active investment holding, and creating financial fixture data is prohibited. Without a selected holding, request counts, operation semantics, and matched latency samples cannot be measured. Runtime verification should resume only with an existing safe authenticated session that has an active holding; do not create one for this benchmark. Rotate the configured E2E password before reuse because it appeared in the local development server output.

## Final decision

**INVESTMENTS PHASE 1.1 INCONCLUSIVE — AUTHENTICATED RUNTIME VERIFICATION BLOCKED**
