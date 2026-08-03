# ST-E05-002 — Review Report

## Findings

- Active jars remain the only allocation targets; paused/archived are listed separately and excluded from capture.
- Planned amounts use intention `Amount`, never Real Ledger `Balance` (BR-01).
- Household income placement defaults to Suggest and is surfaced on list/detail (AC-004).
- Ritual lock is explained on detail; operational lock belongs to ST-E05-004.

## Risks

- Until the migration is applied on the linked Supabase project, pause/plan screens will error on missing `is_paused` / `jar_plans`.

## Verdict

**APPROVED** — freeze story; leave `ST-E05-003` for the next run.
