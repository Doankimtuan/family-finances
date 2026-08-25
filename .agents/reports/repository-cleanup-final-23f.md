# REPO 23F — Final Repository Hygiene + Canonical Cleanup Gate

Date: 2026-08-26  
Branch: `main`  
HEAD: `556c776c8a49116e8e1608961cef0ef9bc72af64`

## Verdict

**REPOSITORY CLEANUP COMPLETE.**

The canonical repository shape is in place, the two-migration freeze is aligned locally and remotely, and the required unit, E2E, release, lint, typecheck, build, diff, and changed-file formatting checks pass. The worktree remains intentionally non-clean because pre-existing user changes were preserved.

The repository-wide Prettier check still reports 209 files with existing formatting debt. The changed-file check passes; this gate did not mass-format unrelated files.

## Hygiene completed

- Removed 22 confirmed obsolete 23A–23D cleanup reports, schema snapshots, and historical artifact/blueprint files.
- Kept durable `.agents` instructions, reusable skills, current design/IA/UX artifacts, final module reports, migration certification, and release integration evidence.
- Removed the stale root `history` pointer from `index.json`.
- Updated `public/README.md` and `scripts/README.md` to describe the current repository.
- Renamed `scripts/g1-seed-e2e-fixtures.mjs` to `scripts/seed-e2e-fixtures.mjs` and updated its documentation reference.
- Confirmed no historical top-level source trees, phase/prompt/sprint/gate-named test files, stale migration paths, or deleted-report references remain in the working tree.
- Confirmed all public assets are referenced runtime brand/favicon/manifest assets; no dependency or asset deletion was justified.
- Confirmed generated/local paths remain ignored, including `output/`, `screenshots/`, `.next/`, Playwright results, environment files, and local agent evidence.

## Canonical structure metrics

| Metric                                                              |          23A baseline |                         23F result |
| ------------------------------------------------------------------- | --------------------: | ---------------------------------: |
| Tracked files                                                       |                 6,492 | 2,186; 2,187 including this report |
| Repository content size (excluding `.git`, `node_modules`, `.next`) |               ~200 MB |                             ~22 MB |
| `.agents` tracked files                                             |                   353 |     216; 217 including this report |
| `artifacts` tracked files                                           |                 1,039 |                                940 |
| `scripts` tracked files                                             | 21 plus one untracked |                                 14 |
| Unit/integration test files                                         |                   158 |                                157 |
| E2E spec files                                                      |                    53 |                                 50 |
| Dependencies / devDependencies                                      |               22 / 19 |                            22 / 19 |
| Migration files                                                     |  131 historical files |                  2 canonical files |

The on-disk workspace is approximately 94.7 MB when `.git` is included; `.git` alone is approximately 72 MB and was not rewritten.

## Validation evidence

| Check                          | Result                                                       |
| ------------------------------ | ------------------------------------------------------------ |
| Unit suite                     | PASS — 157 files, 977 tests                                  |
| Canonical non-release E2E      | PASS — 135 passed, 6 intentional skips, 0 failures           |
| Release-critical E2E           | PASS — 11 passed                                             |
| `npm run lint`                 | PASS                                                         |
| `npm run typecheck`            | PASS                                                         |
| `npm run build`                | PASS — 96 static pages generated                             |
| Migration freeze guard         | PASS — baseline plus one forward migration                   |
| Linked migration list          | PASS — local and remote aligned                              |
| Linked dry-run push            | PASS — remote database up to date                            |
| `git diff --check`             | PASS                                                         |
| Changed-file Prettier check    | PASS                                                         |
| Repository-wide Prettier check | Existing debt — 209 files; no unrelated mass rewrite applied |

## Migration state

The only committed migration files are:

1. `supabase/migrations/20260825125516_v1_baseline.sql`
2. `supabase/migrations/20260825143000_inbox_read_state_acl_23e1.sql`

The migration freeze manifest and checksum guard remain authoritative. Local and linked remote history report exactly those two versions, and the linked dry run reports no pending migrations.

## Remaining intentional debt

- Repository-wide formatting debt remains in 209 pre-existing files. Address it separately as a formatting-only task with an explicit review budget.
- Browser runs still emit existing reduced-motion, HeroUI PressResponder, and development-stream warnings; they did not fail the required suites.
- Production credential rotation/history-rewrite obligations remain operational security work, not repository cleanup work. No secret values were added by this gate.
