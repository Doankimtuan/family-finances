# AI Operating System (AIOS)

Control plane for multi-role AI work.

**Version:** `0.13.0` — domain layout migration (structure only; worker ids unchanged)  
**DX:** Capability-first via `@Run` and [`docs/capabilities/`](docs/capabilities/)

## Domain map

| Domain | Path | Purpose |
|--------|------|---------|
| Core packages | [`core/packages/`](core/packages/) | workers, validators, reviewers, pipelines, registry, JSON schemas, templates, scaffold |
| Engine | [`core/`](core/) | TypeScript planner/orchestrator/knowledge (Zod in `core/schemas/`) |
| Runtime | [`runtime/`](runtime/) | `@Run` execution / commands / configs |
| Skills | [`skills/`](skills/) | Skill packages |
| Artifacts | [`artifacts/`](artifacts/) | All produce packs |
| Governance | [`governance/`](governance/) | qualification, policies, reviews, decisions, quality |
| Docs | [`docs/`](docs/) | architecture, capabilities, releases, guides |
| Workspace | [`workspace/`](workspace/) | local run scratch (not source of truth) |

## Start here

1. [`AGENTS.md`](AGENTS.md) → [`docs/guides/AGENTS.md`](docs/guides/AGENTS.md)
2. [`docs/capabilities/README.md`](docs/capabilities/README.md)
3. [`docs/architecture/SIMPLIFIED_ARCHITECTURE.md`](docs/architecture/SIMPLIFIED_ARCHITECTURE.md)
4. [`docs/releases/MIGRATION_0.12_to_0.13.md`](docs/releases/MIGRATION_0.12_to_0.13.md)
5. [`docs/releases/RELEASE_NOTES_0.13.0.md`](docs/releases/RELEASE_NOTES_0.13.0.md)

## Non-negotiables

1. Artifacts over chat (`art_…` only)
2. Shared `$defs` — never re-inline enums
3. Registry-open artifact types
4. Validate then review
5. **No Feature Workers**
6. Canonical `payload.*` paths only
7. Core Engine never **invokes** skills/workers (load/validate only)
8. Never treat `docs/architecture/` as product architecture input — use `artifacts/product-architecture/`
9. Produce under `artifacts/`; gates under `governance/`; packages under `core/packages/`
