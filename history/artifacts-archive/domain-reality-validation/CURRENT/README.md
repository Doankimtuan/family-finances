# Domain Reality Validation Board — README

## Purpose

The Domain Reality Validation Board exists to pressure-test ViNha's domain model against real-world financial behavior, competitor products, behavioral economics, and long-term evolution. It does not design — it validates.

## Board Composition

The board evaluates 13 domains across 8 validation dimensions plus competitor benchmarking:

### Core Validation Dimensions
1. **Reality Validation** — How real people actually interact with this concept
2. **Financial Validation** — Does the model reflect real financial behavior?
3. **Behavioral Validation** — Does it support healthy financial habits?
4. **Competitor Benchmark** — How do YNAB, Copilot, Monarch, Simplifi handle this?
5. **Simplicity Validation** — Too simple? Too complex? What's missing?
6. **Longevity Validation** — Will it age well for 3-5 years?
7. **Product Fit Validation** — Does it feel like an OS or just a tracker?
8. **Missing Concepts** — What's genuinely absent?

### Domains Evaluated

| Domain | Maturity Score | Category |
|--------|---------------|----------|
| Accounts | 9.3/10 | Real Ledger |
| Transactions | 9.6/10 | Real Ledger |
| Cards | 7.9/10 | Real Ledger |
| Savings | 8.1/10 | Real Ledger |
| Installments | 8.3/10 | Real Ledger |
| Budgets/Jars | 8.6/10 | Intention Plan |
| Goals | 8.3/10 | Intention Plan |
| Planning | 8.0/10 | Intention Plan |
| Month Close/Ritual | 8.1/10 | Intention Plan |
| Inbox | 8.7/10 | Intention Plan |
| Categories | 7.9/10 | Shared |
| Together | 8.4/10 | Tenancy |
| Health | 8.0/10 | Insight |

### Competitors Benchmarked
- YNAB (You Need A Budget)
- Copilot Money
- Monarch Money
- Quicken Simplifi

## How to Use These Documents

### For Product Decisions
Start with `final-verdict.md` for the overall assessment. Dive into individual domain files for specific concerns. Use `priority-matrix.md` to prioritize evolution opportunities.

### For Architecture Decisions
Start with `longevity-validation.md` to assess structural risk. Use `migration-risks.md` when considering evolution. Cross-reference with individual domain files for domain-specific stress points.

### For Competitive Strategy
Start with `benchmark-summary.md` for the competitive landscape. Use individual domain files' Competitor Benchmark sections for domain-specific competitive analysis.

### For Engineering Planning
Start with `recommendations.md` for prioritized action items. Use `future-capabilities.md` to plan long-term architecture. Reference `priority-matrix.md` for scored opportunities.

### For Design and UX
Start with `behavioral-validation.md` for behavioral insights. Use `simplicity-validation.md` for complexity assessment. Reference individual domain files' Reality Validation sections.

## Methodology

1. **Evidence-Driven** — Every validation references competitor behavior, household finance research, or behavioral economics
2. **Domain-Immutable** — This board validates; it does not redesign. Evolution opportunities are proposed, not mandated
3. **BR-Guarded** — All validations respect BR-01 (Real ≠ Virtual) and BR-14 (Health must not write)
4. **Competitor-Specific** — All competitor references name specific products and features
5. **Scored Opportunities** — All evolution opportunities carry numeric scores across 8 dimensions

## Document Index

| File | Purpose | Audience |
|------|---------|----------|
| `README.md` | Board index and methodology | All |
| `overview.md` | Cross-domain synthesis | Product, Architecture |
| `benchmark-summary.md` | Detailed competitor analysis | Product, Strategy |
| `financial-validation.md` | Cross-domain financial correctness | Product, Architecture |
| `behavioral-validation.md` | Cross-domain behavioral assessment | Product, Design |
| `simplicity-validation.md` | Overall simplicity assessment | Product, Design |
| `longevity-validation.md` | 3-5 year evolution assessment | Architecture |
| `future-capabilities.md` | Catalog of future capabilities | Product, Architecture |
| `priority-matrix.md` | Scored and ranked opportunities | Product, Engineering |
| `migration-risks.md` | Evolution risks and costs | Architecture |
| `recommendations.md` | Board recommendations by priority | Product, Engineering |
| `final-verdict.md` | Overall board verdict | Product, Leadership |
| `domains/*.md` | Per-domain deep dives | All |

## Non-Goals

This board does NOT:
- Redesign domains or architecture
- Implement features
- Make product decisions (it recommends)
- Replace the Architecture Decision Board
- Challenge frozen product principles

## Status

**Current** — This is the active validation board. All previous iterations are superseded.

---

*Board convened for ViNha MKP scope validation. All assessments reflect the state of the domain model as captured in `artifacts/domain-definition/CURRENT/` and `artifacts/architecture-definition/CURRENT/`.*
