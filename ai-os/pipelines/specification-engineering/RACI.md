# Specification Engineering — Ordering RACI

> Resolves ownership collision between milestones, dependencies, delivery order, and build order.

| Concern | task-generator | roadmap-generator | implementation-planner |
|---------|----------------|-------------------|------------------------|
| Work-item hierarchy (epic→subtask) | **R/A** | C | C |
| Work-item `depends_on` / `dependency` edges | **R/A** | I | C (must respect) |
| Work-item milestones (tied to epics/features) | **R/A** | I | I |
| Release / phase / sprint milestones | I | **R/A** | C |
| Delivery order / timeline (releases & phases) | I | **R/A** | C (must respect) |
| Risk plan | I | **R/A** | C |
| Build order / critical path / parallel / blocked | I | I | **R/A** |
| Implementation graph-node / graph-edge | I | I | **R/A** |

**R** = Responsible · **A** = Accountable · **C** = Consulted · **I** = Informed

## Precedence

1. `tasks/` work-item graph is the source of truth for engineering dependencies.
2. `roadmap/` sequences releases/phases; it must not invent new product scope or contradict task `depends_on`.
3. `implementation/` derives build order from `tasks/` + `roadmap/` + `architecture-v2/` / `redesign/`; it must not redesign modules.

## Naming note

Produce folder `tasks/` holds **engineering-task-graph** mirrors. It is **not** the Core Engine `task` artifact type used by the planner.
