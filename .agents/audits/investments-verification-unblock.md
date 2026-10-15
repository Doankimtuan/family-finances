# Investments Verification Unblock — Safe Fixture & Credential Hygiene

**Status:** Blocked. Phase 1 remains in place; this audit does not start Phase 2 or the Phase 1.1 benchmark.

## Credential exposure

The login action did not log its input. The output came from Next.js 16.3.1 development Server Function diagnostics, which log function arguments by default. The `logging.serverFunctions` option is now set to `false` in `next.config.ts`. This disables that diagnostic category while retaining Next's request and error logging.

A unit contract test asserts that Server Function argument logging is disabled without globally disabling logging. No test login was repeated with the exposed credential.

## Credential identity, consumers, and rotation

The Auth identity to remediate is the account configured through `E2E_USER_EMAIL` in local `.env.local`; `E2E_USER_PASSWORD` supplies its password. This is the account used by the previous authenticated check. Its disposability was not positively verified. No password was rotated and no local secret was changed. Owner action is required: rotate the password through the app's supported password update/reset flow, then update `E2E_USER_PASSWORD` before any further authentication. Do not reuse the exposed password. The email and password values are omitted.

E2E credentials are consumed by `tests/e2e/support/env.ts`, `tests/e2e/support/auth.ts`, `tests/e2e/auth.setup.ts`, authenticated Playwright specs, and scripts for fixtures and request-path/browser benchmarks. `tests/e2e/global-setup.ts` also sets these variables after creating its fixture. The standard E2E global setup was not run because it writes Auth and financial fixture data to the configured backend. Credential values, identity email, tokens, cookies, and financial payloads are intentionally omitted here.

## Authenticated context and safe holding

The prior authenticated check reached an active household, but the Investments List contained no active holding detail links. No holding suitable for Buy Detail, Sell Detail, or Update Price Detail was found through that normal user session. The authenticated browser context was closed after the check. The previously stored browser state was expired and was not reused. No Phase 0 identity was assumed to be the current E2E identity.

Because no active holding was available and the exposed credential needs rotation, no authenticated Buy/Sell route was opened in this unblock task. Route result: **not verified**; writable, read-only, and unavailable route states were not established. No safe authenticated benchmark context is prepared.

## Isolated environment and benchmark readiness

No existing local Supabase project configuration was found, and Docker was unavailable. No isolated Supabase environment was positively verified. No paid branch or project was created.

The control/candidate benchmark cannot proceed. The required dedicated authenticated browser context, accessible active holding, and successful selected Buy/Sell route are unavailable. No request-path benchmark or financial write was run. The shared database was not used for fixture creation, and service-role access was not used to bypass RLS.

## Scope and safety

The only code/configuration change for this unblock is the narrow Next.js logging setting. No Investments operation page/query strategy, holding loader, valuation, accounting, RPC, list/detail/navigation behavior, Supabase schema, or RLS was changed for this unblock task. Existing Phase 1 working changes were preserved.

No Auth user, household, account, holding, operation, or valuation was created or mutated. The prior development server output already exposed the configured E2E credential; rotate it before reuse.

## Validation

- Focused unit tests: **37 passed** across the logging contract and investment operation/view-model tests.
- Typecheck, lint, and production build: **passed**.
- Prettier check on the changed configuration, contract test, and audit: **passed**. Repository-wide `npm run format:check` reports 192 pre-existing files outside this task's scope; they were not reformatted.
- `git diff --check`: **passed** after the audit was added.

## Final decision

**INVESTMENTS VERIFICATION BLOCKED — CREDENTIAL REMEDIATION REQUIRED**
