# Skill Binding — `specification-generator`

Skill claim/execute binding for Specification Engineering worker `specification-generator`.
Skills live under `skills/specification-generator`. Validators/reviewers are not skills.

## Allowed skill roles

- `planner`
- `executor`
- `orchestrator-helper`

Reject skills claiming `validator` or `reviewer` role.

## Skill selection

| Source | Rule |
|--------|-------|
| Task `skill_id` | Required in `registry/skills.json` |
| Task `skill_version` | Exact semver or `"active"` |
| Worker allow-list | Optional: `specification-generator` |

Reserved/draft skills may be claimed when `acceptReservedSkills: true`.

## Claim protocol

1. Claim `task_id` with unique `run_id` (`art_…`).
2. Write/update `run-record`: `claimed` → `running`; pin skill; fill `trace`.
3. Acquire lock `task:{task_id}` (see `CONCURRENCY.md`).
4. Append heartbeat events to `events.jsonl`.

## Preparation

1. Resolve hard deps via predecessor/successor graph.
2. Load skill `manifest.json` + `SKILL.md`.
3. Verify side effects ⊆ budget.
4. Create staging artifact dirs as `draft`.

## Execution

1. Follow skill procedure; read only declared inputs.
2. Never invent business logic; mark gaps `UNKNOWN: …`.
3. Restate Product RE with pointers — do not rewrite requirements.
4. Respect `pipelines/specification-engineering/RACI.md` ordering ownership.
5. Write only staging paths / declared output types.
6. Heartbeat ≥ every 30s while `running`.
7. Never publish from the skill path.

## Persistence

1. Canonical `payload.*` only.
2. `content_hash` (`sha256:…`).
3. `meta.json` with `produced_by.role`.
4. Staging `draft` → `ready`.
5. Attach output refs on run-record.

## Stop conditions

After persistence, stop skill work; hand off to validator then reviewer.

## Consumes

`knowledge/`, `repository/` (soft human/pre-step), `features/`, `business/`, `product-architecture/` (logical `architecture/`), `architecture-v2/`, `decision-records/`, `tech-stack/`, `migration/`, `folder-structure/`, `requirements/`, `quality/`, `redesign/`, `workflow/`, `acceptance/`

## Produces

`specifications/`

## Specification rule

Never invent business logic. Never redesign. Never change requirements. Mark missing information `UNKNOWN: …`.
