---
document: UI Review Guide
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

# UI Review Guide

| Check | Pass |
|-------|------|
| Blueprint fidelity | Matches Screen Blueprints for the Story |
| Design System | Uses DS component IDs / tokens |
| Canvas | AppViewport 440px; overlays inside viewport |
| Navigation | No sidebar; IA unchanged |
| Layering | Page → Feature → Pattern → Primitive |
| HeroUI / Phosphor | No alternate kits/icons |
| Dark mode | Token-driven; no hardcoded hex in features |

**Fail** on desktop dashboard layouts or token bypass.
