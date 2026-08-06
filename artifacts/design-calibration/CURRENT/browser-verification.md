# Browser Verification

## Environment

- Local app: `http://localhost:3000`
- Browser tooling: Playwright CLI and Playwright test runner.
- Server: Next dev server, PID `75858`, cwd `/Users/doantuan/Desktop/Plan/family-finances`, using `.next/dev`.
- Git commit: `ed9ab1f`.
- Auth state: unauthenticated and authenticated.
- E2E credentials: loaded from `.env.local` during the authenticated E0.1 run; no literal credentials are stored in source, screenshots, or documentation.
- Disposable registration: attempted and rejected by backend.

## Manual Browser Checks

| Check | Result |
|---|---|
| `/en/home` at 390px | Redirected to `/en/login`; login shell rendered. |
| `/en/money` at 440px | Initially exposed a runtime icon import error; fixed, then redirected to `/en/login`. |
| `/en/money/transactions/new` at 440px | Redirected to `/en/login`; login shell rendered. |
| `/vi/money/transactions` at 440px | Redirected to `/vi/login`; Vietnamese login shell rendered. |
| `/vi/login` dark mode | Dark theme storage applied; Vietnamese login shell rendered. |
| `/en/home` desktop viewport | Redirected to `/en/login`; desktop auth shell rendered. |
| E0.1 before evidence | Captured under `evidence/before/`; all target routes redirected to login because no E2E credentials were available. |
| E0.1 after evidence | Captured under `evidence/after/`; all target routes redirected to login because no E2E credentials were available. |
| Auth Home, 390px, light, Vietnamese | Rendered authenticated Home at `/vi/home`. |
| Auth Home, 440px, dark, English | Rendered authenticated Home at `/en/home`. |
| Auth Money, 390px, light, Vietnamese | Rendered authenticated Money at `/vi/money`. |
| Auth Money, 440px, dark, English | Rendered authenticated Money at `/en/money`. |
| Auth Transactions, 390px, light, Vietnamese | Rendered authenticated transaction list at `/vi/money/transactions`. |
| Auth Transactions, 440px, dark, English | Rendered authenticated transaction list at `/en/money/transactions`. |
| Auth Create Transaction states | Captured initial, validation error, filled preview, dark mode, reduced motion, and save-attempt states. |

## Automated Checks

`npm run typecheck`: passed.

`npm run lint`: passed with two existing warnings:

- `app/[locale]/(product)/money/money-products-actions.ts`
- `app/[locale]/(product)/money/savings/savings-actions.ts`

Focused Playwright smoke specs:

- Initial unauthenticated run: 6 passed, 4 skipped because credentials were not configured.
- Credentialed rerun: login succeeded and reached the authenticated Money surface.
- Credentialed rerun then failed on `money-hub.smoke.spec.ts` because `getByText(/Real position|jar plans/i)` matches multiple visible elements after calibration. This is a smoke-test locator issue, not an authentication failure.
- E0.1 locator fix: `money-hub.smoke.spec.ts` now scopes the assertion to the Money hub ledger balance instead of broad copy text.
- E0.1 focused run without credentials: 6 passed, 4 skipped.
- E0.1 authenticated focused run with `.env.local`: 10 passed, 0 skipped.

## State Coverage

| State | Evidence |
|---|---|
| Protected/unauthenticated | Verified in browser and smoke specs. |
| Authenticated shell | Verified by focused smoke tests and screenshots. |
| Ready | Verified on Home, Money, Transactions, and Create Transaction. |
| Empty | Verified on sparse Money activity and Transactions fixture states. |
| Loading | Not directly captured; existing server loading behavior unchanged. |
| Validation error | Verified on Create Transaction invalid amount state. |
| Recoverable error | Auth registration failure observed; product recoverable states were not safely forced. |
| Success | Save attempt captured, but no completed receipt/redirect was observed. |
| Dark mode | Verified on Home, Money, Transactions, and Create Transaction. |
| English/Vietnamese | Verified on Home, Money, and Transactions. |

## Evidence Files

| Folder | Contents |
|---|---|
| `evidence/before/` | Home, Money, and Create Transaction protected-route screenshots before E0.1 visual changes. |
| `evidence/after/` | Protected-route screenshots plus authenticated product screenshots after E0.1 visual changes. |

## Remaining Browser Requirement

For future reruns, provide an authenticated E2E household account through environment variables, then run:

```bash
E2E_USER_EMAIL=<email> E2E_USER_PASSWORD=<password> npx playwright test tests/e2e/home-dashboard.smoke.spec.ts tests/e2e/money-hub.smoke.spec.ts tests/e2e/money-transactions.smoke.spec.ts tests/e2e/money-capture.smoke.spec.ts
```
