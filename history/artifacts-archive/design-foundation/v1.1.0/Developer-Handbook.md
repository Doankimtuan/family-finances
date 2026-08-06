---
document: Developer Handbook
design_foundation: v1.1.0
status: OFFICIAL_DESIGN_SOURCE_OF_TRUTH
run_id: run_mobile_design_system_20260801T180000Z
created_at: 2026-08-01T16:01:24Z
board: Mobile Experience & Design System Board
product_sot: artifacts/product-definition/CURRENT
architecture_sot: artifacts/architecture-definition/CURRENT
technical_sot: artifacts/technical-specification/CURRENT
inherits: v1.0.0
supersedes_clauses: desktop-nav-layout-ui-kit
frozen: true
---
# Developer Handbook

## Daily rules

1. Design against a phone; preview desktop as phone-in-monitor (440px)  
2. One primary CTA per screen  
3. Use glossary terms (Jar, Inbox, ReviewItem, Month Ritual, Partner, Admin)  
4. Never label jar amounts as unlabeled “Balance”  
5. Money mutations fail closed when offline  
6. Compose via Primitive → Pattern → Feature → Screen  
7. HeroUI + Phosphor only  
8. Pass Design Checklist before merge  

## PR expectations

- Screenshots: mobile width required; desktop optional showing centered viewport  
- No sidebar CSS  
- No new UI dependencies without Design Foundation amendment  

## When unsure

Product Definition &gt; Architecture &gt; Technical Specification &gt; this Design Foundation for scope/behavior; this pack wins for **visual/interaction/chrome** including desktop canvas.
