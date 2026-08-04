# Executive Summary — Sprint 2 Verification

**Verdict: 🟡 APPROVED WITH REQUIRED FIXES**

Sprint 2 delivers a **credible BR-01 plan-movement engine**: `plan_movements` with hard `ledger_impact = 0`, `jars.capacity_delta` virtual shifts, SECURITY DEFINER `reallocate_jar_capacity` with a post-condition ledger-row count guard, emergency metadata (`is_emergency` + `intent_note`), and household Inbox visibility for emergencies.

The sprint is **not Spec-complete** under Verification Board rules. Stories must not remain frozen as COMPLETE.

## Why not APPROVED

1. **Story DoD testing gate failed.** AC-JAR-01 / AC-JAR-02 are covered by pure policy/schema unit tests only — no command/RPC mock integration, no live DB proof of zero ledger rows or unchanged bank balances, no E2E for partner notification (`definition-of-done.md`).
2. **AC-JAR-02 partner-device notification unmet.** Spec THEN requires notification to the partner’s **device**; implementation is shared household Inbox + Plan banner only (documented as TD-S2-02, still fails literal AC).
3. **BR-06 / `OverspendPolicy.BLOCK` not enforced on reallocate.** Capacity can move without floor; `BLOCK` neither warns nor blocks (`plan-movement-policy.ts` only handles `WARN`).

## What is solid

| Area | Assessment |
|------|------------|
| BR-01 zero ledger write path | Strong (schema + RPC guard + no account mutation) |
| Emergency flag + required intent note | Present (DB check + Zod + UI) |
| Warn bypass when emergency | Policy + command gate present |
| Partner in-app visibility | Inbox kind + Plan banner |
| Constants discipline (app TS) | Strong |
| Unit suite green | 206/206 (re-verified) |
| Health-RO / Architecture redesign | No regression |

## Sprint readiness

| Question | Answer |
|----------|--------|
| Can Sprint 3 start now? | **No** |
| Must Sprint 2 be reopened? | **Yes — for required fixes only** |
| Overall score | **6.6 / 10** |

See [blocking-issues.md](./blocking-issues.md) and [final-verdict.md](./final-verdict.md).
