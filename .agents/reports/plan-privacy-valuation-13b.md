# PLAN 13B — Privacy + Investment UNKNOWN Valuation Integrity

Date: 2026-08-23

## Verdict

`PLAN PRIVACY/VALUATION READY`

The authenticated browser blocker is repaired and the requested 13B browser re-certification is green.

## PLAN 13B.1 blocker repair

Root cause:

- `RecommendationList` passed rich interpolation callbacks for messages using plain `{amount}` placeholders. next-intl returned those callbacks as React children, causing the Plan route to throw `Functions are not valid as a child of Client Components` and fall into the generic request-error boundary.
- Monthly Review passed a `plan.monthlyReview` translator into recommendations whose keys live under `plan.recommendations`, producing missing-message errors.

Smallest fix:

- Financial recommendation interpolations now use explicit rich tags around privacy-aware leaves.
- Monthly Review passes the root `plan` translator to `RecommendationList` while retaining its scoped translator for review copy.
- Added rerunnable `scripts/plan-13b1-fixture.mjs`, isolated by the `PLAN 13B.1` prefix, covering current, stale, UNKNOWN, and mixed known+UNKNOWN investment Goal fixtures.

## Scoped result

- Financial values in Plan Home, Jars, Goals, Monthly Review, recommendations, linked-source summaries, issues, and action previews now use `FinancialValue`, `Amount`, or rich translation leaves containing those primitives.
- Shared `JarCard`, `GoalCard`, and privacy-aware `Progress` centralize masking. Names, statuses, dates, and surrounding copy remain visible when privacy is enabled.
- Recommendation rendering now receives Plan currency and locale and renders amount interpolation through privacy-aware rich leaves.
- Investment Goals preserve `AUTO_CURRENT`, `AUTO_STALE`, `MANUAL`, and `UNKNOWN` quality per source. `AUTO_STALE` remains usable; `UNKNOWN` contributes no fabricated zero and produces indeterminate progress.
- Mixed-source Goals retain known contributions while reporting an indeterminate aggregate. Closed or unavailable sources remain unavailable.
- Savings and Loans/Debt funding semantics were not changed.
- Ready ↔ Active lifecycle regression behavior remains covered.

## Findings

P0 count: 0

P1 count: 0 active findings. The authenticated browser blocker was fixed at the translation boundary.

P2 count: 0

## Tests and validation

Passed:

- Plan and related domain suites: 22 files, 204 tests.
- Added/updated privacy and valuation suites: 34 focused tests; all passed.
- Full suite: 150 files passed, 1,075 tests passed.
- Typecheck: passed.
- Production build: passed.
- Changed-file ESLint: passed.
- i18n message loading and Plan recommendation tests: passed.
- Investment market valuation, Savings, Loans/Debt, and Ready regression coverage: passed.

Baseline failures not changed by this work:

- 4 tests in `tests/unit/home-screen-v2-polish.test.ts` assert older Home source markup. They are unrelated to 13B and were not modified.

Browser smoke with `.env.local` credentials:

- Existing Plan Home/Jars/Goals/Monthly Review smoke: 9 passed.
- New 13B.1 browser certification: 2 passed.
- 390px VI/light: privacy ON, Home, Jars, Goals, UNKNOWN, stale, Monthly Review, no Quick Close, no overflow.
- 440px EN/dark: privacy OFF, Home, current, mixed indeterminate Goal, Monthly Review, recommendations, no raw i18n keys, no overflow.
- UNKNOWN was not rendered as `0 ₫` or `0%`; stale remained usable; privacy kept names/statuses/dates visible while masking values.

F3 / legacy ritual safety:

- Monthly Review remains the exposed product contract and is non-blocking.
- Existing F3/G1 mutation specs still have a pre-existing `jar-plan-form` selector mismatch after opening the edit surface; this is unrelated to the repaired authenticated read boundary. No Quick Close UI was reintroduced.

## Recommended implementation sequence

1. Keep the deterministic 13B.1 fixture available for future browser recertification.
2. Address the unrelated Home polish source-contract failures and stale F3/G1 edit-form selectors separately.
