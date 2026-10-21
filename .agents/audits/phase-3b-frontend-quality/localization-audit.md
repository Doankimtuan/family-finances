# F5 — Localization Quality Audit & Display-Time Resolution

## 1. Issue Overview & Investigation

The audit identified system-generated savings transaction text appearing in Vietnamese even when the UI locale was set to English:

- **Observed**: `Gửi tiết kiệm: Vietcombank`
- **Expected (English)**: `Savings deposit: Vietcombank`
- **Expected (Vietnamese)**: `Gửi tiết kiệm: Vietcombank`

### Root Cause Analysis

Investigation revealed that the source of the Vietnamese text was not a hardcoded React string or a missing client-side translation key, but the database stored procedures themselves:

- PostgreSQL migration functions (such as `create_saving`, `early_settle_saving`, `settle_saving`) concatenated hardcoded Vietnamese strings directly into the `transactions.note` column:
  - `'Gửi tiết kiệm: ' || p_product_name`
  - `'Tiền gửi tiết kiệm: ' || ...`
  - `'Lãi tiết kiệm: ' || ...`
  - `'Rút trước hạn: ' || ...`
- The presentation layer across the transaction list, recent activity, and transaction detail screens rendered `transaction.note` raw without display-time localization.

### Architectural Constraints & Boundaries

Per the ViNha Agent Ownership Rules:

1. **Frontend & UX Owner (Antigravity)** cannot modify Supabase migrations, PostgreSQL RPCs, ledger mutations, or historical financial records.
2. Historical financial records must never be rewritten or modified simply to change display language.
3. User-entered notes must strictly remain intact and never be translated or mutated.
4. Display-time localization must cleanly detect and translate system-generated metadata while leaving custom user notes untouched.

---

## 2. Implementation: Display-Time Note Localization

