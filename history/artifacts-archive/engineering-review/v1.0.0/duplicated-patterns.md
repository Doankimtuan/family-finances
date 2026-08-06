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
