# PLAN 13C — ActionSheet UX + Responsive Action Certification

Date: 2026-08-23

## Verdict

`PLAN ACTION UX READY`

P1-02 and P1-03 from PLAN 13A are complete. Plan mutation surfaces now use the shared action hierarchy, and the authenticated responsive matrix is certified without changing Plan accounting or domain semantics.

## Action composition

- Jar create, edit, archive/disable confirmation, and allocation reallocation use `Sheet`, `ActionSheetLayout`, and `SheetActionFooter`.
- Goal create, edit, legacy contribute, source link, unlink, reassign, supported fund/withdraw navigation, pause/resume, complete, and cancel use the same shared composition where they are currently exposed.
- Monthly Review remains an optional report and uses the shared bottom action hierarchy. Quick Close and ritual blocking behavior were not restored.
- Action bodies scroll independently. Primary and secondary actions remain sticky above `env(safe-area-inset-bottom)` through the canonical shared footer.
- Shared `ChoiceTile` and controlled field primitives replace feature-local selector tiles and the reallocation native select. No Plan-specific sheet primitive, feature-local bottom padding, competing component system, or new dependency was introduced.
- Closing create/action sheets discards abandoned local state; edit sheets reopen from persisted values. Recoverable mutation failures keep entered values available for correction or retry.

## Preserved contracts

- Jar fixed-amount, qualifying-income percentage, category, rollover, and enabled/paused behavior are unchanged.
- Jar reallocation remains virtual capacity movement with zero ledger impact. No Money movement was added.
- Goal source eligibility, personal source ownership, household authority, cross-household isolation, lifecycle actions, and funding navigation remain enforced by existing application commands.
- Goal `UNKNOWN` valuation remains indeterminate and never renders a fabricated zero. `AUTO_STALE` keeps the latest usable value with restrained stale context and does not block otherwise safe actions.
- Mixed known and `UNKNOWN` Goal sources retain known contributions while keeping the aggregate indeterminate.
- Recommendation ordering, historical snapshot immutability, and Monthly Review report-only behavior are unchanged.

## Validation and failure UX

Covered by existing command validation plus the normalized action surfaces:

- invalid, zero, and negative allocation values;
- percentage overflow where applicable;
- unavailable or ineligible linked sources;
- personal-source ownership rejection and cross-household rejection;
- stale mutation, duplicate/retry behavior, offline state, and unexpected server failure;
- loading, empty, recoverable error with Retry, and current read-only foundations.

The stale F3/G1 `jar-plan-form` contract was corrected at the test layer. The specs now open the canonical Jar edit action and target `jar-edit-form`, `jar-edit-plan-percent`, and `jar-plan-edit`. One stable `jar-edit-open` trigger ID was added; old markup and arbitrary `.first()` selectors were not restored.

## Authenticated browser certification

Authenticated `.env.local` coverage passed:

- 390px, Vietnamese, light theme, reduced motion: Plan Home, Jar create, Goal create, Monthly Review, keyboard focus, dismissal, privacy, no horizontal overflow, no raw i18n keys, and no Quick Close.
- 440px, English, dark theme: Jar edit, allocation/reallocation, Goal edit, available source actions, stale/UNKNOWN/mixed-source fixtures, privacy ON/OFF, safe footer position, focus, and no overflow.
- 768px and 1280px regression: the intentional centered 440px shell and action-sheet footer geometry remain intact.
- Dedicated PLAN 13C action certification: 4 passed.
- PLAN 13B privacy/valuation certification: 2 passed.
- Existing Plan Home/Jar/Goal/Monthly Review smoke coverage: passed.
- G1 unlocked mutation safety: 1 passed.
- F3 live mutation path: skipped because the authenticated fixture period is locked by BR-08; G1 certifies the same position invariant on the unlocked path.

The browser assertions wait for the HeroUI sheet transition before measuring geometry and verify that the sticky action remains separated from the viewport bottom.

## Automated validation

Passed:

- Focused Plan/Jar/Goal actions, funding/valuation, Monthly Review, recommendations, ownership/security, privacy, and i18n: 26 files, 300 tests.
- Action component suites: 12 tests.
- Changed-file ESLint.
- Changed-file Prettier check.
- TypeScript typecheck.
- `git diff --check`.
- Next.js production build.

Repository baselines reproduced and intentionally not changed:

- Full Vitest: 150 files and 1,075 tests passed; 4 assertions in `tests/unit/home-screen-v2-polish.test.ts` still expect older unrelated Home markup.
- Full ESLint: only the 3 existing `scripts/home-compact-cta-check.cjs` diagnostics remain.
- Repository-wide Prettier still reports historical formatting debt outside the PLAN 13C changed-file set.

These baseline failures do not exercise Plan action behavior and were left untouched per the instruction not to fix unrelated Home debt.
