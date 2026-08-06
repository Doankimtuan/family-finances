# ST-E05-004 — Known Limitations

1. **Remote migration apply** — `20260802170000_plan_month_ritual.sql` (and prior Plan migrations if still pending) not applied via Supabase MCP this run. Apply before production use.
2. **Assisted preview is KPI snapshot** — counts jars/inbox/goals/recurring; does not compute overspend cover or ledger rollover (legacy month-close engine deferred).
3. **Lock gate fails open if table missing** — so Plan stays usable before migration; once migrated, approved rows lock correctly.
4. **Authenticated e2e** — skips without `E2E_USER_*` / household.
