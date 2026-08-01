# Validation Engine — Execution Graph

```mermaid
flowchart TB
  A[artifact-validator] --> D[dependency-validator]
  S[schema-validator] --> D
  A --> P[pipeline-validator]
  S --> P
  D --> T[traceability-validator]
  D --> C[completeness-validator]
  D --> X[consistency-validator]
  P --> T
  P --> C
  P --> X
  T --> Q[quality-scoring-engine]
  C --> Q
  X --> Q
  A --> Q
  S --> Q
  D --> Q
  P --> Q
  Q --> O[validation-orchestrator]
  T --> O
  C --> O
  X --> O
  O --> R[validation-reporter]
  Q --> R
```

## v0.7.1 notes

- Findings partitioned at `validation/<worker_id>/` (`folder_mirror`).
- Order owned by `pipeline.waves`; orchestrator merges only.
- Gate packages emit `gate-validation-report`.
