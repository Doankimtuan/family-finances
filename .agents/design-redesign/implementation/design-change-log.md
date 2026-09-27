# Design Change Log — ViNha Post-Freeze Audit & Implementation

**Canonical System**: Task 11 ViNha Component System (`DS-01`)  
**Freeze Reference**: Task 13 Final Design Freeze (2026-09-27)

---

## Log Entries

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
