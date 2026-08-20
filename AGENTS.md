# Agent instructions

## Blocking laws (do not skip)

1. **No magic strings** — always-on Cursor rule: `.cursor/rules/no-magic-strings.mdc`.  
   SoT: `artifacts/coding-standards/CURRENT/magic-string-policy.md`, `constants-policy.md`.  
   Domain constants live in `modules/<bc>/application/*-constants.ts` (ledger / plan / inbox / tenancy). Routes: `app-path.ts`.

2. Prefer existing module application APIs, `shared/ui`, and Design Tokens. No imports from `archive/legacy-v1`.

If a required constant is missing, **add it at the documented home first**, then use it. Never hardcode and “clean up later.”

# Agent Skills System (canonical)

Before modifying production code:

1. Read `.agents/instructions/PROJECT.md` (canonical AI instructions).
2. Load relevant skills from `.agents/skills/` (one `SKILL.md` per skill).
3. For substantial implementation/refactoring, always apply `code-quality` and `typescript-quality`.
4. Apply framework-specific skills when relevant: `react-quality`, `nextjs-architecture`, `form-architecture`, `error-handling`, `testing-quality`.
5. Before completion, apply `refactor-review` to the changed-file set.

Codex, Cursor, ZCode, and Zed discover `.agents/skills/` natively. Do not duplicate skill bodies into tool-specific directories. New machine setup / verification: `./scripts/setup-agent-skills.sh` (idempotent; see `.agents/README.md`).

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

## Persistent UI Constitution

- HeroUI v3 is the canonical component system; do not add a competing UI library.
- Hugeicons Free Stroke Rounded is the canonical icon system. Use `AppIcon` for low-level rendering and semantic registries only for stable domain concepts.
- The centered `max-width: 440px` app shell is intentional at every viewport. Desktop preserves the same single-column mobile layout and navigation.
- Shared form primitives own labels, descriptions, validation, and state styling. Prefer HeroUI controls over native primary Select, Date, and Time inputs.
- Do not use arbitrary HEX colors, radius values, icon libraries, Pro Hugeicons, one-off money formatting, or persisted formatted money strings.
- Significant UI work requires real-browser evidence at 390px, 440px, 768px, and 1280px.

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

### UI Constitution: Required Practices

- Build product controls from HeroUI v3 primitives and the shared `shared/ui` / `shared/patterns` layer before creating a local wrapper.
- Use semantic design tokens for color, spacing, radius, elevation, typography, financial states, and focus behavior. Keep display formatting separate from persisted financial values.
- Render Hugeicons via `AppIcon`. Use the navigation, finance, action, utility, and category registries for stable semantic concepts; persist category `iconKey` values only, never SVG markup or component identifiers.
- Make shared form components own their labels, descriptions, required state, validation message, disabled state, and accessible relationships. Preserve React Hook Form value contracts when adapting a field.
- Use shared currency, percentage, quantity, and compact-number formatters rather than formatting values within feature screens.
- Use `MoneyInput` or `AmountField` for monetary entry and `NumberField` for restricted numeric values. Ensure a formatted string is never saved as a financial domain value.
- Verify substantial UI changes in a running browser at 390px, 440px, 768px, and 1280px; check keyboard focus, reduced motion, overlays, and light/dark themes.

### UI Constitution: Forbidden Practices

- Do not add a competing UI component system or another icon library, use paid Hugeicons, or use emoji as production UI icons.
- Do not use native Select, Date, or Time controls as primary product UX without a documented technical exception.
- Do not introduce arbitrary HEX values, spacing, radius, shadow, icon size, or stroke width inside feature screens.
- Do not create one-off form controls, duplicate labels outside a field component, format money ad hoc, or persist localized money display strings.
- Do not use raw SVG or icon component names as persisted Tag or Category data.

### Ephemeral Create and Action Forms

Create/action forms are ephemeral by default. Closing a create/action Sheet or Modal discards unsaved state, conditional hidden values, preview state, validation errors, and mutation errors. Reopening starts from canonical fresh defaults. Edit forms reopen from persisted data, not abandoned local edits.

### Motion Foundation

- Use `motion/react` only. Do not import `framer-motion` or add another animation library.
- Use tokens and named spring presets from `shared/motion`; do not inline durations, easings, distances, scales, stiffness, or damping.
- Prefer `transform` and `opacity`; never animate layout properties such as width, height, margin, padding, top, or left.
- Respect `prefers-reduced-motion`. Reduced motion disables transforms and allows only short opacity fallbacks.
- Non-essential motion is disabled on low-end hardware. Responsiveness outranks smoothness.
- Motion components remain client leaves. Initial server output must match the hydrated first render.
- Conditional motion uses `AnimatePresence`, stable keys, and explicit exit states. Scroll reveals run once only.
- Do not add infinite decorative motion, parallax, scroll hijacking, animated financial values, or motion for serious warnings.
- HeroUI owns Drawer, Modal, Popover, Select, and other built-in transitions. Do not stack Motion over them.
- Use CSS for simple hover/press state changes when existing shared styles are sufficient.
- Verify meaningful motion changes in Chromium at 390px, 440px, 768px, and 1280px, in light/dark themes and with reduced motion enabled.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
