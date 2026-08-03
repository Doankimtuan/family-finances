# ST-E07-002 — Known Limitations

1. **No persisted `health_snapshots` / `insights` / `scenarios` tables** — derived in-memory from ledger/plan/inbox (same approach as Health pulse).
2. **EMI celebrate requires pending Inbox item** — Money installment engines (ST-E04-004) enqueue items; Health only surfaces them.
3. **Phase 2 AI not implemented** — guardrail copy establishes BR-14; no model calls.
4. **Authenticated e2e** — skips without `E2E_USER_*`.
