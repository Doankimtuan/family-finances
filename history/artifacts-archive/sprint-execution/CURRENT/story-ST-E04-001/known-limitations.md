# ST-E04-001 — Known Limitations

1. **Capture form** — `/money/add` is a stub; full <15s capture is `ST-E04-002`.
2. **Activity feed** — hub activity section is empty until transactions exist (`ST-E04-002` / `ST-E04-003`).
3. **Balance source** — Real position uses `opening_balance` until ledger transactions land.
4. **Debts / savings / cards** — hub sections labeled “coming later” (later epics).
5. **Authenticated e2e** — money hub happy path skips when `E2E_USER_*` missing or user has no household.
