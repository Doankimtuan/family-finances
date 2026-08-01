# Validator — discovery-schema-check

Reserved deterministic validator for `discovery-report` artifacts.

## Checks

1. JSON Schema validate against `core/packages/schemas/discovery-report.schema.json`
2. `report_kind` ∈ known discovery kinds
3. `findings` non-empty

## Outputs

`validation-report` only. No qualitative language.
