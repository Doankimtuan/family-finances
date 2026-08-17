# Form Architecture Standard

Status: CURRENT · Established 2026-08 · Applies to every form in `app/` that
captures user input, now and during future form migrations.

Reference implementations (copy these shapes):

- `app/[locale]/(auth)/login/login-screen.tsx`
- `app/[locale]/(auth)/register/register-screen.tsx`
- `app/[locale]/(auth)/forgot-password/forgot-password-screen.tsx`
- `app/[locale]/(product)/plan/jars/reallocate-jar-form.tsx`

---

## 1. State ownership

Every value in a form belongs to exactly one owner:

| Kind                | Owner                                                |
| ------------------- | ---------------------------------------------------- |
| Submitted form data | React Hook Form (`useForm`)                          |
| Validation          | Zod schema via `zodResolver`                         |
| UI-only state       | `useState` (sheet open, step index, pending flags)   |
| Derived values      | computed during render from `useWatch` values        |
| Server state        | server action results / router refresh              |
| Business math       | pure functions in `modules/<bc>/application`         |

Never mirror an RHF field into `useState`. Never derive one form field from
another with `useEffect`. If a form field needs to drive a preview, compute the
preview during render from `useWatch` values (see `previewAmount` in
`jar-configuration-form.tsx` for the intent — during migration it moves from
`useState`+`useMemo` to `useWatch` + render-time derivation).

## 2. Schema ownership

```text
canonical client-safe Zod schema (modules/<bc>/application/<feature>.schema.ts)
        ↓ reused by            ↓ reused by        ↓ reused by
client resolver          server action       unit tests
```

- Schemas live with the module application layer and must stay client-safe
  (no `server-only` imports; see `configure-jar.schema.ts` for the pattern).
- Types come from `z.infer`; never hand-maintain a parallel form type.
- Form-only fields (confirm password, terms acceptance, warning
  acknowledgement) extend the module schema at the form:
  `signInInputSchema.extend({ remember: z.boolean() })`.
- Enum/option lists use the `*_VALUES` arrays from the domain constants files
  (no-magic-strings law).
- Constraint messages are domain error-code constants or i18n message keys
  (e.g. `message: PLAN_ACTION_ERROR_CODE.SAME_JAR`), so field errors and
  server errors share one translation namespace.
- Client and server never re-implement the same constraint by hand. The server
  action revalidates with the same schema; the client resolver is the first
  gate, not a different one.

Forbidden (seen in current product forms):

```ts
// Discards all field-level errors into one generic banner.
if (!schema.safeParse(input).success) {
  setErrorCode(PRODUCT_ACTION_ERROR_CODE.INVALID);
  return;
}
```

The resolver already produces per-field errors; use them.

## 3. Default values

- `defaultValues` are always explicit and come from a pure factory, not from
  module-level mutable objects:

```tsx
function createDefaultValues(props: Props): FormValues {
  return { name: "", targetId: props.targets[0]?.id ?? "", amount: undefined };
}

const form = useForm<FormValues>({
  resolver: zodResolver(formSchema),
  defaultValues: createDefaultValues(props),
});
```

- Numeric fields default to `undefined`/`null`, never `""`. Money, percent,
  and quantity values are numbers at every layer; only display strings are
  formatted (`AmountField`, `MoneyInput` return numeric values — UI
  Constitution).
- Server-provided initial values (edit forms) flow through the same factory:
  `createDefaultValues(fromEntity(entity))`.

## 4. Field integration: `register` vs `Controller`

Default is `register`. Use `Controller` / `useController` only when the control
genuinely requires controlled integration — which in this codebase means the
shared HeroUI-backed fields with value/onChange contracts:

| Shared field                        | Integration        |
| ----------------------------------- | ------------------ |
| `TextField`, `AuthTextField`        | `registration={register(name)}` |
| `CheckboxField`                     | spread `{...register(name)}`    |
| `AmountField`                       | `Controller` (`number \| null` / `onValueChange`) |
| `MoneyInput`                        | `Controller` (controlled numeric only — never `register`) |
| `NumberField`, `SelectField`        | `Controller`      |
| `DatePickerField`, `TimeField`      | `Controller`      |

`MoneyInput` has no `registration` prop by design: formatted display strings
must never enter form state.

Do not wrap `register` fields in `Controller` "for consistency" — that is
noise. Do not hand-roll native `<select>` + label + error markup
(`reallocate-jar-form.tsx` predates `SelectField`; migrating it is part of its
next touch).

## 5. Watching values

- `useWatch({ control, name })` at the component that needs the value —
  focused subscriptions only.
- Avoid whole-form `watch()`; it rerenders on every keystroke.
- Derived previews (allocation totals, remaining capacity, disposal P&L) are
  computed during render from watched values, with the math delegated to
  `modules/<bc>/application` pure functions.

