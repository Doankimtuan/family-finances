# Concurrency

## Claims

- A task may have at most one `running` run unless `allow_parallel_attempts: true`.
- Claim creates run-record artifact with status `claimed` then `running`.
- Claim is exclusive on `(task_id)` under the default policy.

## Artifact writes

- Only one writer may produce a given `artifact_id` at a time.
- Version directories are create-once: `vN` must not be overwritten.
- Publish is a metadata status transition after gates; it does not rewrite payload bytes.

## Waves

- Orchestrator schedules a wave only when all hard predecessors of each member are `succeeded`.
- Fail-fast policy may cancel remaining wave members; otherwise complete in-flight runs.

## Locks (normative intent for workers)

Future workers MUST implement advisory locks:

| Resource | Lock key |
|----------|----------|
| Task claim | `task:{artifact_id}` |
| Artifact write | `artifact:{artifact_id}` |
| Orchestration mutate | `orc:{artifact_id}` |

Lock TTL and heartbeat are worker concerns; framework requires heartbeats in `events.jsonl`.
