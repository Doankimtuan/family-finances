---
document: Localization Review
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

# Localization Review

Follow Localization Foundation (`artifacts/localization/CURRENT`).

| Check | Pass |
|-------|------|
| No hardcoded UI copy | Strings in message catalogs |
| en + vi | Both locales updated together |
| Namespaces | Correct namespace per strategy |
| Formatting | Money/date via shared formatters |
| Zod messages | Localized via shared i18n helpers |
| Locale switch | Does not break AppViewport flows |

**Fail** on English-only user-facing strings in product UI.
