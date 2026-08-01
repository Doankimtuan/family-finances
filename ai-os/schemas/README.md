# Schemas Index

All schemas are JSON Schema Draft 2020-12.  
`$id` base: `https://aios.dev/schemas/`

**Rule:** shared enums/objects live in `common.schema.json` `$defs`. Other schemas MUST `$ref` them.

| File | Purpose |
|------|---------|
| `common.schema.json` | Shared `$defs` (source of truth) |
| `artifact.schema.json` | Artifact `meta.json` |
| `goal.schema.json` | Goal payload |
| `plan.schema.json` | Plan payload (`task_refs` + graph ref) |
| `task.schema.json` | Task payload (standalone) |
| `dependency-graph.schema.json` | Predecessor/successor edges |
| `skill-manifest.schema.json` | Skill package manifest |
| `validator-spec.schema.json` | Validator package manifest |
| `validator-report.schema.json` | Validation report payload |
| `reviewer-spec.schema.json` | Reviewer package manifest |
| `review-report.schema.json` | Review report payload |
| `execution-run.schema.json` | Run-record payload |
| `orchestration-state.schema.json` | Orchestrator control state |
| `quality-gate.schema.json` | Combined gate decision |
| `registry.schema.json` | Registry document shape |
| `gate-profile.schema.json` | Gate profile policy file |
| `run-event.schema.json` | `events.jsonl` line |
| `plan-decision.schema.json` | Accept/reject/revise |
| `escalation.schema.json` | Human escalation |
| `pipeline-dependency-graph.schema.json` | Worker edges inside a named pipeline |
| `pipeline.schema.json` | Named worker pipeline registration |
| `discovery-report.schema.json` | Discovery Worker primary payload |
| `worker-output-envelope.schema.json` | Shared worker run envelope |
| `worker-manifest.schema.json` | Worker port manifest |
| `product-re-payload.schema.json` | Product reverse-engineering primary payloads |
