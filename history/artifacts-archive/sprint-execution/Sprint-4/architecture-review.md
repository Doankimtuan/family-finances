# Architecture Review — Sprint 4

## Decisions

1. Extend `month_ritual_runs` rather than resurrect legacy `jar_month_close_runs`.
2. Household-scoped autolock RPC (same pattern as Inbox staleness) instead of inventing a separate BC or hard cron in-app.
3. Spec Miscellaneous Jar → existing seeded `General` spending jar (`MISCELLANEOUS_JAR_NAME`).
4. Ritual-gate errors live in `RITUAL_GATE_ERROR_CODE` (not shared `PRODUCT_ACTION_ERROR_CODE`) to avoid i18n fan-out across unrelated forms.

## Boundaries

- Plan lock gate (`assertPlanPeriodUnlocked`) now treats `pending_review` as locked.
- Inbox BR-15 month-lock half is executed inside the autolock RPC (assigns jar + `auto_resolved`).
