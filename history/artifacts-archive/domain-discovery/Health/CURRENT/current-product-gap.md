# Current Product Gap

This document compares the discovered real-world Health domain with current product artifacts and code. It lists factual gaps only and does not propose solutions.

## Current Product Observations

- Current module README defines Health as a leaf context for household financial health scores, insights, and scenarios.
- Current Health contract states Health is compute-on-read only.
- Current Health contract forbids direct Supabase client use, commands, persistence, and Health snapshots.
- Current Health detail orchestration reads ledger, plan, and inbox application queries.
- Current Health pulse computes from account count, active jar count, and open Inbox count.
- Current Health levels are starting, steady, and strong.
- Current insight generation uses account count, active jar count, open Inbox count, recent transaction count, and EMI completion pending state.
- Current insight generation includes an AI guardrail.
- Current messages frame Health as "Household financial pulse" and "Financial Health."
- Current messages state that Health never invents ledger balance or moves money.
- Current tests cover Health overview, insights, read-only shield, pulse, and AI policy guardrails.

## Factual Gaps Against Real-World Domain

| Real-world concern | Current product evidence | Factual gap |
| --- | --- | --- |
| Health is shaped by liquidity amount and timing. | Pulse uses account count, jar count, and Inbox count. | No factual evidence that actual liquidity level or timing pressure contributes to Health. |
| Debt burden affects household stability. | Health currently reads ledger, plan, and inbox; product decisions mention Cards and Loans as adjacent read sources. | No factual evidence in current Health computation of loan burden, card utilization, interest, or payment pressure. |
| Income stability matters. | Health reads recent transactions count, not income regularity. | No factual evidence of income volatility or income concentration interpretation. |
| Medical shocks are a major Vietnam household financial risk. | Ledger has a medical transaction category; Health has no observed medical-expense factor. | No factual evidence of medical exposure, insurance coverage, or reimbursement timing interpretation. |
| Emergency buffer is central to resilience. | Planning and Goals exist as adjacent domains; Health uses active jar count. | No factual evidence of emergency-buffer adequacy interpretation. |
| Partner alignment affects real household control. | Current messages mention partners deciding together. | No factual evidence of partner-specific participation or alignment factor. |
| Data completeness changes trust in the signal. | Setup insight mentions accounts and jars. | No factual evidence of explicit data completeness or confidence state beyond setup counts. |
| Seasonal obligations affect Vietnam household pressure. | Planning artifacts mention seasonal expenses elsewhere. | No factual evidence of seasonal pressure in Health. |
| Family support can be inflow, obligation, or emergency fallback. | No observed Health factor for family support. | No factual evidence of informal support or family obligation interpretation. |
| A score requires explainable weighting. | Health pulse has deterministic heuristic in code. | No observed product artifact explaining weight rationale as domain discovery. |

## Product-Definition Alignment Observations

- The strongest alignment is Health's read-only posture.
- Current product language correctly separates Health interpretation from real balances and money movement.
- Current implementation is narrower than the real-world domain and appears focused on early setup, decision load, and tracking rhythm.

No implementation changes are proposed in this discovery phase.
