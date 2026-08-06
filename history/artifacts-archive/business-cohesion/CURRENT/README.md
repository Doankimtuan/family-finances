# Business Cohesion Board — README

**Artifact Pack:** `artifacts/business-cohesion/CURRENT/`  
**Board Convened:** 2026-08-03  
**Scope:** Business Cohesion & Money Lifecycle Validation for ViNha Household Money Operating System  
**Product Version:** Specification v2.1 + Approved R1 Features (Decision Board) + Domain Philosophy + Domain Reality Validation  
**Status:** VALIDATION ONLY — Source of Truth not modified

---

## Core Question

> **Does ViNha behave as ONE complete financial operating system — not a collection of independent features?**

---

## Board Composition

| Role | Lens |
|------|------|
| **Chief Product Officer** | Product identity: Household Money OS vs expense-tracker drift |
| **Household Finance Expert** | Real household money behavior, shared obligations, month rhythm |
| **Consumer Finance Expert** | Cards, installments, savings products, interest, safety |
| **Behavioral Economist** | Decision friction, ostrich effect, ritual adoption, feedback loops |
| **Principal Domain Architect** | Ownership, boundaries, circularity, bounded-context integrity |
| **Principal UX Strategist** | Mental model continuity across Home · Money · Plan · Inbox · Together |
| **Systems Thinking Specialist** | Lifecycles, feedback loops, emergent failure modes |
| **FinTech Product Strategist** | 5–10 year cohesion under feature pressure |

---

## Governing Constitution (Board Mandate)

| Invariant | Board Interpretation for This Validation |
|-----------|------------------------------------------|
| **BR-01** | Real Ledger ≠ Virtual Jars. Money lives in Accounts. Jars are intentions. |
| **BR-14 (Constitution)** | Health is read-only. Health never mutates money, plans, or decisions. |
| Household-first | Tenancy is the unit of analysis, not the individual as default. |
| Progressive disclosure | Complexity reveals on demand; core path stays simple. |
| Simple mental model | Five surfaces; no duplicated responsibilities; no feature islands. |
| No circular ownership | Every concept has exactly one owning domain. |

### SoT Note — BR-14 Identity Collision (Not Resolved Here)

Product Definition `Business-Catalog.md` states **BR-14 = AI non-invention** (AI may explain/suggest; must not invent balances or move money without explicit path).

Domain Philosophy, Domain Reality Validation, Decision Board compliance notes, and this board’s Product Constitution treat **BR-14 = Health is read-only**.

Both constraints are valid and must hold. The **shared ID is a SoT defect**. This board:

- Enforces **Health read-only** as a constitutional invariant (labeled **Health-RO** when distinguishing from Product BR-14 text)
- Enforces **AI non-invention** as Product SoT **BR-14**
- Records the ID collision as a **Business Rule Conflict** smell
- Does **not** modify Source of Truth

---

## Methodology

1. **Domain Inventory** — 13 domains across 4 bounded contexts  
2. **Business Graph** — Nodes (domains, features, rules, decisions, states, events, actors) + edges  
3. **Lifecycle Tracing** — 13 money flows + decision + user journeys  
4. **Cross-Domain Matrix** — Every domain × every domain  
5. **Smell Detection** — 17 smell types  
6. **Scoring & Verdict** — Domain and system cohesion scores  

---

## How to Read These Documents

| Audience | Start Here |
|----------|------------|
| Product leadership | `executive-summary.md` → `final-verdict.md` |
| Domain architects | `business-graph.md` → `domain-cohesion-score.md` → `business-ownership.md` |
| Feature teams | `cross-domain-matrix.md` → `integration-analysis.md` → `feature-islands.md` |
| Analysts | `money-lifecycle.md` → `decision-lifecycle.md` → `lifecycle-gaps.md` |
| Risk | `business-smells.md` → `risk-analysis.md` → `priority-matrix.md` |
| Forward planning | `integration-opportunities.md` → `future-considerations.md` |

---

## Document Index

| # | Document | Purpose |
|---|----------|---------|
| 1 | `README.md` | Board, methodology, reading guide |
| 2 | `executive-summary.md` | Headline findings and overall score |
| 3 | `business-graph.md` | Business interaction graph (text + Mermaid) |
| 4 | `business-graph.json` | Machine-readable graph |
| 5 | `money-lifecycle.md` | 13 money lifecycle traces |
| 6 | `decision-lifecycle.md` | Financial decision lifecycles |
| 7 | `user-lifecycle.md` | User journey continuity |
| 8 | `cross-domain-matrix.md` | Domain × domain interactions |
| 9 | `business-ownership.md` | Ownership / never-touch boundaries |
| 10 | `integration-analysis.md` | Domain-pair integration quality |
| 11 | `feature-islands.md` | Island detection for approved features |
| 12 | `business-smells.md` | 17 smell types systematically checked |
| 13 | `feedback-loops.md` | Positive, negative, missing loops |
| 14 | `lifecycle-gaps.md` | Incomplete money/decision paths |
| 15 | `dependency-analysis.md` | Business dependency structure |
| 16 | `integration-opportunities.md` | Collaboration opportunities (no redesign) |
| 17 | `priority-matrix.md` | Severity × impact ranking |
| 18 | `risk-analysis.md` | Cohesion failure risks |
| 19 | `future-considerations.md` | Deferred / future cohesion impact |
| 20 | `domain-cohesion-score.md` | Per-domain cohesion scores |
| 21 | `final-verdict.md` | Board answers and sign-off |

---

## Evidence Base (Frozen — Read Only)

- `artifacts/product-definition/CURRENT/`
- `artifacts/architecture-definition/CURRENT/`
- `artifacts/technical-specification/CURRENT/`
- `artifacts/domain-philosophy/CURRENT/`
- `artifacts/domain-reality-validation/CURRENT/`
- `artifacts/product-decision-board/CURRENT/`
- `artifacts/developer-constitution/CURRENT/`
- `artifacts/execution/CURRENT/` (S1–S6 complete; R1 not yet planned as sprint packs)
- Business Rules: Product BR-01–BR-15 (+02a/b) + Decision Board BR-16–BR-27

---

## Constraints

- Validation board only — no product redesign, no code, no SoT edits  
- Never invent business requirements  
- Never violate BR-01 or Health-RO  
- Integration opportunities describe business rationale only — not implementation specs  
- Decision Board is binding for approved/deferred/rejected EO features  
