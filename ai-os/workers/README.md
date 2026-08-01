# Workers

Concrete worker packages live here. Instantiation **must** copy `templates/worker/` unchanged in layout.

## Allowed in this phase

**Discovery Workers only** (`worker_class: discovery`).

| Worker | Pipeline | Status |
|--------|----------|--------|
| `discover-repo-map` | discovery | draft |
| `discover-domain-map` | discovery | draft |
| `discover-contract-inventory` | discovery | draft |
| `discover-registry-audit` | discovery | draft |
| `discover-runtime-surface` | discovery | draft |
| `discover-gap-report` | discovery | draft |

Registry: [`registry/workers.json`](../registry/workers.json)  
Pipeline: [`pipelines/discovery/`](../pipelines/discovery/)  
Dependency graph: [`pipelines/discovery/dependency-graph.json`](../pipelines/discovery/dependency-graph.json)

## Forbidden

- **Feature Workers** (any worker that implements product features, mutates app source, or raises side effects to `repo-write` / `external` without a later phase bump)
- Packages that do not match the mandatory template tree
- Executables that bypass `contracts/worker-port.md`

## Mandatory package tree

```
README.md
skill.md
validator.md
reviewer.md
checklist.md
output-schema.json
manifest.json
examples/
testcases/
```

## Template

[`ai-os/templates/worker/`](../templates/worker/)
