# AIOS Release Notes — 0.9.0

**Date:** 2026-08-01  
**Phase:** Sprint 9 Framework Generator  
**Scope:** `pipelines/framework-generator/`, `framework-generator/`, ten generator workers, schemas, registries, catalog

## Summary

Introduces the **Framework Generator** — a self-extensible scaffolding pipeline that plans Workers, Validators, Reviewers, Pipelines, and supporting artifacts from YAML/JSON capability specs.

## Components

| Generator | Purpose |
|-----------|---------|
| `worker-generator` | Complete Worker package from capability description |
| `validator-generator` | Validators (artifact, schema, traceability, dependency, completeness, consistency, quality) |
| `reviewer-generator` | Engineering reviewers (architecture, business, spec, quality, docs, security, performance) |
| `pipeline-generator` | Pipelines (sequential, parallel, conditional, resume, incremental, retry, checkpoint, rollback) |
| `artifact-generator` | Artifact definitions (folder structure, contracts, naming, lifecycle, versioning, retention) |
| `schema-generator` | JSON Schemas, markdown templates, config/validation/artifact schemas |
| `prompt-generator` | Builder, reviewer, validator, improve, freeze, execution prompts |
| `documentation-generator` | Architecture docs, usage guides, migrations, changelogs, release notes |
| `test-generator` | Test cases, validation cases, edge cases, regression, sample projects, acceptance tests |
| `project-bootstrap-generator` | Full AI OS project bootstrap from configuration |

## Output layout

```
framework-generator/
├── generators/     # Per-generator partitions + templates
├── bootstrap/
├── scaffolding/
├── templates/
├── registries/
└── catalog/        # worker, schema, template catalogs
```

## Artifact types

- `framework-generation` — primary scaffold plan
- `framework-generation-status` — rollup status
- `framework-generation-report` — human report
- `gate-framework-generation-report` — gate envelope
- `generation-spec` — input capability spec

## Self-registration

Output plans include registry targets (workers, skills, validators, reviewers, pipelines, artifact-types, schemas, templates). Registries are **not** modified at execution time in this packaging milestone.

## Compatibility

- Prior pipelines and workers unchanged
- Pipeline id `framework-generator`; 10 new worker ids only
- Configuration-driven generation via `configs/sample-capability.yaml`

## Verification

```bash
npm run aios:framework-generator:smoke
npm run aios:review-engine:smoke
npm run aios:validation-engine:smoke
npm run aios:discovery:smoke
```

Generation was **not** executed.
