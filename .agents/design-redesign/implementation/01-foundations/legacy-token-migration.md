# Legacy Token Migration & Compatibility Strategy — Task 01

**Scope**: ViNha UI Foundations & Tokens  
**Date**: 2026-09-27  
**Status**: ACTIVE (Non-Breaking)

---

## 1. Core Principle: Zero Mass Rewrite & Strict Backwards Compatibility

Task 01 implements canonical foundation tokens according to the Task 11 Stitch specification without breaking existing production screens.
Instead of renaming or deleting legacy variables across 100+ files, we established a **3-tier aliasing and forward-mapping architecture**:

1. **Tier 1 — Canonical Brand Tokens (`--vn-*`)**:
   Standardized ViNha design tokens directly matching the Task 11 design handoff (e.g. `--vn-canvas`, `--vn-surface`, `--vn-primary`, `--vn-input-height`, `--vn-touch-target-min`).
2. **Tier 2 — Project Semantic Tokens (`--vinha-*`)**:
   Existing semantic tokens used by Tailwind `@theme inline` and repository code (e.g. `--vinha-canvas`, `--vinha-surface`, `--vinha-border-subtle`). These are synchronized to identical values.
3. **Tier 3 — Utility Class & HeroUI Compatibility (`--color-*`)**:
   Next.js / Tailwind v4 and HeroUI tokens (e.g. `--color-canvas`, `--color-surface`, `--color-primary`, `--radius-control`, `--radius-card`).

---

## 2. Token Inventory & Action Classification

| Category             | Action                                      | Count | Notes                                                                                                         |
| -------------------- | ------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------- |
| **REUSE**            | Preserved unchanged                         | 42    | Canvas neutrals, primary teal, state tokens already in alignment                                              |
| **ALIASED**          | Legacy token mapped to canonical token      | 28    | Tailwind radii (`rounded-md`, `rounded-lg`, `rounded-xl`), legacy `--background`, `--card`, `--border`        |
| **RESTYLE**          | Values harmonized to Task 11 Stitch board   | 14    | Dark theme elevated surfaces (`#28282d`), dark borders (`#2e2e33`), subtle dividers (`#ebefef`)               |
| **REPLACE (Bugfix)** | Corrected semantic mismatch                 | 1     | `--vinha-expense-soft` corrected from `#ffe4e6` (red/debt duplicate) to `#f4f4f5` (neutral slate per Task 11) |
| **EXTENDED**         | New foundation tokens added                 | 22    | Explicit Disabled vs Read-Only states, soft financial categories, 44px touch targets, safe area utilities     |
| **DEFERRED**         | Migration of screen-level hardcoded classes | 18    | Product screens will migrate iteratively during feature implementation phases                                 |

---

## 3. Critical Fix: Soft Expense vs Debt Soft

During Phase 3 audit, an inconsistency was identified in legacy `styles/globals.css`:

- **Legacy State**: `--vinha-expense-soft: #ffe4e6;` (Light pink/reddish), identical to `--vinha-debt-soft: #ffe4e6;`.
- **Task 11 Canonical State**: Expense icons sit on neutral slate/zinc soft containers (`#F4F4F5` Light, `#27272A` Dark), while Debt containers sit on rose/crimson (`#FFF1F2` Light, `#4C0519` Dark).
- **Resolution**: Updated `--vinha-expense-soft` to `#f4f4f5` (Light) and `#27272a` (Dark), preserving `--vinha-debt-soft` for liabilities.

---

## 4. Radii Scale Alignment

To ensure both legacy HeroUI components and modern Task 11 specifications function seamlessly:

- `--radius-control: 10px;` (buttons, inputs)
- `--radius-card: 12px;` (cards, tiles)
- `--radius-overlay: 16px;` (sheets, dialogs)
- Tailwind `rounded-md` -> `var(--radius-control)` (10px)
- Tailwind `rounded-lg` -> `var(--radius-card)` (12px)
- Tailwind `rounded-xl` -> `var(--radius-overlay)` (16px)
- Canonical hero/banner radius `14px` exposed via `--radius-xl-canonical` and `--vn-radius-xl`

---

## 5. Deferred Screen Migrations

No screen-level domain files (`app/[locale]/(app)/*`) were refactored in this task.
Screens will be updated screen-by-screen during their respective implementation tasks (e.g. Implementation 03+).
All screens continue to render with full contrast and visual stability via the underlying CSS variable updates.
