# .agents — Canonical Agent Skills & Instructions

One editable source of truth for AI coding standards in this repository.
Every tool consumes this directory; no tool owns a private copy.

```text
                 ┌──────────────────────────────┐
                 │      .agents/skills/         │
                 │      CANONICAL SOURCE        │
                 │  .agents/instructions/       │
                 └──────────────┬───────────────┘
                                │  native discovery / symlink / adapter
        ┌───────────────┬───────┴────────┬───────────────┐
        ▼               ▼                ▼               ▼
     Codex           Cursor            ZCode        CommandCode
 (native .agents) (native .agents)  (native .agents) (per-skill symlinks)
                                ▼
                              Zed (native, if installed)
```

## Canonical Source-of-Truth Principle

- Each skill exists exactly once, editable, under `.agents/skills/<name>/`.
- Tool-specific directories only reference (symlink) or point (adapter rule)
  to this source — they never contain copies.
- Externally-installed skills are tracked by `skills-lock.json`
  (`npx skills` convention). First-party skills below are hand-authored and
  deliberately NOT in `skills-lock.json`, so updater runs never touch them.

## First-Party Skills (this system)

| Skill                 | Purpose                                                                                               | Loaded when                                |
| --------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `code-quality`        | Structural quality baseline: control flow, magic values, functions, duplication, anti-overengineering | Every implementation/review task           |
| `typescript-quality`  | Type-system domain modeling, unions, guards, schema-derived types                                     | Any type/schema/state definition work      |
| `react-quality`       | React 19 component responsibility, state ownership, effect discipline, rendering                      | Any component work                         |
| `nextjs-architecture` | Server Components, `"use client"` boundaries, Server Actions, revalidation, loading/error boundaries  | Route, layout, action, or data-access work |
| `form-architecture`   | React Hook Form + Zod ownership, ephemeral create forms, shared schemas                               | Form/validation/mutation-payload work      |
| `error-handling`      | Typed results, domain error codes, expected vs unexpected, Supabase/RPC/action errors, user messages  | Failure handling or Supabase-touching work |
| `testing-quality`     | Regression-first testing, financial-math coverage, behavior-oriented tests (Vitest/Playwright)        | Test writing, or before risky refactors    |
| `refactor-review`     | Final changed-file review gate                                                                        | End of every refactor/substantial change   |

Always load `code-quality` + `typescript-quality` for implementation; add
framework skills per the matrix in `.agents/instructions/PROJECT.md`; finish
refactors with `refactor-review`.

### Externally-Installed Skills (also canonical here)

`supabase`, `typescript-clean-code` (deep Clean Code reference),
`vercel-react-best-practices` (React/Next performance deep-dive), and the
design/taste skills (`brandkit`, `design-taste-frontend`, `gpt-taste`,
`high-end-visual-design`, `minimalist-ui`, `redesign-existing-projects`)
referenced by the UI workflow in root `AGENTS.md`.

## Tool Integration

| Tool        | How it finds skills                                                                                                                                                     | Verified                         |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Codex       | Native: scans `.agents/skills` up to repo root (docs for codex-cli 0.147.0; symlinked folders supported)                                                                | Yes — docs + local CLI           |
| Cursor      | Native: project-level `.agents/skills/` (current docs); `.cursor/rules/no-magic-strings.mdc` stays as the hard-law rule, plus the small `agent-skills.mdc` pointer rule | Yes — docs; Cursor.app installed |
| ZCode       | Native: project `.agents/skills/` (this session lists them as available skills)                                                                                         | Yes — live                       |
| Zed         | Native: `<worktree>/.agents/skills/` (trusted worktrees) — Zed not installed locally, so unverified on this machine                                                     | Docs only                        |
| CommandCode | `.commandcode/skills/<name>` per-skill relative symlinks to `../../.agents/skills/<name>` (established repo pattern, git-tracked)                                       | Yes — existing links resolved    |

Because Codex, Cursor, ZCode, and Zed all read `.agents/skills` natively, no
symlinks are created for them — that is the point of the standard. Symlinks
exist only where a tool has its own directory (CommandCode).

## Setup & Verification

```bash
./scripts/setup-agent-skills.sh          # all tools (idempotent)
./scripts/setup-agent-skills.sh verify   # validate skills + links only
```

Safe to run repeatedly: it never overwrites real files, only creates/refreshes
project-owned symlinks and prints a report.

## Adding a New Skill

1. `mkdir .agents/skills/<kebab-name>`
2. Create `SKILL.md` with frontmatter `name` (must equal the folder name) and
   a `description` that says WHEN the skill applies.
3. Keep the body focused (<~200 lines); progressive disclosure — details go
   into reference files, not the prompt.
4. Register the skill in the selection matrix in
   `.agents/instructions/PROJECT.md` and in the table above.
5. Run `./scripts/setup-agent-skills.sh verify`.
6. First-party skills are never added to `skills-lock.json`.

## Updating a Skill

Edit `.agents/skills/<name>/SKILL.md` — that is the only copy. Consumers pick
up changes on their next session; symlinks need no updates. For
externally-installed skills, prefer `npx skills update <name>` so
`skills-lock.json` hashes stay accurate.
