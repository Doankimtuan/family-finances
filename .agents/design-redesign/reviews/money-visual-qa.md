# Money Overview Visual QA & UI Consistency Audit (Task 02B)

**Scope**: `/money`  
**Google Stitch Project**: `16826760243481546078`  
**Light Canonical Screen Under Audit**: `b928b2c5a8944f99b0af363ef1d9e5a5`  
**Dark Canonical Screen Under Audit**: `b7d12b3f0e6d4eba959f72dc630a265c`  
**Reference Screens**: Home Canonical (`c48a58d9...` Light / `d4a4d84e...` Dark)  
**Status**: AUDIT COMPLETED — FIXES APPLIED & VERIFIED

---

## 1. Defect Audit Table

| ID         | Area                                     | Problem                                                                                                                                                                                                                                                                                       | Severity | Light/Dark  | Root Cause                                                                               | Fix                                                                                                                                                                                     | Status       |
| ---------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| **DEF-01** | Global Icons                             | All icons in Light screen rendered via Material Symbols web font ligatures rather than inline SVG vectors, causing hidden/blank icons or raw text overflow when web font is not loaded or cross-origin blocked.                                                                               | **P0**   | Light       | Used `<span class="material-symbols-outlined">...</span>` instead of native inline SVGs. | Replace all icons with canonical ViNha 24×24 inline SVG vectors with round stroke caps, round joins, and `currentColor` inheritance.                                                    | **RESOLVED** |
| **DEF-02** | Peer Icon Containers                     | Icon container sizing and fillets are inconsistent across peer financial modules. `Sổ giao dịch` used `w-9 h-9 rounded-lg` while domain rows used `w-10 h-10 rounded-xl`. Inlined account pills mixed raw text monograms (`TP`, `M`, `VCB`) with miniature non-standard `w-6 h-5` rectangles. | **P1**   | Both        | Ad-hoc per-component sizing without enforcing the 40×40px domain container standard.     | Standardize all 5 primary financial domain containers to `w-10 h-10 rounded-xl` (40×40px, 12px radius) and account chips to clean, unified `w-7 h-7 rounded-lg` containers.             | **RESOLVED** |
| **DEF-03** | Row Layout & Baseline                    | Asymmetrical layout across peer domain rows: `Tiết kiệm` and `Đầu tư` put status badges in the middle stack and delta on the right, whereas `Khoản vay` and `Vay mượn cá nhân` put text status under `₫ 0` on the right column.                                                               | **P1**   | Both        | Lack of rigid 2-column anatomical contract across financial domain rows.                 | Enforce uniform 2-column grid: Left 40×40px icon, Center title + subtitle (with inline alert badge), Right tabular amount + right-aligned secondary status + centered trailing chevron. | **RESOLVED** |
| **DEF-04** | Trailing Navigation Actions              | Inconsistent trailing affordances: some rows used chevrons with color hover, some used chevrons without hover, while `Sổ giao dịch` and summary links used inline text arrows (`→`).                                                                                                          | **P1**   | Both        | Mixing button links with row-level navigation chevrons.                                  | Unify all navigable domain rows to use identical right chevron SVGs (`w-4 h-4 stroke-[2]`), with consistent right margin and vertical centering.                                        | **RESOLVED** |
| **DEF-05** | Card Radii & Padding                     | Sổ giao dịch ledger card used `rounded-xl` (12px) and `p-3.5` (14px), whereas all other section cards used `rounded-2xl` (16px) and `p-4`.                                                                                                                                                    | **P2**   | Both        | One-off styling on the activity ledger card.                                             | Standardize all section cards to `rounded-2xl` (16px) with uniform `p-4` internal padding and `space-y-4` section gutters.                                                              | **RESOLVED** |
| **DEF-06** | Optical Weight & Stroke Variance         | SVG stroke weights varied across icons (`stroke-[1.75]`, `stroke-[2]`, `stroke-[2.5]`). Bank/Landmark icon was visually heavier than the thin Handshake icon.                                                                                                                                 | **P2**   | Dark / Both | Inconsistent SVG stroke calibration.                                                     | Calibrate all domain glyphs to optical `1.8px` stroke weight with balanced internal volume and optical padding.                                                                         | **RESOLVED** |
| **DEF-07** | Asset Allocation Legend Alignment        | Legend chips below the 3-segment progress bar suffered from 1px vertical misalignment between colored dots and tabular percentage labels.                                                                                                                                                     | **P2**   | Both        | Dot spans lacked flex vertical alignment with text baselines.                            | Wrap each legend element in `inline-flex items-center gap-1.5` with a crisp `w-2 h-2 rounded-full` color pip.                                                                           | **RESOLVED** |
| **DEF-08** | Bottom Navigation Consistency            | Tab 5 label previously displayed `Chung ví` instead of canonical `Gia đình`, and tab 2 varied between `Tài chính` and `Tiền`.                                                                                                                                                                 | **P2**   | Both        | Non-canonical labels in first draft.                                                     | Synchronize all 5 tabs to canonical ViNha standards: `Trang chủ`, `Tiền` (Active teal), `Kế hoạch`, `Hộp thư` (badge 14), `Gia đình`.                                                   | **RESOLVED** |
| **DEF-09** | Floating Button (`+ Giao dịch`) Geometry | Floating button plus icon used Material Symbols in Light and thick `stroke-[2.5]` in Dark; padding and shadow varied.                                                                                                                                                                         | **P2**   | Both        | Lack of shared FAB component specification.                                              | Standardize FAB to `h-10 px-4 rounded-full flex items-center gap-1.5` with clean `w-4 h-4 stroke-[2]` plus SVG, anchored at `bottom-[74px] right-4` with `pb-36` clearance.             | **RESOLVED** |

