---
name: testing-quality
description: Test quality standards — regression coverage before risky refactors, domain unit tests for financial calculations, integration, component, and E2E tests with Vitest/Playwright. Use for any task that writes or modifies tests, or before starting a risky refactor.
---

# Testing Quality

Stack: Vitest (`tests/unit`, `tests/…`), Playwright (`tests/e2e`). Behavior is
the contract.

## Refactors Need a Safety Net First

Before a risky refactor, capture observable behavior with regression tests:

```text
Refactoring must preserve observable behavior unless explicitly requested
otherwise.
```

If the behavior is not covered, add characterization tests around the touch
point before changing it. If tests must change, that is a behavior change —
make it explicit, not incidental.

## What to Test Where

| Kind           | Target                                                      |
| -------------- | ----------------------------------------------------------- |
| Domain unit    | Pure functions in `modules/<bc>/application`                |
| Financial math | Every calculation: allocation, rounding, rollover, limits   |
| Integration    | Query/command against a (mocked or local) Supabase contract |
| Component      | User-observable rendering/interaction (Testing Library)     |
| E2E            | Critical user flows via Playwright                          |

## Financial Calculations

Money invariants get dedicated unit tests: boundary values (0, exactly at
limit, one over limit), rounding, currency handling (VND no-decimal
assumptions), and sign/direction rules. Property-style sweeps are welcome
where cheap, but explicit boundary cases are mandatory.

Assert via the domain constants, never fresh literals that duplicate them:

```ts
expect(result.direction).toBe(TransactionDirection.EXPENSE);
```

## Behavior, Not Implementation

Prefer behavior-oriented tests:

- assert what the user/function observes: outputs, rendered text, DOM state,
  emitted calls
- avoid asserting internal call counts, mock invocation orders, private state,
  or component internals that make refactors impossible
- test the contract of the module application layer

If a test breaks on every internal refactor while behavior stays the same,
the test is wrong.

## Component Tests

- Query by accessible role/label/name (a11y-aligned selectors), not CSS
  implementation classes.
- Test states that matter to users: loading, empty, error (typed codes),
  i18n keys rendering in both locales where relevant.
- Ephemeral create forms: test that reopening resets to canonical defaults
  (UI Constitution).

## E2E Tests

- One user flow per spec; seed fixtures deterministically
  (`scripts/seed-e2e-fixtures.mjs` pattern).
- Keep smoke specs fast; deep flows live separately.
- Run with `npm run test:e2e` (smoke subset: `npm run test:e2e:smoke`).

## Verification Commands

```bash
npm run test           # Vitest unit/integration
npm run test:e2e       # Playwright
npm run lint           # ESLint
npm run typecheck      # tsc --noEmit
```

## Related Skills

- `code-quality` — always apply
- `refactor-review` — after refactors, before finishing
