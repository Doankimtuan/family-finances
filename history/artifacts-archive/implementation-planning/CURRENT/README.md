# ViNha — Implementation Planning Board (CURRENT)

**Board:** Implementation Planning Board  
**Date:** 2026-08-03  
**Status:** APPROVED & FROZEN  
**Target Architecture:** ViNha Household Money Operating System (Specification v2.1)  

---

## Overview

The **Implementation Planning Board** is responsible for converting the canonical **Specification v2.1** into a comprehensive, multi-sprint implementation execution master plan.

This planning pack establishes complete traceability from **Business Rules $\rightarrow$ Requirements $\rightarrow$ Acceptance Criteria $\rightarrow$ Epics $\rightarrow$ Stories $\rightarrow$ Technical Tasks $\rightarrow$ Sprints $\rightarrow$ Release Milestones**.

All future sprint executions, technical task assignments, pull requests, and automated testing suites MUST strictly adhere to this implementation master plan.

---

## Immutable Constitutional Safeguards

ViNha is **NOT** an Expense Tracker. ViNha is a **Household Money Operating System** (`Home` · `Money` · `Plan` · `Inbox` · `Together`).

Every planning document in this pack enforces the following non-negotiable constraints:
- **BR-01 (Real Ledger ≠ Virtual Jars)**: Real money in bank accounts is strictly separated from virtual plan allocations in jars. Plan movements execute `$0.00` ledger transactions.
- **BR-14 (AI Non-Invention Policy)**: AI features may explain/suggest based on verified data, but MUST NOT invent balances or execute unauthorized transactions.
- **BR-24 (`Health-RO`) (Health Read-Only Policy)**: The Health domain reads operational data, calculates scores and insights, but NEVER writes back or executes money movement.
- **Vertical Slice Delivery**: Sprints deliver end-to-end user and business value, avoiding horizontal layer implementation.
- **Zero Orphan Specification**: 100% of Requirements and Acceptance Criteria map directly to actionable Stories and Tasks.

---

## Artifact Directory Structure

| Artifact File | Description |
|---|---|
| [README.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/implementation-planning/CURRENT/README.md) | Overview, directory index, and constitutional safeguards (this document). |
| [executive-summary.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/implementation-planning/CURRENT/executive-summary.md) | High-level synthesis of the Implementation Master Plan. |
| [implementation-roadmap.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/implementation-planning/CURRENT/implementation-roadmap.md) | Multi-sprint implementation roadmap and release milestones. |
| [epic-catalog.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/implementation-planning/CURRENT/epic-catalog.md) | Detailed catalog of Epics 1 through 6. |
| [story-catalog.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/implementation-planning/CURRENT/story-catalog.md) | Comprehensive Story catalog mapping REQs $\rightarrow$ ACs $\rightarrow$ Stories. |
| [task-breakdown.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/implementation-planning/CURRENT/task-breakdown.md) | Granular technical task breakdown per Story (Frontend, Backend, DB, API, Testing). |
| [dependency-graph.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/implementation-planning/CURRENT/dependency-graph.md) | Module, Epic, and Story dependency graph. |
| [critical-path.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/implementation-planning/CURRENT/critical-path.md) | Critical path analysis and bottleneck mitigation. |
| [implementation-order.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/implementation-planning/CURRENT/implementation-order.md) | Step-by-step technical implementation order. |
| [gap-analysis.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/implementation-planning/CURRENT/gap-analysis.md) | Codebase audit and gap report against Specification v2.1. |
| [technical-debt.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/implementation-planning/CURRENT/technical-debt.md) | Legacy code retirement, refactoring, and quality gates. |
| [sprint-plan.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/implementation-planning/CURRENT/sprint-plan.md) | Vertical slice sprint allocations (Sprints 1 through 6). |
| [release-roadmap.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/implementation-planning/CURRENT/release-roadmap.md) | Target release milestones (v2.1-Alpha, Beta, GA). |
| [definition-of-done.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/implementation-planning/CURRENT/definition-of-done.md) | Strict Definition of Done (DoD) per Task, Story, and Sprint. |
| [testing-strategy.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/implementation-planning/CURRENT/testing-strategy.md) | Comprehensive multi-tier testing plan (Unit, Integration, E2E, Regression, A11y, Security). |
| [risk-register.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/implementation-planning/CURRENT/risk-register.md) | Technical and schedule risk matrix with mitigation plans. |
| [final-verdict.md](file:///Users/doantuan/Desktop/Plan/family-finances/artifacts/implementation-planning/CURRENT/final-verdict.md) | Final Board sign-off declaring the plan official. |
