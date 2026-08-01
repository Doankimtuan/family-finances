---
document: Scope Definition
product_definition: v2.0.0
status: OFFICIAL_SOURCE_OF_TRUTH
run_id: run_product_definition_20260801T144500Z
created_at: 2026-08-01T14:46:45Z
supersedes_candidate: ai-os/artifacts/product-strategy/runs/run_product_strategy_20260801T140000Z/
does_not_overwrite_spec_v1: true
---

# Scope Definition

## In Scope (v2 Now/MVP)

Core/MVP features in Feature Catalog; BR-01–BR-13, BR-15; IA five surfaces; en/vi locale path.

## Out of Scope

Offline writes · Brokerage trading · Tax filing · Crypto trading desk · Multi-household · Standalone Categories/Decision Tools IA

## Future Vision

Wealth lane · Assistive AI · Offline read-only · Multi-household · External API versioning if needed

## Non Goals

Becoming YNAB/Monarch clones · Shame-based gamification · Inventing balances via AI

## Technical Constraints

Next.js app + Supabase tenancy/RLS remain implementation base; product SoT does not require rewriting storage in this freeze.

## Business Constraints

One active household per user (Now) · Real≠virtual axiom · Partner collaboration mandatory for target segment
