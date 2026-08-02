---
document: Business Review Guide
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

# Business Review Guide

| Check | Pass |
|-------|------|
| Business Rules | Cited `BR-*` honored; jars ≠ Balance (BR-01) |
| Requirements | Only cited `REQ-*` implemented |
| Acceptance Criteria | Each touched `AC-*` has a verifiable check |
| No business regression | Existing money/auth/membership behaviors unchanged unless Story says so |
| No invented behavior | No guest mode, no offline write queue, no Categories nav, no sidebar |

**Fail** if behavior is not traceable to SoT.
