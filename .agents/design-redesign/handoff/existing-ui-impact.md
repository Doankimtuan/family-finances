# Existing UI Architecture Impact Audit — ViNha

**Scope**: Audit of current `shared/ui/`, `shared/patterns/`, and Next.js route components.  
**Rule**: **DO NOT REMOVE OR BREAK CODE DURING TASK 13**. This audit serves as the technical roadmap for the subsequent implementation task.

---

## 1. Component Classification Matrix

| Component File Path                        | Current Role               | Classification | Technical Rationale & Required Implementation Action                                                                                |
| ------------------------------------------ | -------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `shared/ui/button.tsx`                     | Base button                | **RESTYLE**    | Functional; update with Task 11 tokens (`10px` radius, 44px min-height, `#0D3331` / `#2DD4BF` primary colors, loading spinner).     |
| `shared/ui/icon-button.tsx`                | Icon action target         | **RESTYLE**    | Ensure strict 44×44px touch target bounding box, 10px radius, and visible focus rings.                                              |
| `shared/ui/input.tsx`                      | Form text input            | **RESTYLE**    | Update with 44px height, 10px radius, hairline `#DDE4E1` / `#3F3F46` border, and 16px body font to prevent iOS zoom.                |
| `shared/ui/textarea.tsx`                   | Multiline text input       | **RESTYLE**    | Standardize with 10px radius and hairline borders; connect character counter.                                                       |
| `shared/ui/select.tsx`                     | Dropdown selector          | **REFACTOR**   | Currently handles closed state; refactor to provide canonical floating popover listbox (`SelectDropdown`) with checkmark indicator. |
| `shared/ui/stitch-icon-artwork.ts`         | Icon SVG library           | **REUSE**      | Canonical icon artwork; already contains verified 271 Warm Precision icons.                                                         |
| `shared/ui/app-icon.tsx`                   | Icon renderer              | **REUSE**      | Standard icon wrapper inheriting `currentColor`.                                                                                    |
| `shared/ui/icon-container.tsx`             | Icon container wrapper     | **RESTYLE**    | Standardize to 32×32px (compact) and 40×40px (default) with strict 10px border radius.                                              |
| `shared/ui/badge.tsx` & `status-badge.tsx` | Status pill badges         | **RESTYLE**    | Update to 22px fixed height, pill radius (9999px), and semantic color tokens.                                                       |
| `shared/ui/progress.tsx`                   | Progress bar               | **RESTYLE**    | Ensure clamped 0–100% calculation and 4px/6px bar height with rounded tips.                                                         |
| `shared/patterns/app-viewport.tsx`         | 440px shell container      | **REUSE**      | Core architecture primitive maintaining the centered 440px viewport.                                                                |
| `shared/patterns/top-app-bar.tsx`          | Sticky top navigation      | **RESTYLE**    | Update typography to Geist Sans 24px/20px, standardize back chevron and avatar placement.                                           |
| `shared/patterns/bottom-navigation.tsx`    | 5-tab docked bar           | **RESTYLE**    | Update tab slot styles with primary mint container active state; ensure 56px touch target.                                          |
| `shared/patterns/floating-action.tsx`      | `FloatingAddCTA`           | **RESTYLE**    | Ensure 44px pill height, 9999px radius, Level 2 shadow, and 16px bottom-right positioning.                                          |
| `shared/patterns/amount-field.tsx`         | VND monetary entry         | **RESTYLE**    | Standardize tabular numerals, period thousand formatting, and ₫ prefix placement.                                                   |
| `shared/patterns/choice-tile.tsx`          | Selectable card tile       | **RESTYLE**    | Align border radius to 12px, border to 1px hairline, and active background to soft tint.                                            |
| `shared/patterns/transaction-row.tsx`      | Activity row               | **RESTYLE**    | Standardize 40px icon container, concept title on line 1, metadata on line 2, tabular amount on right.                              |
| `shared/patterns/card.tsx`                 | Surface card               | **RESTYLE**    | Update to 12px/14px radius, 1px border (`#DDE4E1` light / `#3F3F46` dark), and `#1C1C1F` dark surface.                              |
| `shared/patterns/sheet.tsx`                | Modal bottom sheet         | **RESTYLE**    | Enforce 16px top border radius (`rounded-t-2xl`), dimmed backdrop `rgba(0,0,0,0.65)`, and drag handle.                              |
| `shared/patterns/dialog.tsx`               | Modal alert dialog         | **RESTYLE**    | Standardize with 16px radius, Level 2 shadow, and accessible focus trap.                                                            |
| `shared/patterns/empty-state.tsx`          | Empty queue/list surface   | **RESTYLE**    | Align with SCR-45 dignified empty state (56px icon container, calm copy, primary CTA).                                              |
| `shared/patterns/loading-state.tsx`        | Skeleton shimmer rows      | **RESTYLE**    | Calibrate shimmer gradients to `#E4E4E7` (light) and `#2E2E33` (dark) matching exact row heights.                                   |
| `shared/patterns/social-button.tsx`        | Google/Apple OAuth buttons | **RESTYLE**    | Ensure 44px min height, 10px radius, 1px hairline border, and official Google/Apple vector logos.                                   |
| `shared/patterns/review-card.tsx`          | Inbox decision card        | **RESTYLE**    | Standardize with heterogeneous decision styles, deep link triggers, and urgency chips.                                              |
| `shared/patterns/jar-card.tsx`             | Budget envelope card       | **RESTYLE**    | Update with clamped progress bars, overspend indicator, and 1-to-1 reallocation CTA.                                                |
| `shared/patterns/hero-pill-link.tsx`       | Quick action pill          | **REUSE**      | Clean interactive link primitive.                                                                                                   |
| `shared/patterns/auth-house-glow.tsx`      | Auth background glow       | **REUSE**      | Decorative branding element on unauthenticated screens.                                                                             |

---

## 2. Technical Summary of Code Changes Required in Next Phase

1. **Foundational Token Layer**:
   - Centralize all color, typography, radius, and spacing tokens in `tailwind.config.ts` and `app/globals.css`.
   - Eliminate all arbitrary inline HEX values and random Tailwind border radii across `shared/ui` and `shared/patterns`.

2. **Component Restyling**:
   - The majority of existing primitives are functionally sound and only require visual restyling to match Task 11 tokens.
   - Minimal functional rewrites are required; existing React Hook Form integrations and accessibility hooks will be preserved.

3. **Refactoring Scope**:
   - The primary component requiring structural refactoring is `select.tsx`, which needs a robust, accessible floating popover listbox (`SelectDropdown`) for custom option rendering with checkmarks.
