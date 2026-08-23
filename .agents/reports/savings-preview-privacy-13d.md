# SAVINGS 13D — Preview Consistency + Financial Privacy + Deterministic Package Fixture

Date: 2026-08-22

## Verdict

`SAVINGS PREVIEW/PRIVACY READY`

## Implemented

- Create/opening preview now reuses `calculateSettlementBreakdown` and presents principal, gross interest, tax when applicable, fee when applicable, net interest, and expected net maturity proceeds.
- Historical/opening mode keeps the same calculation semantics and retains the no-source-account-movement copy.
- Settlement review now uses the same snapshot tax rule/rate breakdown instead of recalculating presentation values in the component.
- Savings overview, create/review, settlement, cycle history, and activity amount paths now pass displayed monetary values through `FinancialValue`, `Amount`, `ConfirmSummary`, or `TransactionRow`.
- The Savings create wizard defaults to the first provider with an active package, so an empty provider ordered first cannot block a valid catalog.
- `g1-seed-e2e-fixtures.mjs` now idempotently creates household-scoped deterministic BANK and PLATFORM providers and valid active packages, with no production seed dependency and no destructive cleanup.

## Verification

- Focused Savings/domain/privacy/create/settlement/lifecycle tests: **PASS**, 93 tests.
- Changed-file Prettier, ESLint, and `npm run typecheck`: **PASS**.
- `npm run build`: **PASS**.
- Deterministic Savings visual E2E: **PASS** at 390, 440, 768, and 1280px with reduced motion.
- Browser privacy matrix against authenticated `.env.local`: **PASS** at 390 VI/light privacy OFF and ON; 440 EN/dark privacy OFF and ON; regression at 768 and 1280. No horizontal overflow.
- Fixture seeder: **PASS**, rerunnable; both fixture providers/packages were present for the authenticated household.
- Full unit suite: **149/152 files passed; 1,067/1,072 tests passed**. The five failures are the pre-existing Home/header/motion contract failures recorded in 13B/13C; no unrelated fixes were made.
- Full lint: **FAIL** only on the pre-existing `scripts/home-compact-cta-check.cjs` `require`/`console` rules.
- Full `format:check`: **FAIL** on 2,203 pre-existing files; all changed 13D files pass targeted Prettier checks.
- Savings G1 smoke: existing receipt-text assertion failed after create; the deterministic visual creation flow passed. No 13D accounting or preview assertion failed.

## Scope stop

Stopped after 13D. No Savings redesign or unrelated baseline cleanup was performed.
