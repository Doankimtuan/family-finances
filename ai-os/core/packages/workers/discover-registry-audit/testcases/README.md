# Testcases — `discover-registry-audit`

Machine-oriented fixtures for future conformance runners.

## Rules

1. Each case is one JSON file: `case-NN-slug.json`.
2. Cases are normative for the worker package once status is `active`.
3. Every `expect` block must be objectively checkable.
4. Prefer small fixtures; pin all artifact versions.

## Required coverage (minimum)

| Case | Intent |
|------|--------|
| `case-01-happy-path.json` | Claim → prepare → execute stub → validate → review → ready envelope |
| `case-02-budget-exceed.json` | Skill side effect not in orchestration budget → fail preparing |
| `case-03-blocking-validation-fail.json` | Validator `fail` → run failed, no publish |
| `case-04-blocking-review-fail.json` | Reviewer `fail` / veto → run failed, no publish |
| `case-05-missing-skill.json` | Unknown `skill_id` → fail preparing |

## File format

See `case-01-happy-path.json` for the template shape.
