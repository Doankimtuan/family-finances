# ST-E05-002 — Known Limitations

1. **Remote migration apply** — `20260802150000_plan_jars_state_and_plans.sql` is in-repo; Supabase MCP was unavailable this run (pooler URL had no password). Apply via Supabase dashboard / `apply_migration` / linked CLI before production use of pause/plans.
2. **Month Ritual lock enforcement** — UI teaches BR-08; approve→lock movements is `ST-E05-004`.
3. **Jar rules (category→jar)** — `UpsertJarRule` not in this story.
4. **Authenticated e2e** — skips without `E2E_USER_*` / household.
5. **Create jar default plan** — new jars start at 0% percent plan until edited.
