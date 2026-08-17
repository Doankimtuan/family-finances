---
name: typescript-quality
description: Use the TypeScript type system to model domain constraints — discriminated unions, exhaustive handling, type guards, schema-derived types, avoiding any and unsafe casts. Use for any task that defines or consumes types, schemas, or domain state in this repository.
---

# TypeScript Quality

Exploit the type system instead of writing JavaScript-style condition-heavy
code. Prefer making invalid states unrepresentable.

Constraint:

```text
Do not create complex type-level programming when a simple explicit type
is clearer.
```

## Domain Modeling

Strongly prefer:

- discriminated unions
- literal unions (`type Direction = "income" | "expense"` via as-const objects
  per the constants policy)
- `as const`
- `satisfies`
- exhaustive checks
- `readonly` types where mutation is not intended
- `Record`, `Pick`, `Omit`, mapped and utility types
- generics only when they remove real duplication

Avoid:

- `any`
- unjustified `unknown as X`
- unnecessary type assertions
- generic `string` when a domain union is known
- anonymous string unions duplicating an existing domain concept
- large objects with many unrelated optional properties
- boolean flags representing mutually exclusive states

### Reusable Domain Unions

Never hand-write `"BANK" | "PLATFORM"` when the concept already exists as a
domain constant, type, enum, or Zod schema. Search the codebase first:

```ts
// BAD: anonymous duplicate of an existing domain concept
function familyIcon(family: "BANK" | "PLATFORM") { ... }

// BETTER: reuse the canonical as-const object and derived type
import { SavingsFamily, type SavingsFamily } from "../savings-constants";

function familyIcon(family: SavingsFamily) {
  return family === SavingsFamily.BANK ? BankIcon : SmartPhoneIcon;
}
```

Only define a new as-const object + derived type when no canonical definition
exists, and place it at the documented constants home.

## Model Membership, Don't Chain It

An equality chain over the same value means membership in a semantic
category. Model the category once as a typed set (or use `.includes()` when
inference stays clean) and give it the domain name:

```ts
const MATURITY_ATTENTION_STATES = new Set<MaturityPresentationState>([
  MaturityPresentationState.MATURED,
  MaturityPresentationState.MATURE_TODAY,
  MaturityPresentationState.ACTION_REQUIRED,
]);

function isMaturityAttention(state: MaturityPresentationState) {
  return MATURITY_ATTENTION_STATES.has(state);
}
```

Prefer lookup tables and handler maps (`Record<Variant, Handler>`) over
switch-like ternary chains and repeated branch logic. Do not extract
one-off comparisons that have no domain name.

## Model State, Don't Guard It

BAD — many fields optional, every consumer must re-validate:

```ts
type Operation = {
  type: string;
  quantity?: number;
  unitPrice?: number;
  amount?: number;
};
```

BETTER — each variant carries exactly its required data:

```ts
type Operation =
  | { type: "BUY"; quantity: number; unitPrice: number }
  | { type: "SELL"; quantity: number; unitPrice: number }
  | { type: "DIVIDEND"; amount: number };
```

The same applies to request/result state: prefer
`{ status: "loading" } | { status: "ready"; data } | { status: "failed"; error }`
over `{ data?; error?; isLoading: boolean; hasFailed: boolean }`.

## Exhaustive Handling

When switching over a union, make the switch exhaustive so adding a variant
becomes a compile error at every consumer:

```ts
function describe(operation: Operation): string {
  switch (operation.type) {
    case "BUY":
      return ...;
    case "SELL":
      return ...;
    case "DIVIDEND":
      return ...;
    default: {
      const unreachable: never = operation;
      throw new Error(`Unhandled operation: ${unreachable}`);
    }
  }
}
```

## Type Guards and Assertion Functions

Use user-defined type guards (`x is T`) and assertion functions
(`asserts x is T`) to validate external data once, at the boundary, instead of
scattering checks through call sites:

```ts
function isJarAllocation(value: unknown): value is JarAllocation {
  return ...;
}
```

## Schema-Derived Types

Zod is the source of truth for input shapes. Derive types from schemas instead
of hand-maintaining parallel interfaces:

```ts
const CreateJarSchema = z.object({ ... });
type CreateJarInput = z.infer<typeof CreateJarSchema>;
```

Share schemas between client and server where safe, and never duplicate Zod
constraints manually inside components.

## Nullable States

- Model absence explicitly with `T | null` or `T | undefined` — do not use
  sentinel values (`""`, `-1`, `"none"`).
- Narrow before use; avoid `!` non-null assertions except where invariants are
  locally obvious and documented.
- Prefer `??` and optional chaining over conditional pyramids.

## API / Result Types

Public module APIs (commands, queries) should communicate outcomes through
explicit result types (for example a typed `Result`/error-code union), not by
throwing for expected business failures. See the `error-handling` skill.

Expected failures must use a domain-owned error-code union rather than
`string`. Unexpected failures are boundary concerns: log them, then map them
to the safe public code. Keep one Result contract per repository convention;
do not create competing success/error shapes for the same flow.

## Casting Discipline

- `as X` is acceptable only for genuine, locally-provable invariants.
- Never cast to silence a type error you do not fully understand.
- Prefer fixing the source type, adding a guard, or an assertion function with
  a runtime check over a blind cast.

## Related Skills

- `code-quality` — structural quality baseline
- `form-architecture` — form schema usage
- `error-handling` — result and error-code types

## RHF field configuration

Declarative RHF field lists must use a discriminated union with
`FieldPathByValue<TValues, TValue>` (or an equivalent proven constraint), not
`name: string`. Use `satisfies` at call sites so literals remain narrow and an
incompatible primitive/path pair fails at compile time. Keep rendering
exhaustive and avoid unsafe dynamic component maps or casts.

Do not add generic prop bags or business callbacks to field configs. If a
control needs a workflow callback, cross-field mutation, or a type assertion
to compile, keep that control as direct RHF JSX.
