# Repository scripts

Reusable development, fixture, asset, and migration tooling for the current
application. Historical one-off scripts are not part of the product
repository.

- `setup-agent-skills.sh` — initialize/verify the canonical Agent Skills system (`.agents/`); idempotent, safe to re-run.
- `validate-migration-freeze.mjs` — verify the frozen baseline and forward-only migration policy.
- `ownership-test-harness.mjs` — provision and clean ownership/release E2E fixtures.
- `e2e-auth-fixture.mjs` — provision and clean the run-scoped authenticated E2E fixture.
- `seed-e2e-fixtures.mjs` — seed deterministic E2E domain data for local verification.
- `generate-brand-assets.mjs` — generate runtime brand assets from the approved source.
