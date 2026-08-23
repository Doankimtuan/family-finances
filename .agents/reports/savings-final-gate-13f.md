# SAVINGS 13F — Final Reference Gate

Date: 2026-08-23

## Final verdict

`SAVINGS REFERENCE READY`

13F.1 resolved the two browser blockers without changing Savings accounting,
domain, lifecycle, or eligibility semantics.

## Gate evidence

### Accounting, lifecycle, ownership, activity, privacy, and UX

PASS by the 13B–13E reports and current targeted regression tests:

- neutral principal placement and return; Income interest; Expense tax and
  actual fee/penalty; authoritative net payout;
- simple, compound-daily, and compound-monthly calculations;
- server-derived early settlement, configured early rate, destination
  eligibility, lifecycle preconditions, replay protection, and idempotency;
- maturity settlement, principal-only rollover, and principal-plus-net-interest
  rollover with immutable prior-cycle history;
- live BANK/PLATFORM opening and HISTORICAL_OPENING with zero financial rows;
- ownership/RLS/RPC protection and Savings event metadata across activity,
  Transactions, and Home;
- FinancialValue privacy coverage, shared choice/action-sheet patterns, sticky
  safe-area actions, terminal-state action gating, and no-overflow responsive
  evidence.

Current targeted unit/domain/privacy/semantics run: **112 passed**.
Current changed-file ESLint: **PASS**.
Current typecheck: **PASS**.
Current production build: **PASS**.

### Browser certification

The deterministic lifecycle suite passed **7/7**, covering live BANK, live
PLATFORM, historical opening, maturity settlement, principal-only rollover,
principal-plus-net-interest rollover, early withdrawal, and settled/early-settled
terminal states. The creation visual suite passed at 390, 440, 768, and 1280px
with reduced motion and overflow checks.

The final combined authenticated browser run was **9 passed, 0 failed** with
one worker, avoiding the known single-user session collision from parallel
workers. It covered:

- catalog provider/package CRUD and creation-selector availability;
- creation visual smoke at 390 VI/light, 440 EN/dark, 768, and 1280px with
  reduced motion and no horizontal overflow;
- G1 live funding smoke;
- live BANK, live PLATFORM, historical opening, maturity settlement,
  principal-only rollover, principal-plus-net-interest rollover, early
  withdrawal, and terminal-state lifecycle tests;
- overview, detail, create preview, and early-withdraw preview.

### Full-suite visibility

- Full unit: **148/152 files passed; 1,065/1,072 tests passed**. The seven
  failures are existing Home/header/motion and investment UI baseline failures;
  no Savings test failed in that run.
- Full lint: failed only on the existing
  `scripts/home-compact-cta-check.cjs` rules.
- Full format check: emitted repository-wide pre-existing formatting warnings;
  no Savings blocker was identified.
- Local Supabase execution was unavailable because Docker was not running.
  The 13B–13D linked-development SQL/RPC verification remains the source for
  database-level accounting and security evidence.

## 13F.1 fixes

- Catalog smoke now waits for the awaited provider/product action to leave the
  active sheet and waits for refreshed CRUD/archive assertions with bounded
  Playwright expectations. It does not weaken the exact provider/package
  assertions or add sleeps.
- Savings smoke now uses its own deterministic `e2e-savings-f6` fixture prefix
  and output file, preventing concurrent lifecycle-fixture resets from
  replacing its known IDs.
- G1 selectors now scope to `#app-viewport-root`, matching the active-surface
  contract and avoiding intentional inactive-surface duplicates.

## Regression

- Targeted Savings/domain/privacy/semantics: **PASS**.
- Ownership/idempotency: **PASS**, 83 tests.
- Changed-file Prettier and ESLint: **PASS**.
- Typecheck: **PASS**.
- Build: **PASS**.
- Full unit: **148/152 files passed; 1,065/1,072 tests passed**. The seven
  failures are unchanged Home/header/motion and investment baseline failures;
  none are Savings blockers.
- Full lint: failed only on the unchanged
  `scripts/home-compact-cta-check.cjs` rules.
- Local Supabase execution remains unavailable because Docker is not running;
  database-level evidence remains the linked-development verification recorded
  in 13B–13D.
