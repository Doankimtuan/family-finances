# AIOS Agent Entry Contract

**Framework 0.13.0 — Capability-first.**

Canonical guide: [`docs/guides/AGENTS.md`](docs/guides/AGENTS.md)  
Simplified architecture: [`docs/architecture/SIMPLIFIED_ARCHITECTURE.md`](docs/architecture/SIMPLIFIED_ARCHITECTURE.md)  
Capabilities: [`docs/capabilities/README.md`](docs/capabilities/README.md)

## User / agent UX

```
@Run full
@Run incremental
@Run validate
@Run review
@Run benchmark
@Run resume
```

Do **not** manually invoke individual workers for normal operation.

## Layout (v0.13.0)

| Domain | Path |
|--------|------|
| Core packages | `core/packages/` |
| Runtime | `runtime/` |
| Skills | `skills/` |
| Artifacts | `artifacts/` |
| Governance | `governance/` |
| Docs | `docs/` |
| Workspace | `workspace/` |
