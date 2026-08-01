# Execution Graph

```mermaid
flowchart TD
  RPC[reference-project-catalog] --> BR[benchmark-runner]
  BR --> QR[qualification-runner]
  BR --> EE[evaluation-engine]
  BR --> ST[stress-test-runner]
  EE --> ME[metrics-engine]
  QR --> ME
  ME --> CA[coverage-analyzer]
  EE --> CA
  ME --> RR[regression-runner]
  EE --> RR
  ME --> CE[certification-engine]
  CA --> CE
  RR --> CE
  ST --> CE
  QR --> CE
  CE --> RQB[release-qualification-board]
```

Waves are topologically valid — no hard edge within the same wave.
