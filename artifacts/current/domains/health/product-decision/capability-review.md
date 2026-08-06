# Capability Review

## Decision Matrix

| ID | Capability | Description | Business value | User value | Complexity | Risk | Decision | Reasoning |
|----|------------|-------------|----------------|------------|------------|------|----------|-----------|
| HLT-PD-001 | Household financial condition reflection | Reflect whether the household appears financially stable, pressured, or unclear. | High | High | Low | Medium | APPROVED | Phase 1 and 2 validate the core need for a shared financial condition mirror. |
| HLT-PD-002 | Liquidity visibility summary | Summarize whether real money visibility appears sufficient. | High | High | Medium | High | APPROVED WITH MODIFICATIONS | Approve visibility only; must not state that money is safe to spend or infer hidden balances. |
| HLT-PD-003 | Open obligation pressure | Identify pressure from visible bills, loans, cards, or other obligations. | High | High | Medium | High | APPROVED WITH MODIFICATIONS | Approve read-only pressure interpretation from owning domains; Health must not create or edit obligations. |
| HLT-PD-004 | Unresolved decision pressure | Reflect open Inbox burden as a financial-health factor. | High | Medium | Low | Low | APPROVED | Validated as realistic: unresolved household decisions increase unmanaged risk. |
| HLT-PD-005 | Plan presence and rhythm | Interpret planning presence and rhythm as a condition factor. | High | Medium | Low | Medium | APPROVED | Supports household-first understanding while preserving Planning as the owner of intention. |
| HLT-PD-006 | Debt and card burden signals | Surface loan and card burden as Health risk signals. | High | High | Medium | High | APPROVED WITH MODIFICATIONS | Approve read-only signals only; debt/card truth remains in Loans and Cards. |
| HLT-PD-007 | Recent activity rhythm | Use recent ledger activity as evidence of tracking rhythm. | Medium | Medium | Low | Medium | APPROVED | Phase 2 validates tracking rhythm as a trust and awareness signal if not over-weighted. |
| HLT-PD-008 | Prior condition comparison | Compare current Health with prior known condition. | Medium | Medium | Medium | High | APPROVED WITH MODIFICATIONS | Approve only when based on stable, grounded prior facts; avoid false precision and persisted Health truth. |
| HLT-PD-009 | Factor explanation | Explain why a score, pulse, level, or signal appears. | High | High | Low | Medium | APPROVED | Required for user trust and to prevent black-box scoring anxiety. |
| HLT-PD-010 | Read-only grounded interpretation | Ensure Health only reads source facts and never mutates money domains. | Critical | High | Medium | Critical | APPROVED | Directly protects BR-24 and Phase 1/2 trust findings. |
| HLT-PD-011 | Medical-expense exposure awareness | Notice visible medical cost pressure. | Medium | High | Medium | High | APPROVED WITH MODIFICATIONS | Approve financial exposure awareness only; no clinical, provider, or insurance advice. |
| HLT-PD-012 | Emergency-buffer adequacy awareness | Interpret visible emergency resilience. | High | High | Medium | High | APPROVED WITH MODIFICATIONS | Approve as a cautious signal; must not prescribe exact required amounts as advice. |
| HLT-PD-013 | Income concentration awareness | Notice dependency on one income source or limited income visibility. | Medium | Medium | Medium | Medium | DEFERRED | Real but needs source reliability and user research before adding interpretive weight. |
| HLT-PD-014 | Irregular income volatility | Interpret variable-income risk. | Medium later | Medium later | High | High | DEFERRED | Valuable for freelancers and small business households, but requires longitudinal evidence. |
| HLT-PD-015 | Seasonal pressure awareness | Interpret Tet, school, insurance renewal, travel, or annual pressure. | Medium later | High later | High | Medium | DEFERRED | Vietnam-relevant but belongs after basic Health trust and Planning/Month Close maturity. |
| HLT-PD-016 | Partner alignment awareness | Reflect whether shared decisions and visibility appear aligned. | Medium | Medium | Medium | High | APPROVED WITH MODIFICATIONS | Approve only as neutral household rhythm; avoid blame, surveillance, or partner scoring. |
| HLT-PD-017 | Insurance coverage visibility | Surface insurance coverage as financial protection context. | Medium later | Medium later | High | High | DEFERRED | Needs insurance truth source, terminology research, and compliance review. |
| HLT-PD-018 | Reimbursement timing awareness | Notice timing gap between medical payment and insurance reimbursement. | Medium later | Medium later | High | High | DEFERRED | Real Vietnam pain point, but needs claim/reimbursement evidence and boundary validation. |
| HLT-PD-019 | Data completeness awareness | Indicate when Health is based on incomplete visible facts. | High | High | Medium | Medium | APPROVED | Required to protect trust when cash, wallets, partner accounts, or obligations are missing. |
| HLT-PD-020 | Household confidence or stress check-ins | Use qualitative household stress or confidence inputs. | Low now | Medium later | Medium | High | DEFERRED | Emotionally relevant but manual, subjective, and easy to overinterpret. |
| HLT-PD-021 | Longer trend interpretation | Interpret Health over longer periods. | Medium later | Medium later | High | High | DEFERRED | Needs stable period facts and evidence that users value long-term trend language. |
| HLT-PD-022 | Read-only scenario comparison | Show what-if interpretations from verified facts. | Medium | Medium | Medium | High | APPROVED WITH MODIFICATIONS | Approve light read-only scenarios only; no recommendations, no automation, no invented balances. |
| HLT-PD-023 | Cross-domain risk clustering | Group multiple risk signals across domains. | Medium later | Medium later | High | High | DEFERRED | Useful later but can become opaque and anxiety-inducing before core factors are trusted. |
| HLT-PD-024 | Protection-gap interpretation | Interpret gaps across emergency buffer, insurance, income, and debt. | Medium later | Medium later | High | Critical | DEFERRED | High advisory risk; requires more research and compliance guardrails. |
| HLT-PD-025 | Provider-derived benefits context | Read insurance or employment benefits from providers. | Medium later | Medium later | High | High | DEFERRED | Provider reliability, consent, and maintenance cost are too high for current scope. |
| HLT-PD-026 | Household lifecycle adjustments | Interpret Health differently as children, elder care, housing, or retirement approach. | Medium later | Medium later | High | Medium | DEFERRED | Real 5-10 year need, but premature before simpler Health interpretation is validated. |
| HLT-PD-027 | Health mutates source domains | Allow Health to create, edit, approve, repay, reconcile, or close records elsewhere. | Low | Low | High | Critical | REJECTED | Violates BR-24 and destroys the mirror role validated in Phase 1 and 2. |
| HLT-PD-028 | Advisory-grade Health guidance | Provide medical, credit, insurance, investment, tax, or legal advice. | Low | Low | High | Critical | REJECTED | Conflicts with financial safety, compliance boundaries, and simple household reflection. |
| HLT-PD-029 | Treat virtual planning as real money | Let Health interpret jars, goals, or plans as available cash. | Low | Low | Medium | Critical | REJECTED | Violates BR-01 and risks dangerous affordability misunderstanding. |
| HLT-PD-030 | Invented or ungrounded Health facts | Let Health or AI invent balances, obligations, income, claims, or risk facts. | Low | Low | Medium | Critical | REJECTED | Violates trust, BR-01, and Phase 2's strongest validation requirement. |
| HLT-PD-031 | Automatic financial action from Health | Let Health initiate transfers, repayments, allocation changes, or provider actions. | Medium convenience | Low | High | Critical | REJECTED | Conflicts with no unnecessary automation and financial safety over convenience. |
| HLT-PD-032 | Black-box precise scoring | Present highly precise Health scoring without understandable factors or confidence context. | Medium | Low | Medium | High | REJECTED | Phase 2 identified false precision and judgment risk; Health must remain explainable. |

## Summary

- APPROVED: 7.
- APPROVED WITH MODIFICATIONS: 8.
- DEFERRED: 11.
- REJECTED: 6.
