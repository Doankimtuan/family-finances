---
document: Definition of Ready
implementation_governance: v1.0.0
status: OFFICIAL_IMPLEMENTATION_GOVERNANCE
run_id: run_implementation_governance_20260802T021300Z
created_at: 2026-08-02T02:14:36Z
board: Implementation Governance Board
frozen: true
constitution_sot: artifacts/developer-constitution/CURRENT
engineering_patterns_sot: artifacts/engineering-review/CURRENT
localization_sot: artifacts/localization/CURRENT
architecture_sot: artifacts/architecture-definition/CURRENT
technical_sot: artifacts/technical-specification/CURRENT
---

# Definition of Ready (Universal)

Applies to **every** Story in every Sprint. Sprint Planning may add sprint-specific rows; it cannot remove these.

## Must be true

1. Story ID exists and is selected for the active sprint (or explicitly authorized)
2. Dependencies earlier in the sprint order are Done or explicitly waived
3. REQ / AC / BR cited for product-facing work (or N/A documented for shell-only)
4. Architecture placement known: `app` / `features` / `shared` / `modules`
5. Screen Blueprint / Design System references known (or N/A)
6. Localization namespaces known (`messages/en`, `messages/vi`)
7. Security-sensitive surfaces identified (auth, money, PII)
8. Test approach known (unit / integration / e2e as applicable)
9. [implementation-checklist.md](./implementation-checklist.md) can be completed without FAIL
10. No Phase-2 / out-of-sprint scope smuggled in

## Not Ready → do not start

Ambiguous AC, missing env for Auth stories (execution STOP), unknown module ownership, or checklist failure.
