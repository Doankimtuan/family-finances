# AIOS Capabilities (v0.13.0)

**Primary mental model.** Prefer capabilities over 81 individual workers.

End users run:

```
@Run full
@Run incremental
@Run validate
@Run review
@Run benchmark
@Run resume
```

Workers remain registered for packaging/BC but are **implementation details** of capabilities.

| Capability | Pipeline | Decision |
|------------|----------|----------|
| `discover` | `discovery` | KEEP |
| `reverse-engineer` | `product-re` | KEEP |
| `architect` | `solution-architecture` | KEEP |
| `specify` | `specification-engineering` | KEEP |
| `validate` | `validation-engine` | GENERALIZE (Phase 3B deferred) |
| `review` | `review-engine` | GENERALIZE (Phase 3B deferred) |
| `qualify` | `qualification-framework` | MERGE (Phase 3B deferred) |
| `runtime` | `runtime-engine` | MERGE (Phase 3B deferred) |
| `scaffold` (optional) | `framework-generator` | MOVE off critical path |

Registry: [`registry.json`](registry.json)  
Architecture: [`../architecture/SIMPLIFIED_ARCHITECTURE.md`](../architecture/SIMPLIFIED_ARCHITECTURE.md)  
Board: [`../architecture/REFACTORING_BOARD_REPORT.md`](../architecture/REFACTORING_BOARD_REPORT.md)  
Layout migration: [`../releases/MIGRATION_0.12_to_0.13.md`](../releases/MIGRATION_0.12_to_0.13.md)
