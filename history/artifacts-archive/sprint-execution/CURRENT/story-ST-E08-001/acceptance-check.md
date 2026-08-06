# ST-E08-001 — Acceptance Check

| Criterion | Evidence | Status |
|-----------|----------|--------|
| AC-018 offline fail-closed | `/offline` + Money/Plan/Inbox escalate banners | PASS |
| AC-018 no offline writes | Offline shell + mutation banners; no write queue | PASS |
| AC-020 partner vs admin | `/permission` + policies learn-roles / FORBIDDEN redirect | PASS |
| BR-15 online-first mutations | Offline shell copy; banners block escalate path | PASS |
| BR-13 admin elevation visible | Permission shell explains Admin gate | PASS |
| Screens | error, offline, permission, maintenance | PASS |
| Health not 6th tab | System chrome without BottomNavigation | PASS |

## Verdict

**ACCEPTED** for ST-E08-001. Next story: `ST-E04-004` (Debts savings and cards/EMI surfaces).
