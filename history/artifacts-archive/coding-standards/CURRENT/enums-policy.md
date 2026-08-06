---
document: Enums Policy
coding_standards: v1.0.0
status: OFFICIAL_CODING_STANDARDS
run_id: run_coding_standards_20260802T150000Z
created_at: 2026-08-02T15:05:00Z
board: Engineering Standards Board
frozen: true
constitution_sot: artifacts/developer-constitution/CURRENT
---

# Enums Policy

## Rule

Prefer a `const` object + `as const` + a derived union type over a TypeScript `enum`. Use a native `enum` **only** when a third-party API or platform contract requires an actual runtime enum — this is an exception, not a starting point, and must be justified in the PR description.

This codebase already has **zero** native `enum` usage in `app/`, `modules/`, and `shared/`. Keep it that way.

## Required pattern

```ts
export const TransactionStatus = {
  PENDING: "pending",
  RESOLVED: "resolved",
} as const;

export type TransactionStatus =
  (typeof TransactionStatus)[keyof typeof TransactionStatus];
```

Why this over `enum`:

- Erases to plain string literals — no extra runtime object shipped unless the const itself is imported.
- Structurally compatible with `z.enum(Object.values(X) as [string, ...string[]])`, so validation and UI share one source.
- No `reverse mapping` footguns, no `const enum` bundler pitfalls.

## Zod alignment (mandatory)

Whenever a domain value has both a Zod schema and a UI-facing type, both must derive from the **same** `as const` object. Do not maintain a `z.enum([...])` literal list and a parallel TypeScript union or UI array independently.

```ts
export const AccountType = {
  CASH: "cash",
  CHECKING: "checking",
  SAVINGS: "savings",
  EWALLET: "ewallet",
  BROKERAGE: "brokerage",
  OTHER: "other",
} as const;

export type AccountType = (typeof AccountType)[keyof typeof AccountType];

export const accountTypeSchema = z.enum(
  Object.values(AccountType) as [AccountType, ...AccountType[]],
);
```

This is currently violated by the ledger account type union (`modules/ledger/application/account-types.ts`) vs. the `z.enum([...])` in `create-account.ts`, and by `TransactionDirection` vs. the repeated `z.enum(["income", "expense"])` in `record-transaction.ts` / `update-transaction.ts`. These are **manual-review** items — see [audit-report.md](./audit-report.md) — because they touch DB check constraints and require coordinated verification, not a mechanical rename.

## Discriminated unions over boolean/enum soup

When a type has mutually exclusive states with different payloads, use a discriminated union with a `kind`/`status`/`type` tag, not multiple optional booleans or a bare enum plus optional fields.

```ts
type MutateTransactionActionState =
  | { status: "success"; transactionId?: string; deleted?: boolean }
  | { status: "error"; code: TransactionErrorCode };
```

(Already the pattern in `mutate-actions.ts` — keep using it.)

## Forbidden

- `enum X { A, B }` or `enum X { A = "a", B = "b" }` without a documented platform-API justification in the PR.
- A `z.enum([...])` whose literal list is not derived from (or does not exactly mirror, with a comment linking the source of truth) a shared `as const` object.
- Parallel string-literal unions describing the same domain concept in two files.
