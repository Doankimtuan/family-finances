---
document: Architecture Review Guide
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

# Architecture Review Guide

| Check | Pass |
|-------|------|
| Module boundaries | Change sits in correct `modules/*` BC |
| Dependencies | No forbidden cross-module imports (ledger↛plan/inbox/health, etc.) |
| Shared ownership | New shared code has clear owner (`shared/ui` vs `patterns` vs `lib`) |
| Circular dependencies | None introduced |
| Folder violations | No growth of root `components/`; features vs modules ownership correct |
| Domain leaks | Domain layer free of React/Next/Supabase |
| Business leaks | No invented BR; product terms correct |
| Infrastructure leaks | Supabase only in `modules/*/infrastructure` or platform |

**Fail** on any boundary violation in touched files.
