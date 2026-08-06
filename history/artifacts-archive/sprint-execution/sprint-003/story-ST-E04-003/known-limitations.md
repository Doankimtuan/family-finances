# ST-E04-003 — Known Limitations

1. **Search** — client-side filter over last 100 txs (no full-text index yet).
2. **Unmap on edit** — clearing jar does not re-enqueue Inbox (mapping does resolve pending).
3. **Transfers** — still income/expense only.
4. **Authenticated e2e edit/delete** — skips without `E2E_USER_*` / household.
