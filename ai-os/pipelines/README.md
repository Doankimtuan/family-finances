# AIOS Pipelines

| Pipeline | Class | Feature Workers |
|----------|-------|-----------------|
| [`discovery/`](discovery/) | system discovery | **forbidden** |
| [`product-re/`](product-re/) | product reverse engineering | **forbidden** |
| [`solution-architecture/`](solution-architecture/) | solution redesign (preserve business behavior) | **forbidden** |
| [`specification-engineering/`](specification-engineering/) | specs / tasks / roadmap / implementation plan | **forbidden** |
| [`validation-engine/`](validation-engine/) | automatic artifact validation → findings / scores / reports | **forbidden** |
| [`review-engine/`](review-engine/) | governance review → findings / scores / decisions | **forbidden** |
| [`framework-generator/`](framework-generator/) | configuration-driven framework scaffolding (12 workers, 9 waves) | **forbidden** |
| [`qualification-framework/`](qualification-framework/) | evaluate / benchmark / certify AIOS (10 workers, 7 waves) | **forbidden** |
| [`runtime-engine/`](runtime-engine/) | single-command orchestration of AIOS (15 workers, 7 waves) | **forbidden** |

All pipelines are discovery-class packages. Feature Workers are out of scope. Validation, Review Engine, Framework Generator, Qualification Framework, and Runtime Engine workers are packaged (not executed by Core).
