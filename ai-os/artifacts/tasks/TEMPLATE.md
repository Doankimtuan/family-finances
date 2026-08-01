# tasks — Engineering Task Graph (mirror)

> Produce folder for **engineering-task-graph**.  
> **Not** Core Engine `task` artifacts. See `core/packages/pipelines/specification-engineering/RACI.md`.

**Runtime:** `entries[]` with kinds: epic, feature, story, task, subtask, milestone (work-item), dependency.

## Hierarchy

```
epic
 └─ feature
     └─ story
         └─ task
             └─ subtask
```

## Required (ready)

| Kind | Notes |
|------|-------|
| epic | ≥1 |
| feature or story | ≥1 |
| task or subtask | ≥1 |
| dependency and/or depends_on | work-item edges only |

## Fields

| id | entry_kind | priority | complexity | depends_on | DoD | sources | confidence | unknowns |
|----|------------|----------|------------|------------|-----|---------|------------|----------|
| | | | | | | | | |

## RACI

task-generator **owns** work-item milestones and `depends_on`. Roadmap owns release milestones.
