# Domain Philosophy — Current

**ViNha — Household Money Operating System**
*Domain Philosophy Board Assessment*

**Version:** v1.0.0 | **Date:** 2026-08-03 | **Status:** Active

---

## Purpose

This artifact pack captures the **philosophical foundation** of every domain in ViNha. It answers *why* each domain exists before *what* it stores or *how* it is built. It is the single source of truth for domain boundaries, business language, and financial correctness.

When a new feature is proposed, when a domain boundary is questioned, or when a team member needs to understand what ViNha *is* (not just what it *does*), start here.

---

## Navigation Guide

### Core Documents
| File | Purpose | Read When |
|------|---------|-----------|
| `philosophy-overview.md` | Cross-domain synthesis — the big picture | You need to understand how all domains fit together |
| `glossary.md` | Ubiquitous language across all domains | You need a canonical definition of any term |
| `principles.md` | Financial first principles justifying all domains | You need the WHY behind domain decisions |
| `scoring.md` | Aggregated domain scores and commentary | You need to assess domain health |
| `risks.md` | What breaks when boundaries are violated | You are proposing a feature that crosses domains |
| `recommendations.md` | Board recommendations for domain integrity | You need guidance on what to protect/evolve/simplify |
| `final-verdict.md` | Overall assessment of completeness | You need the board's final word |

### Domain Files
| File | Domain | Bounded Context |
|------|--------|-----------------|
| `domains/accounts.md` | Accounts | Real Ledger |
| `domains/transactions.md` | Transactions | Real Ledger |
| `domains/cards.md` | Cards | Real Ledger |
| `domains/savings.md` | Savings | Real Ledger |
| `domains/installments.md` | Installments | Real Ledger |
| `domains/budgets.md` | Budgets (Jars) | Intention Plan |
| `domains/goals.md` | Goals | Intention Plan |
| `domains/planning.md` | Planning | Intention Plan |
| `domains/month-close.md` | Month Close (Ritual) | Intention Plan |
| `domains/inbox.md` | Inbox | Intention Plan |
| `domains/categories.md` | Categories | Shared (tags) |
| `domains/together.md` | Together | Tenancy |
| `domains/health.md` | Health | Insight |

---

## Usage Instructions

1. **Onboarding new team members:** Read `philosophy-overview.md` → `glossary.md` → `principles.md`, then domain files relevant to their work.
2. **Proposing a feature:** Read the domain file for the affected domain, verify against `risks.md`, check `recommendations.md` for relevant guidance.
3. **Debating a domain boundary:** Start with the relevant domain file's "Domain Boundary" and "Explicit Non-Responsibilities" sections, cross-reference with `philosophy-overview.md`.
4. **Design review:** Every domain file's "Success Criteria" and "Common Mistakes" sections are your checklist.
5. **Architecture decisions:** Reference domain scores in `scoring.md` for risk assessment on fragile domains.

---

## The Two Financial Truths

Every domain traces back to one fundamental distinction:

| | Real Ledger | Intention Plan |
|--|-------------|----------------|
| **Question answered** | What money do we really have? | Where is money meant to go? |
| **Nature** | Facts — what happened | Promises — what we intend |
| **Domains** | Accounts, Transactions, Cards, Savings, Installments | Budgets (Jars), Goals, Planning, Month Ritual, Inbox |
| **Mistake to avoid** | Calling it a "budget" | Calling it a "balance" |

This distinction is not negotiable. It is the philosophical core of ViNha.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| v1.0.0 | 2026-08-03 | Initial Domain Philosophy Board assessment — all 13 domains assessed, 21 files created |

---

## Board Membership

The Domain Philosophy Board is the guardian of domain integrity. It does not write code, approve PRs, or manage sprints. It answers one question: *does this domain make sense?*
