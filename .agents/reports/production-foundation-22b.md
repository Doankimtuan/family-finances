# RELEASE 22B — Secrets Hygiene + Release Source Freeze

Date: 2026-08-25

## Verdict

**NO-GO for production provisioning or deployment.** Release 22B completed the
hygiene and freeze checks, but the source is not yet an immutable release
commit: 97 already-applied migrations are modified in the worktree, 16 applied
migrations are untracked, and the credential-bearing settings file remains in
reachable Git history. No deployment was attempted.

## Credential exposure

The tracked `.commandcode/settings.json` was sanitized. Its non-secret
CommandCode allow-list was retained; credential-bearing remote/test commands
were removed. Secret values are intentionally absent from this report.

The post-change tracked-tree scan found no high-confidence literal Supabase
secret key, service-role JWT, database URL credential, or credential assignment.

| Finding                                                                                                              | Classification                                | Action                                                                             |
| -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------- |
| Historical credential-bearing Supabase/test commands in `.commandcode/settings.json`                                 | Real/test credentials                         | Rotate every affected disposable identity and any linked development DB credential |
| `E2E_*` and `OWNERSHIP_TEST_*` environment references in scripts/tests                                               | Test configuration                            | Keep values in local/CI secret stores only; do not commit values                   |
| `NEXT_PUBLIC_SUPABASE_URL`, publishable key, and legacy anon-key fallback                                            | Public configuration / compatibility fallback | Keep public; prefer `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`                         |
| Provider names and public CoinGecko/VNStock endpoints                                                                | Public configuration                          | No rotation required                                                               |
| `MARKET_SYNC_SECRET`, `COINGECKO_API_KEY`, `VNSTOCK_API_KEY`, `SUPABASE_DB_PASSWORD` with no active current consumer | Unused/stale names                            | Not added to the production contract; remove later only with owner confirmation    |
| Documentation, env-key names, and fixture labels without secret values                                               | False positives                               | No action                                                                          |

## Git-history exposure

- `.commandcode/settings.json` exists in 6 reachable commits.
- Credential-bearing entries matching the current pre-sanitization settings
  were present in 4 of those commits.
- Rotation is required even if the repository is private.
- History rewriting was **not** performed. Rewrite is required if this
  repository was public or any untrusted clone had access; private-repository
  cleanup may be handled separately after rotation.

## Rotation checklist

- [ ] Rotate or delete/recreate each disposable E2E/Auth identity whose
      password was used by the historical settings commands; update only local/CI
      secret stores.
- [ ] Rotate `OWNERSHIP_TEST_A_PASSWORD` and `OWNERSHIP_TEST_B_PASSWORD` if
      either identity maps to the exposed test commands; verify the two identities
      remain isolated.
- [ ] Rotate `E2E_USER_PASSWORD` if its identity was reused by the exposed
      commands.
- [ ] Rotate the linked development Supabase database password if the
      historical database command used that credential; update local Supabase
      link/configuration without committing it.
- [ ] No privileged `service_role`/`sb_secret` key value was detected, so no
      privileged-key rotation is identified by this scan. Confirm in the Supabase
      dashboard before closing the item.
- [ ] No market-sync secret value was detected; no market-secret rotation is
      identified.
- [ ] If history rewriting is approved, rewrite the settings file from all
      reachable refs after rotation and force-refresh dependent clones.

Rotation was not performed automatically because it changes external Auth and
database state and the current environment did not provide a safe, explicit
disposable-identity mapping without exposing values.

## Environment separation

- Development/test contracts remain in `.env.local.example`.
- Production public/server-only contracts are documented in
  `.env.production.example`.
- Production application paths do not consume `E2E_*`, `OWNERSHIP_TEST_*`, or
  `SUPABASE_DB_PASSWORD`; those names occur only in fixture/test tooling or
  historical documentation.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` remains an active compatibility fallback in
  the public Supabase env adapter and legacy/fixture tooling.
- `SUPABASE_SECRET_KEY` remains a fixture-only compatibility fallback ahead of
  `SUPABASE_SERVICE_ROLE_KEY`; it is not a production public env.
- Current market admin routes use `MARKET_CATALOG_SYNC_SECRET` and
  `MARKET_PRICE_SYNC_SECRET`. The stale singular `MARKET_SYNC_SECRET` is not
  consumed.
- `COINGECKO_API_KEY` and `VNSTOCK_API_KEY` are not consumed; current provider
  adapters use their public endpoints.

## Migration source freeze

Remote verification showed the local and linked migration histories aligned
through schema head `20260824233500_release_21a2_rpc_acl_regression`, and the
linked dry-run reported no pending migrations.

The canonical ordered inventory, including version, filename, Git status,
remote-applied status, SHA-256 checksum, classification, and action, is
[production-foundation-22b-migration-manifest.json](./production-foundation-22b-migration-manifest.json).

| Class | Meaning                                             |                     Count | Required action                                                    |
| ----- | --------------------------------------------------- | ------------------------: | ------------------------------------------------------------------ |
| A     | Current applied migration with clean tracked source |                        11 | Freeze unchanged                                                   |
| B     | Fetched/aligned remote migration                    | 0 separately identifiable | No separate B state was distinguishable from the linked CLI output |
| C     | Modified already-applied tracked migration          |                        97 | Review/recover or explicitly approve; never edit after freeze      |
| D     | Duplicate/obsolete migration                        |                         0 | None                                                               |
| E     | Valid applied migration not tracked by Git          |                        16 | Add to the release commit                                          |

The guard in `scripts/validate-migration-freeze.mjs` checks frozen SHA-256
content, duplicate versions, ordering, missing frozen files, and stale
unfrozen files. New migrations are allowed only when their version is after
the frozen schema head. CI runs `npm run migrations:validate`.

## Release source checkpoint

Production provisioning must use a new clean Git commit containing this report,
the sanitized settings, the migration manifest, the guard, and the intended
release migration set. The current base commit is
`ff8a46d39f2e991c291a8d4892de69aae4f84e54`, but the current worktree is dirty
and is not itself a provisioning checkpoint.

- Schema head: `20260824233500_release_21a2_rpc_acl_regression`
- Migration manifest: `production-foundation-22b-migration-manifest.json`
- Next.js: `16.3.1`
- React / React DOM: `19.2.3 / 19.2.3`
- Package manager / lockfile: npm / `package-lock.json` v3
- Node expectation: CI uses Node 22; local build used Node 24.4.1

## Validation

| Check                                 | Result                                                                                       |
| ------------------------------------- | -------------------------------------------------------------------------------------------- |
| Redacted tracked-tree secret scan     | PASS after settings sanitization                                                             |
| Environment contract separation check | PASS                                                                                         |
| Migration manifest / checksum guard   | PASS — 124 frozen migrations                                                                 |
| Duplicate and ordering validation     | PASS                                                                                         |
| `supabase migration list --linked`    | PASS — local/remote aligned                                                                  |
| `supabase db push --linked --dry-run` | PASS — no pending migrations                                                                 |
| `npm run lint`                        | PASS                                                                                         |
| `npm run typecheck`                   | PASS                                                                                         |
| `npm run build`                       | PASS                                                                                         |
| `git diff --check`                    | PASS                                                                                         |
| `npm run format:check`                | FAIL — pre-existing repository-wide format debt across 2,209 files; no mass-format performed |
| Full unit suite                       | Skipped per runbook; no shared runtime/product code changed                                  |
