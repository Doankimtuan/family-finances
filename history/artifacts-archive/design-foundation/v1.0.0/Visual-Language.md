---
document: Visual Language
design_foundation: v1.0.0
status: OFFICIAL_DESIGN_SOURCE_OF_TRUTH
run_id: run_design_foundation_20260801T170000Z
created_at: 2026-08-01T15:53:04Z
product_sot: artifacts/product-definition/CURRENT
architecture_sot: artifacts/architecture-definition/CURRENT
technical_sot: artifacts/technical-specification/CURRENT
frozen: true
---
# Visual Language

## Chosen direction: ViNha Calm Ledger

**Synthesis:** Wise/Monzo money clarity (trust, legible amounts, low drama) + Linear product chrome (tight type, restrained surfaces, sparse motion).

**Why:** Matches *Calm finance UI*, *Truth before intention*, *Partners first*, *Sparse celebration*; mobile-first capture; collaborative household — not a power-user cockpit or bank portal.

### Rejected styles

| Style | Why rejected |
|-------|----------------|
| Material 3 as system | Busy defaults; wrong personality |
| Raycast | Tool/command-palette aesthetic |
| Notion | Doc-first, not money OS |
| Apple HIG wholesale | iOS-native ≠ web App Router shell |
| Stripe Dashboard | B2B/dev density |
| Rose Bloom (legacy) | Pink lock + old IA; superseded |
| AI-purple / beige-brass craft | Banned LLM defaults |

## Color Philosophy

- **Neutrals:** cool stone / zinc family  
- **Brand accent:** single **deep teal** (trust/calm) — used for primary CTAs, key focus, nav active  
- **Semantic (secondary, not brand):** income/credit, expense/debit, warning, danger, success  
- Overspend / health never rely on color alone  
- Max one accent; saturation restrained  

Legacy Rose Bloom pink is **not** the SoT.

## Typography System

- **Sans:** Geist (or equivalent geometric sans) via `next/font`  
- **Not default:** Inter-as-default, Fraunces, Instrument Serif  
- **Display / titles:** semibold, tracking tight, controlled scale  
- **Body:** readable, `max ~65ch` where prose appears  
- **Money:** tabular lining figures; same family as UI (not decorative mono)  
- **Mono:** request IDs / debug only  

## Iconography

- One family: **Phosphor** (stroke weight locked globally, e.g. 1.5)  
- No emoji as chrome  
- Nav icons paired with text labels (IA names)  

## Illustration Style

Sparse. Prefer empty-state composition with clear next action over decorative scenes. No hand-rolled decorative SVG mascots as default.

## Charts & Financial Visualization

- Minimal ink; Health narrative > flashy viz  
- Intention vs real must use distinct series labels  
- Tooltips with accessible text  
- Never encode overspend by color alone  

## Empty States

Explain what’s missing + one primary next action (Add expense / Set up plan / Invite partner on Home).

## Loading States

Skeleton shapes matching final layout zones. Avoid generic full-page spinners for Home/Money lists.

## Error States

Inline for forms; toast/snackbar for transient; blocking dialog only when mutation cannot proceed (offline, closed month without correction path).

## Dark Mode

Paired tokens (`--surface`, `--text`, `--accent`, …). Hierarchy parity with light. Off-black / off-white — avoid pure `#000` / `#fff`.
