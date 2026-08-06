---
document: Folder Policy
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

# Folder Policy

Mandatory tree (Constitution):

```text
app/  features/  shared/{ui,patterns,hooks,lib,utils}  modules/*
providers/  styles/  types/  supabase/  tests/  artifacts/
archive/legacy-v1/
```

| Path | Rule |
|------|------|
| `modules/*` | BC domain/application/infrastructure |
| `features/*` | Feature UI only |
| `shared/ui` | Primitives only |
| Root `components/` | Must not grow |
| `archive/legacy-v1` | No product imports |

Emptiness of a folder is not permission to invent alternate trees.
