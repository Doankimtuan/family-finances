# Duplicated Patterns — Engineering Review

**Run:** `run_engineering_review_20260802T011833Z`  
**Scope:** rewrite `app/`, `shared/`, `modules/` (exclude `archive/`)

## Confirmed duplication (≥3 or expected standard)

| Pattern | Count | Evidence |
|---------|------:|----------|
| Alert compound (Indicator/Content/Title/Description) | 4 | `login-screen`, `confirm-screen` ×2, `money-membership-gate` |
| Login field stack (label + Input + error + a11y) | 2 fields | Will become ≥4 with register/forgot — expected form standard |
| ProductStub IA pages | 6 | home/money/plan/inbox/together/health |
| Auth/product chrome shell | 2 near-identical layouts | AppViewport + scroll main ± BottomNav |
| Auth centered column shell | 5+ | login, welcome, confirm states, money-gate |
| `min-h-11` touch targets | 12 | Buttons/Inputs/links across auth + chrome |
| Duplicate Zod login schema | 2 | Client `loginFormSchema` vs `signInInputSchema` |

## Light / intentional duplication

| Pattern | Notes |
|---------|--------|
| Splash Spinner vs LoadingState | Brand moment — keep custom |
| Product page `setLocale` + translations | Already DRY via ProductStub |

## Not duplicated (do not invent)

Dialog, Toast consumers, CurrencyField, Confirm flows, useAsyncAction — zero or one consumer.

## Round 2 — Coding Standards audit findings (S4/S5 Money/Plan/Inbox surface)

**Run:** `run_engineering_review_20260802T154500Z` · **Scope:** rewrite `app/`, `shared/`, `modules/` after S4/S5 stories landed

| Pattern | Count | Evidence |
|---------|------:|----------|
| Long CTA/link-styled-button class chain (`inline-flex min-h-11 w-full items-center justify-center rounded-md ...`) instead of `Button`/link variant | ~15 files | Money/Together/Plan back-links, detail-page CTAs |
| Direction/category segmented-control class ternary (identical long string, both branches) | 2 files × 3 controls each | `capture-transaction-form.tsx`, `edit-transaction-form.tsx` |
| Transaction create/edit form shell (direction, account list, tag chips, jar select) | 2 (298 / 394 lines) | Same two files above — see Coding Standards `audit-report.md` item 1 |
| Signed-amount template (`` `${type === "expense" ? "−" : "+"}${formatCurrency(...)}` ``) | 4 | `money/page.tsx`, `transactions/page.tsx`, `transactions/[id]/page.tsx`, `accounts/[id]/page.tsx` |
| `TransactionDirection` / `AccountType` declared as a bare union, independently re-declared as `z.enum([...])` in commands, independently re-declared as `(["expense","income"] as const)` in both forms | 3 sources per concept | `transaction-types.ts` / `account-types.ts` vs `record-transaction.ts`, `update-transaction.ts`, `create-account.ts` vs capture/edit forms |
| `"VND"` default currency literal | ~10 | `transaction-types.ts`, `get-real-position.ts`, `list-accounts.ts`, `review-items.ts`, money page fallbacks |

Mechanical smells already fixed at the Coding Standards freeze (not duplicated components, just literal/token drift): `rounded-[var(--radius-*)]` bracket form (66× / 34 files), 4 hardcoded money detail routes, 1 deep relative import, 9 E2E hardcoded onboard paths, 1 file-local storage key. See [Coding Standards / safe-refactor-log.md](../../coding-standards/CURRENT/safe-refactor-log.md) — these do not need re-litigating here.
