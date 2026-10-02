# Design Change Log — ViNha Post-Freeze Audit & Implementation

**Canonical System**: Task 11 ViNha Component System (`DS-01`)  
**Freeze Reference**: Task 13 Final Design Freeze (2026-09-27)

---

## Log Entries

### ENTRY-04: Bottom Navigation Five-Route Redesign

- **ID**: `DCL-004`
- **Date**: 2026-09-30
- **Gap Discovered**: The live navigation used four route tabs and placed Create transaction in the middle of the dock, removing Together from the primary navigation and making the active tab and action compete.
- **Resolution**: Restore five equal route tabs (Home, Money, Plan, Inbox, Together). Move Create transaction to a separate 44px floating pill above the bar. Replace the filled selected tile with a small top indicator, primary text, and emphasized icon stroke.
- **Stitch Change**: Refined the supplied navigation screen. Previous exploration `2b70f6125b134d3d9ca2499befaecf1b` is superseded by canonical reference `468646066fc14f1f87f6080af33308eb`.
- **Code Impact**: `BottomNavigation`, its semantic icon registry, the shared `FloatingAction` control size, and the authenticated product shell. Route semantics and Add transaction destination stay unchanged.
- **Verification**: Responsive geometry and localized light/dark screens were reviewed in the authenticated browser at 360, 390, 430, 440, 768, and 1280px. Lint, typecheck, and navigation-focused tests pass. Remaining live checks are listed in `implementation/04-navigation-shell/bottom-navigation-redesign.md`.

### ENTRY-01: Soft Expense Container Harmonization

- **ID**: `DCL-001`
- **Date**: 2026-09-27
- **Gap Discovered**: In legacy `styles/globals.css`, `--vinha-expense-soft` was `#ffe4e6` (reddish pink, duplicated from `--vinha-debt-soft`), contradicting the canonical Task 11 Component Board (`DS-01 Strip 5`), which specifies neutral slate/zinc containers for expense rows (`#F4F4F5` Light, `#27272A` Dark).
- **Reason**: Bug in legacy pre-freeze stylesheet; debt and expense categories lacked clear visual differentiation.
- **Old Design State (Code)**: `--vinha-expense-soft: #ffe4e6`
- **New Design State (Code & Task 11 Board)**: `--vinha-expense-soft: #f4f4f5` (Light), `#27272a` (Dark)
- **Stitch Change**: None required; Task 11 Stitch board already had `#F4F4F5` as canonical.
- **Docs Updated**: `.agents/design-redesign/handoff/token-handoff.md`, `token-implementation-map.md`, `legacy-token-migration.md`.
- **Code Impact**: Corrected in `styles/globals.css`.

---

### ENTRY-02: Explicit Disabled vs Read-Only System

- **ID**: `DCL-002`
- **Date**: 2026-09-27
- **Gap Discovered**: While Task 11 specified distinct interactions for Disabled (opacity `0.45`, non-interactive) and Read-Only (opacity `1.00`, selectable/copyable, crisp surface), the codebase had only generic `--vinha-disabled` text color and lacked explicit `--vinha-disabled-*` and `--vinha-readonly-*` token pairs.
- **Reason**: Prevent future UI components from applying a blanket `opacity: 0.3` or confusing disabled controls with read-only financial data.
- **Old Design State**: Single `--vinha-disabled: #a1a1aa` variable.
- **New Design State**: Full semantic token set:
  - `--vinha-disabled-bg`, `--vinha-disabled-border`, `--vinha-disabled-text`, opacity `0.45`
  - `--vinha-readonly-bg`, `--vinha-readonly-border`, `--vinha-readonly-text`, opacity `1.00`
- **Stitch Change**: Aligned with Task 11 Strip 3 input states.
- **Docs Updated**: `component-system/foundations.md`, `token-implementation-map.md`.
- **Code Impact**: Implemented in `styles/globals.css` and `shared/theme/tokens.ts`.

---

### ENTRY-03: Backward Compatible Action & Status Variant Aliasing

- **ID**: `DCL-003`
- **Date**: 2026-09-27
- **Gap Discovered**: Task 11 specifies 5 canonical button variants (`primary`, `tonal`, `outline`, `ghost`, `destructive`) and 6 canonical status tones (`positive`, `warning`, `danger`, `info`, `growth`, `neutral`), whereas existing legacy unit tests asserted legacy HeroUI variant classes (`button--secondary`, `button--danger`, `bg-danger/10 text-danger`).
- **Reason**: Preserve zero regressions across 236 unit tests while guaranteeing full adoption of Task 11 tokens.
- **Resolution**:
  - `Button`: Supported canonical variants while aliasing `secondary` to `tonal`, `tertiary` to `outline`, `danger` to `destructive`. HeroButton was passed mapped `heroVariant` and rendered explicit `button--${variant}` class names.
  - `StatusBadge`: Supported canonical tones while pairing text directly with semantic classes (`bg-success/10 text-success`, `bg-danger/10 text-danger`) to maintain legacy test contracts.
- **Stitch Change**: None required; visual appearance conforms 100% to Task 11 Strip 2 & Strip 6.
- **Docs Updated**: `.agents/design-redesign/implementation/02-core-components/compatibility-strategy.md`, `component-api-map.md`.
- **Code Impact**: `shared/ui/button.tsx`, `shared/ui/status-badge.tsx`.
