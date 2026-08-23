# SAVINGS 13E — UX Polish + Action Flow Consistency

Date: 2026-08-23

## 13E.2 — Lifecycle E2E Fixture + Smoke Stabilization

Implemented deterministic authenticated fixtures in
`scripts/savings-13e2-fixture.mjs` for live BANK/PLATFORM deposits, historical
opening, maturity settlement, early withdrawal, both rollover strategies, and
settled/early-settled terminal states. Fixture-owned Inbox decisions are
removed on reset so retries do not reuse stale lifecycle rows.

The duplicate locator source was the authenticated active-surface selector,
not a duplicate production route or accounting UI. Savings E2E locators now
scope to `#app-viewport-root`, preserving strict assertions while ignoring the
intentional inactive surface copy.

Catalog CRUD had a real cache invalidation defect: provider/product mutations
did not revalidate the catalog management and Savings creation routes. Added
route constants and a shared catalog revalidation boundary. No accounting
logic or product copy changed.

## Verification

Passed:

- Savings lifecycle E2E: 5/5, covering live BANK, live PLATFORM, historical opening, maturity settlement, early withdrawal, both rollovers, and terminal states.
- `savings.smoke.spec.ts`: 1/1
- `savings-catalog-management.smoke.spec.ts`: 1/1
- Savings G1 fixture: 1/1
- Savings visual smoke: 390 VI/light, 440 EN/dark, 768, 1280; reduced motion and horizontal-overflow checks passed
- Focused Savings, ownership/idempotency, privacy, Transactions, and Home semantics: 198/198
- Changed-file lint, typecheck, and build

Lifecycle assertions verify receipts/result navigation, resulting status/action
gating, readable history, and idempotent confirmation behavior. Accounting
formula coverage remains owned by the existing 13B/13C contracts; browser
flows introduced no contradictory state or duplicate lifecycle rows.

Full-suite baseline remains outside this gate: 7 failures across existing
Home/header/motion and investment UI contracts. Full lint retains the existing
`scripts/home-compact-cta-check.cjs` errors. Neither is a Savings blocker.

## Verdict

# SAVINGS UX READY
