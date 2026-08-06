---
document: Implementation Rules
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

# Implementation Rules

1. Read Governance → Constitution → Engineering Review → Localization → Story SoTs before coding.
2. Complete pre-story checklist; **STOP** on any fail.
3. Implement **one Story** at a time per Sprint contract.
4. Reuse before create; record decisions for new shared code.
5. Obey folder and import law (`app` / `features` / `shared` / `modules`).
6. Tokens only; HeroUI + Phosphor only; AppViewport 440px; no sidebar.
7. RHF + Zod via shared form layer; never raw RHF in pages.
8. TanStack Query for server state; Zustand UI-only.
9. No UI Supabase; repositories/infrastructure only.
10. Every AC verifiable; no invented behavior.
11. i18n en+vi for all new UI copy.
12. Async UX must define Loading / Error / Empty / Retry / Offline.
13. Ambiguity → STOP and ask. Never guess.
