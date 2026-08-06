# ST-E02-006 — Known Limitations

1. **`SUPABASE_SERVICE_ROLE_KEY` required** for delete happy path — documented in `.env.local.example`; fail closed otherwise.
2. **IdP sessions** — Google/Apple IdP session may persist after app sign-out (expected).
3. **Household/ledger cascade** — Auth user delete only; tenant data cleanup is S2+ schema policy.
4. **Re-auth step** — Password re-entry before delete deferred; recent session accepted for MVP.
