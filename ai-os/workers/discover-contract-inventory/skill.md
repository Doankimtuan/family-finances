# Skill Binding — `discover-contract-inventory`

> Template for how this worker loads and executes AIOS **skills**.  
> Skills are declarative packages (`skills/discover-contract-inventory`). This worker is the runtime that claims runs and applies them.  
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
| Task `skill_id` | Required; must exist in `registry/skills.json` `entries` |
| Task `skill_version` | Pin exact semver, or resolve `"active"` to the registry-active version before claim |
| Worker allow-list | Optional: `discover-contract-inventory` |

If the skill package is **missing on disk**, outside allow-list, or `deprecated` → fail run in `preparing` and escalate.
Discovery Workers **may** claim `reserved`/`draft` skills when the package exists and the plan sets `acceptReservedSkills: true` (or an equivalent reserved-skill exception is recorded on the run).

## Claim protocol

1. Claim `task_id` with unique `run_id` (`art_…`).
2. Write / update `run-record` (`schemas/execution-run.schema.json`):
   - `status`: `claimed` → `running`
   - `skill_id` / `skill_version` pinned
   - `trace` filled (`orchestration_id`, `plan_id`, `task_id`, `run_id`)
3. Acquire lock `task:{task_artifact_id}` where `task_artifact_id` is the task's `art_…` id (see `CONCURRENCY.md`).
4. Append heartbeat events to `events.jsonl` (`schemas/run-event.schema.json`).

## Preparation

1. Resolve task inputs via dependency graph (`predecessor` → `successor`); refuse if hard deps are not `succeeded` / published as required.
2. Load skill `manifest.json` + `SKILL.md` (+ input/output schemas if present).
3. Verify each skill `side_effects` entry ⊆ orchestration budget `allowed_side_effects`.
4. Create staging artifact dirs as `draft` under `runtime/artifacts/`.

## Execution

1. Follow skill procedure; read **only** declared inputs.
2. Write **only** to staging paths and declared output artifact types.
3. Heartbeat at least every `30` seconds while `running`.
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

- `architecture/skill-conventions.md`
- `architecture/execution-lifecycle.md`
- `templates/skill/SKILL.md`
- `schemas/skill-manifest.schema.json`
- `schemas/execution-run.schema.json`
