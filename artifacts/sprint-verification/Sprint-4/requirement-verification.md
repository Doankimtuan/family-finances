# Requirement Verification — Sprint 4

Trace: Story → REQ → Implementation evidence.

---

## ST-E04-001 → REQ-RIT-01

| REQ | Statement | Implementation | Board |
|-----|-----------|----------------|-------|
| **REQ-RIT-01** | Automatically transitions uncompleted rituals > 30 days to `PendingReview` lock | RPC `run_month_ritual_autolock_worker` + page-open invoke | **PARTIAL** — transition logic exists; not automatic/scheduled; lock of allocations ineffective for past periods |

Also touches **BR-15** month-lock half (REQ-INB-03 adjacent): unmapped resolve on autolock — **PARTIAL** (session-bound).

---

## ST-E04-002 → REQ-CAT-01, REQ-RIT-01

| REQ | Statement | Implementation | Board |
|-----|-----------|----------------|-------|
| **REQ-CAT-01** | Enforce N:1 Category↔Jar | Ritual-time divergence over period spend + gate | **PARTIAL** — enforces mapping for ritual progression; does not re-verify category *creation* (that was Sprint 1 / AC-CAT-01) |
| **REQ-RIT-01** | (catalog lists) | Divergence is not REQ-RIT-01; catalog noise | **N/A** |

Story intent (EVO-01) is met functionally for preview/approve blocking. Requirement ID attachment is imprecise.

---

## ST-E04-003 → REQ-RIT-02, REQ-RIT-03

| REQ | Statement | Implementation | Board |
|-----|-----------|----------------|-------|
| **REQ-RIT-02** | Surfaces declared emergencies for **mandatory** reflection | `listRitualEmergencies` + optional UI section | **FAIL** on “mandatory” |
| **REQ-RIT-03** | Unlocks 1-tap Quick Close after 6 consecutive | Streak column + UI CTA + `quickClose` approve path | **PARTIAL** — unlock works when streak ≥ 6; no partner dual-approve; no Tier-2 proof of streak persistence |

Catalog also lists **AC-JAR-02** (emergency device notify). That REQ is **REQ-JAR-02** / BR-13 device channel — still unmet from Sprint 2; not re-delivered here.

---

## Extra behavior (not required)

- Fire-and-forget autolock on every ritual page open (acceptable opportunistic fallback **if** cron exists; insufficient alone).
- Autolock creates ritual rows for months with unmapped-only traffic — reasonable extension of BR-15.
- Streak reset on autolock — sound for BR-23 integrity.

## Missing behavior

| Gap | REQ / BR |
|-----|----------|
| Scheduled daily worker | REQ-RIT-01, Tech Spec §2.1 |
| Retro-active allocation / category mapping lock for auto-locked periods | BR-08, Month Lifecycle Step 4 |
| Mandatory emergency acknowledge | REQ-RIT-02 |
| Health snapshot on close (lifecycle Step 4) | Out of Sprint 4 explicit stories; noted as non-delivered EVO step |

---

## Requirement score

**5.5 / 10**
