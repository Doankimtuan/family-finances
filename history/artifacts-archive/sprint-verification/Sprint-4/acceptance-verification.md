# Acceptance Verification — Sprint 4

## Method

Given–When–Then from Spec Sync `acceptance-criteria.md`, plus story intent where catalog AC IDs are misaligned.

---

## AC-RIT-01 (ST-E04-001 primary)

**GIVEN** January ritual unapproved on March 2 (30+ days post month-end)  
**WHEN** the daily background worker executes  
**THEN** status → `PendingReview` and January Jar allocations locked against editing

| Clause | Board |
|--------|-------|
| GIVEN date math (31 Jan + 30 = 2 Mar) | **PASS** — unit `isRitualAutolockDue`; SQL uses equivalent interval |
| WHEN daily background worker | **FAIL** — no schedule; requires authenticated ritual visit |
| THEN status PendingReview | **PARTIAL** — RPC can set `pending_review` if invoked |
| THEN January allocations locked | **FAIL** — plan gates use current period; past `pending_review` does not block jar mutations; `is_month_ritual_locked` unused |

**AC-RIT-01: FAIL**

---

## AC-CAT-01 (catalog maps to ST-E04-002)

**GIVEN** creating category without Jar  
**WHEN** save  
**THEN** block + require Jar dropdown

| Clause | Board |
|--------|-------|
| Literal GWT | **Not Sprint 4 work** — category create was Sprint 1 |
| Story intent EVO-01 divergence | **PASS functionally** — unbound/archived categories block ritual preview/approve |

**Catalog AC claim: FAIL (wrong AC)**  
**Story intent gate: PASS (code), FAIL (tests)**

---

## AC-JAR-02 (catalog maps to ST-E04-003)

**GIVEN** emergency reallocate  
**WHEN** submitted  
**THEN** bypass warn, `is_emergency=true`, partner **device** notification

| Clause | Board |
|--------|-------|
| Delivered in Sprint 4 | **NO** — reflection list only |
| Prior Sprint 2 board | Still open (Inbox ≠ device) |

**AC-JAR-02 via ST-E04-003: FAIL (carryover / mis-mapped)**

---

## Implicit acceptance (no Spec AC ID)

| Behavior | Source | Board |
|----------|--------|-------|
| Quick Close unlock at 6 | REQ-RIT-03 / BR-23 / TSK-E04-003-QA | **PARTIAL** — helpers PASS; persistence untested |
| Emergency list in Step 3 | REQ-RIT-02 / EVO-06 | **PARTIAL** — list PASS; mandatory FAIL |
| Pending-review banner | TSK-E04-001-FE | **PASS** UI present for **current** period only |

---

## Story AC scorecard

| Story | Claimed ACs | Board |
|-------|-------------|-------|
| ST-E04-001 | AC-RIT-01 | **FAIL** |
| ST-E04-002 | AC-CAT-01 | **FAIL claim** / intent partial |
| ST-E04-003 | AC-JAR-02, AC-RIT-01 | **FAIL** |

Under board rules: **zero of three stories fully COMPLETE**.
