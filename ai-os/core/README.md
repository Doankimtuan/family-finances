# AIOS Core Engine

Production control plane for AIOS **v0.3.1**.

## Scope

| Included | Excluded |
|----------|----------|
| `planner/` | Skill/worker invocation |
| `orchestrator/` (waves + stub runs + gates) | Real executor workers |
| `artifacts/` | Product repo mutations |
| `memory/` | |
| `knowledge/` | |
| `schemas/` (Zod runtime, strict) | |
| `templates/` (loader) | |
| `configs/` | |

## Layout

```
ai-os/core/
  index.ts              # createAiosCore()
  configs/
  schemas/              # Zod mirrors of ai-os/schemas JSON contracts
  templates/            # reads ai-os/templates
  artifacts/            # filesystem store under runtime/artifacts
  memory/               # namespaced working memory (MemoryManager)
  knowledge/            # registries + gate profiles (read-only)
  planner/              # goal → tasks → dependency-graph → plan
  orchestrator/         # waves, plan-decision, quality-gate, escalation, stub runs
  lib/                  # ids, hash, graph, errors
```

## Quick start

```ts
import { createAiosCore } from "@/ai-os/core";

const core = createAiosCore();

const { orchestrationId } = await core.orchestrator.start({
  gateProfile: "standard",
});

const planned = await core.orchestrator.planAndAttach(orchestrationId, {
  goal: {
    title: "Ship jar rollover docs",
    problem: "Need a gated plan for documentation work",
    successCriteria: [
      { id: "docs-ready", description: "Doc artifact published" },
    ],
    nonGoals: ["Implement workers"],
  },
  planTitle: "Docs plan",
  tasks: [
    {
      key: "draft",
      title: "Draft doc",
      skillId: "example-skill",
      primaryOutputType: "doc",
      doneWhen: ["Doc payload ready"],
      sideEffectBudget: ["runtime-write"],
      inputGoal: true,
    },
  ],
  acceptReservedSkills: true,
});

await core.orchestrator.acceptPlan({
  orchestrationId,
  planId: planned.planId,
  planGate: {
    result: "pass",
    reviewResults: [{ artifact_id: planned.planId, result: "pass" }],
  },
});

const wave = await core.orchestrator.startNextWave(orchestrationId);
await core.orchestrator.recordTaskOutcome({
  orchestrationId,
  taskId: wave.taskIds[0]!,
  status: "succeeded",
});
```

## Guarantees

- Durable IDs are `art_…`
- Payloads are canonical `payload.*` only
- Artifact versions are create-once (exclusive `wx` create)
- Registry artifact types required on every write
- Skills must be registered when `requireActiveSkills` (default true)
- Gate profiles enforced before plan publish when configured
- Plan meta/payload status stay synced via publish versioning
- Orchestration state is append-only (new versions)
- Hard dependency cycles are rejected
- Wave lifecycle reaches settling without workers (stub run-records)
- No worker invocation paths exist in this package
