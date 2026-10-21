# ViNha audit setup — 20 October 2026

Configuration only. No product audit, authentication, application mutation, or
database operation was performed.

## Skills and discovery

Created `vinhna-user-journey`, `vinhna-financial-integrity`, and
`vinhna-product-audit` in canonical `.agents/skills/`, exposed through relative
symlinks at the requested `.zcode/skills/` paths. There are no duplicated bodies.

Verified live in ZCode Settings → Skills → family-finances: after Refresh and
searching `vinhna`, the UI showed **Installed 3**, all three requested names and
descriptions, with all three switches **on**. This confirms actual discovery,
not just files existing. Descriptions separate journey execution, financial
reconciliation, and product evaluation, each within ZCode's approximate
250-character trigger preview. Automatic task selection remains model-driven;
no product task was run to test invocation behavior.

Root `AGENTS.md` retains existing instructions and adds an audit-scoped safety
section. Shared operating rules and the single resumable progress manifest live
here. Ordinary implementation work is not placed in audit-only mode.

## Existing browser and MCP capabilities

- Installed Playwright CLI **0.1.22** is usable; no installation required.
- ZCode lists the user `playwright-cli` skill and built-in Browser Use skills
  `control-browser` and `web-gui-tester`. Prefer CLI for two-account execution,
  built-in Browser Use for visual exploration under its own instructions.
- ZCode Settings → MCP Servers lists **Installed 0** custom servers and seven
  existing plugin-managed servers: `node_repl` (Browser Use), `documents`,
  `image_search`, `pdf`, `presentations`, `spreadsheets`, and `supabase`.
  No duplicate Playwright MCP was listed. No new server or plugin was enabled.
  Existing unrelated global plugins remain enabled; they were preserved rather
  than removing capabilities used outside this audit.
- Inspected ZCode user/workspace configuration and compatibility MCP locations;
  no explicit custom MCP server configuration was found. Runtime plugin server
  health and the built-in browser backend were not exercised from this Codex chat.

## Session isolation evidence

Created independent in-memory CLI sessions `vinha-setup-a` and `vinha-setup-b`
(distinct browser processes). Intercepted `https://vinha-setup.invalid/` inside
each browser and fulfilled a static synthetic page locally, without contacting
ViNha or an external server.

1. A wrote synthetic cookie/local-storage marker `A`.
2. B asserted both markers absent, wrote `B`, reloaded, and asserted both still B.
   CLI result: **PASS: B isolated from A; own cookies and localStorage persist
   after reload**.
3. A reloaded and asserted both markers remained A after B's writes.
   CLI result: **PASS: A retained own cookies and localStorage after B writes
   and reload**.
4. Closed both setup-owned sessions; no shared/user browser was closed.

These checks prove session storage isolation and reload persistence. Actual
two-account authentication and household visibility remain for the future audit.

## Token economy

Three focused skills share one operating reference and load policy details only
for the current flow. Short snapshots, reused sessions, milestone screenshots,
incremental finding IDs, and one progress manifest prevent repeated exploration
and replay after compaction. Financial checks retain independent exact arithmetic
and required browser verification.

## Validation

- Canonical repository skill verification: PASS.
- YAML, skill naming, trigger length, supporting reference, and canonical symlink
  assertions using installed Node `yaml`: PASS for all three.
- ZCode live discovery and enabled state: PASS for all three.
- Two-session isolation/reload smoke check: PASS.
- The skill-creator Python validator could not import PyYAML in either available
  Python runtime. Equivalent format checks above used the already-installed YAML
  parser; no dependency was added.
- Lint and typecheck: PASS. Changed Markdown formatting and `git diff --check`: PASS.
- Repository formatting: FAIL, 192 files flagged, including unchanged application
  and test files. No broad formatting changes were made.
- Repository unit tests: FAIL, 265 files passed / 5 failed; 1,847 tests passed /
  8 failed. Failures are in unchanged application tests (navigation, translation
  parity, investment opening, account presentation, and financial privacy). No application
  fixes were attempted as part of this configuration task. Full product E2E is
  intentionally deferred.
- Final scope review: existing `AGENTS.md` content is preserved verbatim; the only
  tracked-file edit is its appended audit section. New files are audit documents,
  the three skills, and their compatibility symlinks. Application code is unchanged.
