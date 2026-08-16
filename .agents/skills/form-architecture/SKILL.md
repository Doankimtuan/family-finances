---
name: form-architecture
description: React Hook Form + Zod form architecture — form state ownership, register/Controller/FormProvider usage, shared schemas, and the form/UI/server/derived state distinction. Use for any task that creates or modifies forms, form fields, validation, or mutation payloads.
---

# Form Architecture

This project uses React Hook Form + Zod (`@hookform/resolvers`). Shared form
primitives own labels, descriptions, validation messages, disabled state, and
accessible relationships (UI Constitution in `AGENTS.md`).

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

- `register` for simple inputs
- `Controller` / `useController` for HeroUI and shared controlled fields
- `useWatch` for cross-field derived values (allocation totals, remaining
  capacity)
- `FormProvider` + `useFormContext` instead of drilling `form` props through
  field subtrees
- `zodResolver` with the module's schema

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

## Related Skills

- `code-quality`, `typescript-quality` — always apply
- `react-quality` — component structure
- `error-handling` — mutation result contracts
