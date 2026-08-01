# Worker Package Template

> **Copy this entire directory** when scaffolding a new worker.  
> Replace every template marker before activation. Do **not** leave template markers in an active package.  
> This pack is structure-only — it is not a runnable worker runtime.

## Canonical layout (mandatory)

Every worker package MUST use exactly this tree:

```
{{worker_id}}/
├── README.md
├── skill.md
├── validator.md
├── reviewer.md
├── checklist.md
├── output-schema.json
├── manifest.json
├── examples/
│   ├── README.md
│   ├── sample-input.json
│   └── sample-output.json
└── testcases/
    ├── README.md
    ├── case-01-happy-path.json
    ├── case-02-budget-exceed.json
    ├── case-03-blocking-validation-fail.json
    ├── case-04-blocking-review-fail.json
    └── case-05-missing-skill.json
```

Optional siblings (allowed, not required by this template pack):

| File | Purpose |
|------|---------|
| `events.jsonl` | Produced at runtime under `runtime/`, not in the package |

## Identity

| Field | Value |
|-------|-------|
| Worker id | `{{worker_id}}` (kebab-case; matches registry / manifest `id`) |
| Version | `{{semver}}` |
| Status | `reserved` \| `draft` \| `active` \| `deprecated` |
| Implements roles | `{{implements_roles}}` (subset of `executor`, `validator`, `reviewer`, `planner`, `orchestrator`) |
| Side effects | `{{side_effects}}` (from `sideEffect` enum) |

## Mission

{{one_paragraph_what_this_worker_does}}

## Non-goals

- Do not mutate the product repo unless `side_effects` includes `repo-write` and orchestration budget allows it.
- Do not publish artifacts on blocking gate fail.
- Do not invent payload paths other than `payload.json` \| `payload.md` \| `payload.patch` \| `payload.bin`.
- Do not skip validators/reviewers declared on the task.

## Contracts this package must honor

1. `contracts/worker-port.md`
2. `architecture/execution-lifecycle.md`
3. `architecture/TRACEABILITY.md`
4. `architecture/CONCURRENCY.md` (locks / claim exclusivity)
5. `architecture/SECURITY.md` (side-effect ceiling)

## Package file map

| File | Role |
|------|------|
| `README.md` | This file — identity, layout, non-goals |
| `skill.md` | How this worker invokes / binds skills |
| `validator.md` | How this worker runs deterministic checks |
| `reviewer.md` | How this worker applies qualitative review |
| `checklist.md` | Conformance gate before marking package `active` |
| `output-schema.json` | JSON Schema for this worker’s primary durable output envelope |
| `manifest.json` | Worker port manifest (`schemas/worker-manifest.schema.json`) |
| `examples/` | Illustrative inputs/outputs (non-normative) |
| `testcases/` | Machine-checkable fixtures for future conformance runners |

## Instantiation recipe

1. Copy `ai-os/templates/worker/` → `ai-os/workers/{{worker_id}}/`.
2. Replace all template markers.
3. Fill `examples/` and `testcases/` with real fixtures.
4. Ensure `manifest.json` conforms to `worker-manifest.schema.json`.
5. Register in `registry/workers.json` and the appropriate `pipelines/<id>/`.
6. Pass every item in `checklist.md` before promoting to `active`.

## Phase rule

- **Discovery Workers** (`worker_class: discovery`) may be instantiated under `ai-os/workers/discover-*` or Product RE packages bound by `pipelines/product-re/` in the current phase.
- **Feature Workers** remain forbidden until a later VERSION bump explicitly opens that class.
- Packages are declarative port bindings. Executable claim/run loops are a separate runtime milestone; Core does not invoke workers yet.
