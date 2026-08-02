---
document: Testing Policy
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

# Testing Policy

| Layer | Required when |
|-------|----------------|
| Unit | Domain rules, Zod schemas, pure utils |
| Integration | Application services / repositories for touched flows |
| E2E | Critical journeys touched (auth, capture, inbox, ritual, offline fail-closed, keyboard) |
| Visual | Significant UI chrome changes (screenshot/manual checklist acceptable if tooling absent) |
| Accessibility | Interactive UI — keyboard path + labels at minimum |
| Acceptance mapping | **Every** touched AC must be verifiable (test name, checklist, or e2e tag) |

No Story is Done without AC verifiability.
