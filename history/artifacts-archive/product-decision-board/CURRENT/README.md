# Product Decision Board — README

## Board Composition

The Product Decision Board is the official governance body for ViNha's product evolution. It reviews all evolution opportunities surfaced by the Domain Reality Validation Board and issues binding product decisions.

**Board Members (Roles):**
- **Product Owner** — Represents the end user; votes on value and usability
- **Product Architect** — Represents product integrity; votes on architectural coherence
- **Business Analyst** — Represents business viability; votes on market alignment
- **UX Lead** — Represents user experience; votes on interaction design
- **Domain Expert** — Represents domain correctness; votes on financial accuracy

## Methodology

1. **Input:** 30 Evolution Opportunities (EOs) scored by the Domain Reality Validation Board, plus 7 "Do Not Implement" (DNI) items flagged as dangerous.
2. **Scoring Dimensions (from Validation Board):** BV (Business Value), UV (User Value), CX (Complexity), MC (Market Competitiveness), AI (Architecture Impact), RK (Risk), FI (Financial Impact), LO (Longevity).
3. **Decision Framework:** Each EO and DNI receives one of four decisions:
   - **APPROVE** — Proceed as specified; full product specification provided
   - **APPROVE WITH MODIFICATIONS** — Proceed with specified changes; modifications documented
   - **DEFER** — Not now; target version and activation criteria specified
   - **REJECT** — Never; rationale and product-integrity analysis documented
4. **Decision Principles:** MKP Discipline, Product Identity, Simplicity First, Financial Safety, Competitive Necessity, BR-01/BR-14 inviolability, Long-term Integrity.

## How to Use These Documents

| Document | Purpose | Read When |
|---|---|---|
| `executive-summary.md` | One-page overview of all decisions | Quick reference |
| `decision-matrix.md` | Tabular summary of all 37 decisions | Filtering/sorting decisions |
| `approved.md` | Full product spec for each APPROVED feature | Implementing a feature |
| `approved-with-modifications.md` | Full product spec + required modifications | Scoping modified features |
| `deferred.md` | Deferred features with activation criteria | Planning future releases |
| `rejected.md` | Rejected features with rationale | Understanding "why not" |
| `future-capabilities.md` | Catalog of future capabilities by version | Long-term planning |
| `roadmap.md` | Updated product roadmap R0-R3 + v2.x | Release planning |
| `business-rule-changes.md` | All BR additions, modifications, retirements | Updating business rule docs |
| `requirement-changes.md` | All REQ additions, modifications, retirements | Updating requirement docs |
| `acceptance-criteria-changes.md` | All AC additions and modifications | Test planning |
| `architecture-impact.md` | Architecture implications of all decisions | Architecture planning |
| `database-impact.md` | Database implications of all decisions | Data modeling |
| `api-impact.md` | API implications of all decisions | API design |
| `migration-plan.md` | Phased migration from current to target state | Release management |
| `risk-analysis.md` | Risk assessment of all decisions | Risk management |
| `dependency-analysis.md` | Cross-feature dependency mapping | Sequencing work |
| `priority-matrix.md` | Priority-ranked feature list | Sprint planning |
| `implementation-order.md` | Sequenced implementation plan | Engineering planning |
| `product-health.md` | Product health assessment post-decisions | Governance review |
| `final-verdict.md` | Board's final assessment and sign-off | Executive review |

## Decision Status Summary

| Decision | Count |
|---|---|
| **APPROVED** | 14 |
| **APPROVED WITH MODIFICATIONS** | 3 |
| **DEFERRED** | 10 |
| **REJECTED** | 10 (3 EOs + 7 DNIs) |
| **TOTAL** | 37 |

## Version

- **Board Session:** 2026-08-03
- **Effective Date:** 2026-08-03
- **Review Cycle:** Quarterly or upon significant market change
- **Supersedes:** All prior product decision artifacts
