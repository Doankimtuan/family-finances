# Formatting Rules

## Locale tags

| App locale | Intl tag |
|------------|----------|
| `en` | `en-US` |
| `vi` | `vi-VN` |

Mapped by `toIntlLocale()` in `i18n/locales.ts`.

## APIs

### Pure helpers (`shared/i18n/formatters.ts`)

- `formatCurrency(amount, currencyCode, locale?)`
- `formatNumber(value, locale?, options?)`
- `formatPercent(value, locale?, options?)`
- `formatDate(value, locale?, options?)`
- `formatTime(value, locale?, options?)`
- `formatRelativeTime(value, unit, locale?, options?)`

Pass **major** currency units (not minor/cents) unless a later money module defines otherwise.

### Client hook

`useAppFormatter()` binds the above to `useLocale()`.

### next-intl formatters

Prefer `useFormatter()` / `getFormatter()` from next-intl when formatting inside message-rich UI; use `shared/i18n/formatters` for non-React / shared utils.

## Pluralization

Use ICU plural syntax in catalogs (see `common.itemsCount`). Do not branch on count in components when a message can express it.

## Money display (future)

- Tabular nums via existing Text `tabular` prop
- Currency code from household settings when available
- Never invent unlabeled “Balance” copy (Design System anti-pattern)
