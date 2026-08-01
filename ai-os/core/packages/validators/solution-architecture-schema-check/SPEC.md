# Validator — solution-architecture-schema-check

Deterministic checks for Solution Architecture redesign payloads.

## Critical

- schema-valid against `solution-architecture-payload.schema.json`
- source_paths + confidence on every entry
- invent_business_logic / overwrite_discovery must not be true
- no AIOS `docs/architecture/` control-plane docs as product sources

## High

- migration-plan entries require `preserves_behavior: true`
