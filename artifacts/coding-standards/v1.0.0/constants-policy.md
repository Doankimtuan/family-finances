---
document: Constants Policy
coding_standards: v1.0.0
status: OFFICIAL_CODING_STANDARDS
run_id: run_coding_standards_20260802T150000Z
created_at: 2026-08-02T15:05:00Z
board: Engineering Standards Board
frozen: true
constitution_sot: artifacts/developer-constitution/CURRENT
---

# Constants Policy

## Rule

Never write a literal (string or number with product meaning) more than once. Every literal used for routing, storage, messaging, or domain classification is defined **once**, as a named `as const` object, and imported everywhere it is needed.

## Where constants live

| Scope | Home | Example |
|-------|------|---------|
| Cross-cutting, app-wide (routes, storage keys, query keys, cookies, HTTP) | `shared/constants/` | `shared/constants/storage-keys.ts` |
| Environment / build / feature configuration | `shared/config/` | `shared/config/feature-flags.ts` |
| Bounded-context / domain constants (statuses, roles, error codes specific to one module) | `modules/<bc>/application/*-constants.ts` | `modules/tenancy/application/auth-constants.ts` |

Do not invent a fourth location. Do not scatter the same concept across two of the three.

**Existing precedent to follow** (already conformant — extend, do not replace):

- [`modules/tenancy/application/app-path.ts`](../../../modules/tenancy/application/app-path.ts) — `APP_PATH` (aliased as `RoutePath`, see Naming Policy)
- [`modules/tenancy/application/auth-constants.ts`](../../../modules/tenancy/application/auth-constants.ts) — auth paths, query keys, cookie name, OTP types, HTTP headers/status
- [`modules/tenancy/application/tenancy-constants.ts`](../../../modules/tenancy/application/tenancy-constants.ts) — `TOGETHER_PATH`, `INVITATION_STATUS`, `HOUSEHOLD_ROLE`

## Required shape

```ts
export const RoutePath = {
  MONEY: "/money",
  MONEY_TRANSACTIONS: "/money/transactions",
} as const;

export type RoutePathValue = (typeof RoutePath)[keyof typeof RoutePath];
```

Rules for the shape:

1. `export const <PascalCaseName> = { ... } as const;` — never `let`, never a plain object without `as const`.
2. Keys are `SCREAMING_SNAKE_CASE`; values are the literal.
3. Export a derived type via `(typeof X)[keyof typeof X]` when the value type is consumed elsewhere (function params, props, Zod `z.enum` sourced from `Object.values`).
4. Group related constants in one file per concern; do not create a single monolithic `constants.ts` that mixes unrelated domains.
5. When a dynamic path is needed (`/money/accounts/${id}`), add a typed builder function next to the constant object (see `moneyAccountPath`, `moneyTransactionPath` in `app-path.ts`) — never inline template literals at call sites.

## Forbidden

- Inline string/number literals for anything in the [Magic String Policy](./magic-string-policy.md) list, anywhere outside the constant's definition file.
- A second object re-declaring values that already exist in a `*-constants.ts` file (e.g., a local `const ROUTES = {...}` duplicating `APP_PATH`).
- Passing raw strings across a function boundary where a constant object already types that boundary (e.g., `status: "pending"` instead of `status: INVITATION_STATUS.PENDING`).

## Review gate

A PR introducing a new hardcoded literal that duplicates, or should be added to, an existing constants object **fails review**. See [review-checklist.md](./review-checklist.md).
