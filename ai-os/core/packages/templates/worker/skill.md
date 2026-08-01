# Skill Binding — `{{worker_id}}`

> Template for how this worker loads and executes AIOS **skills**.  
> Skills are declarative packages (`skills/{{skill_id}}`). This worker is the runtime that claims runs and applies them.  
> Validators and reviewers are **not** skills — see `validator.md` / `reviewer.md`.

## Allowed skill roles

Only skills with role:

- `planner`
- `executor`
- `orchestrator-helper`

Reject any skill that claims `validator` or `reviewer` role.

## Skill selection

| Source | Rule |
|--------|------|
| Task `skill_id` | Required; must exist in `core/packages/registry/skills.json` `entries` |
| Task `skill_version` | Pin exact semver, or resolve `"active"` to the registry-active version before claim |
| Worker allow-list | Optional: `{{allowed_skill_ids_or_star}}` |

If the skill is missing, `reserved` without policy exception, or outside allow-list → fail run in `preparing` and escalate per orchestrator policy.

## Claim protocol

1. Claim `task_id` with unique `run_id` (`art_…`).
2. Write / update `run-record` (`core/packages/schemas/execution-run.schema.json`):
   - `status`: `claimed` → `running`
   - `skill_id` / `skill_version` pinned
   - `trace` filled (`orchestration_id`, `plan_id`, `task_id`, `run_id`)
3. Acquire lock `task:{{task_artifact_id}}` (see `CONCURRENCY.md`).
4. Append heartbeat events to `events.jsonl` (`core/packages/schemas/run-event.schema.json`).

## Preparation

1. Resolve task inputs via dependency graph (`predecessor` → `successor`); refuse if hard deps are not `succeeded` / published as required.
2. Load skill `manifest.json` + `SKILL.md` (+ input/output schemas if present).
3. Verify each skill `side_effects` entry ⊆ orchestration budget `allowed_side_effects`.
4. Create staging artifact dirs as `draft` under `runtime/artifacts/`.

## Execution

1. Follow skill procedure; read **only** declared inputs.
2. Write **only** to staging paths and declared output artifact types.
3. Heartbeat at least every `{{heartbeat_seconds}}` seconds while `running`.
4. Never publish (`published`) from the skill path — publish is an orchestrator/gate decision.

## Persistence

1. Finalize canonical `payload.*` bytes only.
2. Compute `content_hash` (`sha256:…`).
3. Write `meta.json` with `produced_by.role` appropriate to the skill role (usually `executor`).
4. Transition staging artifacts `draft` → `ready`.
5. Attach output refs on the run-record.

## Stop conditions (skill phase)

After persistence, **stop skill work**. Hand off to validator then reviewer flows described in sibling docs.

## Done when (skill binding)

- [ ] Skill id/version pinned on run-record
- [ ] Side-effect budget respected
- [ ] Outputs match skill declared `outputs[]` artifact types
- [ ] Trace fields present per `TRACEABILITY.md`
- [ ] No undeclared filesystem or network writes

## References

- `docs/architecture/skill-conventions.md`
- `docs/architecture/execution-lifecycle.md`
- `core/packages/templates/skill/SKILL.md`
- `core/packages/schemas/skill-manifest.schema.json`
- `core/packages/schemas/execution-run.schema.json`
