---
document: Component Philosophy
design_foundation: v1.0.0
status: OFFICIAL_DESIGN_SOURCE_OF_TRUTH
run_id: run_design_foundation_20260801T170000Z
created_at: 2026-08-01T15:53:04Z
product_sot: artifacts/product-definition/CURRENT
architecture_sot: artifacts/architecture-definition/CURRENT
technical_sot: artifacts/technical-specification/CURRENT
frozen: true
---
# Component Philosophy

**Do not design components here.** Define behavior only. Implementation lives later under `components/` (presentational) and feature routes.

## Buttons

- One primary per view region  
- Destructive uses danger semantic + confirm when money/plan lock  
- `:active` tactile press (`scale`/`translate` subtle)  
- Labels: verb + object (“Add expense”), one line at desktop  

## Inputs

- Label above; never placeholder-as-label  
- Amount inputs: numeric, tabular, locale-aware  
- Disabled state explains why when policy blocks  

## Cards

- Use for actionable units (ReviewItem, account row summary)  
- Avoid wrapping every Home metric in a card  
- Clear hit target; whole-card tap only when intentional  

## Lists

- Prefer dividers over nested cards  
- Sticky section headers sparingly  
- Empty state at list level  

## Dialogs

- Confirm destructive / blocking decisions  
- Short title + preview body + primary/secondary  
- Focus trap; Esc closes when safe  

## Bottom Sheets

- Mobile-first for filters, jar pickers, ritual steps  
- Same content available as dialog/panel on desktop  
- Drag handle optional; buttons always present  

## Tabs

- Within a surface only (e.g. Money sub-views) — never replace primary IA  
- Labels match glossary  

## Navigation

- Shell-owned; five IA items + Inbox badge  
- Active state: accent + label weight, not color alone  

## Charts

- Minimal; accessible summaries  
- Legend required when multiple series  

## Calendars

- Used for ritual period / recurring — not as Home chrome  
- Locale-aware week start if household requires  

## Badges

- Counts (Inbox) and status (Jar Active/Paused)  
- Status includes text or icon, not color-only  

## Tags

- Categories are tags on Money, not primary nav  
- Removable where editing allowed  

## Avatars

- Partners in Together / activity attribution  
- Initials fallback; never decorative only  

## Alerts

- Inline policy warnings (overspend Warn)  
- Persistent until acknowledged or condition clears  

## Snackbars

- Transient non-blocking feedback  
- Not for money failures that need recovery — use inline/dialog  

## Tables

- Desktop Money activity optional; mobile prefers list rows  
- Avoid dense spreadsheet chrome  

## Filters

- Sheet/popover; clear “reset”  
- Applied filters visible as chips  

## Search

- Within Money activity / jars; debounced  
- Empty query ≠ empty state of whole product  
