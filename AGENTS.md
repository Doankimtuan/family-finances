# Agent instructions

## Blocking laws (do not skip)

1. **No magic strings** — always-on Cursor rule: `.cursor/rules/no-magic-strings.mdc`.  
   SoT: `artifacts/coding-standards/CURRENT/magic-string-policy.md`, `constants-policy.md`.  
   Domain constants live in `modules/<bc>/application/*-constants.ts` (ledger / plan / inbox / tenancy). Routes: `app-path.ts`.

2. Prefer existing module application APIs, `shared/ui`, and Design Tokens. No imports from `archive/legacy-v1`.

If a required constant is missing, **add it at the documented home first**, then use it. Never hardcode and “clean up later.”

# UI Implementation Rules

Before modifying UI, read:

1. artifacts/information-architecture/CURRENT/
2. artifacts/ux-redesign/CURRENT/
3. artifacts/design-system-evolution/CURRENT/

Mandatory:

- Mobile-first, 440px viewport
- Reuse shared/ui and shared/patterns
- No business redesign
- No hardcoded strings or colors
- Light and dark mode
- English and Vietnamese
- WCAG AA
- Verify every changed screen in a real browser
- One flow per task
- Never mark UI complete without browser evidence

# UI Design Authority

Canonical product inputs:

1. artifacts/information-architecture/CURRENT/
2. artifacts/ux-redesign/CURRENT/
3. artifacts/design-system-evolution/CURRENT/

Taste Skill is an execution assistant only.

When Taste Skill conflicts with ViNha canonical artifacts, ViNha artifacts always win.

For every UI task:

- Use redesign-skill for audit first.
- Use design-taste-frontend or gpt-tasteskill for implementation.
- Use soft-skill as the preferred visual direction.
- Preserve business, IA, routes, and UX contracts.
- Implement exactly one screen or one coherent flow.
- Verify in a running browser.
