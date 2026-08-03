# Agent instructions

## Blocking laws (do not skip)

1. **No magic strings** — always-on Cursor rule: `.cursor/rules/no-magic-strings.mdc`.  
   SoT: `artifacts/coding-standards/CURRENT/magic-string-policy.md`, `constants-policy.md`.  
   Domain constants live in `modules/<bc>/application/*-constants.ts` (ledger / plan / inbox / tenancy). Routes: `app-path.ts`.

2. **Developer Constitution** — `artifacts/developer-constitution/CURRENT/` (especially `ai-agent-rules.md`). Do not redesign Product, Architecture, or Design System.

3. Prefer existing module application APIs, `shared/ui`, and Design Tokens. No imports from `archive/legacy-v1`.

If a required constant is missing, **add it at the documented home first**, then use it. Never hardcode and “clean up later.”
