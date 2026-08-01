# Discovery Pipeline

**Status:** draft · **Worker class:** discovery only · **Feature Workers:** forbidden

## Purpose

Produce read-only `discovery-report` artifacts that inventory the repository, domains, contracts, registries, and Core Engine surface, then synthesize a gap report for planning.

## Workers (registered)

| Worker | Wave | Depends on |
|--------|------|------------|
| `discover-repo-map` | 0 | — |
| `discover-domain-map` | 0 | — |
| `discover-contract-inventory` | 0 | — |
| `discover-registry-audit` | 1 | `discover-contract-inventory` |
| `discover-runtime-surface` | 1 | `discover-repo-map` |
| `discover-gap-report` | 2 | `discover-repo-map`, `discover-domain-map`, `discover-contract-inventory`, `discover-registry-audit`, `discover-runtime-surface` |

## Artifacts

| File | Role |
|------|------|
| `pipeline.json` | Pipeline registration (worker list, waves, policy) |
| `dependency-graph.json` | Hard predecessor→successor edges among Discovery Workers |

## Registry

- Workers: `core/packages/registry/workers.json` (`worker_class: discovery`)
- Skills: reserved `discover-*` entries in `core/packages/registry/skills.json`
- Validator: `discovery-schema-check`
- Reviewer: `discovery-coverage-review`
- Artifact type: `discovery-report`

## Non-goals

- Do **not** add Feature Workers to this pipeline.
- Do **not** raise side-effect ceiling above `runtime-write`.
