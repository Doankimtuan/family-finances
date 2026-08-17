---
name: code-quality
description: Enforce readable, type-safe, maintainable TypeScript code and prevent common structural code smells during implementation and refactoring. Use for every task that writes, edits, or reviews application code in this repository (modules/, app/, shared/, providers/, features/, tests/).
---

# Code Quality

Baseline quality skill for this repository. Apply it to almost every
implementation and refactor task, before writing the first line of code and
again during self-review.

Goal: readable, maintainable, type-safe code with no unnecessary abstraction.
Optimize for the next engineer reading the code, not for line count or
cleverness.

## Control Flow

Avoid:

- deeply nested `if` / `if-else`
- condition pyramids
- nested ternaries
- giant boolean expressions
- boolean flag explosions
- duplicated branch logic

Prefer when appropriate:

- guard clauses and early returns
- named predicates (`const isAllocationOverLimit = ...`)
- semantic membership sets for equality chains
- lookup maps and command/handler maps
- discriminated unions
- exhaustive `switch` statements
- strategy functions
- small resolver helpers for multi-branch domain mapping (`resolveBackingState`, `asGoalType`)

Principle:

```text
Do not encode multiple business decisions inside one giant condition.
Name business decisions explicitly.
```

### Nested ternaries and chained conditionals

Do not chain ternaries to pick among three or more outcomes. A nested ternary
usually means several business rules were collapsed into one expression.

```ts
// BAD: three backing outcomes hidden in one expression
const backingState = isLegacy
  ? GoalBackingState.LEGACY
  : hasLinks
    ? GoalBackingState.LINKED
    : GoalBackingState.NEEDS_BACKING;

const fundedAmount =
  backingState === GoalBackingState.LEGACY
    ? legacyAmount
    : backingState === GoalBackingState.LINKED
      ? (summary?.fundedAmount ?? derived ?? 0)
      : 0;
```

Prefer guard clauses, `switch`, or a named resolver that returns one outcome per
branch:

```ts
function resolveGoalBackingState(
  isLegacyIntention: boolean,
  fundingLinkCount: number,
): GoalBackingStateValue {
  if (isLegacyIntention) return GoalBackingState.LEGACY;
  if (fundingLinkCount > 0) return GoalBackingState.LINKED;
  return GoalBackingState.NEEDS_BACKING;
}

function resolveGoalFundedAmount(
  backingState: GoalBackingStateValue,
  legacyAmount: number,
  fundingSummary: GoalFundingSummary | null,
  derivedFundedAmount?: number,
): number {
  switch (backingState) {
    case GoalBackingState.LEGACY:
      return legacyAmount;
    case GoalBackingState.LINKED:
      return fundingSummary?.fundedAmount ?? derivedFundedAmount ?? 0;
    default:
      return 0;
  }
}
```

A single ternary is fine when it expresses one binary decision with no nested
follow-up logic. Repeated `backingState === X ? ... : ...` chains in the same
mapper should also move into resolvers instead of spreading the same branch
logic across the return object.

Mirror existing row-mapping style in the module: `asGoalStatus` / `switch` for
string-to-enum coercion, not nested ternaries.

### Lookup tables for static domain mappings

When one domain key maps to a fixed outcome (enum → enum, status → label,
type → handler), prefer a named lookup table over a long `switch` or repeated
equality chain. Use `Record` / `Partial<Record<…>>` so the mapping is data, not
control flow.

```ts
// BAD: repetitive switch for a static ledger-type → activity-kind table
switch (row.type) {
  case TransactionLedgerType.INCOME:
    return TransactionActivityKind.INCOME;
  case TransactionLedgerType.EXPENSE:
    return TransactionActivityKind.EXPENSE;
  // ...
  default:
    return TransactionActivityKind.OTHER;
}
```

```ts
// GOOD: named lookup + fallback for unmapped keys
const LEDGER_TYPE_TO_ACTIVITY_KIND: Partial<
  Record<TransactionLedgerTypeValue, TransactionActivityKind>
> = {
  [TransactionLedgerType.INCOME]: TransactionActivityKind.INCOME,
  [TransactionLedgerType.EXPENSE]: TransactionActivityKind.EXPENSE,
  [TransactionLedgerType.TRANSFER_OUT]: TransactionActivityKind.TRANSFER,
  [TransactionLedgerType.TRANSFER_IN]: TransactionActivityKind.TRANSFER,
  // many keys can share one value
};

return LEDGER_TYPE_TO_ACTIVITY_KIND[row.type] ?? TransactionActivityKind.OTHER;
```

