# MONEY 16B — Summary Integration + Partial Read-State Hardening

## Verdict

**MONEY FOUNDATION READY**

The three P1 findings from MONEY 16A are implemented. No concrete Money blocker remains in scope.

## Scope completed

### Investments summary

- Money now reads the canonical `InvestmentHomeSummary` adapter.
- The row shows estimated market value, holding count, and valuation coverage/quality.
- `current`, `stale`, `manual`, `partial`, and `unknown` states are explicit.
- `UNKNOWN` renders no fabricated zero amount.
- `PARTIAL` is labeled as a partial estimate and retains known value only.
- Money does not request full investment portfolio or history data.
- Market value remains a position fact; unrealized P&L is not introduced into Money cash or income/expense semantics.

### Savings summary

- Money now reads `getSavingsHomeSummary()` instead of `listSavings()`.
- The adapter returns active principal, active count, nearest maturity, and action-required count.
- Current-cycle selection prevents rollover double counting.
- Matured, settled, and early-settled lifecycle semantics remain outside the active principal total.
- The query is bounded to the savings and active/matured cycle reads; it does not load history, activity, or per-saving fallback data.

### Independent typed read states

- Real Position, Credit Cards, Savings, Investments, Loans, and Debt now use one discriminated `ready | unavailable` read composition.
- A failed source only marks its own section unavailable.
- A Position failure produces an unavailable hero, never a fabricated balance.
- A Cards failure leaves owned-money position and other module summaries visible.
- The full-page failure path is reserved for a root failure outside these independent reads.
- Secondary debt amounts now also pass through `FinancialValue`.

### Browser harness

- Ambiguous `ledger-balance` assertions are scoped to the intended Money position hero/container.
- Production markup was not changed to satisfy the selector.

## Focused validation

- Focused unit/integration run: **18 files, 134 tests passed**.
- Changed-file ESLint: **passed**.
- Typecheck: **passed**.
- Production build: **passed**.
- Money browser certification: **passed** at 390 VI/light, 440 EN/dark, 768, and 1280.
- Browser coverage included healthy/partial investment valuation, Savings maturity attention, privacy ON/OFF, reduced motion, raw-key checks, and horizontal-overflow checks.
- Focused Money smoke: **3 tests passed**.
- Privacy component coverage confirms independent Accounts and Credit Cards unavailable states render without hiding the rest of the hub.
- Query-shape coverage proves no full Investment portfolio/history read, no full Savings list/history read, no Savings N+1 fallback loop, and bounded summary reads.

The full unit suite and repository-wide lint were intentionally not run.

## Smallest implementation sequence

1. Keep the canonical Investment and Savings summary adapters as the only Money inputs.
2. Keep the shared discriminated read composition at the Money page boundary.
3. Extend focused failure-state/browser coverage only when new Money read sources are added.
