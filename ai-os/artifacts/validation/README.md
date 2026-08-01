# artifacts/validation/

Partitioned Validation Engine findings + orchestrator status.

| Path | Type | Writer |
|------|------|--------|
| `artifacts/validation/<worker_id>/` | `validation-finding` | specialized `*-validator` workers |
| `artifacts/validation/` (status pack) | `validation-status` | `validation-orchestrator` |

See [RACI.md](../pipelines/validation-engine/RACI.md). Gate packages emit `gate-validation-report`, not worker findings.
