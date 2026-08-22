# PROJECT.md — Canonical AI Instructions

Single source of truth for how AI agents work in this repository. Root
`AGENTS.md` points here; do not duplicate this content into tool-specific
files.

## Canonical Locations

| What                  | Where                                                                        |
| --------------------- | ---------------------------------------------------------------------------- |
| Agent instructions    | `.agents/instructions/PROJECT.md` (this file)                                |
| Design system (Home)  | `.agents/design-system.md` (canonical UI reference; read before any UI work) |
| Agent skills          | `.agents/skills/<skill-name>/SKILL.md`                                       |
| UI constitution, laws | root `AGENTS.md`                                                             |
| Setup / verify links  | `./scripts/setup-agent-skills.sh`                                            |

`.agents/skills/` is the Agent Skills open-standard root. Codex, Cursor,
ZCode, and Zed discover it natively — never copy skill bodies into
tool-specific directories.

## Skill Selection

Before implementation, load the relevant skills:

| Task                           | Load                                                |
| ------------------------------ | --------------------------------------------------- |
| Any code write/edit/review     | `code-quality`, `typescript-quality`                |
| React components               | + `react-quality`                                   |
| Routes / server data / actions | + `nextjs-architecture`                             |
| Forms and validation           | + `form-architecture`                               |
| Failure handling / Supabase    | + `error-handling` (and installed `supabase` skill) |
| Writing or changing tests      | + `testing-quality`                                 |
| End of every refactor          | `refactor-review` (mandatory)                       |

UI work additionally follows the UI Constitution in root `AGENTS.md` and the
design skills it references.

## Verification Commands (mandatory before completion)

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run test        # Vitest
```

Run `npm run format:check` when markdown/config files changed, and
`npm run test:e2e` for E2E-relevant changes. Substantial UI changes require
real-browser evidence at 390/440/768/1280 (UI law in `AGENTS.md`).

## Architecture Constraints

- Business logic lives in `modules/<bc>/application` (framework-independent,
  testable). UI renders; domain computes.
- Prefer existing module application APIs, `shared/ui`, and design tokens.
- No imports from `archive/legacy-v1`.
- Domain constants live in `modules/<bc>/application/*-constants.ts`; routes in
  `app-path.ts`. Missing constant → add it at the documented home first.
- Health is read-only (BR-24): no Supabase clients or command imports there.

## Hard Rules

- Pure refactors preserve observable behavior unless the task explicitly
  requests otherwise.
- No new dependencies without clear justification; prefer native
  JS/TS, then existing project utilities, then installed libraries.
- No broad unrelated cleanup — the change set matches the task.
- Do not mark UI complete without browser evidence.

## Workflow

```text
Understand  ->  Plan  ->  Implement  ->  Validate  ->  refactor-review
```

Validate means the verification commands above; `refactor-review` is the
final gate for any substantial change.
