---
document: Product Definition v2
product_definition: v2.0.0
status: OFFICIAL_SOURCE_OF_TRUTH
run_id: run_product_definition_20260801T144500Z
created_at: 2026-08-01T14:46:45Z
supersedes_candidate: ai-os/artifacts/product-strategy/runs/run_product_strategy_20260801T140000Z/
does_not_overwrite_spec_v1: true
---

# Product Definition v2

## Product Vision

Help partners always know: (1) what money they really have, (2) where it is meant to go this month, (3) what needs a decision together.

## Mission

Replace fragmented household finance hubs with a calm, collaborative system that never confuses plans with bank balances.

## Target Users

Couples and small families managing shared expenses and intentions together.

## Primary Persona

**Daily Partner** — checks a few times weekly; needs fast capture and clear next action.

## Secondary Persona

**Household Steward** — cares about Month Ritual, invites, policies; needs control without sole-operator opacity.

## Core User Problems

1. Cannot see real vs intended money clearly  
2. Decisions buried in queues  
3. Onboarding too long before value  
4. Partner collaboration under-designed  

## Product Principles

1. Truth before intention  
2. Partners first  
3. Inbox over archaeology  
4. Progressive depth  
5. Automation with receipts  
6. Month as ritual  
7. Calm finance UI  
8. Accessible by default  
9. Household privacy  
10. AI assists, never invents money  

## Success Metrics

Time-to-clarity · Dual engagement · Inbox zero rate · Ritual completion · Allocation confidence · A11y critical paths

## North Star Metric

**Weekly dual-partner clarity:** weeks where ≥2 members are active AND Inbox is cleared at least once AND Home real≠virtual teaching is intact.

## Design Principles

One primary action per screen · Teach real≠virtual on Plan · Empty states with next action · Human errors

## Information Architecture (final)

Home · Money · Plan · Inbox · Together · (Health accessible from Home)

## Navigation Model

Bottom/primary nav: Home, Money, Plan, Inbox, Together. Health via Home chip. No Categories / Decision Tools top-level.

## Financial Model

Two bounded contexts: **Real Ledger** (Money) and **Intention Plan** (Plan/Inbox). Month Ritual locks plan movements.

## Household Collaboration Model

Partners equal on daily money; Admin elevates advanced assumptions; material changes audited/notified.

## Notification Strategy

Inbox-first; notify on aging Inbox, invites, ritual ready, maturity/EMI, policy changes; digest auto-successes.

## Automation Strategy

Default Suggest; Auto only high-confidence mapped paths; always explainable; Inbox for ambiguity.

## Security Principles

Auth required · RLS membership · no cross-household leakage · privileged actions auditable

## Privacy Principles

Shared inside household · sealed outside · export/delete runbooks as ops (Decision Board IMP-015 docs)

## AI Strategy

Phase 2 assistive only under BR-14. Not MVP-critical.

## Offline Strategy

Online-first. Future: read-only cache. **Offline writes: permanently out of scope for v2.**

## Accessibility Strategy

WCAG-oriented; keyboard for capture, Inbox, Month Ritual (REQ-019).

## Internationalization Strategy

Retain en/vi household locale path; strings via i18n catalogs; money formats by household locale.
