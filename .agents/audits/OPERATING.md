# ViNha audit operating rules

Read this once per audit context, then load only the relevant audit skill.
Root `AGENTS.md` supplies audit safety boundaries. Setup does not authorize a
product audit. Before future browser mutations, verify the target URL, backend,
synthetic household, and two distinct test identities are non-production. If this
cannot be established, record BLOCKED and stop dependent actions.

## Evidence and checkpoints

Use `progress.md` as the only progress manifest. Record environment/build,
synthetic fixture identifiers, session aliases (never secrets), journey IDs,
checklists, status, evidence paths, finding IDs, and the exact next action.
Statuses: NOT STARTED, IN PROGRESS, PASS, FAIL, BLOCKED. PASS requires observed
browser results; absent evidence means BLOCKED, not PASS. Distinguish a setup
smoke check from authenticated product verification.

Write incremental findings to separate Markdown reports here; link them from the
manifest. After compaction, read the manifest and relevant finding only. Resume
unfinished steps without recreating data or repeating completed journeys. Rerun
only when changed build/fixtures invalidate evidence; retain the earlier result.

## Browser selection

Prefer installed `playwright-cli` for repeatable two-account workflows. Use two
named, in-memory sessions, not two tabs sharing a browser context:

```bash
playwright-cli -s=vinha-a open about:blank
playwright-cli -s=vinha-b open about:blank
```

Confirm each identity through the UI after sign-in; reuse those sessions for the
audit. If a session expires, reauthenticate that identity and verify the current
checkpoint before continuing. Keep authentication state out of tracked files and
reports; redact private data from evidence. Close only audit-owned sessions.

Use ZCode's existing Browser Use plugin for visual exploration when useful; read
its `control-browser` skill and inspect advertised backends first. Do not assume
two built-in tabs are isolated sessions. Do not install a second browser stack or
enable another MCP server for capabilities already available.

## Context budget

- Work in small, independently completable phases and one coherent flow at a time.
- Read targeted files and policy sections; avoid whole repositories/tables.
- Prefer short accessibility snapshots and targeted text searches. Take screenshots
  at milestones or for visual defects; retain enough evidence to verify claims.
- Reuse browsers and the running app; restart only to resolve an observed issue.
- Link confirmed findings instead of investigating them again. Use network,
  performance, or trace diagnostics only for a specific unresolved question.
- Reserve deeper reasoning for financial/security analysis; keep routine clicks
  direct. Token savings never justify skipping verification.
