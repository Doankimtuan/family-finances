# Validator — specification-engineering-schema-check (v0.2.0)

Deterministic checks for Specification Engineering payloads.

## Critical

- schema-valid, source_paths, confidence, traceability, unknowns
- no invent / overwrite flags
- no `ai-os/architecture` or bare `architecture/` as product source (use `product-architecture/` or `architecture-v2/`)
- project-specification section coverage (13 kinds or explicit gaps)
- project-specification body fields + full traceability matrix

## High

- unknowns prefix `UNKNOWN:`
- task-graph / roadmap / implementation minimum entry kinds

## Medium

- RACI ordering consistency (see `pipelines/specification-engineering/RACI.md`)
