# F6 — Plan budget availability state

## Root cause

The Plan hub treated the absence of a current Jar budget summary as an unavailable summary. For a new household with active starter Jars but no monthly Jar plan, the UI showed “Unavailable” and missing-data messaging, which implied a technical failure even though the user had not configured a plan.

## State model

`PlanBudgetAvailability` now distinguishes:

- `NOT_CONFIGURED`: both current reads succeeded, but there is no configured budget summary. Show a setup explanation and link to Jar plans.
- `UNAVAILABLE`: the Plan pulse or budget read failed. Show a recoverable error and retry the Plan route.
- `READY`: reads succeeded and a summary exists. Display the calculated planned, spent, and remaining totals, including zero spend.

An empty active-Jar list still calculates a valid zero summary when reads succeed and uses the existing no-Jars state. A failed read hides the Jar section instead of implying there are no Jars.

## Change and files

- Added `PlanBudgetAvailability` in `modules/plan/application/plan-constants.ts` and a small resolver in `plan-home-health.ts`, exported from the application barrel.
- Updated `app/[locale]/(product)/plan/page.tsx` to map read success, configured state, and failure into those outcomes.
- Added separate English/Vietnamese messages and setup/retry destinations.
- Removed the Jar list warning that had conflated missing configuration with an outage.
- Added unit coverage for all three availability outcomes.

Files: `app/[locale]/(product)/plan/page.tsx`, `modules/plan/application/plan-constants.ts`, `modules/plan/application/plan-home-health.ts`, `modules/plan/application/index.ts`, `messages/en/plan.json`, `messages/vi/plan.json`, and `tests/unit/plan-home-health.test.ts`.

## User impact

New households get a direct route to set monthly amounts. A genuine read failure remains visibly different and can be retried. Configured plans continue to show their current totals and zero-spend progress. The new explanatory copy clarifies that complete planned and remaining totals need monthly amounts for active Jars.

## Verification

Unit tests and browser checks covered unconfigured, configured with zero spend, empty active-Jar, a simulated read failure, a zero-income month, refresh persistence, a new reporting month, and partner visibility. Details and screenshots are in [F6 browser verification](f6-browser-verification.md). Financial effects are documented in [F6 financial integrity](f6-financial-integrity.md).
