# ViNha — Business Evolution Board (CURRENT)

**Board:** Business Evolution Board  
**Date:** 2026-08-03  
**Status:** APPROVED & FROZEN  
**Target Architecture:** ViNha Household Money Operating System  

---

## Overview

The **Business Evolution Board** is responsible for evolving ViNha's business model based **exclusively on validated evidence** from prior review boards (`domain-philosophy`, `domain-reality-validation`, `product-decision-board`, and `business-cohesion`). 

This board does **NOT** audit, redesign the product, invent speculative features, or modify frozen specifications directly. Its mission is to transform validated weaknesses, lifecycle gaps, and business smells into a stronger, future-proof, 5-to-10-year business model while strictly preserving product identity and upholding immutable product constitution principles.

---

## Immutable Constitution & Identity Safeguards

ViNha is **NOT** an Expense Tracker. ViNha is a **Household Money Operating System** (`Home` · `Money` · `Plan` · `Inbox` · `Together`).

Every document in this pack enforces the following immutable constraints:
- **BR-01 (Real Ledger ≠ Virtual Jars)**: Real money in bank accounts is strictly separated from virtual plan allocations in jars.
- **BR-14 / BR-24 (Health Read-Only / Health-RO)**: The Health domain reads operational data, calculates scores and insights, but NEVER writes back or executes money movement.
- **Household-First Architecture**: Multi-member collaboration, privacy boundaries, and shared decision-making.
- **Progressive Disclosure**: Keep core daily flows simple while revealing depth on demand.
- **Mobile-First Simplicity**: Optimized for touch, speed, and immediate clarity.
- **Clear Bounded Contexts**: No duplicated ownership; every business entity has exactly one primary domain.
- **No Feature Explosion**: Every evolution must be traceable to a validated weakness.

---

## Artifact Directory Structure

| Artifact File | Description |
|---|---|
| [README.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/business-evolution/CURRENT/README.md) | Overview, directory index, and constitutional safeguards (this document). |
| [executive-summary.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/business-evolution/CURRENT/executive-summary.md) | High-level synthesis of Business Model v2, strategic goals, and key decisions. |
| [evolution-overview.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/business-evolution/CURRENT/evolution-overview.md) | Detailed rationale and scope for all 10 validated evolutions. |
| [traceability-matrix.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/business-evolution/CURRENT/traceability-matrix.md) | End-to-end 6-stage traceability mapping from validated origin to evolved model. |
| [business-rule-evolution.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/business-evolution/CURRENT/business-rule-evolution.md) | Formal specification of New, Modified, Deprecated, and Disambiguated Business Rules. |
| [requirement-evolution.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/business-evolution/CURRENT/requirement-evolution.md) | Domain requirement changes, additions, and updates mapped to evolutions. |
| [acceptance-evolution.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/business-evolution/CURRENT/acceptance-evolution.md) | Measurable Acceptance Criteria (AC) for every evolved feature and lifecycle. |
| [domain-interactions.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/business-evolution/CURRENT/domain-interactions.md) | Comprehensive domain interaction map: Producers, Consumers, Events, and Lifecycles. |
| [money-lifecycle-v2.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/business-evolution/CURRENT/money-lifecycle-v2.md) | Master money flow architecture across Real Ledger and Intention Plan. |
| [decision-lifecycle-v2.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/business-evolution/CURRENT/decision-lifecycle-v2.md) | Evolved Inbox decision lifecycle from detection to resolution. |
| [review-lifecycle-v2.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/business-evolution/CURRENT/review-lifecycle-v2.md) | Evolved review item lifecycle with type taxonomy and auto-resolution rules. |
| [month-lifecycle-v2.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/business-evolution/CURRENT/month-lifecycle-v2.md) | Evolved Month Ritual lifecycle with Auto-Lock, Quick Close, and Emergency annotations. |
| [refund-lifecycle.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/business-evolution/CURRENT/refund-lifecycle.md) | Dedicated Refund Lifecycle specification and state machine. |
| [correction-lifecycle.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/business-evolution/CURRENT/correction-lifecycle.md) | Dedicated Correction Lifecycle specification and 3-way audit chain graph. |
| [manual-adjustment-lifecycle.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/business-evolution/CURRENT/manual-adjustment-lifecycle.md) | Dedicated Manual Adjustment Lifecycle distinguishing Ledger vs Plan adjustments. |
| [emergency-lifecycle.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/business-evolution/CURRENT/emergency-lifecycle.md) | Dedicated Emergency Flow specification and jar reallocation bypass rules. |
| [reviewitem-taxonomy.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/business-evolution/CURRENT/reviewitem-taxonomy.md) | Complete specification of `ReviewItemType` taxonomy, handlers, and resolution policies. |
| [category-jar-contract.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/business-evolution/CURRENT/category-jar-contract.md) | Formal Category ↔ Jar mapping contract, taxonomy ownership, and divergence resolution. |
| [risk-analysis.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/business-evolution/CURRENT/risk-analysis.md) | Comprehensive evaluation of Business, UX, Architecture, Migration, and Financial risks. |
| [migration-plan.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/business-evolution/CURRENT/migration-plan.md) | Conceptual migration strategy for existing users and historical data. |
| [consistency-report.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/business-evolution/CURRENT/consistency-report.md) | Formal validation of internal consistency across BRs, Requirements, and Lifecycles. |
| [future-roadmap.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/business-evolution/CURRENT/future-roadmap.md) | 5-to-10-year strategic horizon planning for ViNha's continued evolution. |
| [final-verdict.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/business-evolution/CURRENT/final-verdict.md) | Final declaration of readiness and approval by the Business Evolution Board. |

---

## Evolution Summary

The Business Evolution Board has resolved **18 active business smells, lifecycle gaps, and domain integration weaknesses** by defining 10 formal business evolutions:

1. **Category ↔ Jar Formal Contract**: N:1 mapping, jar taxonomy primacy, divergence feedback loops.
2. **Typed ReviewItem Taxonomy**: Typed items (`UnmappedExpense`, `MaturityDecision`, `PaymentReminder`, `InstallmentComplete`, `EmergencyDeclaration`) enabling safe auto-resolution.
3. **Structured Refund Lifecycle**: Linked reversal audit trail (`reverses_transaction_id`), status updates, and jar balance restoration.
4. **Immutable Correction Lifecycle**: 3-way audit chain linking original (`Reversed`), reversal (`reverses_transaction_id`), and corrected transaction (`corrects_transaction_id`).
5. **Decoupled Manual Adjustment Lifecycle**: Real Ledger Reconciliation vs. Intention Plan Reallocation.
6. **Explicit Emergency Flow**: `EmergencyDeclaration` bypassing mid-month BR-07 Warn with mandatory Month Ritual annotation.
7. **Month Ritual Maturity & Auto-Lock**: 30-day Auto-Lock timeout (`PendingReview`), stale transaction auto-resolution, and Quick Close path.
8. **BR-14 / BR-24 Disambiguation**: Resolving documentation collision by establishing `BR-14` (AI Non-Invention) and `BR-24` (`Health-RO`).
9. **Unified Household Calendar**: Aggregating recurring patterns, credit card due dates, and installment schedules into one timeline.
10. **Pattern Metadata & Inbox Auto-Resolution**: Annotating transactions with `source: recurring_pattern` for smart Inbox auto-resolution and staleness archiving.
