---
document: Release Checklist
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

# Release Checklist

Before shipping a sprint/MVP cut:

- [ ] All committed Stories Done per universal DoD
- [ ] Governance + Constitution obeyed on main
- [ ] No CRITICAL open regressions
- [ ] Auth + membership fail-closed verified
- [ ] Money paths: BR-01 + BR-15 verified
- [ ] i18n en/vi complete for shipped surfaces
- [ ] A11y smoke on critical journeys
- [ ] Performance CWV guidance reviewed
- [ ] Security review on auth/money surfaces
- [ ] Observability: request_id / error reporting as Architecture requires
- [ ] Migrations reviewed; RLS enabled
- [ ] Release notes / change log updated if project requires
