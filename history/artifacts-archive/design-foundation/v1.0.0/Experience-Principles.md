---
document: Experience Principles
design_foundation: v1.0.0
status: OFFICIAL_DESIGN_SOURCE_OF_TRUTH
run_id: run_design_foundation_20260801T170000Z
created_at: 2026-08-01T15:53:04Z
product_sot: artifacts/product-definition/CURRENT
architecture_sot: artifacts/architecture-definition/CURRENT
technical_sot: artifacts/technical-specification/CURRENT
frozen: true
---
# Experience Principles

## Core UX Principles

1. Answer before decorate — Home’s three answers first  
2. One primary CTA per view  
3. Speed for daily capture; ceremony for Month Ritual  
4. Teach once, reinforce with labels — not modal spam  
5. Empty / loading / error are first-class states  

## Financial UX Principles

1. **Real ≠ virtual** always (BR-01)  
2. Amounts are positive magnitudes; direction is explicit in UI (BR-06)  
3. Overspend uses policy + non-color cues (Warn default) (BR-07, REQ-019)  
4. Only **Active** jars are allocation targets (BR-03)  
5. Money mutations require online connectivity — fail closed (BR-15)  

## Family Collaboration Principles

1. Partners equal on daily Money / Plan / Inbox  
2. Admin elevates assumptions/policies only  
3. Material changes are partner-visible (audit/notify)  
4. Defaults favor **Assisted** collaboration (ritual, Suggest)  

## Trust Principles

1. Preview before destructive money actions  
2. Never silent money failure  
3. Privileged actions auditable  
4. Explain automation (“why this jar?”)  

## Error Recovery Principles

1. Human message + next step  
2. Map API `error.code` to recovery paths (e.g. ClosedMonth → correction)  
3. Retry-safe capture via idempotency awareness  
4. Offline: block mutate; do not queue local ledger writes  

## Confirmation Principles

1. Destructive money: confirm + impact preview  
2. Suggest → confirm → teach  
3. Month Ritual: preview → approve → lock  
4. Soft undo when safe (non-closed months)  

## Notification Philosophy

Inbox-first. Push/email for aging Inbox, invites, ritual ready, maturity/EMI, policy changes. Digest auto-successes — do not toast every Suggest.

## Review Flow Philosophy

One **ReviewItem** = one decision card. Resolve / dismiss / acknowledge are explicit. Both partners may resolve (REQ-020).

## Decision Making Philosophy

Surfaces prioritize *what needs a decision together* (Inbox) over historical archaeology. Home CTA into Inbox when count > 0.

## Accessibility Principles

WCAG-oriented contrast; visible focus; keyboard for capture, Inbox, ritual; touch targets ≥44px; never color-alone for overspend/status.
