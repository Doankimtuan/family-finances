# Skill Binding — `requirement-generator`

Skill claim/execute binding for Product RE worker `requirement-generator`.
Skills are declarative packages (`skills/requirement-generator`). Validators and reviewers are **not** skills.

## Allowed skill roles

- `planner`
- `executor`
- `orchestrator-helper`

Reject any skill that claims `validator` or `reviewer` role.

## Skill selection

| Source | Rule |
|--------|------|
| Task `skill_id` | Required; must exist in `core/packages/registry/skills.json` `entries` |
| Task `skill_version` | Pin exact semver, or resolve `"active"` to the registry-active version before claim |
| Worker allow-list | Optional: `requirement-generator` |

If the skill package is **missing on disk**, outside allow-list, or `deprecated` → fail in `preparing`.
Product RE workers **may** claim `reserved`/`draft` skills when the package exists and the plan sets `acceptReservedSkills: true`.

## Claim protocol

1. Claim `task_id` with unique `run_id` (`art_…`).
2. Write / update `run-record` (`core/packages/schemas/execution-run.schema.json`):
   - `status`: `claimed` → `running`
   - `skill_id` / `skill_version` pinned
   - `trace` filled (`orchestration_id`, `plan_id`, `task_id`, `run_id`)
3. Acquire lock `task:{task_id}` (see `CONCURRENCY.md`).
4. Append heartbeat events to `events.jsonl` (`core/packages/schemas/run-event.schema.json`).

## Preparation

1. Resolve task inputs via dependency graph (`predecessor` → `successor`); refuse if hard deps are not `succeeded` / published as required.
2. Load skill `manifest.json` + `SKILL.md` (+ input/output schemas if present).
3. Verify each skill `side_effects` entry ⊆ orchestration budget `allowed_side_effects`.
4. Create staging artifact dirs as `draft` under `runtime/artifacts/`.

## Execution

1. Follow skill procedure; read **only** declared inputs (plus documented soft discovery handoff).
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

## Consumes (product RE)

`artifacts/product/`, `artifacts/workflow/`, `artifacts/business/`

## Produces (product RE)

`artifacts/requirements/`

## Discovery rule

Only discover/extract. Do not redesign. Do not implement features.
