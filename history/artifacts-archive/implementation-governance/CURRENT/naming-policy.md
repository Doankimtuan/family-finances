---
document: Naming Policy
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

# Naming Policy

- Components: `PascalCase.tsx`
- Hooks: `useX.ts`
- Schemas: `thing.schema.ts`
- DTOs: `thing.dto.ts`
- Repositories: `thing.repository.ts`
- Actions: `thing.actions.ts`
- Tests: `*.test.ts` / Playwright under `tests/e2e`
- Product terms: Jar, Balance (ledger only), Inbox, Month Ritual, Together — never rename BR/REQ/AC IDs
- No abbreviations; `as const` namespaces in `PascalCase` — full detail: [Coding Standards / naming-policy.md](../../coding-standards/CURRENT/naming-policy.md)
