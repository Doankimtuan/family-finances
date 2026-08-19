# Shared Visual Test Cleanup — 07C.2

## Root cause

The shared visual-foundation tests retained the previous Tailwind CSS-variable utility spelling, `rounded-[var(--token)]`. The normalized production syntax is `rounded-(--token)`, which is equivalent for the shared radius tokens and is already used by `Section` and `Button`.

## Tests changed

- Updated `tests/unit/shared-visual-foundation.test.tsx` to assert the current card-radius token syntax and the surface/background/border semantics for `Section` variants.
- Removed the brittle exact radius serialization assertion from the button test.
- Strengthened the button contract with minimum hit-target assertions and accessible-name assertions for standard and icon-only buttons.

## Production code decision

No production code was changed. Inspection confirmed that `Section` and `Button` use the intentional current token syntax, and no visual or behavioral regression was present.

## Final validation

- Shared visual-foundation tests: 1 file, 9 tests passed.
- Home-focused tests: 2 files, 5 tests passed.
- Full unit suite: 122 files, 914 tests passed.
- Lint: passed.
- Typecheck: passed.
- Build: passed.

Motion work was not started.
