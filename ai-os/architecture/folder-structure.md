# Folder Structure

## Canonical tree

```
ai-os/
├── README.md
├── AGENTS.md
├── VERSION
├── architecture/           # AIOS framework docs (NOT product architecture input)
├── product-architecture/   # Product architecture observations (logical architecture/ for SA)
├── knowledge/              # Product RE / SA consume
├── features/               # Product RE / SA consume
├── business/               # Product RE / SA consume
├── quality/                # Solution Architecture consume
├── product/                # Product RE produce
├── workflow/               # Product RE produce
├── requirements/           # Product RE produce / SA consume
├── acceptance/             # Product RE produce
├── gaps/                   # Product RE produce (product-re-gap mirrors)
├── redesign/               # Solution Architecture produce
├── architecture-v2/        # Solution Architecture produce
├── tech-stack/             # Solution Architecture produce
├── migration/              # Solution Architecture produce
├── folder-structure/       # Solution Architecture produce
├── decision-records/       # Solution Architecture produce (ADRs)
├── repository/             # Specification Engineering soft input
├── specifications/         # Specification Engineering produce
├── tasks/                  # Specification Engineering produce
├── roadmap/                # Specification Engineering produce
├── implementation/         # Specification Engineering produce
├── validation/             # Validation Engine produce (findings/status)
├── reports/                # Validation Engine produce (PASS/FAIL reports)
├── scores/                 # Validation Engine produce (quality-scores)
├── artifacts/              # Validation Engine soft consume (→ runtime/artifacts)
├── execution/              # Validation Engine soft consume (lifecycle notes)
├── core/                   # Core Engine (TypeScript control plane)
│   ├── planner/
│   ├── orchestrator/
│   ├── artifacts/
│   ├── memory/
│   ├── knowledge/
│   ├── schemas/
│   ├── templates/
│   ├── configs/
│   └── scripts/
├── schemas/
├── templates/
│   └── worker/
├── contracts/
├── policies/
├── pipelines/              # discovery + product-re + solution-architecture + specification-engineering + validation-engine
├── registry/
├── roles/
├── runtime/
├── skills/
├── validators/
├── reviewers/
└── workers/                # Discovery + Product RE + SA + Spec Eng + Validation Engine (Feature Workers forbidden)
```

## Runtime layout

```
runtime/artifacts/<art_id>/v<n>/meta.json + payload.*
```

Prefer writing under `runtime/artifacts/`. Working folders hold templates + published mirrors only.

## Placement rules

| Content | Location |
|---------|----------|
| AIOS conventions | `architecture/` |
| Product architecture observations | `product-architecture/` |
| Quality / debt inputs | `quality/` (SA); additive `quality/validation-scorecard/` for VE |
| Solution redesign outputs | `redesign/`, `architecture-v2/`, `tech-stack/`, `migration/`, `folder-structure/`, `decision-records/` |
| Spec engineering outputs | `specifications/`, `tasks/`, `roadmap/`, `implementation/` (+ soft `repository/`) |
| Validation engine outputs | `validation/`, `reports/`, `scores/` |
| Machine contracts | `schemas/` |
| Core Engine code | `core/` |
| Catalogs | `registry/` |
| Executors | `workers/` |
| Pipelines | `pipelines/discovery/`, `pipelines/product-re/`, `pipelines/solution-architecture/`, `pipelines/specification-engineering/`, `pipelines/validation-engine/` |
