# ViNha Home Visual Refinement — 07C.1

## Summary

Refined Home's static visual hierarchy without changing its information
architecture, copy semantics, calculations, routes, permissions, or motion
behavior.

The implementation now follows **flat by default, surface by semantic
importance**:

- the balance remains the only emphasized hero surface;
- period analytics remain open sections;
- pending Inbox work uses a soft task surface while clear Inbox stays flat;
- Plan uses a calmer bounded planning row;
- the decorative Home header icon was removed because it had no interaction or
  distinct meaning.

## Surface Decision Model

Documented in `artifacts/design-system-evolution/CURRENT/visual-foundation.md`.
It defines emphasized hero surfaces, soft financial-object surfaces, pending
task surfaces, flat transaction rows, open analytics, semantic warning/error
surfaces, soft setup states, flat navigation, and flat metadata.

Home applies the model through the emphasized balance hero, open cash-flow and
spending story, pending Inbox task surface, and quieter Plan object surface.

## Hero refinement

- Moved the supporting account meaning below the dominant balance as compact
  `xs` helper text with pretty wrapping.
- Moved the contextual action below the amount so it no longer forms a
  competing two-column block; it remains visible and keyboard accessible.
- Kept net cash flow inside the hero, associated the state text with the net
  value, and reduced the status treatment to a compact text-like badge.
- Kept the hero softly tinted with existing surface tokens and elevation-1.

## Light mode

Adjusted shared light-mode canvas and soft-surface tokens toward cleaner
neutral separation while preserving the existing semantic palette. The Home
hero now uses the existing surface-highlight token instead of a heavier accent
wash.

## This-period section

- Changed Income and Expense from three equal report columns into a two-up
  comparison pair.
- Kept Net as a full-width supporting result below the pair.
- Reduced helper copy to compact text with pretty wrapping.
- Reduced chart height from 160px to 144px, line weight from 2px to 1.5px,
  active dots from 4px to 3px, and area/grid opacity for quieter presentation.
- Preserved the existing chart type, point data, tooltip, and financial
  calculations.
- Kept spending as a flat list, softened icons and progress treatment, reduced
  bar thickness, and increased row breathing room.

## Inbox

Pending Inbox items now use a soft warning-toned bounded task surface with a
notification icon and one secondary action. Clear Inbox uses a neutral icon and
flat text without success coloring or a card surface.

## Plan

Plan now uses a soft bounded row for its Jar count and allocation mode. Its
destination link remains in the section header and stays calmer than the
pending Inbox task surface.

## Header action/icon

The Home top-right icon was decorative: `TopAppBar` rendered it as a visual
container, but it had no interaction, label, or distinct action. It was removed
from Home rather than retaining a control-looking element without purpose.

## Responsive

The constrained 440px shell and token-based spacing remain unchanged. The
implementation uses flexible wrapping, a stacked hero action, a two-column
cash-flow comparison that collapses naturally within the shell, and no fixed
horizontal widths.

Authenticated browser inspection was unavailable: `http://localhost:3000/en/home`
redirected to `/en/login`. Therefore 390px, 440px, 768px, and 1280px populated
Home findings are not claimed here.

## Dark mode

Dark-mode token values were not changed. Home continues to use semantic surface,
border, warning, and text tokens, so the new light-mode adjustments do not
invert or introduce a separate dark palette.

## Screenshot evidence

No authenticated Home screenshots were captured. The local browser fixture
redirected to login, and no safe authenticated fixture was available. Existing
pre-change audit screenshots were not reused as 07C.1 evidence.

## Deferred

- Motion pass and any motion-wrapper refactor.
- Point-by-point chart accessibility.
- Freshness, partial-data, and source contracts.
- Transaction, Inbox, Plan, and Jars module rollout.

## Validation

- Home-focused tests: pass — 5 tests across `home-ia-ux.test.tsx` and
  `home-header.test.ts`.
- Shared visual tests: 7/9 pass; 2 pre-existing assertions still expect the
  old `rounded-[var(--radius-...)]` class spelling while shared components use
  the current `rounded-(--radius-...)` token syntax.
- Full unit suite: 912/914 pass; the same 2 pre-existing shared-visual
  foundation class assertions fail.
- Lint: pass — `npm run lint`.
- Typecheck: pass — `npm run typecheck`.
- Build: pass — `npm run build`.
- Browser smoke on port 3000: pass — 5 passed, 2 credential-dependent tests
  skipped with `E2E_PORT=3000 npm run test:e2e:smoke`.