---

## 2. Summary of Defect Counts

- **Total Defects Audited**: 9
- **P0 (Functional / Hidden Elements)**: 1 (DEF-01)
- **P1 (Major Visual & Consistency Issues)**: 3 (DEF-02, DEF-03, DEF-04)
- **P2 (Visual Polish & Systemic Alignment)**: 5 (DEF-05, DEF-06, DEF-07, DEF-08, DEF-09)
- **P3 (Minor Optical Polish)**: 0

---

## 3. Systemic Solutions Implemented

### System 1: Canonical Money Domain Row Specification

For all 5 peer-level financial domains (`Tài khoản`, `Tiết kiệm`, `Đầu tư`, `Khoản vay`, `Vay mượn cá nhân`):

- **Container**: `w-10 h-10 rounded-xl flex items-center justify-center shrink-0` (40×40px, 12px radius, subtle border).
- **Icon**: Native inline SVG vector, `w-5 h-5`, 1.8px round stroke, round joins/caps, `currentColor`.
- **Title Stack**: Left-aligned, `text-sm font-semibold` primary title + `text-xs text-muted` subtitle.
- **Value Stack**: Right-aligned, `text-sm font-bold tabular-nums` amount + `text-[11px] font-medium` status/delta subtext.
- **Trailing Action**: `w-4 h-4 stroke-[2] text-zinc-400 group-hover:text-zinc-600 transition-colors` chevron SVG, vertically centered with 44px min touch target.

### System 2: Complete Elimination of Material Symbols Web Fonts

All icons on both Light and Dark screens are now pure, self-contained SVG vectors embedded directly into the HTML markup. No external font dependency exists, guaranteeing 100% rendering reliability and instant visual loading.

### System 3: Surface & Spacing Rhythm Harmonization

- Standard card corner fillet: `rounded-2xl` (16px).
- Standard card padding: `p-4` (16px).
- Inter-section spacing: `space-y-4` (16px).
- Page bottom scroll clearance: `pb-36` (144px).
