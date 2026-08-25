# Family Finances (ViNha)

This repository uses `artifacts/current/` as the single implementation knowledge base.

## Official Knowledge Base

- `artifacts/current/specification/`
- `artifacts/current/domains/`
- `artifacts/current/product/`
- `artifacts/current/planning/`
- `artifacts/current/architecture/`

See `artifacts/README.md` and `artifacts/index.json` before implementing product behavior.

## Authenticated E2E

Local authenticated Playwright runs load `E2E_USER_EMAIL` and
`E2E_USER_PASSWORD` from `.env.local`; CI can provide the same variables
explicitly. Run `npm run e2e:auth-check` to verify login and protected routes
without printing credentials. Use `npm run e2e:fixture:setup` only for the
existing disposable ownership fixture when its identities are unassigned.

Historical implementation records are intentionally excluded from the product
repository. Use the pre-cleanup safety branch for rollback when needed.
