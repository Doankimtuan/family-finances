# ST-E04-002 — Known Limitations

1. **Transfers** — income/expense only; transfer type deferred.
2. **Jar movements** — resolve sets `transactions.jar_id` but does not write `jar_movements` (Plan epic).
3. **Auto income** — Auto mode currently enqueues Inbox like Suggest (no silent auto-split yet).
4. **Household category tags** — system tags only; custom household tags UI deferred.
5. **Authenticated e2e save** — capture happy-path write skips without `E2E_USER_*` / household.
6. **Transaction edit/list** — detail/edit is `ST-E04-003`.
