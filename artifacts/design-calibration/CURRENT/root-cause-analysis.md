# Root Cause Analysis

## Verdict

The product owner's observation is valid. Phase E0 made the implementation cleaner, but the visible transformation was too conservative to satisfy visual acceptance.

## Confirmed Causes

1. Phase E0 was structurally correct but visually subtle.
   - `Page`, `Section`, and `BottomActionBar` reduced repeated layout code.
   - Most target screens still rendered the same plain vertical rhythm, same neutral surfaces, same typography scale, and same row treatment.

2. The active routes do render the modified files.
   - Home: `app/[locale]/(product)/home/page.tsx`
   - Money: `app/[locale]/(product)/money/page.tsx`
   - Transactions: `app/[locale]/(product)/money/transactions/page.tsx`
   - Create Transaction: `app/[locale]/(product)/money/transactions/new/page.tsx`
   - Shared primitives: `shared/patterns/page.tsx`, `shared/patterns/section.tsx`, `shared/patterns/bottom-action-bar.tsx`

3. The browser is using the current local working tree.
   - Local route: `http://localhost:3000`
   - Server: Next dev server, PID `75858`
   - Server cwd: `/Users/doantuan/Desktop/Plan/family-finances`
   - Build cache: `.next/dev`, not production `.next/server`
   - Git commit: `ed9ab1f`
   - Tailwind source includes app and shared component files; `history/`, `archive/`, `artifacts/`, and `.agents/` are excluded intentionally.

4. Authenticated acceptance is blocked in this shell.
   - `E2E_USER_EMAIL` is missing.
   - `E2E_USER_PASSWORD` is missing.
   - Protected routes redirect to login in before and after browser screenshots.
   - The credentialed Playwright test cases correctly skip instead of using literal credentials.

5. The smoke-test blocker was real but separate from visual acceptance.
   - `money-hub.smoke.spec.ts` used broad text matching.
   - After visual calibration, multiple visible phrases matched the same regex.
   - The locator was tightened to the authenticated Money hub ledger balance.

## Screen Findings

## Home

- Phase E0 issue: real position, Plan pulse, Inbox, and Health looked like similarly weighted sections.
- E0.1 change: real position is now the dominant tonal summary; Plan and Inbox use bounded surfaces; day-zero and health states have clearer grouping.
- Remaining blocker: authenticated Home cannot be visually inspected without the E2E fixture.

## Money

- Phase E0 issue: Money summary, account scan, activity, and More all used similar rhythm, so hierarchy looked unchanged.
- E0.1 change: real position is now an emphasized summary zone with supporting counts; account/product groups have clearer nested rhythm; activity and More use bounded sections.
- Remaining blocker: long list, real account data, and dark/Vietnamese product fit need authenticated evidence.

## Create Transaction

- Phase E0 issue: the sticky action existed, but the form still read as a conventional field stack.
- E0.1 change: amount is visually first and prominent; direction is a compact segmented control inside the amount zone; account/tag/jar/note groups are visibly bounded; preview is highlighted as financial consequence.
- Remaining blocker: initial, filled, validation, preview, and success states need authenticated browser evidence.
