# ST-E05-003 — Known Limitations

1. **Remote migration apply** — `20260802160000_plan_goals_recurring.sql` (and prior jars migration if still pending) not applied via Supabase MCP this run. Apply before production use.
2. **Contribute is intention-only** — updates `funded_amount` / contributions; does not post Real Ledger transactions or jar_movements.
3. **Recurring does not auto-post** — schedule/review only; no engine to create transactions on `next_run_date`.
4. **Authenticated e2e** — skips without `E2E_USER_*` / household.
