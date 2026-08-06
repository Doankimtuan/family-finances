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
