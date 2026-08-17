---
name: form-architecture
description: React Hook Form + Zod form architecture — form state ownership, register/Controller/FormProvider usage, shared schemas, and the form/UI/server/derived state distinction. Use for any task that creates or modifies forms, form fields, validation, or mutation payloads.
---

# Form Architecture

This project uses React Hook Form + Zod (`@hookform/resolvers`). Shared form
primitives own labels, descriptions, validation messages, disabled state, and
accessible relationships (UI Constitution in `AGENTS.md`).

Canonical standard (full detail — reset/reopen, submission, error
presentation, migration steps):
`artifacts/current/architecture/architecture-decisions/form-architecture.md`.

## State Ownership

```text
React Hook Form owns submitted form state.
```

Never duplicate RHF field values into `useState`. Distinguish:

```text
form state     -> RHF (values, errors, dirty, touched)
UI state       -> local useState (sheet open, step index)
server state   -> mutation/query results (TanStack Query / action results)
derived state  -> computed from the above during render (useWatch)
```

## RHF APIs to Prefer

- `register` for simple inputs (`TextField`, `AuthTextField`, `CheckboxField`)
- `Controller` / `useController` for shared controlled fields with
  value/onChange contracts (`AmountField`, `MoneyInput`, `NumberField`,
  `SelectField`, `DatePickerField`, `TimeField`)
- `useWatch` for cross-field derived values (allocation totals, remaining
  capacity); never whole-form `watch()`
- `FormProvider` + `useFormContext` instead of drilling `form` props through
  field subtrees
- `zodResolver` with the module's schema

`MoneyInput` is controlled-numeric only (no `registration` prop): formatted
display strings must never enter form state.

```tsx
const form = useForm<CreateJarInput>({
  resolver: zodResolver(createJarSchema),
  defaultValues: canonicalDefaults(), // fresh defaults each mount
});
```

## Ephemeral Create Forms

Create/action forms are ephemeral by default (UI Constitution): closing the
sheet/modal discards unsaved state, conditional hidden values, preview state,
and errors. Reopening starts from canonical fresh defaults — so `defaultValues`
must come from a pure factory, not from module-level mutable objects. Edit
forms reopen from persisted data, never from abandoned local edits.

## Schema Rules

- Zod schemas live with the module application layer and are shared between
  client and server where safe; Server Actions validate with the same schema.
- Derive types with `z.infer`; do not hand-maintain parallel form types.
- Never manually duplicate Zod constraints inside components (e.g. re-checking
  `max` in a handler or message that the resolver already enforces).
- Enum/option lists must share the as-const `*_VALUES` arrays from the domain
  constants files (no-magic-strings law).

```ts
export const CreateJarSchema = z.object({
  direction: z.enum(TRANSACTION_DIRECTION_VALUES),
  allocationPercent: z.number().min(0).max(MAX_JAR_ALLOCATION_PERCENT),
});
export type CreateJarInput = z.infer<typeof CreateJarSchema>;
```

## Submission

- `handleSubmit` wraps the mutation call; the component maps the typed result
  to UI feedback (toast/inline error). Business validation outcomes arrive as
  values, not exceptions (see `error-handling`).
- Submission uses `useTransition` + `startTransition` with one `errorCode`
  state and a single `StatusAlert` (canonical block in the standard).
- No generic `useServerAction` hook (2026-08 audit: per-form success
  semantics diverge — navigate vs receipt vs toast vs confirm step).
- Keep optimistic/rollback behavior in the command layer.
- Never persist formatted display strings (money, percentages) as form output
  values — `MoneyInput`/`AmountField` return numeric values (UI Constitution).

## Common Smells

- `useState` mirroring a watched field (use `useWatch` or RHF get/set APIs)
- `useEffect` reacting to form values to derive another form value (compute in
  render or via resolver)
- per-field `formState.errors` re-implemented in local state
- validation constants (max lengths, thresholds) duplicated in messages,
  schemas, and components

## Controlled field adapter

When multiple forms repeat `useController`/`Controller` plus value conversion,
error presentation, IDs, and a shared field primitive, use the typed adapter in
`shared/patterns/controlled-fields.tsx`. Describe compatible fields with
`ControlledFieldConfig<TValues>[]` and `satisfies`; keep `FieldPathByValue`
constraints intact. This is a thin RHF-to-UI adapter, not a schema-driven form
engine. Keep direct JSX for composite controls, dynamic arrays, and fields with
workflow side effects.

Do not recreate local `number`, `select`, or `date` render helpers when the
adapter already covers the same wiring.

Never weaken a field path or value type to fit an unusual control into the
adapter. Keep composite money/currency controls, field arrays, multi-field
selectors, and workflow-specific interactions in direct JSX/RHF. Split large
config lists by semantic form section; the adapter is not a validation,
visibility, layout, or action engine.

## Related Skills

- `code-quality`, `typescript-quality` — always apply
- `react-quality` — component structure
- `error-handling` — mutation result contracts
