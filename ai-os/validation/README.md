# validation/

Partitioned Validation Engine findings + orchestrator status.

| Path | Type | Writer |
|------|------|--------|
| `validation/<worker_id>/` | `validation-finding` | specialized `*-validator` workers |
| `validation/` (status pack) | `validation-status` | `validation-orchestrator` |

See [RACI.md](../pipelines/validation-engine/RACI.md). Gate packages emit `gate-validation-report`, not worker findings.