## 6. `FormProvider` + `useFormContext`

Introduce only when field subtrees are extracted into child components that
would otherwise receive `form` (or many field props) by drilling — e.g. a
multi-section wizard step. Small and medium forms keep the destructured
`useForm` return in one component. Not needed for `<Controller>`; `Controller`
takes `control` directly.

## 7. Reset and reopen behavior

Create/action forms are ephemeral (UI Constitution): closing a sheet/modal
discards unsaved state, hidden values, and errors. Achieve this structurally,
not with reset cascades:

- **Render-on-open / keyed remount**: `{open && <Form key={entityId ?? "create"} … />}`
  — reopening re-runs the pure defaults factory. This is the default pattern.
- **Successful create that stays open** (rare): `reset()` with no arguments —
  returns to `defaultValues`. Never re-list the defaults inline.
- **Successful edit**: `router.refresh()` (and/or navigate); the server is the
  source of truth for the next open.
- **Server-provided initial values change while mounted**: key the form by the
  entity id so remount produces fresh defaults; avoid `useEffect` reset
  chains.
- The one sanctioned `useEffect` + `setValue` pattern is syncing an external
  system (e.g. remembered email from `localStorage` in `login-screen.tsx`).

## 8. Submission and server results

Canonical block (all four reference forms):

```tsx
const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
const [isPending, startTransition] = useTransition();

const onSubmit = handleSubmit((values) => {
  setErrorCode(null);
  if (!online) {
    setErrorCode(CLIENT_ACTION_ERROR_CODE.OFFLINE);
    return;
  }
  startTransition(async () => {
    const result = await someAction(payload);
    if (result.status === "success") {
      // per-form success: reset / navigate / receipt / refresh
      return;
    }
    setErrorCode(result.code);
  });
});
```

- **No generic `useServerAction` hook.** Decision (2026-08 audit): all 48
  action-calling client files use the same `useTransition` dance, but the
  success branches differ per form (navigate vs receipt vs toast vs
  confirm-step vs callback), the error-code unions differ per module, and two
  modules still use an `ok:` discriminator. A shared hook would only wrap the
  two-line pending/error scaffolding while forcing generics over divergent
  success semantics. Revisit only if a third of call sites converge on
  identical success handling.
- Prefer migrating the remaining `ok:`-contract modules (investments, ritual)
  to the dominant `status: "success" | "error"` + `code` contract during their
  form migrations, using `ProductActionStatus` — new actions must use the
  `status` contract.
- Result types stay per-action (they describe different success payloads);
  only the status constant and error-code unions are shared
  (`product-action-error.ts`).
- Optimistic/rollback behavior lives in the command layer, never in the form.

## 9. Error presentation

One failure has one presentation. Field-level and form-level errors coexist
but never duplicate:

| Layer                    | Source                         | Presentation                          |
| ------------------------ | ------------------------------ | ------------------------------------- |
| Field validation         | `formState.errors[name]`       | field's `error` prop (message = i18n key / error-code constant) |
| Action/domain failure    | `errorCode` state              | one `StatusAlert` with `t(\`errors.${code}\`)` |
| Client-side gate failure | `CLIENT_ACTION_ERROR_CODE.*`   | same single `StatusAlert` slot       |
| Unexpected failure       | typed `UNKNOWN` code           | same slot; never a second generic banner |

Rules:

- `errorCode` is cleared at submit start; there is at most one form-level
  alert (see `capture-transaction-form-error.test.tsx` for the regression
  contract).
- Mapping an RHF error to a message by position
  (`errors.email ? tValidation("invalidEmail")`) is acceptable only while a
  field has exactly one possible rule; when a field has several rules the
  schema message itself is the key.
- Never branch error handling on `error.message` string matching; codes only.

## 10. Migration guidance

When migrating a `useState`-heavy product form (current anti-patterns: 7–20
`useState` fields, stringly-typed numbers, `safeParse(...).success` discarding
field errors, no field errors at all, no reset story):

1. Extract/confirm the client-safe schema in `modules/<bc>/application`.
2. Build `createDefaultValues(props)` and mount the form with `useForm` +
   `zodResolver`.
3. Move each field to `register` or `Controller` per §4; numbers become
   numbers.
4. Move cross-field derivations to `useWatch` + render-time computation.
5. Replace manual validation branches with schema issues (error-code
   messages) so field errors exist.
6. Adopt the §7 reset/reopen pattern and the §8 submission block.
7. Keep one `errorCode` + `StatusAlert`; delete per-failure competing banners.

Recommended pilot (next task): `plan/jars/jar-configuration-form.tsx` — its
schema (`configure-jar.schema.ts`) is already extracted, and it exhibits every
anti-pattern above at moderate size (11 `useState` fields, string percent,
discarded field errors) with existing unit coverage
(`tests/unit/plan-jar-configuration.test.ts`).
