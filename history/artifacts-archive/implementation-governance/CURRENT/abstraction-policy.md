---
document: Abstraction Policy
implementation_governance: v1.1.0
status: OFFICIAL_IMPLEMENTATION_GOVERNANCE
run_id: run_implementation_governance_20260802T153000Z
created_at: 2026-08-02T15:30:00Z
board: Implementation Governance Board
frozen: true
constitution_sot: artifacts/developer-constitution/CURRENT
engineering_patterns_sot: artifacts/engineering-review/CURRENT
localization_sot: artifacts/localization/CURRENT
architecture_sot: artifacts/architecture-definition/CURRENT
technical_sot: artifacts/technical-specification/CURRENT
---

# Abstraction Policy

1. **Never** create an abstraction for a single use case (wait for Rule of Three — third real use).
2. **Rule of Three:** third duplication triggers extract (earlier only if Design System requires the primitive now).
3. Prefer **composition** over inheritance.
4. Prefer **headless / pattern** components with token styling over style-only wrappers.
5. Avoid speculative engineering and premature optimization.
6. No giant components (&gt;300 lines without split plan).
7. No giant hooks (multiple unrelated responsibilities).
8. No god utilities (catch-all `helpers.ts`).
9. Abstractions APIs must be typed and tested.
10. If Engineering Review lists a target abstraction, prefer that path over a new parallel one.
