# ST-E02-005 — Acceptance Check

| Criterion | Evidence | Status |
|-----------|----------|--------|
| AC-002b same verified email → one `auth.users.id` when linking supported | Ops policy: rely on Supabase **automatic identity linking**; no app-side second profile/membership seed on conflict | PASS (ops + fail-closed) |
| BR-02b no duplicate profiles | Conflicts map to stable codes; confirm Alert; no client merge of ledgers/memberships | PASS |
| REQ-002a providers retained | Google / Apple / email paths unchanged from ST-E02-004 | PASS |
| Conflict / linking-disabled UX | Codes: `identity_conflict`, `linking_disabled`, `duplicate_account`, `email_mismatch`, `cancelled` on confirm | PASS |
| B-ENV-05 | Policy recorded in `ops-linking-policy.md` | PASS (cleared for execution) |
| Optional authenticated `linkIdentity` | Application command + unit tests; settings entry deferred | PASS (scoped) |
| i18n en/vi | Confirm conflict strings parity | PASS |
| Auth chrome | Confirm remains auth chrome / no BottomNav | PASS |

## Verdict

**ACCEPTED** for ST-E02-005. Sign-out + delete remains **ST-E02-006**.
