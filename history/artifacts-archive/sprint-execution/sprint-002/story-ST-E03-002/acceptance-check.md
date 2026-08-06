# ST-E03-002 — Acceptance Check

| Criterion | Evidence | Status |
|-----------|----------|--------|
| AC-012 one household | Accept fails if invitee already member; unique active membership | PASS |
| AC-020 partners equal daily | New members join as `partner` role | PASS |
| BR-12 | Max two active partners; pending invite uniqueness | PASS |
| BR-02 | Invitations require auth; accept requires session | PASS |
| List members | Together hub Avatars + role labels | PASS |
| Send / revoke invite | Invitations screen + RPC | PASS |
| Accept / decline deep link | `/invite/[token]` | PASS |
| i18n en/vi | `together.*` parity | PASS |

## Verdict

**ACCEPTED** for ST-E03-002.
