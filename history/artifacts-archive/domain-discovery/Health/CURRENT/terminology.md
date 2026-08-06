# Terminology

## Preferred Terms

| Term | Definition |
| --- | --- |
| Health | Read-only household financial condition domain. |
| Financial health | Overall condition of stability, resilience, pressure, and control. |
| Pulse | Lightweight condition signal based on visible facts. |
| Score | Numeric expression of condition when the product uses numeric communication. |
| Level | Named condition band such as starting, steady, or strong. |
| Signal | A compact condition indicator. |
| Insight | Read-only observation grounded in household facts. |
| Scenario | Read-only what-if interpretation, not an action. |
| Factor | A source-domain fact that influences Health interpretation. |
| Pressure | Financial strain from obligations, timing, decisions, or shocks. |
| Resilience | Ability to absorb expected and unexpected events. |
| Buffer | Money or accessible support available for shocks. |
| Medical exposure | Potential household financial burden from healthcare costs. |
| Out-of-pocket payment | Medical cost paid directly by the household. |
| Co-payment | Portion of eligible medical cost paid by the insured person. |
| Reimbursement | Money returned by an insurer after eligible expense review. |

## Forbidden Synonyms

| Avoid | Use instead | Reason |
| --- | --- | --- |
| Medical Health | Health financial domain | Avoids confusion with clinical health. |
| Diagnosis | Observation | Health does not diagnose finances or people. |
| Advice | Observation / interpretation | Avoids regulated advisory implication. |
| Recommendation | Consideration / scenario | Avoids prescriptive action. |
| Command | Action in owning domain | Health is read-only. |
| Prediction | Scenario / projection | Avoids certainty. |
| Available money | Real balance / liquidity | Avoids confusing plans with cash. |
| Safe to spend | Visible pressure / buffer | Avoids guaranteeing safety. |

## Business Definitions

- Health is interpretive, not operational.
- Health may read facts but must not mutate source facts.
- Health may surface risk but must not decide for the household.
- Health may explain financial condition but must not provide medical, insurance, investment, credit, or tax advice.
- Health is only as trustworthy as the source facts it can observe.
