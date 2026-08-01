# Framework Generator Pipeline

**Version:** 0.1.0 · **Workers:** 10 · **Waves:** 4

Generates scaffold plans for framework components from YAML/JSON capability specs.

## Generators

- `schema-generator` — Schema Generator
- `artifact-generator` — Artifact Generator
- `prompt-generator` — Prompt Generator
- `worker-generator` — Worker Generator
- `validator-generator` — Validator Generator
- `reviewer-generator` — Reviewer Generator
- `pipeline-generator` — Pipeline Generator
- `test-generator` — Test Generator
- `documentation-generator` — Documentation Generator
- `project-bootstrap-generator` — Project Bootstrap Generator

## Verification

```bash
npm run aios:framework-generator:smoke
```

Generation is **not** executed in packaging milestone.
