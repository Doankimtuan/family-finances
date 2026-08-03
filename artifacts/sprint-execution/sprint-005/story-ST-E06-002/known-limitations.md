# ST-E06-002 — Known Limitations

1. **No savings/installment engines yet** — maturity/EMI ReviewItems are not auto-enqueued; ack records intention in `context_json` only.
2. **Jar movements** — resolve still sets `transactions.jar_id` without `jar_movements`.
3. **Authenticated e2e** — skips without pending items / `E2E_USER_*`.
