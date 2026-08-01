# Folder Structure

## Canonical tree

```
ai-os/
├── README.md
├── AGENTS.md
├── VERSION
├── docs/architecture/           # AIOS framework docs (NOT product architecture input)
├── artifacts/product-architecture/   # Product architecture observations (logical docs/architecture/ for SA)
├── artifacts/knowledge/              # Product RE / SA consume
├── artifacts/features/               # Product RE / SA consume
├── artifacts/business/               # Product RE / SA consume
├── governance/quality/                # Solution Architecture consume
├── artifacts/product/                # Product RE produce
├── artifacts/workflow/               # Product RE produce
├── artifacts/requirements/           # Product RE produce / SA consume
├── artifacts/acceptance/             # Product RE produce
├── artifacts/gaps/                   # Product RE produce (product-re-gap mirrors)
├── artifacts/redesign/               # Solution Architecture produce
├── artifacts/architecture-v2/        # Solution Architecture produce
├── artifacts/tech-stack/             # Solution Architecture produce
├── artifacts/migration/              # Solution Architecture produce
├── artifacts/folder-structure/       # Solution Architecture produce
├── governance/decision-records/       # Solution Architecture produce (ADRs)
├── artifacts/repository/             # Specification Engineering soft input
├── artifacts/specifications/         # Specification Engineering produce
├── artifacts/tasks/                  # Specification Engineering produce
├── artifacts/roadmap/                # Specification Engineering produce
├── artifacts/implementation/         # Specification Engineering produce
├── artifacts/validation/             # Validation Engine produce (findings/status)
├── artifacts/reports/                # Validation Engine produce (PASS/FAIL reports)
├── artifacts/scores/                 # Validation Engine produce (quality-scores)
├── artifacts/              # Validation Engine soft consume (→ runtime/artifacts)
├── artifacts/execution/              # Validation Engine soft consume (lifecycle notes)
├── core/                   # Core Engine (TypeScript control plane)
│   ├── planner/
│   ├── orchestrator/
│   ├── artifacts/
│   ├── memory/
│   ├── artifacts/knowledge/
│   ├── core/packages/schemas/
│   ├── core/packages/templates/
│   ├── core/packages/configs/
│   └── scripts/
├── core/packages/schemas/
├── core/packages/templates/
│   └── worker/
├── core/packages/contracts/
├── governance/policies/
├── core/packages/pipelines/              # discovery + product-re + solution-architecture + specification-engineering + validation-engine
├── core/packages/registry/
├── core/packages/roles/
├── runtime/
├── skills/
├── core/packages/validators/
├── core/packages/reviewers/
└── core/packages/workers/                # Discovery + Product RE + SA + Spec Eng + Validation Engine (Feature Workers forbidden)
```

## Runtime layout

```
runtime/artifacts/<art_id>/v<n>/meta.json + payload.*
```

Prefer writing under `runtime/artifacts/`. Working folders hold templates + published mirrors only.

## Placement rules

| Content | Location |
|---------|----------|
| AIOS conventions | `docs/architecture/` |
| Product architecture observations | `artifacts/product-architecture/` |
| Quality / debt inputs | `governance/quality/` (SA); additive `governance/quality/validation-scorecard/` for VE |
| Solution redesign outputs | `artifacts/redesign/`, `artifacts/architecture-v2/`, `artifacts/tech-stack/`, `artifacts/migration/`, `artifacts/folder-structure/`, `governance/decision-records/` |
| Spec engineering outputs | `artifacts/specifications/`, `artifacts/tasks/`, `artifacts/roadmap/`, `artifacts/implementation/` (+ soft `artifacts/repository/`) |
| Validation engine outputs | `artifacts/validation/`, `artifacts/reports/`, `artifacts/scores/` |
| Machine contracts | `core/packages/schemas/` |
| Core Engine code | `core/` |
| Catalogs | `core/packages/registry/` |
| Executors | `core/packages/workers/` |
| Pipelines | `core/packages/pipelines/discovery/`, `core/packages/pipelines/product-re/`, `core/packages/pipelines/solution-architecture/`, `core/packages/pipelines/specification-engineering/`, `core/packages/pipelines/validation-engine/` |
