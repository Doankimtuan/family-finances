# Workers — Out of Scope

This directory is intentionally empty of implementations.

## Framework phase rule

**Do not implement workers here.**

Workers are future processes/agents that:

- claim runs
- invoke skills
- call validators/reviewers
- persist artifacts under `runtime/`

Until the worker phase is explicitly opened, only this boundary document may exist in `workers/`.

## When workers are allowed

A later phase must provide:

1. Worker interface contract (input/output)
2. Permission model for side effects
3. Conformance tests against execution + orchestrator lifecycles
4. Explicit version bump of AIOS beyond framework-only

## Temporary exceptions

None. “Just a small script” is still a worker.
