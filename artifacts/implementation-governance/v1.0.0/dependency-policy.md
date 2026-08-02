---
document: Dependency Policy
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

# Dependency Policy

## Allowlist (locked stack)

Next.js 16, React, TypeScript, Tailwind v4, HeroUI v3, React Aria, tailwind-variants, Motion, Phosphor, RHF, Zod, Zustand, TanStack Query, Supabase, next-themes, Recharts, date-fns, next-intl (Localization Foundation).

## Deny

- Alternate UI kits / icon libraries
- CSS Modules / Styled Components / Emotion
- Redux and other server-state stores
- Random utility mega-libraries that duplicate existing shared helpers
- Anything not required by a Story and Constitution

## Process

New dependency → must cite Story need + Constitution compatibility in PR. Otherwise **STOP**.
