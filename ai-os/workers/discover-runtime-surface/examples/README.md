# Examples — `discover-runtime-surface`

Non-normative illustrations for humans scaffolding a worker.

## Rules

1. Examples MUST NOT be treated as conformance tests (see `../testcases/`).
2. Use fake but well-formed `art_…` ids.
3. Show the shape of inputs the worker expects after claim/prepare.
4. Fixtures are normative for Discovery Worker packages.

## Files

| File | Purpose |
|------|---------|
| `sample-input.json` | Minimal claimed-run + task context the worker would load |
| `sample-output.json` | Envelope matching `../output-schema.json` |

Add more samples as `sample-fixture.json` using the same conventions.

| `sample-discovery-report.json` | Primary `discovery-report` payload (validates `schemas/discovery-report.schema.json`) |

