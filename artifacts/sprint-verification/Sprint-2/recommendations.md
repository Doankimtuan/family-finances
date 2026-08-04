# Recommendations — Sprint 2 (file-level)

Do **not** implement in this verification pass.

---

## R1 — Prove AC-JAR-01 / AC-JAR-02 on a real path (B1)

1. Add command-layer tests mocking `reallocate_jar_capacity` RPC payload (parity with Sprint-1 command tests).
2. Add DB integration (local Supabase or remote smoke harness) asserting:
   - `jars.capacity_delta` source −100 / target +100
   - `plan_movements.ledger_impact = 0`
   - `count(transactions)` unchanged
   - account `opening_balance` + ledger-derived balances unchanged
3. For emergency: assert `is_emergency`, `intent_note`, inbox row `kind = emergency_declaration`.
4. Optional Playwright: open jar detail → reallocate → emergency checkbox → see banner/inbox.

Touch: `tests/unit/sprint2-*.test.ts`, new `tests/integration/…`, optionally `tests/e2e/plan-jars.smoke.spec.ts`.

---

## R2 — Close BR-13 / AC device gap (B2)

**Preferred product path:** deliver partner-targeted notification (even minimal):

- Insert inbox item **and** filter/banner that surfaces for other members (exclude declarer or mark unread for partners).
- If push infra absent, document Alpha1 acceptance **in Spec** before claiming COMPLETE — Verification Board will not invent waivers.

Files today:  
`supabase/migrations/20260804080000_sprint2_plan_movements_emergency.sql`  
`app/.../plan/emergency-inbox-banner.tsx`  
`modules/inbox/**`

---

## R3 — Enforce BR-06 / BLOCK (B3)

1. Extend `shouldShowOverspendWarning` or add `canReallocateCapacity({ policy, sourceCapacity, amount })`.
2. In `reallocate-jar-capacity.ts`, reject when `OverspendPolicy.BLOCK` and move would violate floor.
3. Mirror check in RPC for defense in depth.
4. Unit tests for WARN vs BLOCK vs ALLOW_NEGATIVE.

Files:  
`modules/plan/application/plan-movement-policy.ts`  
`modules/plan/application/commands/reallocate-jar-capacity.ts`  
`supabase/migrations/` (new additive migration)

---

## R4 — Non-blocking cleanups

| Action | Files |
|--------|-------|
| Import command schema in form (or shared factory) | `reallocate-jar-form.tsx`, `reallocate-jar-capacity.schema.ts` |
| Make warn checkbox authoritative or remove dead control | `reallocate-jar-form.tsx` |
| Add `InboxSourceType.PLAN_MOVEMENT` constant | `inbox-constants.ts` |
| Correct TD-S2-04 in execution pack (stale) | `artifacts/sprint-execution/Sprint-2/technical-debt.md` |
| Consider slider if product insists on task text | FE form |

---

## R5 — Process

1. Do not start Sprint 3 until B1–B3 closed (or B2 formally Spec-amended).
2. Keep Spec budgets → `modules/plan` mapping; do not invent `modules/budgets/`.
3. Prefer extracting Inbox writes from plan RPC to an application orchestration step before Sprint 3 typed ReviewItem work expands.
