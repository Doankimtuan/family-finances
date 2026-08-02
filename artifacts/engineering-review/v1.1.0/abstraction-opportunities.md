# Abstraction Opportunities

## Justified (apply in Pattern v1)

| Abstraction | Why |
|-------------|-----|
| `StatusAlert` | Alert compound ×4 |
| `FormField` + `TextField` | Expected form standard; login field stack ×2; E02-003 imminent |
| `ChromeShell` | Auth/product layouts share shell |
| `AuthScreenShell` | Repeated auth column layout |
| Share `signInInputSchema` | Dual Zod sources |
| Button default `min-h-11` | Touch target repeated ×12 |
| Confirm → `LoadingState` | Dead inventory + spinner duplication |
| Barrel export ProductStub / LocaleSwitcher | DX |

## Speculative (reject)

CurrencyField, NumberField, AmountField, MonthPicker, DateField, CheckboxField, SwitchField, FormPage/ListPage/DetailPage/SettingsPage, ConfirmDialog, useAsyncAction, useConfirm, usePermission, MetricCard, SummaryCard, Permission Guard hooks, FormProvider mega-kit.

## Watchlist (after E02-003)

- `useFormSubmit` / `useActionTransition` if ≥3 async forms
- Wire `createZodErrorMap` when multiple RHF forms share validation i18n

## Round 2 candidates (Coding Standards audit, not yet applied)

These are **findings only** — Rule of Three is already met for each, but extraction requires a design-system-adjacent decision (component API, variant naming) that this board does not make unilaterally. Raise each as its own Story against `shared/ui` / `shared/patterns`, obeying [Coding Standards / react-patterns.md](../../coding-standards/CURRENT/react-patterns.md) and [tailwind-policy.md](../../coding-standards/CURRENT/tailwind-policy.md) when implemented.

| Abstraction | Why | Trigger already met? |
|-------------|-----|----------------------|
| `LinkButton` (or `Button` polymorphic `as={Link}`) | ~15 files repeat the same CTA/link class chain | Yes |
| `SegmentedControl` | Direction/category chip-toggle groups duplicated across capture + edit forms (and `ThemeToggle`'s own segmented control shares the same shape) | Yes |
| `TransactionFormFields` shared shell | Capture (298) and edit (394) forms share account/tag/jar sub-sections | Yes, but blocked on reconciling create-vs-edit state machines (see Coding Standards `audit-report.md` item 1) |
| `formatSignedAmount(transaction, locale)` in `shared/i18n/formatters.ts` | 4 call sites build the identical signed-currency string | Yes |
| `TransactionDirection` / `AccountType` as shared `as const` objects feeding both Zod and UI | Currently 3 independent declarations per concept | Yes, but requires a DB `CHECK` constraint cross-check before merge (money-path caution, BR-15-adjacent) |

## Explicitly not extracted this freeze

Per `ai-agent-rules.md` ("never create duplicate components or utilities" cuts both ways — do not invent new shared components speculatively either), the five items above are recorded as **candidates**, not applied. This board's mandate is Coding Standards + safe mechanical refactors; component/variant design is Engineering Review's own future cycle.
