---
document: Forms Policy
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

# Forms Policy

1. Every form uses **React Hook Form** + **Zod**.
2. Every form must use **shared form components / patterns** (`shared/ui` + `shared/patterns` / Engineering Review form patterns).
3. **Never** wire RHF directly inside pages (`app/**/page.tsx`). Pages compose feature form components.
4. Validation schemas are single-sourced; server re-validates with the same Zod schema.
5. No duplicated validation logic in UI and API.
6. Error messages go through localization helpers.
