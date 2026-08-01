---
name: {{skill_id}}
description: {{third_person_what_and_when}}
---

# {{Skill Title}}

> Framework template — replace placeholders. Do not implement product work in framework phase.

## Roles allowed in skills

`planner` | `executor` | `orchestrator-helper` only.  
Validators and reviewers are separate package kinds.

## Inputs

| Name | Artifact type | Required |
|------|---------------|----------|
| {{input_name}} | {{artifact_type}} | yes |

## Outputs

| Name | Artifact type | Primary |
|------|---------------|---------|
| {{output_name}} | {{artifact_type}} | yes |

## Procedure

1. Load declared inputs only.
2. {{step}}
3. Write staging artifact (`draft`).
4. Finalize payload + `meta.json` (`ready`).
5. Stop — core/packages/validators/reviewers run outside this skill.

## Done when

- [ ] {{criterion_1}}
- [ ] Output validates against skill output schema
- [ ] Dependencies recorded in `meta.json`

## Non-goals

- {{non_goal}}

## References

- `manifest.json`
- Optional: `references/{{doc}}.md`
