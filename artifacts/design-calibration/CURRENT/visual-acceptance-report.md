# Visual Acceptance Report

## Verdict

VISUAL_CALIBRATION_ACCEPTED_WITH_MINOR_CONDITIONS

The three Phase E0 surfaces now show a meaningful visual calibration in authenticated browser evidence. The gate remains conditional because the app does not yet expose a completed success receipt for daily capture, and the fixture does not provide enough seeded data for true long-list evidence.

## Running Application Confirmation

| Item | Evidence |
|---|---|
| Local app | `http://localhost:3000` |
| Server | Next dev server, PID `75858` |
| Workspace | `/Users/doantuan/Desktop/Plan/family-finances` |
| Build mode | `.next/dev` Turbopack cache; no stale production build observed |
| Git commit | `ed9ab1f` |
| Auth fixture | Loaded from `.env.local`; values not printed or stored in docs |
| Browser cache | Fresh Playwright contexts used for before and after screenshots |

## Before Evidence

| Surface | Screenshot |
|---|---|
| Home, 390px, light, Vietnamese | `evidence/before/home-390-light-vi.png` |
| Home, 440px, dark, English | `evidence/before/home-440-dark-en.png` |
| Money, 390px, light, Vietnamese | `evidence/before/money-390-light-vi.png` |
| Money, 440px, dark, English | `evidence/before/money-440-dark-en.png` |
| Create Transaction, 390px, light, English | `evidence/before/capture-390-light-en-initial.png` |

All before screenshots redirected to login because no authenticated fixture was available.

## After Evidence

| Surface | Screenshot |
|---|---|
| Home, 390px, light, Vietnamese | `evidence/after/home-390-light-vi.png` |
| Home, 440px, dark, English | `evidence/after/home-440-dark-en.png` |
| Money, 390px, light, Vietnamese | `evidence/after/money-390-light-vi.png` |
| Money, 440px, dark, English | `evidence/after/money-440-dark-en.png` |
| Create Transaction, 390px, light, English | `evidence/after/capture-390-light-en-initial.png` |
| Auth Home, 390px, light, Vietnamese | `evidence/after/auth-home-390-light-vi.png` |
| Auth Home, 440px, dark, English | `evidence/after/auth-home-440-dark-en.png` |
| Auth Money, 390px, light, Vietnamese | `evidence/after/auth-money-390-light-vi.png` |
| Auth Money, 440px, dark, English | `evidence/after/auth-money-440-dark-en.png` |
| Auth Transactions, 390px, light, Vietnamese | `evidence/after/auth-transactions-390-light-vi.png` |
| Auth Transactions, 440px, dark, English | `evidence/after/auth-transactions-440-dark-en.png` |
| Auth Create Transaction initial, 390px, light, English | `evidence/after/auth-capture-initial-390-light-en.png` |
| Auth Create Transaction validation error, 390px, light, English | `evidence/after/auth-capture-validation-error-390-light-en.png` |
| Auth Create Transaction filled preview, 390px, light, English | `evidence/after/auth-capture-filled-preview-390-light-en.png` |
| Auth Create Transaction initial, 440px, dark, English | `evidence/after/auth-capture-initial-440-dark-en.png` |
| Auth Create Transaction reduced motion, 390px, light, English | `evidence/after/auth-capture-reduced-motion-390-light-en.png` |
| Auth Create Transaction save attempt, 390px, light, English | `evidence/after/auth-capture-success-redirect-390-light-en.png` |

The authenticated screenshots confirm that the modified routes render the current product code and show the calibrated visual hierarchy.

## Visible Calibration Implemented

- Home: dominant real-position surface, stronger amount hierarchy, grouped Plan and Inbox surfaces, clearer pending Inbox count, elevated Health chip, bounded day-zero state.
- Money: emphasized real-position summary, supporting account/activity counts, clearer account scan grouping, bounded activity and More sections, polished transaction-row rail and hover/focus rhythm.
- Transactions: filter bar now reads as a real control surface; segmented filters have selected-state affordance; transaction rows are grouped for dense scanning.
- Create Transaction: amount-first tonal panel, direction segmented control, grouped account/tag/jar/note areas, highlighted financial preview, sticky action retained.

## Acceptance Criteria Status

| Criterion | Status |
|---|---|
| Three target surfaces render authenticated product data | Passed |
| Visual changes observable without source inspection | Passed |
| Before and after evidence exists | Partial: before evidence is protected-route baseline; after evidence is authenticated product UI |
| Phase D personality visible | Passed with minor conditions |
| Focused Playwright flow passes | Passed: 10/10 |
| Light and dark modes reviewed | Passed |
| English and Vietnamese reviewed | Passed |
| 390px and 440px reviewed | Passed |
| Business/IA/routes preserved | Passed by source review |
| Remaining conditions documented | Passed |

## Scores

| Criterion | Score |
|---|---:|
| Visible transformation | 8/10 |
| Product personality | 8/10 |
| Visual hierarchy | 8/10 |
| Mobile usability | 8/10 |
| Financial readability | 8/10 |
| Dark-mode | 8/10 |
| Localization fit | 8/10 |
| Accessibility | 7/10 |

Scores are capped by unresolved success receipt behavior and limited long-list fixture coverage.

## Conditions Resolved

- Non-unique Money hub smoke-test locator fixed.
- Current local dev server and working-tree rendering path confirmed.
- Tailwind source inclusion for modified app/shared files confirmed.
- Visual calibration changes applied to exactly the three Phase E0 surfaces and directly required shared primitives.
- Literal credentials were not written to source, docs, screenshots, or test output.
- Authenticated Home, Money, Transactions, and Create Transaction screenshots captured in light/dark and English/Vietnamese.
- Focused authenticated Playwright suite passed.

## Remaining Blockers

- Create Transaction save currently shows a pending state and then returns to the form without an observed success receipt, redirect, or error in manual browser probing.
- True long-list behavior is not verified because the seeded fixture contains only sparse activity.
- Long currency behavior is partially verified through the filled preview amount, but not in a dense transaction list.
- Loading/skeleton state is still source-level only; no observable slow-loading state was safely produced.
- Recoverable product error beyond validation was not safely produced.

## Recommendation For Phase E

Proceed to Phase E with this calibrated direction, but prioritize a capture success receipt and a richer seeded E2E household fixture before broader screen rollout.
