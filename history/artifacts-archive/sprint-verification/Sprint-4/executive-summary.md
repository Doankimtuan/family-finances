# Executive Summary — Sprint 4 Verification

## Verdict

**🟡 APPROVED WITH REQUIRED FIXES**

Sprint 4 ships a credible Month Ritual maturity scaffold (schema, RPCs, application gates, ritual UI). It does **not** satisfy AC-RIT-01 end-to-end, nor the EPIC 4 Definition of Done across testing tiers. The execution freeze claiming COMPLETE is **not ratified**.

## Story completeness (board)

| Story | Execution claim | Board result |
|-------|-----------------|--------------|
| `ST-E04-001` | COMPLETE | **INCOMPLETE** — no scheduled worker; allocation lock hollow for auto-locked past periods |
| `ST-E04-002` | COMPLETE | **PARTIAL** — divergence gate works; wrong AC mapping (AC-CAT-01); no Tier-2 proof |
| `ST-E04-003` | COMPLETE | **PARTIAL** — Quick Close UI + streak exist; emergency reflection not mandatory; AC-JAR-02 carryover |

## Top findings

1. **AC-RIT-01 WHEN unmet** — Tech Spec requires daily 01:00 UTC worker; shipped = authenticated page-open RPC only (`void runMonthRitualAutolockWorker()`).
2. **AC-RIT-01 THEN unmet for Jar lock** — Auto-lock becomes due only after `month_end + 30`, when `currentPeriodMonth` has already advanced. Plan mutations call `assertPlanPeriodUnlocked(householdId)` with **current** period only. `is_month_ritual_locked` is unused by app code. Past-month `pending_review` does not lock live jar plan edits.
3. **Testing sold as AC proof is helper-only** — date math / threshold constants; no RPC, divergence query, or streak persistence tests; Playwright ritual smoke not extended.
4. **REQ-RIT-02 “mandatory” reflection** — emergencies listed optionally; approve/Quick Close not gated on review.
5. **ST-E04-002 / ST-E04-003 AC catalog mismatch** — divergence ≠ AC-CAT-01 GWT; Quick Close / reflection lack dedicated ACs; catalog attaches AC-JAR-02 (device notify) which remains open from Sprint 2.

## Sprint 5 readiness

| Gate | Status |
|------|--------|
| Start Sprint 5 now? | **NO** |
| Reopen Sprint 4? | **YES (required fixes)** |
| After B1–B4 + re-check? | Sprint 5 may start |

## Overall score

**5.7 / 10** — see [scorecard.md](./scorecard.md)
