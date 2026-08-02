---
document: Code Review Guide
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

# Code Review Guide

| Area | Measurable pass criteria |
|------|--------------------------|
| Naming | Domain terms match glossary; files match naming-policy |
| Readability | Functions generally &lt; 50 lines; files generally &lt; 300 lines unless justified |
| Maintainability | Single responsibility; no commented-out dead code |
| Complexity | No deeply nested conditionals (&gt;3) without extraction |
| Reuse | No duplicate of `shared/*` or Engineering Review inventory |
| Performance | No unjustified client waterfalls; lists virtualized when long |
| Accessibility | Interactive elements keyboardable; labels present |
| Localization | No new hardcoded user strings |
| Architecture | Import graph legal; no UI→Supabase |
| Security | Validation + authz on mutations |
| Testing | AC covered; critical paths have tests |

**Fail** any row that violates Constitution → request changes.
