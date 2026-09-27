# ViNha Component System — Form Inputs & Financial Entry

## 1. Input Architecture & Form Anatomy

All input components in ViNha share a standardized, accessible form field structure:

```text
[1. Field Label]                     [Optional / Required Mark]
┌─────────────────────────────────────────────────────────────┐
│ [2. Icon] [3. Prefix]   [4. Input Value]   [5. Suffix/Ctrl] │
└─────────────────────────────────────────────────────────────┘
[6. Helper Text / Vietnamese Spoken Text]    [7. Error Message]
```

### Component Tokens

- **Container Height**: 48px (Standard form field) / 64px (Hero financial entry).
- **Corner Radius**: 10px (`--vn-radius-control`).
- **Border**: 1px solid `--vn-border` (Resting), 2px solid `--vn-primary` (Focus), 1.5px solid `--vn-debt` (Error).
- **Font Size**: 16px body on mobile to prevent automated iOS viewport zoom; 14px secondary helper.

---

## 2. Text Input (`<TextInput>`)

Standard single-line alphanumeric data entry for notes, counterparty names, account labels, and email addresses.

### States

1. **Default (Empty)**:
   - Border: `1px solid var(--vn-border)`.
   - Background: `var(--vn-surface)`.
   - Placeholder text: `var(--vn-text-muted)` (400 weight).
2. **Hover**:
   - Border: `1px solid var(--vn-text-secondary)`.
3. **Focus**:
   - Border: `2px solid var(--vn-border-focus)`.
   - Outline: None (the border serves as the focus ring).
4. **Filled**:
   - Text color: `var(--vn-text-primary)` (500 weight).
5. **Error**:
   - Border: `1.5px solid var(--vn-debt)`.
   - Error message below input: 12px red text with alert-circle icon.
6. **Disabled**:
   - Opacity: 0.45; Background: `var(--vn-surface-subtle)`; cursor: `not-allowed`.
7. **Read-only**:
   - Opacity: 1.0; Background: `var(--vn-surface-subtle)`; Border: `1px solid var(--vn-border)`; trailing lock icon.

---

## 3. Financial Currency Input (`<CurrencyInput>`)

ViNha's premier transaction and balance entry component. Built for rapid, zero-error VND entry.

### Core Features

1. **Tabular Numerals**: Strict `font-variant-numeric: tabular-nums` for alignment.
2. **Vietnamese Number Pronunciation Preview**: Real-time Vietnamese speech translation below the input to eliminate zero-counting errors (e.g. typing `25000000` renders: _"Hai mươi lăm triệu đồng"_).
3. **Quick Multiplier Chips**: Standard horizontal pills (`+50k`, `+100k`, `+500k`, `+1M`, `Làm tròn`) placed immediately above or below the numeric keypad.
4. **Hero Mode**: 32px display font, centered or left-aligned, auto-formatting thousand separators (`₫ 25.000.000`).

### Stress Testing & Large Values

- `₫ 0`: Valid zero entry.
- `₫ 500.000`: Common daily expense.
- `₫ 999.999.999`: High-net-worth transaction.
- `₫ 12.000.000.000`: Multi-billion VND real estate or portfolio tracking.
- _Layout Rule_: When the formatted string exceeds 12 characters, font size scales gracefully from 32px to 24px to prevent horizontal clipping.

---

## 4. Quantity Input (`<QuantityInput>`)

Engineered for Investment holdings (stocks, fund certificates, crypto tokens).

### Specifications

- **Number Parsing**: Supports integers and decimals up to 4 places (e.g. `1.250,5` CCQ).
- **Embedded MAX Action**:
  - Trailing pill button labeled `Tối đa` (MAX).
  - Tapping fills the field with total available holdings or maximum allowable allocation.
  - Provides instant tactile haptic feedback.
- **Unit Suffix**: Explicit unit label (e.g. `cổ phiếu`, `CCQ`, `chỉ vàng`).

---

## 5. Percentage Input (`<PercentageInput>`)

Used for interest rates (savings/loans) and investment yields.

### Specifications

- **Unit Suffix**: Explicit compounding period:
  - `% / năm` (Annual percentage rate)
  - `% / tháng` (Monthly interest rate)
- **Formatting**: Localized decimal separator (comma `,` e.g. `6,5% / năm`).
- **Validation**: Enforces non-negative values; warns if annual rate exceeds 30%.

---

## 6. Number Input (`<NumberInput>`)

Used for non-currency numeric quantities such as loan tenure (months), reminder days, or payment installments.

### Specifications

- **Alignment**: Right-aligned or left-aligned with explicit suffix (e.g. `12 tháng`, `30 ngày`).
- **Keyboard**: Triggers `inputmode="numeric"`.

---

## 7. Search Input (`<SearchInput>`)

Used across Inbox, Accounts, and Institution selectors.

### Specifications

- **Height**: 44px.
- **Radius**: 10px (or 9999px pill when used as a filter bar).
- **Leading Slot**: 20px magnifying glass glyph (`search`).
- **Trailing Slot**: Interactive `×` clear button that appears only when text is present. Tapping clears text and preserves focus.
- **Debounce**: 200ms debounce on keystroke to avoid UI jank during live filtering.

---

## 8. Date Input & Date Picker (`<DateInput>`)

Used for transaction dates, maturity dates, and loan start dates.

### Specifications

- **Display Format**: Strict `DD/MM/YYYY` (Vietnamese chronological standard).
- **Trailing Slot**: Calendar icon glyph (`calendar`).
- **Interaction**:
  - Tapping triggers the accessible calendar popover or native date picker.
  - Selected date displays in high-contrast tabular numerals.
- **Quick Shortcuts**: Tonal chips for `Hôm nay` (Today) and `Hôm qua` (Yesterday) for fast logging.

---

## 9. Textarea (`<Textarea>`)

Used for transaction descriptions, loan notes, and household policy context.

### Specifications

- **Min Height**: 84px (approx. 3 rows).
- **Corner Radius**: 10px.
- **Auto-Grow**: Expands smoothly as user types up to 6 rows, then enables internal scrolling.
- **Character Counter**: Subtle `label-sm` counter in bottom-right corner (e.g. `45 / 200 ký tự`).
