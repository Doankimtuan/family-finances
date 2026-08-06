---
document: Definition of Done
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

# Definition of Done (Universal)

A Story is **Done** only when all apply:

1. Implements only the Story scope; no invented behavior
2. Constitution obeyed (stack, folders, imports, tokens, 440px, BR locks)
3. Governance checklist was Pass before coding; PR cites evidence
4. Reuse search performed; new shared abstractions justified via decision matrix
5. Forms use RHF + Zod via shared form components/patterns (not raw RHF in pages)
6. Server state via TanStack Query; Zustand UI-only
7. i18n: all new user-facing strings in `en` **and** `vi`
8. A11y: keyboard, focus visible, labels; WCAG AA for touched UI
9. Loading / Error / Empty / Retry / Offline defined for async UX
10. Money paths: online-only fail-closed; idempotency where Tech Spec requires
11. Tests added/updated; every touched AC is verifiable
12. Reviews completed: code, architecture, business, UI, a11y, localization, security, performance (as applicable)
13. No regressions on [regression-checklist.md](./regression-checklist.md) for blast radius
14. PR matches [pull-request-template.md](./pull-request-template.md)

Sprint Planning DoD may add gates; it must not weaken these.
