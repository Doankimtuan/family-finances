# Blocking Issues — Sprint 2

Must resolve before Sprint 3 starts and before marking Sprint 2 stories COMPLETE.

---

## B1 — AC GWT not verified at Integration/E2E tier

| Field | Value |
|-------|--------|
| Severity | **P0 Blocking** |
| Rules | Story DoD; testing-strategy Tier 2–3; TSK-E02-001-QA / 002-QA / 003-QA |
| Symptom | Unit helpers sold as AC proof; no commit path tested |
| Evidence | `tests/unit/sprint2-plan-movements.test.ts` (pure); `tests/integration/` empty; no reallocate E2E |
| Required outcome | At least one automated test proving: capacity ±amount persisted, `transactions` count unchanged, account balances unchanged, emergency inserts inbox with `is_emergency` |

---

## B2 — AC-JAR-02 partner device notification unmet

| Field | Value |
|-------|--------|
| Severity | **P0 Blocking** (literal AC) |
| Rules | AC-JAR-02 THEN; ST-E02-003; BR-13 device language in tasks |
| Symptom | Partner alert = household Inbox + Plan banner only |
| Evidence | Migration inbox insert; `emergency-inbox-banner.tsx`; TD-S2-02 |
| Required outcome | Either (a) ship a real partner notification channel (push/email/in-app realtime to other members), **or** (b) obtain Spec amendment that Alpha1 accepts shared Inbox as AC-JAR-02 notification — board cannot waive SoT unilaterally |

Until (a) or (b), ST-E02-003 is incomplete.

---

## B3 — BR-06 / `OverspendPolicy.BLOCK` not enforced

| Field | Value |
|-------|--------|
| Severity | **P0 Blocking** |
| Rules | ST-E02-001 lists BR-06; tenancy `OverspendPolicy.BLOCK` |
| Symptom | Reallocate never floors capacity; BLOCK policy ignored |
| Evidence | `plan-movement-policy.ts:15-16` only checks WARN; RPC capacity update unconstrained |
| Required outcome | When policy is BLOCK, reject reallocations that would violate capacity rules (define floor: e.g. source remaining intention ≥ amount); WARN remains acknowledge path |

---

## Non-blocking (tracked)

- Slider missing (AmountField) — TD-V2-04  
- Warn “modal” → inline step  
- Form Zod duplication — TD-S2-03  
- Cross-BC inbox insert in plan RPC — TD-V2-02  
- Pack TD-S2-04 stale (updateTransaction already immutable)  
- Month Ritual Step 3 emergency surface — Sprint 4  

---

## Sprint readiness

| Question | Answer |
|----------|--------|
| Can Sprint 3 start? | **No** until B1–B3 closed (or B2 Spec-amended) |
| Reopen Sprint 2? | **Yes — required-fix reopen** |
| Freeze pack trustworthy as COMPLETE? | **No** |
