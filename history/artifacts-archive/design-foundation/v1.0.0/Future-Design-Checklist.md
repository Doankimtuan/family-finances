---
document: Future Design Checklist
design_foundation: v1.0.0
status: OFFICIAL_DESIGN_SOURCE_OF_TRUTH
run_id: run_design_foundation_20260801T170000Z
created_at: 2026-08-01T15:53:04Z
product_sot: artifacts/product-definition/CURRENT
architecture_sot: artifacts/architecture-definition/CURRENT
technical_sot: artifacts/technical-specification/CURRENT
frozen: true
---
# Future Design Checklist

Gate before any UI PR, screen design, or component library work.

## Product alignment

- [ ] Uses IA labels Home/Money/Plan/Inbox/Together; Health not 6th primary  
- [ ] real≠virtual labeling intact (BR-01)  
- [ ] Glossary terms used correctly  
- [ ] No Categories/Decision Tools as primary nav  

## Visual

- [ ] Accent is deep teal system — not Rose Bloom pink / purple / random  
- [ ] One radius scale; one type stack; Phosphor icons  
- [ ] Light and dark tokens considered  
- [ ] No em-dash decorative copy; no shame gamification  

## Interaction

- [ ] One primary CTA  
- [ ] Capture path ≤15s when applicable  
- [ ] Destructive money has preview+confirm  
- [ ] Inbox = one decision per card  
- [ ] Offline mutations fail closed  
- [ ] Keyboard path if capture/Inbox/ritual  

## States

- [ ] Empty / loading / error defined  
- [ ] Overspend not color-only  

## Architecture

- [ ] Presentational components do not write domain  
- [ ] No imports from `archive/legacy-v1`  
- [ ] Shell owns nav; surface owns content  

## Motion

- [ ] No unmotivated loops; celebration only if ritual/goal/EMI  
- [ ] Reduced motion honored  

If any box fails, the design is not ready.
