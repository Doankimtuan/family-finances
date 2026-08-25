# HOME 14D — Final Reference Gate

Date: 2026-08-23

## Verdict

`HOME REFERENCE READY`

## Certification

Home continues to calculate Income, Expense, and net cash flow through the
canonical financial classifier. Focused semantics tests confirm true Income
and Expense inclusion, neutral transfers/card payments/Savings principal/
Investment buy-sell principal/Loan-Debt principal, Income treatment for
investment income and Savings interest, Expense treatment for investment fees,
Savings tax-fees, and Loan interest, and reversal exclusion. No sign-based
inference was introduced.

The grouped Home product section consumes typed read-model adapters only:

- Investments preserve market value, unrealized P&L, realized P&L, income,
  current/stale/manual/partial/UNKNOWN quality, and truthful coverage.
- Savings uses current active/matured lifecycle candidates and excludes rolled,
  settled, and early-settled value without double-counting rollover cycles.
- Loans use the existing bounded summary query with canonical remaining
  principal and due/overdue state.
- Debt uses canonical remaining amount, direction, and due state without sign
  inference.

The Investment Home RPC selects latest valuation rows and operation aggregates
inside the database. Home does not call the full Investment portfolio/history
read, full Savings list/cycle enrichment, lots, full activity, schedules, or
payment histories. Query-shape tests confirm bounded reads and no N+1 pattern.

Home IA remains shallow: shared contextual TopAppBar → financial orientation →
cash-flow/spending → Inbox → Plan pulse → grouped Assets & obligations → one
capture CTA. Plan remains read-only and does not duplicate Goal/Jar money.

Typed ready/partial/error boundaries preserve the rest of Home when transaction
or product reads fail. Offline, reduced-motion, focus restoration, privacy,
and shared motion-token contracts remain intact.

All Home financial values use the existing `FinancialValue` boundary. Browser
certification confirmed privacy masking while names, statuses, and attention
context remain visible.

## Browser evidence

Authenticated `.env.local` certification passed:

- Home 14C.1 fixture E2E: **6 passed** — 390 VI/light, 440 EN/dark, 768,
  1280; stale/partial/UNKNOWN Investment valuation, Savings attention,
  Loan/Debt attention, unavailable product read, privacy, CTA, overflow, and
  Home usability.
- Home dashboard smoke: **6 passed** — capture, Month/Quarter focus
  restoration, financial pulse, and required viewport shell checks.
- Compact CTA harness: **passed** — one CTA, no overlap, no console messages.

## Regression evidence

- Focused final-gate suite: **99 tests passed**.
- Full unit suite: **153 files, 1,081 tests passed**.
- Repository lint: **passed**.
- Typecheck: **passed**.
- Production build: **passed**.
- No repository-wide format cleanup was run; historical formatting debt was
  outside this gate.
