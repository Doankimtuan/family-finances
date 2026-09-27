# Implementation 01 — Foundations & Tokens

## 1. Scope

Implementation 01 establishes the canonical visual, dimensional, and interaction foundations for the ViNha household finance application.
This task implements:

- Semantic color tokens for Light and Dark themes (`Warm Precision` stone neutrals)
- 7-tier corner radius scale (`4px`, `8px`, `10px`, `12px`, `14px`, `16px`, `9999px`)
- Typography utilities with tabular numerals for VND financial accuracy
- Spacing rhythm and mobile screen gutters (`16px`)
- Control dimensional variables (`44px` min touch target, `48px` inputs, `56px` navigation bars, `64px` hero amount fields)
- Icon sizing tokens and `currentColor` stroke conventions
- Separate Disabled (opacity `0.45`, non-interactive) vs Read-Only (opacity `1.00`, selectable, accessible) state systems
- Safe-area utilities (`env(safe-area-inset-*)`) and viewport containment
- Spring motion tokens (`snappy`, `gentle`) with `prefers-reduced-motion` compliance

**Strict Scope Boundary**: Foundations only. No composite components (`Button`, `Input`, `Select`, `Dialog`, etc.) or domain screens were implemented. Backend, Supabase, routes, and financial calculation logic remain completely untouched.

---

## 2. Files Changed

1. `styles/globals.css`: Canonical `--vn-*` foundation tokens, Tailwind `@theme inline` extensions, `:root` and `.dark` scopes, and utility classes in `@layer utilities`.
2. `shared/theme/tokens.ts` & `shared/theme/index.ts`: Typed semantic color, radius, spacing, control dimension, and icon dimension token registries.
3. `shared/motion/tokens.ts`: Aligned spring presets (`snappy`, `gentle`) with Task 11 motion physics while preserving all duration constants.
4. `eslint.config.mjs`: Added `"output/**"` to `globalIgnores` to prevent lint noise on transient profiling artifacts.
5. `app/[locale]/(system)/design-foundations/page.tsx`: Internal development QA harness for visual inspection of foundation tokens.
6. `tests/unit/theme/foundation-tokens.test.ts`: Automated test suite verifying foundation token contracts and CSS variable parity.

---

## 3. Token Architecture & Theme Mechanism

- **Theme Delivery**: Zero-runtime CSS custom properties. Colors and scales are declared in `styles/globals.css` and mapped to Tailwind v4 via `@theme inline`.
- **Theme Modes**: Supported via Next.js `next-themes` provider (`ThemeProvider` in `providers/theme-provider.tsx`), supporting `light`, `dark`, and `system` without client hydration mismatch.
- **Hierarchy**:
  - `canvas` (`#fafaf9` Light / `#141416` Dark): App shell background.
  - `surface` (`#ffffff` Light / `#1c1c1f` Dark): Standard cards, list rows, bottom sheets.
  - `surface-subtle` (`#f6f4f2` Light / `#242428` Dark): Secondary cards, subdued groupings.
  - `surface-elevated` (`#ffffff` Light / `#28282d` Dark): Menus, popovers, dialogs.
  - `border-subtle` (`#dde4e1` Light / `#2e2e33` Dark): Hairline dividers and boundaries.
  - `border-strong` (`#c8d1cd` Light / `#3f3f46` Dark): Inputs, active tabs.
  - `primary` (`#0d9488` Light / `#2dd4bf` Dark): Mint/teal primary action color.

---

## 4. Known Compatibility Aliases

To ensure 100% backwards compatibility with existing UI without mass-rewriting the codebase:

- `--radius-control` (`10px`) is aliased to Tailwind `rounded-md`.
- `--radius-card` (`12px`) is aliased to Tailwind `rounded-lg`.
- `--radius-overlay` (`16px`) is aliased to Tailwind `rounded-xl`.
- Canonical `--vn-*` variables map 1:1 to project `--vinha-*` variables.

---

## 5. Verification Performed

- **Automated Tests**:
  - `tsc --noEmit` passed with 0 errors.
  - `eslint .` passed with 0 errors.
  - 235 Vitest test files passed (1,492 / 1,492 tests passing).
  - Production `next build` compiled cleanly.
- **Real Browser Testing**:
  - Verified in Chromium browser at 360 × 800, 390 × 844, and 430 × 932 viewports.
  - Light and Dark modes inspected with smooth theme toggling.
  - Existing screen regression smoke test passed across `/welcome`, `/home`, `/money`, `/plan`, `/inbox`, and `/together`.

---

## 6. Stitch Changes

- **Count**: 0.
- **Notes**: Task 11 Stitch Component Boards (`DS-01 Light: 5c6805523e9644b9b233449304419296`, `DS-01 Dark: b07644fd6dad4c7c81b8a4bf1a51baff`) already had complete, correct canonical specifications. Legacy code inconsistency on soft expense container (`#ffe4e6` corrected to `#f4f4f5`) was reconciled to match the Task 11 Stitch board.

---

## 7. Documentation Changes

- Created `token-implementation-map.md`.
- Created `legacy-token-migration.md`.
- Created `qa.md`.
- Created `changes.md`.
- Created `../design-change-log.md`.
- Updated `token-handoff.md`.

---

## 8. Remaining Issues

None. The foundation layer is complete and fully verified.

---

## 9. Readiness

**READY FOR IMPLEMENTATION 02 — Core Reusable Components**
