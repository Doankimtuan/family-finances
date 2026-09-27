# ViNha Product Opportunity Backlog

**Origin**: Phase 2 Product Fidelity Audit & Design Review  
**Date**: 2026-09-26  
**Status**: Backlog for Future Product Development (Excluded from Current UI Redesign Scope)

---

## Overview

This backlog captures legitimate product concepts, UX automations, and advanced capabilities that were conceptualized during the Google Stitch design phase but are **not supported by the current ViNha production backend, schema, or RPC contracts**.

Per the core redesign law:

```text
REDESIGN: Faithfully elevate the real existing application.
NEW PRODUCT DEVELOPMENT: Requires PRDs, schema migrations, backend RPCs, and governance models.
```

These features must **not** be masqueraded as existing product behavior in canonical redesign screens. They are documented here with full technical specifications for future engineering roadmaps.

---

## 1. Batch Savings Maturity Rollover ("Tái tục nhanh nhiều sổ")

- **Idea**: Allow users with multiple matured or maturing savings/Tikop contracts sharing the same provider, term, or renewal policy to execute bulk rollover or withdrawal in a single action.
- **User Problem**: In households with multiple laddered micro-deposits (e.g., test household has 7 Tikop contracts), reviewing and acknowledging 6 identical maturity inbox items one by one causes cognitive fatigue.
- **Potential Value**: High efficiency gain for active savers using automated micro-saving or contract laddering strategies.
- **Requires Backend Change?**: **YES**. Requires a new batch RPC (e.g. `batch_renew_savings` or `batch_execute_inbox_items`).
- **Requires Data Model Change?**: **NO**. Individual contract cycles and settlement logs can still be recorded atomically under the hood.
- **Requires New Business Rules?**: **YES**. Must define partial failure policies (what happens if 5 contracts roll over successfully but 1 fails due to rate change?), settlement account cascading rules, and aggregate confirmation auditing.
- **Design Dependency**: Needs an aggregate batch confirmation sheet with individual contract disclosure and rollback summary.
- **Implementation Complexity**: **Medium-High**.
- **Keep for Future Exploration?**: **YES (Priority 1 for Savings V2)**.

---

## 2. Household Spending Approval & Threshold Governance ("Ngưỡng duyệt chi tiêu vợ chồng")

- **Idea**: Introduce a configurable monetary threshold (e.g. expenses > ₫ 1,000,000) that automatically routes recorded transactions to the other partner's inbox for mutual acknowledgment/consent before locking or plan attribution.
- **User Problem**: Couples often agree informally that large purchases require consultation, but personal finance apps either provide no controls or rigid corporate approval workflows.
- **Potential Value**: High emotional security and alignment for shared marital finances.
- **Requires Backend Change?**: **YES**. Requires new transaction states (`pending_review`, `approved`, `disputed`) and push notification dispatchers.
- **Requires Data Model Change?**: **YES**. Must add `spending_threshold_vnd` and `approval_policy` columns to `household_policies` table in Postgres.
- **Requires New Business Rules?**: **YES**. What happens if partner declines? Does transaction remain in ledger? How does this affect bank account balance reconciliation?
- **Design Dependency**: Requires 2-sided review cards in Decision Inbox and policy configuration sliders in Together settings.
- **Implementation Complexity**: **High**.
- **Keep for Future Exploration?**: **YES (Priority 2 for Together Governance)**.

---

## 3. Real-Time Jar Budget Impact Simulation in Add Transaction ("Mô phỏng ngân sách hũ tức thời")

- **Idea**: When entering an amount and selecting a category in the Fast Capture sheet, render a live simulation showing the current jar spent percentage, the projected delta after this transaction, and an immediate visual cue if this purchase triggers an overspend condition.
- **User Problem**: Users often record expenses without realizing that a particular jar only has ₫ 100,000 remaining until they navigate away to the Plan screen.
- **Potential Value**: Prevents accidental overspending at the exact moment of financial recording.
- **Requires Backend Change?**: **NO**. The underlying business logic exists in `modules/plan`, but the `listCaptureJars()` query currently only returns `{ id, name, kind }`.
- **Requires Data Model Change?**: **NO**.
- **Requires New Business Rules?**: **NO**. Purely derived calculation (`projected = spent + new_amount`).
- **Design Dependency**: Requires updating the server loader for `capture-transaction-form` to pass active period allocations and ledger spent totals for each jar.
- **Implementation Complexity**: **Low-Medium**.
- **Keep for Future Exploration?**: **YES (Priority 1 for Transaction UX Enhancement)**.

---

## 4. Proactive Multi-Jar Algorithmic Rebalancing ("Tự động tái cân đối ngân sách")

- **Idea**: When a jar exceeds its monthly capacity (e.g., Mua sắm over budget by ₫ 809,000), an algorithmic advisor evaluates surplus jars with low velocity (e.g., Quỹ dự phòng or Tiết kiệm) and generates a 1-tap rebalancing proposal.
- **User Problem**: Calculating which surplus envelope to draw from to cover an overspent category requires manual mental math and multiple screen visits.
- **Potential Value**: Reduces over-budget anxiety by presenting a solution alongside the problem.
- **Requires Backend Change?**: **NO** for execution (since `reallocate_jar_capacity` RPC already exists). **YES** for smart recommendation generation heuristics in the backend engine.
- **Requires Data Model Change?**: **NO**.
- **Requires New Business Rules?**: **YES**. Rules regarding which jars are protected from automatic reallocation (e.g. Essential Rent/Bills jars should never be suggested as source envelopes).
- **Design Dependency**: Suggestion chips with clear source -> target arrows and 1-tap confirm modal.
- **Implementation Complexity**: **Medium**.
- **Keep for Future Exploration?**: **YES (Priority 2 for Plan Intelligence)**.

---

## 5. Discrete Term Savings Projected Monthly Annuity Extrapolation ("Quy đổi lãi tích lũy thành thu nhập tháng")

- **Idea**: Normalize discrete fixed-term deposits (e.g. 3M, 6M, 12M Tikop and Bank contracts) into an annualized monthly run-rate figure (e.g. `+₫ 11.240.000/tháng`) for household wealth tracking.
- **User Problem**: Household users want to know their overall "passive income" velocity across diverse locked instruments.
- **Potential Value**: Motivating wealth visualization metric.
- **Requires Backend Change?**: **NO**. Derived arithmetic calculation on client.
- **Requires Data Model Change?**: **NO**.
- **Requires New Business Rules?**: **YES**. Must clearly disclose that this is a mathematical extrapolation and NOT actual monthly liquid cashflow, preventing users from budgeting unreceived future interest.
- **Design Dependency**: Secondary footnote or metric toggle ("Quy đổi tương đương") rather than primary headline cashflow figure.
- **Implementation Complexity**: **Low**.
- **Keep for Future Exploration?**: **YES (Priority 3 for Wealth Analytics)**.
