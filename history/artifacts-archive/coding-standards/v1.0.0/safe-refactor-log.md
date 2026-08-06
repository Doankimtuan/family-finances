---
document: Safe Refactor Log
coding_standards: v1.0.0
status: OFFICIAL_CODING_STANDARDS
run_id: run_coding_standards_20260802T150000Z
created_at: 2026-08-02T15:05:00Z
board: Engineering Standards Board
frozen: true
---

# Safe Refactor Log

Mechanical, behavior-preserving fixes applied automatically during this board run. Every change below was verified with `npm run typecheck`, `npm run lint`, and `npm run test` (26 files / 125 tests) passing after the change, with zero business-logic or visual-output difference (identical resolved CSS, identical resolved URLs).

## 1. Tailwind radius codemod — `rounded-[var(--radius-*)]` → canonical `rounded-*`

**Rule:** [tailwind-policy.md](./tailwind-policy.md)

`--radius-sm|md|lg|xl|full` are registered in `styles/globals.css` under `@theme inline`, so Tailwind's own `rounded-*` utilities already resolve to the exact same value as the bracket form. Replaced mechanically with `perl -pi -e 's/rounded-\[var\(--radius-(sm|md|lg|xl|full)\)\]/rounded-$1/g'` across `app/`, `shared/`, `modules/`.

**Result:** 66 occurrences fixed across 34 files. Zero occurrences remain (`git grep` verified).

<details>
<summary>Files changed (34)</summary>

```text
app/[locale]/(auth)/register/register-screen.tsx
app/[locale]/(onboard)/together/onboard/onboard-wizard-screen.tsx
app/[locale]/(product)/inbox/inbox-resolve-row.tsx
app/[locale]/(product)/money/accounts/[id]/page.tsx
app/[locale]/(product)/money/accounts/add-account-form.tsx
app/[locale]/(product)/money/accounts/page.tsx
app/[locale]/(product)/money/transactions/[id]/edit/edit-transaction-form.tsx
app/[locale]/(product)/money/transactions/[id]/edit/page.tsx
app/[locale]/(product)/money/transactions/[id]/page.tsx
app/[locale]/(product)/money/transactions/capture-transaction-form.tsx
app/[locale]/(product)/money/transactions/page.tsx
app/[locale]/(product)/money/transactions/transactions-filter-bar.tsx
app/[locale]/(product)/plan/page.tsx
app/[locale]/(product)/plan/plan-destination-stub.tsx
app/[locale]/(product)/together/invitations/page.tsx
app/[locale]/(product)/together/member-list.tsx
app/[locale]/(product)/together/policies/page.tsx
app/[locale]/(product)/together/policies/policies-form.tsx
app/[locale]/(product)/together/preferences/page.tsx
app/not-found.tsx
shared/patterns/bottom-navigation.tsx
shared/patterns/brand-mark.tsx
shared/patterns/card.tsx
shared/patterns/dialog.tsx
shared/patterns/empty-state.tsx
shared/patterns/locale-switcher.tsx
shared/patterns/social-button.tsx
shared/patterns/theme-toggle.tsx
shared/patterns/transaction-row.tsx
shared/ui/button.tsx
shared/ui/form/auth-text-field.tsx
shared/ui/form/checkbox-field.tsx
shared/ui/icon-button.tsx
shared/ui/input.tsx
shared/ui/select.tsx
shared/ui/textarea.tsx
```

</details>

## 2. Hardcoded money routes → typed path builders

**Rule:** [magic-string-policy.md](./magic-string-policy.md)

Added `RoutePath` alias and `moneyTransactionEditPath()` builder to `modules/tenancy/application/app-path.ts`; replaced 4 hardcoded template-literal routes with the existing/new builders.

