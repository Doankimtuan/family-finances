# Technical Debt — Sprint 3

| ID | Item | Severity | Notes |
|----|------|----------|-------|
| TD-S3-01 | No managed hourly cron for staleness worker | Low | RPC + open-Inbox sweep; wire pg_cron/Edge later |
| TD-S3-02 | Month-lock unmapped→Miscellaneous jar | Medium | Spec BR-15 half; owned by Sprint 4 Month Ritual worker |
| TD-S3-03 | Pattern ingestion not wired into every capture path | Medium | Columns + policy ready; recurring_pattern writers land with calendar/recurring epics |
| TD-S3-04 | Carry-forward TD-S1-01 / TD-S2-* | — | Unchanged |

## Intentionally not debt

- Keeping snake_case `kind` as storage discriminator with Spec PascalCase `type` in application (matches TransactionStatus pattern).
