# Skill Binding — `tech-stack-consultant`

Skill claim/execute binding for Solution Architecture worker `tech-stack-consultant`.
Skills live under `skills/tech-stack-consultant`. Validators/reviewers are not skills.

## Allowed skill roles

- `planner`
- `executor`
- `orchestrator-helper`

Reject skills claiming `validator` or `reviewer` role.

## Skill selection

| Source | Rule |
|--------|------|
| Task `skill_id` | Required; must exist in `core/packages/registry/skills.json` |
| Task `skill_version` | Exact semver or `"active"` |
| Worker allow-list | Optional: `tech-stack-consultant` |

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
2. Preserve business behavior; never invent business logic.
3. Write only staging paths / declared output types.
4. Heartbeat ≥ every 30s while `running`.
5. Never publish from the skill path.

## Persistence

1. Canonical `payload.*` only.
2. `content_hash` (`sha256:…`).
3. `meta.json` with `produced_by.role`.
4. Staging `draft` → `ready`.
5. Attach output refs on run-record.

## Stop conditions

After persistence, stop skill work; hand off to validator then reviewer.

## Consumes

`artifacts/knowledge/`, `artifacts/features/`, `artifacts/business/`, `artifacts/product-architecture/` (logical `docs/architecture/`), `artifacts/requirements/`, `governance/quality/`, `artifacts/architecture-v2/`

## Produces

`artifacts/tech-stack/`, `artifacts/migration/`

## Redesign rule

Solution redesign only. Preserve validated business behavior. Do not invent features or change business rules.