Keep precedence rules that are not simple key lookup (reversal overrides,
semantic category checks) as guard clauses **before** the table lookup. Do not
hide conditional business rules inside the table.

Use `switch` when branches run different logic, not only return a constant.
Use `Set` + predicate when the question is membership, not mapping to a
distinct output per key.

## Semantic Membership Checks

Detect repetitive equality chains that actually mean "this value belongs to
a semantic category":

```ts
// BAD: three comparisons hiding one concept
state === State.MATURED ||
  state === State.MATURE_TODAY ||
  state === State.ACTION_REQUIRED;
```

Prefer a named semantic collection plus a predicate when it improves intent:

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

`.includes()` on a typed array is also acceptable when TypeScript inference
stays clean. Do not extract arbitrary one-off comparisons merely to reduce
line count — extract when the category has a domain name.

## Magic Values

This repository has a hard "no magic strings" law. Domain literals (routes,
statuses, types, roles, currencies, error codes, storage/query keys, locales,
themes, cookies) must come from the documented constant homes:

| Scope                  | Path                                             |
| ---------------------- | ------------------------------------------------ |
| Routes / path builders | `modules/tenancy/application/app-path.ts`        |
| Auth / tenancy         | `modules/tenancy/application/*-constants.ts`     |
| Ledger                 | `modules/ledger/application/ledger-constants.ts` |
| Plan                   | `modules/plan/application/plan-constants.ts`     |
| Inbox                  | `modules/inbox/application/inbox-constants.ts`   |
| App-wide keys/config   | `shared/constants/`, `shared/config/`            |

If a constant is missing, add it once at the documented home first, then use
it. Never hardcode and "clean up later". See `.cursor/rules/no-magic-strings.mdc`
for the full policy (as-const objects, `*_VALUES` arrays shared with Zod).

### Reusable Domain Values

Do not leave anonymous string unions or repeated string literals when they
represent a meaningful, reusable domain concept:

```ts
// BAD: re-declares a domain concept inline
function familyIcon(family: "BANK" | "PLATFORM") {
  ...
}
```

Before creating anything new, search the existing codebase for an existing:

- type
- enum
- `as const` object
- Zod schema
- domain constant

Reuse the existing definition when possible. Only create a new domain
constant/type when no canonical definition already exists, and place it at
the documented constants home:

```ts
const ProviderFamily = {
  BANK: "BANK",
  PLATFORM: "PLATFORM",
} as const;

type ProviderFamily = (typeof ProviderFamily)[keyof typeof ProviderFamily];
```

Do not create meaningless constants merely to eliminate every literal.

For non-domain code, extract literals only when the name adds meaning:

```ts
// BAD: unexplained business threshold
if (allocation > 80) {
}

// BETTER: semantic constant
const MAX_JAR_ALLOCATION_PERCENT = 80;

if (allocation > MAX_JAR_ALLOCATION_PERCENT) {
}
```

Do NOT extract trivial literals, and never create meaningless constants such
as `const ZERO = 0`. The purpose is semantic clarity, not eliminating every
literal.

## Functions

Prefer:

- cohesive functions with one primary responsibility
- explicit inputs and outputs
- pure domain functions
- intention-revealing names

Avoid:

- functions controlled by multiple booleans
- huge parameter lists
- hidden dependencies
- functions that mutate unrelated state
- functions mixing validation, persistence, formatting, and rendering

Instead of `processTransaction(transaction, true, false, true)`, prefer an
explicit options object or separate domain operations.

## Collections

Before implementing manual loops, consider whether intent is better expressed
by `map`, `filter`, `find`, `findIndex`, `some`, `every`, `flatMap`, `reduce`,
`Set`, `Map`, `Object.entries`, or `Object.fromEntries`.

```ts
const uniqueIds = [...new Set(items.map((item) => item.id))];
```

The same applies to manual grouping, deduplication, and indexing: a `Map` /
`Object.fromEntries` keyed by identity usually expresses the intent better
than an accumulator loop with `push`.

