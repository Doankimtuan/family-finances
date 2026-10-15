# Cross-Module Performance Verification Readiness

Date: 2026-10-11 (Asia/Ho_Chi_Minh).

## Scope and decision

Credential recovery and read-only readiness only. Existing Investments, Plan,
and Inbox work was preserved. No performance optimization, benchmark, login,
hosted data inspection, fixture execution, Auth change, membership change, or
financial/Inbox mutation was performed.

Rotation is **unconfirmed**. The exposed credential was not used for
authentication. No current household is approved for verification.

## Credential configuration and identity

Local inspection returned presence flags only: both `E2E_USER_EMAIL` and
`E2E_USER_PASSWORD` are configured. No saved
`output/playwright/e2e-auth-fixture.json` was available to identify a matching
fixture account. Identity classification: **unknown**. A historical active
household does not prove the account is disposable or establish its current
records. Treat it as potentially carrying shared financial data.

Credential consumers found by source search:

- `tests/e2e/support/env.ts`, `support/auth.ts`, `auth.setup.ts`, and the
  authenticated smoke/visual specs.
- `tests/e2e/global-setup.ts` runs `scripts/e2e-auth-fixture.mjs setup`, inherits
  its stdout, reads its credential state file, and replaces both environment
  variables. Global teardown deletes that fixture. Neither may run here.
- Fixture scripts: Inbox populated, loans, loans populated; other seed and
  ownership harnesses can create or mutate users/financial records.
- Benchmark scripts: Supabase request path, Home investment/account-ledger,
  Money credit card, Investments list, and loans direct/browser benchmarks.
  These remain blocked; none were executed.

`.env.local` and `output/` are ignored by Git. No environment file was changed
or staged. Presence of an environment value is not evidence of rotation.

## Exposure remediation and logging verification

`next.config.ts` retains `logging.serverFunctions = false`, matching the
installed Next 16.3.1 logging guide at
`node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/logging.md`.
Other useful request/error logging remains enabled.

A second exposure was found: both fixture setup paths printed their entire
state, including the password. The only source change in this task makes both
stdout objects explicitly contain email, user ID, and household ID. The
password stays in the existing ignored state file written with mode `0600`;
global setup already reads that file, so its credential handoff is unchanged.
Search found no in-repository consumer parsing fixture stdout.

`tests/unit/e2e-fixture-logging.test.ts` executes the two stdout statements in a
VM with synthetic state, captures output, and proves only the permitted fields
are emitted, including when an extra token field is present. It never imports
or executes the mutating fixture script.

Source review found no explicit login/reset/update action input dump or
password/token/header/cookie logging in the inspected Auth consumers. E2E
environment diagnostics report presence only. Performance telemetry uses
method, pathname, status, and timings; it omits URL queries, headers, bodies,
cookies, and SDK results.

Limits: the shared failure logger preserves raw error objects and context; it
is not a general secret sanitizer. Playwright auth failure diagnostics capture
URLs/screenshots, and the standard configuration can retain traces. Next dev
incoming-request logs can also include recovery URL query parameters. Thus
this is source/test evidence for the identified paths, not proof that arbitrary
errors or future browser artifacts cannot contain secrets. No real login or
recovery flow was run, and old logs were not reread. Use the trusted deployed
Auth flow for owner recovery; do not record recovery URLs, credentials, or
login traces/screenshots. Do not enable full-URL fetch logging.

## Required owner recovery actions

The task explicitly reserves password changes for the owner; browser password
entry also requires owner handoff. No password-reset email was sent by this
agent.

1. Privately identify the account from local `E2E_USER_EMAIL`, confirm ownership
   and whether it is a normal/shared account, and use the trusted deployed
   application's Login → Forgot password (`/en/forgot-password` or the
   Vietnamese locale equivalent). Do not log in with the exposed password.
2. Request the recovery email yourself. Follow its link on the trusted app
   origin. The application uses `requestPasswordReset()` →
   `resetPasswordForEmail()` with `/auth/confirm` and the reset-password
   destination. Confirm the allowed redirect origin/email template if the link
   fails; do not bypass Auth or fabricate a session.
3. Complete `/en/reset-password` (or the corresponding Vietnamese route)
   yourself with a unique replacement password. The supported action calls
   validated `updatePassword()` → `auth.updateUser({ password })`. Do not send
   the replacement password to this chat or include it in evidence.
4. Privately edit only `E2E_USER_PASSWORD` in local `.env.local`, preserving
   the email/account identity and the password exactly, using valid dotenv
   quoting. Never place the value in shell arguments, reports, source, or
   screenshots. Restart later verification processes so they reload it.
