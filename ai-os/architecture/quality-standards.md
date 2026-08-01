# Quality Standards

## Quality model

Quality is enforced in layers:

1. **Structural** — schemas, naming, layout (validators)
2. **Contractual** — manifests, deps, side effects (validators + orchestrator)
3. **Substantive** — correctness vs success criteria (reviewers + human)
4. **Operational** — retries, budgets, auditability (orchestrator)

## Definition of Done (framework artifact)

An AIOS artifact is done only when:

- [ ] `meta.json` validates
- [ ] payload validates against its type schema (if any)
- [ ] dependencies pinned and resolvable
- [ ] required validators `pass`
- [ ] required reviewers `pass` (or `skip` under advisory policy)
- [ ] status is `published`
- [ ] success criteria mapping updated by orchestrator

## Gate profiles

Machine source of truth: `policies/gate-profiles.json` (`schemas/gate-profile.schema.json`).

| Profile | Validators | Reviews | Publish rule |
|---------|------------|---------|--------------|
| `strict` | blocking severities include medium+ | required on repo-write + plan | no publish with warn |
| `standard` | critical/high blocking | required on repo-write + plan | warns allowed |
| `advisory` | non-blocking | optional | publish with recorded warns |

Default for product-impacting work: `standard`.

## Plan quality checklist

- [ ] Success criteria are testable
- [ ] Non-goals listed
- [ ] DAG has no cycles
- [ ] Each task has one skill and one primary output type
- [ ] Gates assigned for write-capable tasks
- [ ] Risks and unknowns listed

## Review quality checklist

- [ ] Rubric version pinned
- [ ] Every criterion scored with a note
- [ ] Vetoes explicit if used
- [ ] Summary states ship / revise / reject
- [ ] Findings actionable (what + where + fix hint)

## Validation quality checklist

- [ ] Findings reference `check_id`
- [ ] Paths point to concrete fields/files
- [ ] Fixtures exist for critical checks (when package is `active`)
- [ ] Result aggregation matches finding severities

## Orchestration quality checklist

- [ ] Budget recorded and respected
- [ ] Every state transition logged
- [ ] No publish on blocking fail
- [ ] Final summary maps criteria → artifacts

## Severity → action matrix

| Severity | Standard profile action |
|----------|-------------------------|
| `critical` | block publish; retry or replan |
| `high` | block publish |
| `medium` | warn; continue |
| `low` | record |
| `info` | record |

## Non-negotiable quality laws

1. No self-approval: producers cannot be the blocking reviewer of their own artifact.
2. No silent side effects.
3. No schema-invalid `ready` artifacts.
4. No dependency on chat history.
5. No workers in framework phase pretending to be “temporary exceptions”.
