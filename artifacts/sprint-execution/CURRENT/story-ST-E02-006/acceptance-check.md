# ST-E02-006 — Acceptance Check

| Criterion | Evidence | Status |
|-----------|----------|--------|
| AC-002a lifecycle sign-out | `/auth/signout` clears session cookies; redirect Login | PASS |
| No guest after logout | Money still requires session; sign-out → login | PASS |
| Delete account privileged path | `createSupabaseAdminClient` + `server-only`; never on client | PASS |
| Delete confirm UX | Together Account card two-step confirm | PASS |
| Fail closed without service role | `unconfigured` when `SUPABASE_SERVICE_ROLE_KEY` missing | PASS |
| i18n en/vi | `auth.account.*` parity | PASS |
| REQ-002a / BR-02 | Session required for delete; no anonymous product access invented | PASS |

## Verdict

**ACCEPTED** for ST-E02-006. **S1 committed stories complete.**
