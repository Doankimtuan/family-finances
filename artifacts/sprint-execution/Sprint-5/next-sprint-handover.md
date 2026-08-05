# Next Sprint Handover

## Stop

Sprint 5 (Spec v2.1 Implementation Planning) is **COMPLETE**. Do **not** start Sprint 6 automatically.

## Suggested next

**Sprint 6 — EPIC 6: Health Read-Only Shield & GA Hardening**

| Story | Focus |
|-------|-------|
| `ST-E06-001` | Health domain DB read-only shield (BR-24) |
| `ST-E06-002` | AI non-invention policy guards (BR-14) |
| `ST-E06-003` | Multi-tier regression & GA readiness |

Plan SoT: `artifacts/implementation-planning/CURRENT/sprint-plan.md`

## Prerequisites for Sprint 6

- [ ] Approve this Sprint 5 pack
- [ ] Confirm Calendar route `/plan/calendar` in target UIs
- [ ] Health module already exists — harden RO, do not invent balances

## Do not

- Invent `modules/calendar/` after the fact
- Re-open rewrite freezes
- Treat jar intention as bank Balance in Health
