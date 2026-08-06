---
document: Hooks Policy
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

# Hooks Policy

1. Shared hooks live in `shared/hooks`.
2. Feature-only hooks live under `features/<feature>/hooks` and must not be imported cross-feature.
3. Hooks must not call Supabase directly.
4. Hooks that fetch server data must use TanStack Query (or RSC + props), not ad-hoc `useEffect` fetch soup.
5. One hook ≈ one responsibility.
6. Create shared hooks only per decision matrix / Rule of Three.
7. Prefer derived state over `useEffect`; memoize only with a measured justification — see [Coding Standards / react-patterns.md](../../coding-standards/CURRENT/react-patterns.md).
