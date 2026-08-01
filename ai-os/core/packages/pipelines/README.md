# AIOS Pipelines

> **v0.12.0+:** Prefer [`docs/capabilities/`](../capabilities/) as the primary model. Pipelines implement capabilities.

| Pipeline | Class | Feature Workers |
|----------|-------|-----------------|
| [`discovery/`](discovery/) | system discovery → **discover** | **forbidden** |
| [`product-re/`](product-re/) | product reverse engineering → **reverse-engineer** | **forbidden** |
| [`solution-architecture/`](solution-architecture/) | solution redesign → **architect** | **forbidden** |
| [`specification-engineering/`](specification-engineering/) | specs / tasks / roadmap → **specify** | **forbidden** |
| [`validation-engine/`](validation-engine/) | artifact validation → **validate** | **forbidden** |
| [`review-engine/`](review-engine/) | governance review → **review** | **forbidden** |
| [`core/packages/scaffold/`](core/packages/scaffold/) | optional **scaffold** (not on `@Run full`) | **forbidden** |
| [`qualification-framework/`](qualification-framework/) | certify / benchmark → **qualify** | **forbidden** |
| [`runtime-engine/`](runtime-engine/) | single-command orchestration → **runtime** | **forbidden** |

All pipelines are discovery-class packages. Feature Workers are out of scope. Workers are packaged (not executed by Core in packaging milestones).
