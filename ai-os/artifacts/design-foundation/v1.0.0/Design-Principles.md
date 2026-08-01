---
document: Design Principles
design_foundation: v1.0.0
status: OFFICIAL_DESIGN_SOURCE_OF_TRUTH
run_id: run_design_foundation_20260801T170000Z
created_at: 2026-08-01T15:53:04Z
product_sot: artifacts/product-definition/CURRENT
architecture_sot: artifacts/architecture-definition/CURRENT
technical_sot: artifacts/technical-specification/CURRENT
frozen: true
---
# Design Principles

Mapped to Product Definition v2 product + design principles. Non-negotiable for every future UI.

## 1. Truth before intention

Visual hierarchy always surfaces **Real Ledger** before **Intention Plan**. Never label jar amounts as plain “balance” without an intention qualifier (BR-01).

## 2. Partners first

Default flows assume two capable adults. Avoid sole-operator patterns for daily Money/Plan/Inbox. Policy/assumption changes show partner-visible audit cues (BR-13).

## 3. Inbox over archaeology

Decisions live as **ReviewItem** cards in Inbox. Do not bury ambiguous placements in jar-only queues (BR-05).

## 4. Progressive depth

Show the next useful action. Advanced controls live under Together/Admin or secondary sheets, not on Home.

## 5. Automation with receipts

Default **Suggest**. Every auto/suggest path is explainable. Ambiguity → Inbox.

## 6. Month as ritual

Month Ritual is ceremony: preview → approve → lock. Closed-month corrections are explicit paths, never silent edits (BR-08, BR-09).

## 7. Calm finance UI

One primary action per screen. Sparse celebration. No shame gamification. No AI-purple or alarmist red as brand.

## 8. Accessible by default

Keyboard paths for capture, Inbox resolve, Month Ritual (REQ-019). Contrast and focus rings are design requirements, not polish.

## 9. Household privacy

Shared inside household; sealed outside. No cross-household visual leakage.

## 10. AI assists, never invents money

Phase 2: suggestions only; UI must never imply AI wrote a balance.

## Product design principles (UX)

- One primary action per screen  
- Teach real≠virtual on Plan (and reinforce on Home)  
- Empty states include a next action  
- Human-readable errors; never silent money failure  

## Visual consistency principles

- One accent (deep teal), one radius scale, one type stack, one icon family  
- Page theme lock (light/dark tokens; no mid-scroll theme flip)  
- Cards only when a unit is actionable; Home prefers clear zones over card soup  
