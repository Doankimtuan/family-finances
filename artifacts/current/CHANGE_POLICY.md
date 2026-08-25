# Change Policy

## Rules

- Never modify external historical records.
- Never modify archived documents.
- Only update documents inside `artifacts/current/`.
- Every business change must update:
  - `artifacts/current/specification/`
  - the affected `artifacts/current/domains/<domain>/` package
  - `artifacts/current/product/` references when affected
- New domains must complete the standard 5-phase workflow before entering `artifacts/current/domains/`.
- History is immutable.

## Change Discipline

Documentation changes must preserve one authoritative copy in `artifacts/current/`.
Do not create parallel CURRENT aliases, duplicate indexes, or implementation-facing references outside `artifacts/current/`.
