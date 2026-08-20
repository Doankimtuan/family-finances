# ViNha Money Track — 08E: Account Detail + Actions

Implementation date: 2026-08-19

## Implemented

- Normal account detail now presents the bounded object balance before ownership metadata and labels it `Balance` / `Số dư`.
- Credit-card detail remains liability-first: outstanding debt, available credit, limit, due information, and `Pay card` / `Thanh toán thẻ`.
- Both detail heroes use shared privacy-aware financial primitives and restrained bounded surfaces without feature-level elevation.
- Detail back navigation and archive return to canonical `/money`; the `/money/accounts` route remains redirect-only.
- Generic activity navigation is labeled as transactions because the destination does not preserve an account filter.
- Failed account/card reads use neutral unavailable/error semantics with retry; failed recent-activity reads remain distinct from a successful empty list.
- Existing 08D edit/archive form behavior remains reused; opening balance is not exposed as an edit field.

## Balance adjustment audit

No user-facing balance-adjustment or reconciliation command exists in the current production code. The canonical Accounts contract already defines the future `Adjust balance` / `Điều chỉnh số dư` flow: the user enters the actual current balance and a reason, the system records the delta against the account, preserves an append-only audit trail, and excludes the adjustment from income, expense, and period cash-flow totals. It must remain distinct from ordinary transaction capture and must not affect Planning.

That flow is intentionally not exposed in 08E.

## Validation

- Focused detail/privacy/form/ledger tests: passed — 3 files, 23 tests.
- Full unit suite: passed — 125 files, 931 tests.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- Account-detail Playwright spec: 4 credential-gated tests skipped because the authenticated fixture was unavailable.
