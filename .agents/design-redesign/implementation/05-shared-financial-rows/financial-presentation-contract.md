# Implementation 05 — Financial Presentation Contract

**Product**: ViNha (Bilingual Vietnamese/English Household Financial Platform)  
**Status**: **MANDATORY ENGINEERING LAW**  
**Layer**: Shared Composite & Financial Presentation Components

---

## 1. Core Principles

Shared financial components are strictly **presentational**. They render already-verified numbers, labels, statuses, and currencies passed by domain services or server components. They **never calculate, mutate, infer, or guess** financial meaning.

---

## 2. Invariant Laws

### Law 1: No Financial Calculations in Presentation Components

Components may display:

- `balance`, `amount`, `quantity`, `rate`, `status`, `progress`, `metadata`

Components must **NEVER** calculate:

- Account balance
- Interest or maturity returns
- Investment profits, unrealized gains, or percentage returns
- Loan amortizations or remaining principal
- Budget or Jar remaining capacity
- Overdue status based on dates

All math is performed upstream by domain services (`modules/ledger`, `modules/savings`, `modules/plan`, etc.).

### Law 2: No Automatic Positive = Green Assumption

A positive number does not automatically mean "Income" or "Good", and a negative number does not automatically mean "Expense" or "Bad".

- A debt balance (liability) of `₫ 50.000.000` is a positive number mathematically, but renders in Crimson Rose (`--vn-debt`), not Emerald (`--vn-income`).
- A negative cash flow delta vs an overdue liability are completely different semantic concepts.
- The visual `tone` must be passed explicitly by the caller or determined by explicit domain prop mappings (`type="income" | "expense" | "transfer" | "debt"`).

### Law 3: Explicit Transaction Semantics (Transfer Invariant)

`Transfer ≠ Income` and `Transfer ≠ Expense`.

- Net household wealth is unchanged during an internal account transfer.
- `TransactionRow` must **NEVER** infer transaction type from the sign of an amount.
- `type` must be explicitly declared as:
  - `income`: Emerald (`--vn-income`), prefixed with `+`
  - `expense`: Slate (`--vn-expense`), prefixed with `−`
  - `transfer`: Sky Blue (`--vn-transfer`), prefixed with `⇄`
  - `refund`: Muted Olive / Slate (`--vn-refund`), prefixed with `↩` or `+`
  - `neutral`: Text Primary (`--vn-text-primary`), no prefix

### Law 4: Credit Liability ≠ Cash Asset

Available credit and outstanding balance on a credit card must never look like cash assets.

- `AccountRow` must explicitly distinguish `type="asset"` from `type="credit"`.
- Credit cards display current outstanding debt (`Nợ hiện tại`) and credit limit (`Hạn mức`), never an unqualified positive "balance".

### Law 5: Personal Lending Direction Invariant

Personal debt must always state explicit semantic direction in text:

- "Cho vay" (I lent / Asset to be recovered)
- "Đi vay" (I borrowed / Liability to be repaid)
- Direction must **NEVER** be encoded solely through red/green colors or arrow direction. A clear textual label is mandatory for accessibility and legal clarity.

### Law 6: Investment Calm Aesthetic Invariant

ViNha is a long-term household wealth tool, not a day-trading terminal.

- `InvestmentRow` must avoid neon green/red flashes, candlestick styling, or high-density trading tickers.
- Derived values (`quantity × price = marketValue`) must be calculated by the domain layer and passed ready for display.

### Law 7: Progress Clamping Invariant

- Progress bar visual indicators must **clamp at 100% of the track width**.
- An over-budget or over-target situation (>100%) must never visually overflow the track or clip outside the card.
- Overages are communicated via an explicit text badge or label (e.g. `Vượt ₫ 809.244 (108%)`).

### Law 8: Canonical Currency & Tabular Number Discipline

- All monetary amounts use Vietnamese Dong `₫` symbol with standard dot thousand separators (no decimals for VND).
- All numbers and monetary values use OpenType tabular numerals (`tabular-nums`) to prevent jitter during updates and ensure perfect vertical alignment in lists and tables.
- Central formatters (`formatCurrency`, `formatNumber`, `formatPercent` from `@/shared/i18n/formatters`) are reused; no ad-hoc `toLocaleString()` calls.
