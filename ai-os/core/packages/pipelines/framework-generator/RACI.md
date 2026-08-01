# RACI — Framework Generator (v0.9.1)

Complete entry_kind ownership. Generators must not emit kinds owned by another worker.

| entry_kind | Owner |
|------------|-------|
| `json-schema` | `schema-generator` |
| `config-schema` | `schema-generator` |
| `validation-schema` | `schema-generator` |
| `artifact-schema` | `schema-generator` |
| `markdown-template` | `schema-generator` |
| `artifact-contract` | `artifact-generator` |
| `folder-structure` | `artifact-generator` |
| `naming-rules` | `artifact-generator` |
| `lifecycle` | `artifact-generator` |
| `retention-policy` | `artifact-generator` |
| `builder-prompt` | `prompt-generator` |
| `reviewer-prompt` | `prompt-generator` |
| `validator-prompt` | `prompt-generator` |
| `improve-prompt` | `prompt-generator` |
| `freeze-prompt` | `prompt-generator` |
| `execution-prompt` | `prompt-generator` |
| `worker-package` | `worker-generator` |
| `worker-readme` | `worker-generator` |
| `worker-skill` | `worker-generator` |
| `worker-manifest` | `worker-generator` |
| `artifact-validation` | `validator-generator` |
| `schema-validation` | `validator-generator` |
| `traceability-validation` | `validator-generator` |
| `dependency-validation` | `validator-generator` |
| `completeness-validation` | `validator-generator` |
| `consistency-validation` | `validator-generator` |
| `quality-validation` | `validator-generator` |
| `architecture-review` | `reviewer-generator` |
| `business-review` | `reviewer-generator` |
| `specification-review` | `reviewer-generator` |
| `quality-review` | `reviewer-generator` |
| `documentation-review` | `reviewer-generator` |
| `security-review` | `reviewer-generator` |
| `performance-review` | `reviewer-generator` |
| `sequential-pipeline` | `pipeline-generator` |
| `parallel-pipeline` | `pipeline-generator` |
| `conditional-pipeline` | `pipeline-generator` |
| `resume-pipeline` | `pipeline-generator` |
| `incremental-pipeline` | `pipeline-generator` |
| `retry-strategy` | `pipeline-generator` |
| `checkpoint-strategy` | `pipeline-generator` |
| `rollback-strategy` | `pipeline-generator` |
| `test-case` | `test-generator` |
| `validation-case` | `test-generator` |
| `edge-case` | `test-generator` |
| `regression-test` | `test-generator` |
| `sample-project` | `test-generator` |
| `acceptance-test` | `test-generator` |
| `architecture-doc` | `documentation-generator` |
| `usage-guide` | `documentation-generator` |
| `example-doc` | `documentation-generator` |
| `developer-guide` | `documentation-generator` |
| `migration-guide` | `documentation-generator` |
| `changelog` | `documentation-generator` |
| `release-notes` | `documentation-generator` |
| `repo-init` | `project-bootstrap-generator` |
| `folder-scaffold` | `project-bootstrap-generator` |
| `worker-registration` | `project-bootstrap-generator` |
| `pipeline-registration` | `project-bootstrap-generator` |
| `config-generation` | `project-bootstrap-generator` |
| `default-templates` | `project-bootstrap-generator` |
| `plan` | `generation-orchestrator` |
| `order` | `generation-orchestrator` |
| `merge` | `generation-orchestrator` |
| `dedupe` | `generation-orchestrator` |
| `overall-status` | `generation-orchestrator` |
| `summary` | `generation-reporter` |
| `critical-gaps` | `generation-reporter` |
| `overall-recommendation` | `generation-reporter` |
| `gate-envelope` | `generation-reporter` |

## Overlap resolution

| Concern | Owner | Not owner |
|---------|-------|-----------|
| Worker package skeleton | worker-generator | validator/reviewer/test/documentation generators |
| Registry patch files | project-bootstrap-generator | worker-generator (plans ids only) |
| JSON Schema fields | schema-generator | artifact-generator |
| Prompt text | prompt-generator | worker-generator skill.md content |
| Gate report envelope | generation-reporter | generation-orchestrator |

Packaging only — no generation execution.
