# Final app-wide UI consistency audit

**Author:** Manus AI  
**Scope:** Reachable Family Finance UI, shared primitives, fallback states, auth surfaces, transaction/refund surfaces, and safe design-token normalization.  
**Validation policy:** English-only browser validation, as requested by the audit brief.

## Outcome

The final audit found a small set of remaining reachable seams rather than a broad need for another redesign. The approved Home/Money/Together visual language is already established across the major product flows. This pass therefore made targeted P0/P1 consistency fixes only, preserving business logic, route architecture, financial calculations, mutation behavior, and i18n contracts.

No new animation was added merely for completion. The existing motion foundation remains the correct level for this app: tokenized press/state feedback, reduced-motion handling, and HeroUI-owned overlay transitions.

## P0/P1 issues found and fixed

| Priority | Finding                                                                                                                             | Fix                                                                                                                                                            |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1       | The localized 404 CTA contained the malformed class `rounded-rounded-md`, making its geometry inconsistent and potentially invalid. | Replaced it with `--radius-control` and added the canonical hover, press, focus, and reduced-motion states in `app/[locale]/not-found.tsx`.                    |
| P1       | Auth text inputs and password-reveal buttons used a separate `rounded-lg`/`rounded-md` language and a one-off focus shadow.         | Normalized `AuthTextField` to `--radius-control` and the shared focus-ring-soft token.                                                                         |
| P1       | Registration submit styling overrode the shared Button with `rounded-lg`.                                                           | Replaced the override with `--radius-control` in the registration screen.                                                                                      |
| P1       | Transaction-detail and refund fallback actions used repeated manual `rounded-md` button styling.                                    | Normalized all reachable fallback back actions to `--radius-control`; the transaction category chip was normalized at the same time.                           |
| P1       | Add-account and refund receipt surfaces used legacy `rounded-lg` containers.                                                        | Normalized control-like hints to `--radius-control` and grouped form/summary surfaces to `--radius-card`.                                                      |
| P1       | Shared OAuth buttons still used `rounded-lg` and an arbitrary 15px text size despite otherwise using the canonical Button wrapper.  | Normalized OAuth button geometry to `--radius-control` and typography to the shared `text-sm` scale. Provider glyph brand colors were intentionally preserved. |
| P2       | Shared `IconButton` and `ConfirmSummary` still used `rounded-md`.                                                                   | Normalized `IconButton` to `--radius-control` and `ConfirmSummary` to `--radius-card` because both changes were low-risk and global.                           |

## Shared/global components changed

The shared layer changes were limited to `shared/ui/form/auth-text-field.tsx`, `shared/ui/icon-button.tsx`, `shared/patterns/confirm-summary.tsx`, and `shared/patterns/social-button.tsx`. These changes preserve their public contracts and only remove geometry/focus drift from the canonical token system.

The route-level changes were limited to `app/[locale]/not-found.tsx`, `app/[locale]/(auth)/register/register-screen.tsx`, `app/[locale]/(product)/money/transactions/[id]/page.tsx`, `app/[locale]/(product)/money/transactions/[id]/refund/page.tsx`, `app/[locale]/(product)/money/transactions/[id]/refund/refund-transaction-form.tsx`, and `app/[locale]/(product)/money/accounts/add-account-form.tsx`.

## Remaining P2 visual debt

The repository-wide scan still finds a few intentional or lower-impact exceptions. Provider-specific Google glyph colors in `shared/patterns/social-button.tsx` are brand artwork rather than page palette leakage. `app/not-found.tsx` is the pre-locale global fallback and still uses hardcoded bilingual copy and manual link styling; it is outside the localized product shell and should be handled separately if the global fallback is considered in scope. Some older manual fallback links and rounded surfaces remain in less frequently reached payment/refund and credit-statement branches; they are cosmetic and do not change the main screen hierarchy.

The auth field retains its intentional 56px height because authentication is a distinct entry-flow contract; only its radius and focus language were normalized. Provider-specific SVG artwork and the existing product shell’s desktop outer-radius treatment were left intact because they are intentional exceptions documented by their respective patterns.

The invalid `/en/does-not-exist` browser probe rendered the global fallback in the current development session, so the localized `app/[locale]/not-found.tsx` route’s runtime reachability could not be independently confirmed. Its source-level CTA fix is compiled and linted successfully.

## Unreachable or legacy UI found

The pre-locale `app/not-found.tsx` remains a legacy-style fallback with hardcoded English/Vietnamese strings, manual links, and `rounded-md` geometry. It is classified as **unreachable from the normal localized product flow / report-only** for this task because the brief prioritized reachable UI and the file sits outside the locale-aware shell. No risky cleanup was performed there.

No imports from `archive/legacy-v1` were introduced. No competing component library, icon family, raw product colors, new dependency, or business-rule change was introduced.

## Validation

| Check                    | Result                                                                                                                                                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run lint`           | Passed                                                                                                                                                                                                           |
| `npm run typecheck`      | Passed                                                                                                                                                                                                           |
| `npm run build`          | Passed; all application routes compiled successfully                                                                                                                                                             |
| Targeted Prettier check  | Passed for all files changed in this pass                                                                                                                                                                        |
| `git diff --check`       | Passed                                                                                                                                                                                                           |
| Focused Vitest           | Passed: 3 files, 17 tests (`account-forms`, `account-detail-polish`, `shared-visual-foundation`)                                                                                                                 |
| English browser audit    | Passed for `/en/register` and authenticated `/en/together/settings` at 390px, 440px, 768px, and 1280px; the app shell measured 390px, 440px, 440px, and 440px respectively, confirming the intentional 440px cap |
| Vietnamese browser audit | Not run, per the brief’s English-only validation requirement                                                                                                                                                     |
| Full unit suite          | Not run, per the brief’s testing optimization requirement                                                                                                                                                        |
| New E2E/visual tests     | None added, per the brief                                                                                                                                                                                        |

The repository already contained extensive unrelated modified and untracked files before this audit. They were left untouched. Temporary browser-audit files were removed after verification.

## Completion check

The major reachable product screens and overlays continue to use the approved design language. Shared auth fields, shared action buttons, transaction/refund fallback actions, account-create receipts, and confirmation summaries no longer carry the identified legacy geometry. Add Transaction, bottom navigation, form footers, picker surfaces, loading states, attention semantics, ownership presentation, and financial number formatting were audited and left unchanged where already compliant. No semantic financial presentation regression was introduced.
