# Workers — Out of Scope (implementations)

This directory has **no concrete workers**.

## Templates (use these)

Reusable worker package structure lives at:

[`ai-os/templates/worker/`](../templates/worker/)

Mandatory files for every future worker:

```
README.md
skill.md
validator.md
reviewer.md
checklist.md
output-schema.json
manifest.json
examples/
testcases/
```

Copy that pack when the worker phase opens. Do not invent a different layout.

## Framework phase rule

**Do not implement workers here.**

Workers are future processes/agents that:

- claim runs
- invoke skills
- call validators/reviewers
- persist artifacts under `runtime/`

Until the worker phase is explicitly opened, only this boundary document may exist under `workers/` (plus links to templates).

## When workers are allowed

A later phase must provide:

1. Instantiation from `templates/worker/` (unchanged structure)
2. `manifest.json` validating `schemas/worker-manifest.schema.json`
3. Permission model for side effects
4. Conformance tests from each package’s `testcases/`
5. Explicit AIOS version bump opening the worker phase

## Temporary exceptions

None. “Just a small script” is still a worker.
