# Worker Package Template

> **Discovery Worker package** `discover-gap-report` (class=`discovery`).  
> Instantiated from `templates/worker/`. Not a Feature Worker.  
> Package docs are normative for claim/execute/validate/review bindings; runtime binaries come later.

## Canonical layout (mandatory)

Every worker package MUST use exactly this tree:

```
discover-gap-report/
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
| Worker id | `discover-gap-report` |
| Version | `0.1.0` |
| Status | `draft` |
| Implements roles | `executor` |
| Side effects | `runtime-write` |
| Worker class | `discovery` |
| Pipeline | `discovery` |

## Mission

Synthesize prior discovery reports into a single gap/risk report for orchestrator planning. Does not implement features.

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

## Package registration


1. Instantiated from `ai-os/templates/worker/`.
2. Registered in `registry/workers.json` and `pipelines/discovery/`.
3. Fixtures under `examples/` and `testcases/` use discovery ids.
4. `manifest.json` validates `schemas/worker-manifest.schema.json`.
5. Pass every item in `checklist.md` before promoting status beyond `draft`.

## Discovery phase rule

This package is a **Discovery Worker**. Feature Workers are forbidden in this phase. Side effects are limited to `runtime-write`. Do not mutate product application code.