5. Use the application's Sign out control after recovery. The installed SDK's
   default `auth.signOut()` scope is global, revoking refresh sessions for that
   user. Confirm success; coordinate interruption of other legitimate sessions
   with the owner. This app's sign-out route may also remove the current device's
   reminder subscription, so it is owner remediation, not a benchmark action.
   [Supabase signOut documentation](https://supabase.com/docs/reference/javascript/auth-signout)
   states that issued access JWTs can remain usable until expiry. Do not claim
   immediate invalidation of all access tokens.
6. Confirm the reset succeeded and the old password is unusable. If a negative
   login check is needed, perform it yourself once in a separate private
   session on the trusted deployed Login page with recording/debug capture
   disabled. Report only success/failure; do not share either password, tokens,
   recovery links, or screenshots. This agent will not use the exposed password.
   Then confirm replacement login works and sign out again.
7. Confirm rotation, local configuration update, session revocation result,
   and approve one existing household for read-only checks. Provide only
   non-secret confirmation and account/household purpose; no credential values.

The supported recovery flow is consistent with
[Supabase password Auth documentation](https://supabase.com/docs/guides/auth/passwords).
The current changelog was fetched and reviewed; no relevant hosted password
recovery/sign-out breaking change was identified. No admin password update,
user creation/deletion, or ownership/membership change is authorized here.

## Browser context readiness

Brave was selected and named for this task. Its exposed browser capabilities
list only viewport control; the documented browser API does not offer creation
of an isolated profile/context. No app tab or user tab was opened/claimed, no
personal-profile app navigation occurred, and no saved Auth state was reused.

**Fresh isolated context: not established.** Prepare an owner-approved fresh
disposable Brave profile/context after remediation, verify it has no inherited
site storage/session, and connect it for verification. A new tab alone is not
isolation. Do not reuse the expired Playwright state or generate JWTs. Keep
traces, HAR, request payload capture, and login screenshots disabled.

## Existing fixture coverage by module

No current authenticated household was inspected because remediation is
unconfirmed. No service-role inspection was substituted for normal Auth/RLS.

| Module                       | Existing evidence                                                                                                 | Missing approval/coverage                                                                                             |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Investments operation/detail | Prior Phase 1.1 check found zero active holding links; Phase 0 had a holding in a different, unconfirmed context. | Approved accessible active holding and operation/detail routes; current buy/sell/valuation read-only availability.    |
| Plan Overview                | Source and deterministic tests cover the hub; no current approved household inspection.                           | Representative current budget/jar rows and any historical period to be measured.                                      |
| Plan Goal Detail             | Deterministic tests cover authoritative progress and deferred references.                                         | Existing accessible goal and representative linked funding/progress.                                                  |
| Plan Jar Detail              | Deterministic tests cover period-consistent detail.                                                               | Existing accessible jar and representative budgets/transactions/history.                                              |
| Inbox queue/detail           | Historical six-item queue had transaction/savings and household/other-active-owner cases.                         | Current queue/detail and archive; loan/liability sources and current/former/foreign-owner cases were not established. |

Synthetic unit fixtures prove contracts, not representative hosted data or RLS
coverage. Approve one existing household, then inspect only accessible existing
rows and report absent coverage per module. Do not seed missing coverage.

## Inbox read-only safety

The existing page suppresses both automatic callbacks only when
`NODE_ENV=development` and `INBOX_READ_ONLY_BENCHMARK=true` exactly. Canonical
flag constants remain in `modules/inbox/application/inbox-constants.ts`.
Suppressed RPCs are `run_inbox_staleness_worker` and
`sync_loan_debt_attention_inbox`. Production, test, missing, and invalid flag
values keep ordinary maintenance behavior. Archived GET does not schedule
maintenance; detail GET does not mark an item read. Explicit action controls
remain mutating and must not be activated.

All eight existing maintenance tests pass, including captured production
callback execution against mocks, zero callbacks/RPCs in opted-in development,
and unchanged authorization/queue reads. The read-state authorization contract
also passes. This proves source scheduling, not a live process's settings.

Local configuration inspection did not find the exact benchmark opt-in enabled.
Do not navigate Inbox on an existing server whose environment is unverified.
After owner remediation and isolated-context approval, start a dedicated local
server with the explicit non-secret opt-in:

```sh
INBOX_READ_ONLY_BENCHMARK=true npm run dev -- -p 3117
```

Confirm the port is unused and this process is `next dev`, retains the current
logging configuration, and has the exact opt-in before any Inbox GET. Do not
use `next start` for shared-data Inbox verification: production ignores the
opt-in and performs maintenance writes. No server or benchmark was started here.

## Validation and review

- Focused logging/Auth/Inbox/telemetry tests: **30 passed across eight files**.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed with Next 16.3.1.
- `npm run test`: **1,843 passed, five failed across three files**. Failures are
  `i18n-messages`, `money-ia-privacy`, and `phase-6-accounts-presentation`, matching
  the earlier Inbox safety audit's translation/account/privacy failure categories.
  No failure is in this task's focused safety tests; no unrelated fix was made.
- Repository `npm run format:check`: failed on 192 existing files; no broad
  formatting cleanup performed. Task files are checked separately.
- No E2E command/global setup was run: the task explicitly forbids fixture
  creation against the shared project.
- Prettier check of all three task files and `git diff --check`: passed.

Final refactor review is limited to this task's script, regression test, and
audit. No new domain constants, dependencies, abstractions, financial logic,
or error-logging suppression were introduced. Pre-existing dirty performance
files were preserved.

## Runtime limitations and exact next permitted action

No runtime performance result was collected. The Inbox isolation gate supports
development mode only. A successful build is not production runtime evidence.
Source-derived request topology and deterministic promise/component tests are
not measured HTTP counts, browser RSC bytes, or first-useful-content evidence.
Never compare development timings directly to historical production-build
baselines or claim a cross-module speedup without matched control/candidate
runtime, fixtures, cache state, and instrumentation.

**Next permitted action:** the owner completes the recovery checklist and
confirms it without revealing secrets. Until then, only non-authenticated
source/test preparation is permitted. After confirmation, establish the fresh
isolated context and dedicated development server, obtain existing-household
approval, and inspect fixture availability read-only before any benchmark.

**PERFORMANCE VERIFICATION BLOCKED — OWNER CREDENTIAL ACTION REQUIRED**