Do not force functional one-liners. Do not replace an obvious loop with a
clever `reduce` merely to make the code shorter. Prefer the clearest
expression.

## Language Capabilities Before Manual Branching

Before writing repetitive condition logic, consider TypeScript/JavaScript
constructs that express it directly:

- discriminated unions and literal unions
- `as const` and `satisfies`
- `Record` and mapped types
- type guards and assertion functions
- exhaustive `switch` statements
- lookup tables and handler maps

Prefer making invalid states unrepresentable over re-validating optional
fields at every call site (see `typescript-quality`). Avoid boolean-flag-heavy
domain models where mutually exclusive variants can be modeled as a
discriminated union.

## Utility Libraries

Do NOT introduce lodash automatically. Priority:

```text
1. Existing domain abstraction (modules/<bc>/application)
2. Native JavaScript / TypeScript
3. Existing project utility (shared/, modules/<bc>/application)
4. Existing installed library
5. New dependency only when clearly justified
```

If lodash were already installed, use `groupBy`, `keyBy`, `uniqBy`,
`orderBy`, `differenceBy` only when they materially improve readability.
Never import lodash for trivial `map`, `filter`, or `find`, and never install
it during a refactor unless the task explicitly justifies the dependency.

## Form wiring duplication

Repeated controlled-field plumbing (`Controller`/`useController`, value
normalization, `onChange`, errors, IDs, and shared primitives) belongs in the
existing typed controlled-field adapter. Do not add local `number`, `select`,
or `date` helper functions that duplicate that infrastructure. The adapter
must remain a thin presentation boundary; business rules and unusual event
flows stay in the form component.

Keep field configs near their semantic section and small enough to read with
the surrounding layout. Do not grow the adapter into a generic form engine or
force complex fields through it merely for consistency.

## Complex Expressions

Avoid long expressions that combine parsing, validation, fallback rules,
calculations, domain decisions, and formatting. Use named intermediate values:

```ts
// BAD
const valid = conditionA && conditionB && (conditionC || conditionD) && !conditionE;

// BETTER
const hasValidAmount = ...;
const isAllowedAllocation = ...;
const isConfigurationComplete = ...;

const canSubmit = hasValidAmount && isAllowedAllocation && isConfigurationComplete;
```

## Duplication

Identify duplicated business logic, validation, calculations, parsing,
formatting, and state transitions — then extract only when the shared concept
is genuinely the same concept.

```text
Prefer duplication over the wrong abstraction.
```

Do not abstract coincidental similarity. Two similar-looking blocks that can
change independently for different business reasons must stay separate.

## Domain Logic

Business logic should be:

- framework-independent (live in `modules/<bc>/application`, not in JSX)
- testable and deterministic
- reusable
- expressed through domain terminology

Avoid embedding financial or domain calculations inside React JSX. Prefer
pure functions in the module's application layer; UI components render what
the domain computes.

## Error Handling

Never write `catch {}` or silently swallow exceptions. Errors need meaningful
classification, structured error codes, appropriate logging, and useful
context. Do not classify errors by fragile `error.message.includes(...)`
matching when a structured contract is possible. See the `error-handling`
skill for the full pattern.

Review catch blocks for discarded exceptions and generic `UNKNOWN` returns
without boundary logging. Prefer structured error metadata over parsing
human-readable messages; if a legacy contract prevents that, keep one named
compatibility classifier at the boundary.

## Readability

Prefer boring and obvious code.

```text
No clever code for the sake of cleverness.
```

Avoid compressed one-liners containing business logic, excessive chaining,
premature generic helpers, deeply generic utility types, and over-engineered
design patterns.

## Anti-Overengineering

- Do not create abstractions before there is a demonstrated need.
- Prefer local code over premature shared utilities.
- Prefer composition over generic frameworks.
- Do not introduce repositories, factories, managers, or service layers merely
  to satisfy a pattern.
- Do not optimize for fewer lines or for cleverness.
- Do not introduce dependencies when native language/platform capabilities are
  sufficient.

## Related Skills

- `typescript-quality` — type-system modeling in depth
- `refactor-review` — run at the end of every refactor
- `typescript-clean-code` — optional deep Clean Code reference
