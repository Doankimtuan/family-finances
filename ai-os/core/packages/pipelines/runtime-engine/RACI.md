# RACI — Runtime Engine

Complete entry_kind ownership. Workers must not emit kinds owned by another worker.

| entry_kind | Owner |
|------------|-------|
| `aios-yaml` | `runtime-configuration-loader` |
| `run-yaml` | `runtime-configuration-loader` |
| `workspace-yaml` | `runtime-configuration-loader` |
| `env-vars` | `runtime-configuration-loader` |
| `defaults` | `runtime-configuration-loader` |
| `normalized-config` | `runtime-configuration-loader` |
| `worker-started` | `event-bus` |
| `worker-finished` | `event-bus` |
| `validation-started` | `event-bus` |
| `validation-finished` | `event-bus` |
| `review-started` | `event-bus` |
| `review-finished` | `event-bus` |
| `phase-completed` | `event-bus` |
| `checkpoint-created` | `event-bus` |
| `execution-completed` | `event-bus` |
| `execution-failed` | `event-bus` |
| `execution-log` | `logging-engine` |
| `worker-log` | `logging-engine` |
| `validation-log` | `logging-engine` |
| `review-log` | `logging-engine` |
| `failure-log` | `logging-engine` |
| `performance-log` | `logging-engine` |
| `run-full` | `command-interpreter` |
| `run-incremental` | `command-interpreter` |
| `run-phase` | `command-interpreter` |
| `run-resume` | `command-interpreter` |
| `run-retry` | `command-interpreter` |
| `run-validate` | `command-interpreter` |
| `run-review` | `command-interpreter` |
| `run-freeze` | `command-interpreter` |
| `run-status` | `command-interpreter` |
| `run-benchmark` | `command-interpreter` |
| `worker-dependency` | `dependency-resolver` |
| `artifact-dependency` | `dependency-resolver` |
| `pipeline-dependency` | `dependency-resolver` |
| `execution-dependency` | `dependency-resolver` |
| `circular-rejection` | `dependency-resolver` |
| `current-phase` | `execution-context-manager` |
| `completed-workers` | `execution-context-manager` |
| `execution-state` | `execution-context-manager` |
| `temporary-memory` | `execution-context-manager` |
| `shared-context` | `execution-context-manager` |
| `worker-outputs` | `execution-context-manager` |
| `global-variables` | `execution-context-manager` |
| `artifact-track` | `artifact-manager` |
| `artifact-version` | `artifact-manager` |
| `artifact-lifecycle` | `artifact-manager` |
| `artifact-ownership` | `artifact-manager` |
| `artifact-dependency` | `artifact-manager` |
| `execution-graph` | `execution-planner` |
| `worker-order` | `execution-planner` |
| `estimated-outputs` | `execution-planner` |
| `estimated-runtime` | `execution-planner` |
| `validation-plan` | `execution-planner` |
| `review-plan` | `execution-planner` |
| `checkpoint-plan` | `execution-planner` |
| `phase-checkpoint` | `checkpoint-manager` |
| `validation-checkpoint` | `checkpoint-manager` |
| `retry-checkpoint` | `checkpoint-manager` |
| `freeze-checkpoint` | `checkpoint-manager` |
| `rollback-plan` | `checkpoint-manager` |
| `overall-progress` | `progress-tracker` |
| `current-phase-status` | `progress-tracker` |
| `worker-status` | `progress-tracker` |
| `execution-time` | `progress-tracker` |
| `estimated-completion` | `progress-tracker` |
| `generated-artifacts` | `progress-tracker` |
| `quality-status` | `progress-tracker` |
| `worker-selection` | `worker-scheduler` |
| `execution-order` | `worker-scheduler` |
| `dedupe-guard` | `worker-scheduler` |
| `priority` | `worker-scheduler` |
| `concurrency` | `worker-scheduler` |
| `retry-worker` | `retry-engine` |
| `retry-phase` | `retry-engine` |
| `retry-validation` | `retry-engine` |
| `retry-review` | `retry-engine` |
| `retry-updated-context` | `retry-engine` |
| `retry-limits` | `retry-engine` |
| `resume-checkpoint` | `resume-engine` |
| `resume-failed-worker` | `resume-engine` |
| `resume-failed-phase` | `resume-engine` |
| `resume-interrupted` | `resume-engine` |
| `sequential-execution` | `pipeline-engine` |
| `parallel-execution` | `pipeline-engine` |
| `conditional-execution` | `pipeline-engine` |
| `dynamic-execution` | `pipeline-engine` |
| `resume-execution` | `pipeline-engine` |
| `incremental-execution` | `pipeline-engine` |
| `load-config` | `master-orchestrator` |
| `load-pipeline` | `master-orchestrator` |
| `load-workers` | `master-orchestrator` |
| `resolve-dependencies` | `master-orchestrator` |
| `execute-pipeline` | `master-orchestrator` |
| `handle-failure` | `master-orchestrator` |
| `handle-retry` | `master-orchestrator` |
| `handle-resume` | `master-orchestrator` |
| `freeze-phase` | `master-orchestrator` |
| `execution-summary` | `master-orchestrator` |

## Overlap resolution

| Concern | Owner | Not owner |
|---------|-------|-----------|
| Normalized config | runtime-configuration-loader | command-interpreter |
| @Run parsing | command-interpreter | master-orchestrator |
| Pre-exec plans | execution-planner | pipeline-engine |
| Graph execution | pipeline-engine | worker-scheduler |
| Single UX entry | master-orchestrator | all others |
| Checkpoints | checkpoint-manager | resume-engine (consumes) |

**Never modify worker / validator / reviewer implementations. Orchestrate only.**

Packaging only — workers not executed.
