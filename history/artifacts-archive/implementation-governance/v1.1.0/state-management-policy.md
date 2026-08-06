---
document: State Management Policy
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

# State Management Policy

## Decision matrix

| State kind | Use | Not |
|------------|-----|-----|
| Server/remote data | TanStack Query (or RSC fetch at route) | Zustand, random context caches |
| Ephemeral UI (open/step/tab) | Local React state | Query |
| Cross-tree UI chrome state | Zustand (UI only) or focused context | Server entity mirrors |
| Form state | RHF | Zustand |
| Theme | next-themes | Custom parallel theme store |
| URL state | Search params / next-intl router | Duplicated React state |

## Rules

1. Do not duplicate server data in Zustand.
2. Prefer Server Components; Client Components only when required.
3. Context for dependency injection of UI state is allowed; do not use context as a global server cache.
