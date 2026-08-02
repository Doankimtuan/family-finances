# Reusable Form Patterns — Pattern v1

## Contract

Screens provide: `name`, `label`, validation schema (shared where domain-owned), props (`type`, `autoComplete`).

`FormField` / `TextField` own: RHF registration wiring helpers, label, required mark hook, error message, `aria-invalid` / `aria-describedby`, disabled, token spacing, `min-h-11` input.

## Pattern v1 surface

```
shared/ui/form/
  form-field.tsx
  text-field.tsx
  index.ts
```

## Deferred

NumberField, CurrencyField, TextareaField, SelectField, SwitchField, CheckboxField, DateField, MonthPickerField, AmountField, FormProvider suite — wait for ≥3 real consumers.

## Schema

Domain schemas live in application modules (e.g. `signInInputSchema`). UI imports; does not redefine.
