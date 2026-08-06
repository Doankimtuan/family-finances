# Implementation Boundary

## App Shell Source Files Expected To Change

- `app/[locale]/(product)/layout.tsx`
- `shared/patterns/app-viewport.tsx`
- `shared/patterns/chrome-shell.tsx`
- `shared/patterns/bottom-navigation.tsx`
- `shared/patterns/bottom-navigation-tabs.ts`

## Home Source Files Expected To Change

- `app/[locale]/(product)/home/page.tsx`
- `app/[locale]/(product)/home/home-capture-action.tsx`
- `app/[locale]/(product)/home/home-inbox-cta.tsx`
- `app/[locale]/(product)/home/home-health-chip.tsx`
- `app/[locale]/(product)/home/home-day-zero-trio.tsx`

## Shared Primitives Expected To Change

- `shared/patterns/page.tsx`
- `shared/patterns/top-app-bar.tsx`
- `shared/patterns/balance.tsx`
- `shared/patterns/kpi-block.tsx`
- `shared/patterns/quick-action.tsx`
- `shared/patterns/health-card.tsx`
- `shared/patterns/empty-state.tsx`
- `shared/patterns/loading-state.tsx`
- `shared/patterns/error-state.tsx`
- `shared/patterns/mutation-offline-banner.tsx`
- `shared/patterns/sheet.tsx`
- `shared/ui/status-alert.tsx`

Change these only when the approved blueprint requires shell/Home behavior that cannot be achieved locally.

## Tests Expected To Change

- `tests/e2e/home-dashboard.smoke.spec.ts`
- `tests/e2e/shell.smoke.spec.ts`
- `tests/e2e/chrome.smoke.spec.ts`
- `tests/unit/bottom-navigation.test.ts`
- `tests/unit/theme/theme.test.ts`
- `tests/unit/i18n-messages.test.ts`
- `tests/unit/i18n-routing.test.ts`
- `tests/unit/shared-ui.smoke.test.tsx`
- `playwright.config.ts`, only if directly required for authenticated Home/App Shell verification.

## Routes That Must Remain Unchanged

- `/home`
- `/money`
- `/money/transactions/new`
- `/plan`
- `/inbox`
- `/inbox/[id]`
- `/together`
- `/health`

No visible navigation may add compatibility routes or new top-level product routes.

## Business Logic That Must Remain Untouched

- Ledger posting, correction, refund, and transaction immutability.
- Plan allocation, jar, goal, recurring, calendar, and ritual calculations.
- Inbox ReviewItem resolution policy and source ownership.
- Health read-only policy and no-write boundary.
- Tenancy membership, roles, policies, invitations, and account lifecycle rules.
- Supabase schema, migrations, RLS, and backend persistence.

## Unrelated Modules That Must Not Be Modified

- `modules/ledger/domain`
- `modules/plan/domain`
- `modules/inbox/domain`
- `modules/health/domain`
- `modules/platform/supabase`
- `modules/platform/jobs`
- `archive/legacy-v1`
- Money, Plan, Inbox, Together, Health, and Settings screens except for direct route targets used by Home links.
