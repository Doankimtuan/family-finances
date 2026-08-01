# Framework Generator Contract

**Version:** 0.9.1 · **Pipeline:** `framework-generator` v0.1.1

## Invariants

1. **No execution** — scaffold plans only.
2. **No mutation** — never modify prior sprint workers/registries on disk.
3. **Configuration-driven** — `generation-spec` YAML/JSON under `configs/`.
4. **Partitioned output** — `framework-generator/generators/<id>/` via `folder_mirror`.
5. **Valid waves** — `pipeline.waves` is a topological partition of the hard dependency graph.

## Overlap resolution

| Concern | Owner | Not owner |
|---------|-------|-----------|
| Worker skeleton (README, skill, manifest) | worker-generator | validator/reviewer/test/doc generators |
| Registry patch files | project-bootstrap-generator | worker-generator |
| JSON Schema typing | schema-generator | artifact-generator |
| Prompts | prompt-generator | worker-generator |
| Status merge | generation-orchestrator | generators |
| Gate report | generation-reporter | orchestrator |

## Artifact types

- `framework-generation` — generator scaffold plans
- `framework-generation-status` — orchestrator merge/dedupe
- `framework-generation-report` — human report
- `gate-framework-generation-report` — gate envelope (distinct type)
- `generation-spec` — input capability spec

## Closure workers

- `generation-orchestrator` → `framework-generation-status`
- `generation-reporter` → `framework-generation-report` + gate envelope
