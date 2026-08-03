# ST-E07-001 — Known Limitations

1. **Health score is heuristic** — derived from account/jar/inbox setup counts; no dedicated `DB-Health` tables yet (insights deepen in ST-E07-002).
2. **Health overview is a shell** — factors + narrative only; charts/insights belong to ST-E07-002.
3. **Authenticated e2e** — full chrome path skips without `E2E_USER_*`.
