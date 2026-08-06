---
document: Regression Checklist
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

# Regression Checklist

Run against the Story blast radius before Done:

- [ ] Auth session still works (if auth/shell touched)
- [ ] AppViewport 440px + bottom nav intact
- [ ] Locale switch en ↔ vi still works
- [ ] Dark / light theme still works
- [ ] No Categories nav / sidebar reintroduced
- [ ] BR-01 labels (Balance vs Jar) intact on money surfaces
- [ ] Money offline fail-closed still holds when money touched
- [ ] No imports from archive
- [ ] No new root `components/` files
- [ ] Existing Playwright/unit suites for touched areas pass
