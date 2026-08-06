# Known Issues — Sprint 1

1. **Migration not applied in this session** — SQL is committed to repo; apply via Supabase CLI/pipeline before exercising RPCs against a live DB.
2. **Legacy edit still available** — may mutate fields without 3-way chain; Correct is the Spec path.
3. **E2E not extended** — refund/correct/category forms lack Playwright smoke.
4. **Pre-migration rows** — `cleared`→`posted` and household category jar backfill run in migration; verify on staging snapshot.
5. **Competing roadmap signal** — Product Decision Board still points at EO-04 as “Sprint 7”; this execution followed Implementation Planning Sprint 1 (Spec v2.1). Clarify sequencing with board before Sprint 2 vs EO-04.
