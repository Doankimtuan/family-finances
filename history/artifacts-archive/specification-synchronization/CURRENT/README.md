# ViNha — Specification Synchronization Board (CURRENT)

**Board:** Specification Synchronization Board  
**Date:** 2026-08-03  
**Status:** APPROVED & FROZEN  
**Target Specification Version:** v2.1 (Developer Constitution v1.1)  

---

## Overview

The **Specification Synchronization Board** is responsible for synthesizing and synchronizing all official product, architecture, business, and technical specifications into the **Single Official Implementation Reference (v2.1)** for the ViNha Household Money Operating System.

This specification pack integrates all validated findings, decisions, and evolutions from:
- **Product Definition v1.0 / v2.0**
- **Architecture Definition v1.0 / v2.0**
- **Technical Specification v1.0 / v2.0**
- **Domain Philosophy & Domain Reality Validation**
- **Product Decision Board & Business Cohesion Board**
- **Business Evolution Board (Business Model v2)**

All future sprint executions, code reviews, database migrations, and feature developments MUST strictly adhere to this synchronized specification pack.

---

## Immutable Constitution & Identity Safeguards

ViNha is **NOT** an Expense Tracker. ViNha is a **Household Money Operating System** (`Home` · `Money` · `Plan` · `Inbox` · `Together`).

Every document in this pack enforces the following immutable constraints:
- **BR-01 (Real Ledger ≠ Virtual Jars)**: Real money in bank accounts is strictly separated from virtual plan allocations in jars.
- **BR-14 (AI Non-Invention Policy)**: AI features may explain/suggest based on verified data, but MUST NOT invent balances or execute unauthorized transactions.
- **BR-24 (`Health-RO`) (Health Read-Only Policy)**: The Health domain reads operational data, calculates scores and insights, but NEVER writes back or executes money movement.
- **Household-First Architecture**: Multi-member collaboration, privacy boundaries, and shared decision-making.
- **Progressive Disclosure**: Keep core daily flows simple while revealing depth on demand.
- **Mobile-First Simplicity**: Optimized for touch, speed, and immediate clarity.
- **Clear Bounded Contexts**: No duplicated ownership; every business entity has exactly one primary domain.
- **No Specification Drift**: Zero orphan requirements, zero unmapped acceptance criteria, and zero terminology conflicts.

---

## Artifact Directory Structure

| Artifact File | Description |
|---|---|
| [README.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/specification-synchronization/CURRENT/README.md) | Overview, directory index, and constitutional safeguards (this document). |
| [executive-summary.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/specification-synchronization/CURRENT/executive-summary.md) | High-level synthesis of Specification Synchronization v2.1. |
| [product-definition-v2.1.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/specification-synchronization/CURRENT/product-definition-v2.1.md) | Canonical Product Definition v2.1 (vision, identity, bounded contexts). |
| [architecture-definition-v2.1.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/specification-synchronization/CURRENT/architecture-definition-v2.1.md) | Canonical Architecture Definition v2.1 (event graphs, data boundaries). |
| [technical-specification-v2.1.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/specification-synchronization/CURRENT/technical-specification-v2.1.md) | Canonical Technical Specification v2.1 (DB schemas, APIs, state machines). |
| [developer-constitution-v1.1.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/specification-synchronization/CURRENT/developer-constitution-v1.1.md) | Updated Developer Constitution v1.1 (coding rules, SoT references). |
| [business-rules.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/specification-synchronization/CURRENT/business-rules.md) | Consolidated Business Rules inventory (BR-01 through BR-24). |
| [requirements.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/specification-synchronization/CURRENT/requirements.md) | Canonical, synchronized functional and domain requirements. |
| [acceptance-criteria.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/specification-synchronization/CURRENT/acceptance-criteria.md) | Complete Given-When-Then Acceptance Criteria repository. |
| [glossary.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/specification-synchronization/CURRENT/glossary.md) | Unified domain taxonomy and terminology dictionary. |
| [traceability-report.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/specification-synchronization/CURRENT/traceability-report.md) | End-to-end 6-way traceability graph (BR → REQ → AC → Modules → APIs/DB). |
| [compatibility-report.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/specification-synchronization/CURRENT/compatibility-report.md) | Backward compatibility, schema migration, and API stability report. |
| [migration-notes.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/specification-synchronization/CURRENT/migration-notes.md) | Complete developer implementation and data migration handbook. |
| [change-log.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/specification-synchronization/CURRENT/change-log.md) | Full change log detailing v2.0 → v2.1 modifications. |
| [consistency-report.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/specification-synchronization/CURRENT/consistency-report.md) | Cross-specification consistency and zero-drift verification report. |
| [final-verdict.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/specification-synchronization/CURRENT/final-verdict.md) | Final Board sign-off declaring v2.1 as the single official reference. |
