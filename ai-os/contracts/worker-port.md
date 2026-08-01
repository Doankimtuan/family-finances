# Worker Port Contract

Workers are deferred. This port is the DIP boundary they must implement later.

## Responsibilities

A worker claims runs, loads skill/validator/reviewer packages, respects side-effect budgets, writes artifacts under `runtime/`, and emits `events.jsonl`.

## Manifest

`schemas/worker-manifest.schema.json`

Required: `id`, `version`, `implements_roles`, `side_effects`, `status`.

## Forbidden until worker phase opens

- Any executable under `ai-os/workers/` beyond documentation
- “Temporary scripts” that mutate the product repo

## Conformance checklist (future)

Instantiate from `templates/worker/` and complete that pack’s `checklist.md`.

Minimum:

- [ ] Package tree matches `templates/worker/` exactly
- [ ] Honors execution-lifecycle.md phases
- [ ] Uses predecessor/successor dependency resolution
- [ ] Writes only `payload.*` canonical paths
- [ ] Fills `trace` per TRACEABILITY.md
- [ ] Never publishes on blocking gate fail
- [ ] `testcases/` cover happy path + budget + blocking validation

## Package template

Canonical copy-from pack: `templates/worker/`

| File | Purpose |
|------|---------|
| `README.md` | Identity + layout |
| `skill.md` | Skill claim/execute binding (not skill-package `SKILL.md`) |
| `validator.md` | Deterministic checks |
| `reviewer.md` | Qualitative review |
| `checklist.md` | Activation gate |
| `output-schema.json` | Primary output envelope schema |
| `manifest.json` | `worker-manifest.schema.json` |
| `examples/` | Human illustrations |
| `testcases/` | Conformance fixtures |
