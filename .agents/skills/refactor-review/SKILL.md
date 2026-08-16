---
name: refactor-review
description: Final self-review gate for refactors and substantial changes — scans the changed-file set for magic values, anonymous unions, equality chains, missed Set/Map/Record and discriminated-union opportunities, nested conditions, duplication, weak typing, hook misuse, business logic in UI, silent catches, premature abstraction, and dead code. Use at the end of every refactor or substantial implementation, before reporting completion.
---

# Refactor Review

Run this review over the full changed-file set (`git diff --name-only` against
the base) at the end of every refactor or substantial change. Fix findings or
justify them before reporting completion.

## Checklist

Scan every changed file for:

```text
magic strings
magic numbers
anonymous string unions duplicating a domain concept
duplicated domain constants (re-defined instead of reused)

nested conditions
nested ternaries
condition pyramids

duplicated logic
duplicated validation
duplicated state
duplicated condition branches

equality chains (x === A || x === B || x === C)
manually implemented membership checks
missed Set / Map / Record opportunities
missed discriminated-union opportunities
manual grouping / deduplication / indexing loops

weak TypeScript modeling
any
unsafe casts

boolean flag explosions
large functions
mixed responsibilities

unnecessary useState
unnecessary useEffect
unnecessary useMemo
unnecessary useCallback

business logic inside UI

silent catch blocks
fragile error string matching

missed native JS/TS utilities

premature abstractions
unnecessary wrappers
newly introduced abstractions that duplicate existing ones
dead code introduced by the refactor
```

## How to Check

1. `git status` / `git diff` — enumerate the touch set. Nothing outside it
   should change (no broad unrelated cleanup).
2. Domain literals must resolve to the documented constant homes
   (`.cursor/rules/no-magic-strings.mdc`). Before defining a new constant or
   union, search for an existing type, enum, `as const` object, Zod schema, or
   domain constant to reuse.
3. Hooks audit: every `useState`/`useEffect`/`useMemo`/`useCallback` can name
   the concrete reason it exists; otherwise remove it.
4. Types audit: no new `any`, `as X` without local proof, optional-field
   blobs, or boolean flags encoding mutually exclusive states.
5. Duplication audit: same concept duplicated? Extract. Coincidental
   similarity? Leave it.
6. Error audit: no new `catch {}`, no message-string branching, typed codes
   for expected failures.
7. Dead code: exports, constants, components, and branches orphaned by the
   refactor are deleted, not left "just in case".

## The Final Question

```text
Is the resulting implementation simpler than the code it replaced?
```

If not, reconsider the refactor — smaller steps, less abstraction, or revert.

## The Language Question

```text
Does this implementation use the language and existing domain model
effectively, or is it manually re-implementing concepts TypeScript /
JavaScript already expresses well?
```

Check equality chains, manual membership/grouping/dedup logic, and anonymous
unions against the semantic-membership and reusable-domain-value rules in
`code-quality` and `typescript-quality` before answering.

## Behavior Preservation

For pure refactors:

```text
Refactoring must preserve observable behavior unless explicitly requested
otherwise.
```

Tests must pass unchanged (except where the task explicitly changes
behavior). Run the verification commands from `testing-quality`
(`npm run lint`, `npm run typecheck`, `npm run test`) before finishing.

## Related Skills

- `code-quality`, `typescript-quality` — the rules this review enforces
- `testing-quality` — regression safety net
