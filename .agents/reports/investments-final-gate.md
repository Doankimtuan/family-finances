# Investments Final Gate — Market Data + UX + Accounting Certification

Date: 2026-08-22

## Verdict

**INVESTMENTS REFERENCE READY**

## Certification evidence

- Accounting: prior P0 integrity gate passed. Buy principal and sell gross proceeds remain neutral; fees are Expense; income is Income; market movement is neither; realized P&L is domain-derived; Fund/CCQ uses FIFO; opening positions create no cash movement.
- Market data: MARKET 05 passed catalog ownership, current-price reuse, stale/manual/unknown fallback, USD→VND current FX conversion, native quote preservation, and distinct-instrument batching. No price-history or snapshot tables exist.
- Create flow: authenticated E2E covers Stock/FPT, Crypto/BTC, Fund/CCQ, Bond `TOTAL_VALUE`, manual fallback, historical opening, live purchase, source-account rules, custom holding names, and asset-class validation.
- Holding actions: authenticated E2E covers buy, partial sell, MAX sell, fee/cash/realized-P&L previews, income, manual valuation rules, auto-priced action hiding, closed-history behavior, and no fabricated cash leg.
- Security: prior ownership/security gate passed server-side personal ownership, cross-user mutation denial, catalog/price/FX write denial, server-only provider/sync secrets, protected admin sync routes, and retry/idempotency checks.
- Read UX: overview/detail evidence covers market value, basis, unrealized/realized P&L, income, quote/NAV metadata, freshness, automatic/stale/manual/unknown states, closed history, offline handling, and privacy masking.
- Performance: query-shape and sync tests cover one bulk market read per table, distinct active-instrument sync targets, provider batching, shared prices, and no per-holding provider calls.

## Current verification

- Focused Investment/Market/ownership/privacy/i18n/accounting suite: **32 files, 283 tests passed**.
- Authenticated Investment E2E: **13/13 passed**.
- Coverage included 390px VI/light, 440px EN/dark, 768px and 1280px shell checks, reduced motion, no horizontal overflow, FPT, BTC, Fund/CCQ, Bond, manual holding, buy, partial sell, MAX sell, income, privacy, and offline valuation.
- `npm run typecheck`: passed.
- `npm run build`: passed.

## Non-blocking repository baseline

- Full unit suite: 1,067 passed, 4 unrelated Home/header polish contract failures.
- Full lint: 3 unrelated errors in `scripts/home-compact-cta-check.cjs`.
- These failures are outside Investments and were not introduced or changed by this gate.

## Cron boundary

MARKET 03 scheduled activation remains deployment work until a public current Next app URL and deployment secrets exist. It is not an Investments certification blocker. Do not activate production cron from this workspace.