| File | Before | After |
|------|--------|-------|
| `app/[locale]/(product)/money/transactions/page.tsx` | `` href={`/money/transactions/${tx.id}`} `` | `href={moneyTransactionPath(tx.id)}` |
| `app/[locale]/(product)/money/transactions/[id]/edit/edit-transaction-form.tsx` | `` const detailHref = `/money/transactions/${transaction.id}`; `` | `const detailHref = moneyTransactionPath(transaction.id);` |
| `app/[locale]/(product)/money/transactions/[id]/page.tsx` | `` href={`/money/transactions/${tx.id}/edit`} `` | `href={moneyTransactionEditPath(tx.id)}` |
| `app/[locale]/(product)/money/accounts/page.tsx` | `` href={`/money/accounts/${account.id}`} `` | `href={moneyAccountPath(account.id)}` |

## 3. `RoutePath` naming alias

**Rule:** [naming-policy.md](./naming-policy.md), [constants-policy.md](./constants-policy.md)

Added `export const RoutePath = APP_PATH;` to `modules/tenancy/application/app-path.ts` — a pure alias (no duplicate object), giving new code the standard `RoutePath` namespace name without a disruptive rename of the widely-imported `APP_PATH`.

## 4. Deep relative import fixed

**Rule:** [import-policy.md](./import-policy.md)

`app/[locale]/(product)/money/transactions/[id]/edit/page.tsx` imported `MoneyOfflineBanner` via `../../../money-offline-banner` (3 levels). Replaced with `@/app/[locale]/(product)/money/money-offline-banner`, matching the existing precedent in `app/[locale]/(invite)/invite/[token]/invite-accept-screen.tsx`. The remaining `../../` (2-level) imports of the same component and of `mutate-actions` are within the approved depth-2 limit and were left unchanged.

## 5. E2E hardcoded onboard path → `APP_PATH.ONBOARD`

**Rule:** [magic-string-policy.md](./magic-string-policy.md)

9 Playwright specs hardcoded the literal `"/together/onboard"` (8× in `page.url().includes(...)`, 1× in `page.goto(...)`). All now import `APP_PATH` from `@/modules/tenancy/application/app-path` and reference `APP_PATH.ONBOARD`.

**Files:** `money-capture.smoke.spec.ts`, `account-lifecycle.smoke.spec.ts`, `together-policies.smoke.spec.ts`, `together-invites.smoke.spec.ts`, `inbox.smoke.spec.ts`, `plan-hub.smoke.spec.ts`, `money-transactions.smoke.spec.ts`, `money-hub.smoke.spec.ts`, `onboard.smoke.spec.ts`.

## 6. `REMEMBER_KEY` promoted to a shared auth constant

**Rule:** [constants-policy.md](./constants-policy.md), [magic-string-policy.md](./magic-string-policy.md)

Added `AUTH_STORAGE_KEY = { REMEMBER_EMAIL: "vinha.auth.rememberEmail" } as const;` to `modules/tenancy/application/auth-constants.ts` (co-located with the existing `LOCALE_COOKIE_NAME` precedent — auth-owned storage/cookie constants live in the owning module, not a generic `shared/constants/` bucket). Removed the file-local `REMEMBER_KEY` from `app/[locale]/(auth)/login/login-screen.tsx`; all 3 call sites now use `AUTH_STORAGE_KEY.REMEMBER_EMAIL`.

## 7. `shared/constants/` and `shared/config/` scaffolded

**Rule:** [folder-policy.md](./folder-policy.md)

Created both folders with a `README.md` documenting purpose, ownership boundary versus `modules/*/application`, and explicit non-goals — no placeholder/speculative constant files were added (per `anti-patterns.md` YAGNI and `ai-agent-rules.md` rule 8, "never create duplicate components or utilities"). The audit found no genuinely cross-module constant or feature flag that needs a home today; the folders exist so the next Story that does introduce one has an unambiguous, policy-documented destination.

## Verification

```text
npm run typecheck   → pass, 0 errors
npm run lint         → pass, 0 problems
npm run test         → pass, 26 files / 125 tests
```

No `supabase/migrations/**`, no Zod schema, no business logic, no visual output changed by any item above.
