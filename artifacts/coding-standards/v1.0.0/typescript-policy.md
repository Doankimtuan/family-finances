---
document: TypeScript Policy
coding_standards: v1.0.0
status: OFFICIAL_CODING_STANDARDS
run_id: run_coding_standards_20260802T150000Z
created_at: 2026-08-02T15:05:00Z
board: Engineering Standards Board
frozen: true
constitution_sot: artifacts/developer-constitution/CURRENT
---

# TypeScript Policy

This document adds Staff-Engineer detail on top of the Constitution's `coding-standards.md` TypeScript section (strict mode, no `any` — unchanged and restated here for completeness).

## No `any` — zero tolerance

`any` (explicit or via an untyped third-party surface leaking through) is forbidden anywhere in `app/`, `modules/`, `shared/`. The repository currently has **zero** occurrences outside `archive/legacy-v1` — this is a hard floor, not an aspiration.

- If a third-party type is genuinely unknown, use `unknown` and narrow with a type guard or Zod `.parse()` before use — never cast `as any` to silence the compiler.
- `unknown` casts require a local, justified narrowing (a type guard, a Zod schema, or an `instanceof`/discriminant check) immediately at the cast site — never a bare `as SomeType` on an `unknown`/`any` value without a runtime check.

## Prefer inference over explicit annotation for locals

Let TypeScript infer local variable and simple return types. Add explicit types at **boundaries**: exported function signatures, component props, DTOs, domain models, and Zod-inferred types.

```ts
// Good — inferred locally, explicit at the boundary
export function mapAccountRow(row: AccountRow): LedgerAccount { ... }
const balance = typeof row.opening_balance === "string" ? Number(row.opening_balance) : row.opening_balance;

// Avoid — redundant annotation that only repeats what's inferred
const balance: number = typeof row.opening_balance === "string" ? Number(row.opening_balance) : row.opening_balance;
```

## Discriminated unions for result/state types

Every function that can fail must return a discriminated union with a literal tag (`status`, `ok`, `kind`) rather than throwing for expected failure paths or returning `null`/`undefined` with no error context.

```ts
type UpdateTransactionResult =
  | { ok: true; transactionId: string }
  | { ok: false; code: TransactionErrorCode };
```

This is already the dominant pattern (`mutate-actions.ts`, `record-transaction.ts`) — keep it universal across new commands/queries.

## `Readonly` and immutability

- Domain models and DTOs that are not mutated after construction should be `Readonly<T>` or use `as const` at the definition site.
- Prefer returning new arrays/objects (`.map`, spread) over in-place mutation, matching the existing `applyTransactionDeltas` pattern (`byId.set` on a fresh `Map` copy).

## Utility types over hand-rolled duplicates

Prefer `Pick`, `Omit`, `Partial`, `Required`, `Record`, `Extract`, `ReturnType`, `Awaited` over manually re-declaring a near-identical shape. If two types differ by 1-2 fields, derive one from the other with a utility type instead of copy-pasting the object literal type.

## Zod as the single validation source of truth

Every external input boundary (Server Action, route handler, form) validates through a Zod schema. The inferred TypeScript type (`z.infer<typeof schema>`) is the type used everywhere that value flows — do not hand-write a parallel interface for the same shape.

## Review gate

- Any `any` fails review.
- Any `as` cast on `unknown`/`any` without an adjacent runtime narrowing fails review.
- A new hand-written type that duplicates a `z.infer<...>` shape already available fails review — import the inferred type instead.