We introduced a dedicated display-time localization helper:
[`shared/i18n/localize-transaction-note.ts`](file:///Users/doantuan/Desktop/Plan/family-finances/shared/i18n/localize-transaction-note.ts)

### Architecture of `localizeTransactionNote`

1. **Structured Metadata Resolution**:
   - Inspects `savingsEventKind` from transaction metadata:
     - `SAVINGS_PRINCIPAL_PLACEMENT`: Placed deposit
     - `SAVINGS_PRINCIPAL_RETURN`: Returned deposit
     - `SAVINGS_INTEREST`: Interest payout
     - `SAVINGS_TAX`: Interest tax withholding
     - `SAVINGS_FEE`: Penalty or fee
   - Injects the localized product name or provider name via catalog.

2. **Historical String Pattern Matching**:
   - Matches known historical Vietnamese and English prefix patterns:
     - `Gửi tiết kiệm:` / `Fund saving:` / `Saving funded:`
     - `Tiền gửi tiết kiệm:`
     - `Rút trước hạn:` / `Early withdrawal:`
     - `Lãi tiết kiệm:` / `Savings interest:`
     - `Thuế lãi:` / `Interest tax:`
     - `Phí/phạt:` / `Fee/penalty:`
   - Preserves product and provider names while localizing the action prefix according to the active locale.

3. **Strict User-Note Protection**:
   - If the note does not match a system pattern or structured metadata, it is returned completely unaltered.
   - User custom descriptions are never modified.

### Catalog Parity

Added the `systemNotes` namespace to both message catalogs with 100% key parity:

- [`messages/en/catalog.json`](file:///Users/doantuan/Desktop/Plan/family-finances/messages/en/catalog.json)
- [`messages/vi/catalog.json`](file:///Users/doantuan/Desktop/Plan/family-finances/messages/vi/catalog.json)

Keys added:

- `savingsDeposit`: "Savings deposit: {product}" / "Gửi tiết kiệm: {product}"
- `savingsReturn`: "Savings return: {product}" / "Nhận tiền tiết kiệm: {product}"
- `savingsInterest`: "Savings interest: {product}" / "Lãi tiết kiệm: {product}"
- `savingsTax`: "Interest tax: {product}" / "Thuế lãi tiết kiệm: {product}"
- `savingsFee`: "Savings fee: {product}" / "Phí tiết kiệm: {product}"
- `savingsEarlyWithdrawal`: "Early withdrawal: {product}" / "Rút tiết kiệm trước hạn: {product}"

### Presentation Call Sites Updated

All transaction presentation layers were wired to use `localizeTransactionNote`:

1. [`app/[locale]/(product)/money/transactions/transactions-list-presentations.ts`](<file:///Users/doantuan/Desktop/Plan/family-finances/app/[locale]/(product)/money/transactions/transactions-list-presentations.ts>): Localizes `activityTitle` and `activitySubtitle`.
2. [`app/[locale]/(product)/money/transactions/transactions-activity-list.tsx`](<file:///Users/doantuan/Desktop/Plan/family-finances/app/[locale]/(product)/money/transactions/transactions-activity-list.tsx>): Formats transaction item rows.
3. [`app/[locale]/(product)/home/home-recent-activity.tsx`](<file:///Users/doantuan/Desktop/Plan/family-finances/app/[locale]/(product)/home/home-recent-activity.tsx>): Formats Home recent transactions.
4. [`app/[locale]/(product)/money/transactions/[id]/page.tsx`](<file:///Users/doantuan/Desktop/Plan/family-finances/app/[locale]/(product)/money/transactions/[id]/page.tsx>): Formats transaction detail header context title and note fact rows.
5. [`app/[locale]/(product)/money/accounts/[id]/page.tsx`](<file:///Users/doantuan/Desktop/Plan/family-finances/app/[locale]/(product)/money/accounts/[id]/page.tsx>): Formats account activity notes.
6. [`app/[locale]/(product)/plan/jars/jar-recent-activity.tsx`](<file:///Users/doantuan/Desktop/Plan/family-finances/app/[locale]/(product)/plan/jars/jar-recent-activity.tsx>): Formats Jar activity notes.

---

## 3. Verification & Evidence

### Automated Unit Tests

1. [`tests/unit/localize-transaction-note.test.ts`](file:///Users/doantuan/Desktop/Plan/family-finances/tests/unit/localize-transaction-note.test.ts) (8 tests):
   - Structured `savingsEventKind` translation to English and Vietnamese.
   - Historical Vietnamese prefix `Gửi tiết kiệm: Vietcombank` translates to `Savings deposit: Vietcombank` in EN.
   - Historical Vietnamese prefix `Rút trước hạn: Techcombank` translates to `Early withdrawal: Techcombank` in EN.
   - Historical Vietnamese prefix `Lãi tiết kiệm: MB Bank` translates to `Savings interest: MB Bank` in EN.
   - Passthrough verification: User-entered notes (`Ăn trưa bạn bè`, `Monthly rent payment`) remain strictly untouched.
   - Fallback verification without catalog translator function.
2. [`tests/unit/transactions-list-presentations.test.ts`](file:///Users/doantuan/Desktop/Plan/family-finances/tests/unit/transactions-list-presentations.test.ts) (10 tests):
   - Full presentation view-model testing with English and Vietnamese catalogs.
   - Activity title and subtitle localization verified.
3. [`tests/unit/i18n-messages.test.ts`](file:///Users/doantuan/Desktop/Plan/family-finances/tests/unit/i18n-messages.test.ts) (3 tests):
   - Full message key parity confirmed between `messages/en/` and `messages/vi/`.

### Real Browser Verification

- Navigated to `/en/money/transactions`, `/vi/money/transactions`, `/en/home`, and `/vi/home` in Chromium.
- Confirmed language switcher operates cleanly and system-generated savings notes reflect the chosen locale.
- Confirmed currency formatting (VND), date formatting, and units align with locale standards.

---

## 4. Verdict

**F5 status: FIXED IN TEST & VERIFIED IN BROWSER.**
System-generated savings notes render in natural English under `en` and natural Vietnamese under `vi`, historical database records remain untampered, and user-entered notes are strictly preserved.
