# AIOS Pipelines

| Pipeline | Class | Feature Workers |
|----------|-------|-----------------|
| [`discovery/`](discovery/) | system discovery | **forbidden** |
| [`product-re/`](product-re/) | product reverse engineering | **forbidden** |
| [`solution-architecture/`](solution-architecture/) | solution redesign (preserve business behavior) | **forbidden** |
| [`specification-engineering/`](specification-engineering/) | specs / tasks / roadmap / implementation plan | **forbidden** |
| [`validation-engine/`](validation-engine/) | automatic artifact validation → findings / scores / reports | **forbidden** |

All pipelines are discovery-class packages. Feature Workers are out of scope. Validation Engine workers are packaged in v0.7.0 (not executed by Core).
