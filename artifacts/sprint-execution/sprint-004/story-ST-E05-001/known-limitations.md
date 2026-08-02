# ST-E05-001 — Known Limitations

1. **Paused jar state** — DB has archived only; Active = `!is_archived` until ST-E05-002 expands state matrix.
2. **Jar list/detail** — `/plan/jars` is a stub; full Active-only list is `ST-E05-002`.
3. **Goals / recurring / ritual** — entry stubs only (`ST-E05-003` / `ST-E05-004`).
4. **Jar balances** — intentionally omitted (no jar_movements; avoids BR-01 confusion).
5. **Authenticated e2e** — hub happy path skips without `E2E_USER_*` / household.
