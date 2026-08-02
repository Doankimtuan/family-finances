---
document: Naming Policy
coding_standards: v1.0.0
status: OFFICIAL_CODING_STANDARDS
run_id: run_coding_standards_20260802T150000Z
created_at: 2026-08-02T15:05:00Z
board: Engineering Standards Board
frozen: true
constitution_sot: artifacts/developer-constitution/CURRENT
---

# Naming Policy

This document adds Staff-Engineer detail on top of the Constitution's [naming-conventions.md](../../developer-constitution/CURRENT/naming-conventions.md) (file naming, product glossary — unchanged and restated by reference).

## No abbreviations

Every identifier spells out its meaning. If you would not say the abbreviation out loud in a design review, do not write it in code.

| Forbidden | Required |
|-----------|----------|
| `tmp` | a name describing what it temporarily holds, e.g. `pendingAmount` |
| `obj` | the actual type/role, e.g. `transaction`, `account` |
| `data2`, `value1`, `item2` | a name describing the distinct role, e.g. `previousBalance`, `updatedTransaction` |
| `tx` (outside very tight local scope like a one-line `.map`) | `transaction` |
| `acc` | `account` (in a domain context) or `accumulator` (only inside a `.reduce` callback, where it is an established idiom) |
| `err` | `error` |

Exceptions: extremely well-established, single-purpose loop/callback locals (`i` in a plain numeric `for`, `e` for a DOM event handler param, `acc`/`cur` inside `.reduce`) remain acceptable because they are idiomatic and scoped to a few lines — do not rename these into noise.

## Explicit, domain-scoped names

Prefer a name that states the domain concept and its qualifier, matching the product glossary (Jar, Balance, Inbox, Month Ritual, Together — see Constitution `naming-conventions.md`):

- `transactionSummary`, not `summary` or `txSummary`
- `monthlyExpense`, not `expense` or `monthExp`
- `goalProgress`, not `progress` or `gp`

## Constant namespace naming (pairs with Constants Policy)

`as const` constant objects use `PascalCase` singular-noun namespaces that read as a type name:

| Namespace | Use |
|-----------|-----|
| `RoutePath` | in-app route paths (alias of `APP_PATH`) |
| `QueryKey` | TanStack Query cache keys |
| `MutationKey` | TanStack Query mutation keys |
| `StorageKey` | `localStorage`/`sessionStorage` keys |
| `ThemeMode` | `next-themes` theme values |
| `Locale` | supported app locales |
| `TransactionStatus`, `TransactionDirection` | ledger domain states |
| `AccountType` | ledger account kind |
| `InvitationStatus`, `HouseholdRole` | tenancy domain states (existing: `INVITATION_STATUS`, `HOUSEHOLD_ROLE` — keep `SCREAMING_SNAKE_CASE` for pre-existing exports rather than mass-renaming; use the `PascalCase` form for all **new** constant namespaces going forward) |

Existing `SCREAMING_SNAKE_CASE` exports (`APP_PATH`, `AUTH_CONFIRM_STATUS`, `INVITATION_STATUS`, etc.) are **not** required to be renamed — renaming a widely-imported constant is a mechanical but high-blast-radius change with no behavior benefit. New constant objects introduced after this freeze must use the `PascalCase` namespace form above so the codebase converges over time without a disruptive rename sprint.

## `data-testid` naming

Kebab-case, prefixed by the feature/screen, suffixed by the specific element or dynamic id: `transaction-row-${tx.id}`, `edit-direction-${value}`, `money-accounts`. This is already the dominant pattern — keep it.

## Boolean naming

Booleans read as a yes/no question: `isPending`, `isDisabled`, `hasHousehold`, `online` (already used) — never `flag`, `check`, or a bare noun for a boolean.

## Review gate

- Any new identifier matching a forbidden abbreviation above fails review.
- Any new `as const` constant namespace not in `PascalCase` fails review.
- Any boolean variable/prop that does not read as a yes/no predicate fails review.
