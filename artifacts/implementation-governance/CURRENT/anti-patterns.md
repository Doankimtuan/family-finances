---
document: Anti-Patterns
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

# Anti-Patterns (Forbidden)

| Anti-pattern | Why forbidden |
|--------------|---------------|
| Parallel UI kit / custom Button system | Design drift |
| Growing root `components/` | Constitution violation |
| RHF wired directly in `page.tsx` | Forms policy |
| Zustand storing server entities | State drift / dual cache |
| UI importing Supabase | Architecture leak |
| Hardcoded colors/spacing | Token bypass |
| Hardcoded English strings | i18n bypass |
| Offline money write queue | BR-15 |
| Jar labeled “Balance” | BR-01 |
| Sidebar / desktop dashboard chrome | Mobile Native doctrine |
| God hook / god util / 1k-line component | Maintainability |
| Speculative “future flex” abstractions | YAGNI |
| Importing archive legacy | Rewrite integrity |
| Inventing AC/REQ/BR | Business drift |
| Multi-story mega PRs | Review failure |
