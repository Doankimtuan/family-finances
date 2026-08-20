# ViNha E2E Infrastructure — AUTH.1

## A. Final verdict

E2E AUTH FIXTURE READY

## B. Root cause

`playwright.config.ts` evaluated `process.env.E2E_USER_EMAIL` and
`process.env.E2E_USER_PASSWORD` before any environment loader ran. Next.js loads
`.env.local` for the app process, but the independent Playwright Node process
did not inherit it. Only two legacy fixture modules manually parsed
`.env.local`; most specs therefore saw missing values and skipped authenticated
coverage.

## C. Environment loading

- `tests/e2e/support/env.ts` calls `loadEnvConfig(process.cwd())` once when the
  Playwright configuration imports it.
- Playwright config loads env before port, auth, project, or skip decisions.
- Next.js precedence is preserved: externally supplied CI values remain
  authoritative.
- Legacy custom browser/fixture scripts now use `@next/env` instead of manual
  `.env.local` parsing.
- Safe startup diagnostic reports only `yes`/`no` presence booleans.

## D. Credential safety

- Credentials are read only from `E2E_USER_EMAIL` and `E2E_USER_PASSWORD`.
- Email is trimmed; password is not trimmed.
- No credential values, tokens, or service keys are logged.
- Playwright auth state is written to `output/playwright/.auth/user.json` and
  ignored by Git.
- Auth failure screenshots/logs are written under ignored
  `output/playwright/auth-debug/`.

## E. Authentication helper

`tests/e2e/support/auth.ts` uses the existing UI login flow with stable email
and password field IDs, then proves authentication by reaching the protected
Transactions route. Failures capture a screenshot, URL, and safe visible alert
text.

## F. Fixture/household setup

The configured E2E identity authenticated successfully and already has an
active household. The existing ownership harness was attempted, but its safety
guard correctly refused to move that identity from an existing active
membership into the controlled ownership household. No account was created and
no household data was moved or deleted.

## G. Playwright configuration

- `auth.setup.ts` performs one login and saves reusable storage state.
- `authenticated-chromium` depends on `auth-setup` and consumes that state.
- Public tests remain on the unauthenticated `chromium` project.
- If credentials are absent, public tests remain usable; partial credentials
  fail configuration loudly.
- `npm run e2e:auth-check` runs the authenticated project directly.

## H. Authenticated routes reached

- `/en/home`
- `/en/money/transactions`
- `/vi/money/transactions`
- `/vi/money/transactions/new`
- `/vi/money/transactions/<id>`

## I. Authenticated screenshots

- `output/playwright/auth-final/vi-transactions-list-390-dark.png`
- `output/playwright/auth-final/vi-create-390-dark.png`
- `output/playwright/auth-final/vi-transaction-detail-390-dark.png`
- `output/playwright/auth-final/vi-tag-sheet-390-dark.png`

## J. Transactions visual verification

The authenticated runtime shows the 09F.2 changes: stronger amount hierarchy,
compact account choices, split `Hủy | Lưu` actions, semantic list amount tones,
non-duplicated row metadata, flatter detail presentation, and reduced tag UI.

## K. Shared ActionSheet verification

The authenticated Tag sheet passes at 390px dark. The browser check confirms
the shared body has positive bottom clearance and the shared footer settles
inside the viewport. The root issue was the HeroUI drawer content receiving an
empty `--visual-viewport-height`; `shared/patterns/sheet.tsx` now supplies the
native `h-dvh` constraint. No feature-level Tag sheet padding was added.

## L. Tests

- E2E env unit tests: 4 passed.
- Auth setup + protected smoke: 2 passed.
- Login + Transactions focused E2E: 8 passed.
- Full unit suite: 131 files / 979 tests passed.

## M. Validation

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm run test` passed.
- `npm run build` passed.
- `git diff --check` passed.
- Authenticated Chromium evidence passed with the configured `.env.local`
  account.
- `npm run test:e2e` completed with 63 passed, 34 existing-suite failures, 4
  skipped, and 13 not run; the new `auth-setup` and `authenticated-chromium`
  tests passed. The failures are existing fixture, parallel-state, locator,
  and ownership-harness issues outside AUTH.1.
- `npm run format:check` remains nonzero on 2,200 pre-existing files; all files
  changed for AUTH.1 passed targeted Prettier validation.

## N. Remaining issues

No AUTH.1 blocker remains. The ownership harness cannot be used with this
identity without violating its active-membership safety guard; the configured
account’s existing household is sufficient for authenticated route and visual
verification. Full-suite failures remain outside AUTH.1 and should be handled
by their owning fixture/suite tasks.
