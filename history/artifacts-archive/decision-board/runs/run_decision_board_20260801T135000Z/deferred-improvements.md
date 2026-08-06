# Deferred Improvements

**Decision Board run:** `run_decision_board_20260801T135000Z`  
**Created:** 2026-08-01T13:47:04Z

Deferred items may re-enter a later decision cycle. They are **excluded** from Spec v2 now.

## IMP-011 — Major: consolidate read/write contracts behind shared domain modules

**Verdict:** DEFER  
**Score:** 3

**Why:** Major consolidate increases architectural risk and migration complexity before catalog+tests prove hotspots; little immediate Spec v2 need.

**Revisit when:** After IMP-005 and IMP-007 land and duplicate validation paths are measured as hotspots.

**Defer reasons:**
- architectural risk
- migration complexity
- implementation cost not justified for Spec v2 adoption

## IMP-012 — Major: API versioning policy for public JSON routes

**Verdict:** DEFER  
**Score:** 0

**Why:** API path versioning is premature for a single Next.js client; little business value now; risks churn without external consumers.

**Revisit when:** External/mobile clients need stable public API contracts beyond the Next app.

**Defer reasons:**
- little business value
- unnecessary complexity
- premature / trend for single-client app

## IMP-013 — Future: assistive insights UX (non-generative ledger changes)

**Verdict:** DEFER  
**Score:** 14

**Why:** Assistive insights UX is nice-to-have; weak urgency vs foundations; avoid trend-led scope expansion.

**Revisit when:** After acceptance, a11y, and observability baselines are adopted and insights surfaces show clear UX friction.

**Defer reasons:**
- little immediate business value vs foundations
- risk of trend-chasing AI UX

