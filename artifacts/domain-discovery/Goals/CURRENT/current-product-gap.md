# Current Product Gap

This document compares the discovered real-world Goals domain with current product artifacts and code. It lists factual gaps only and does not propose solutions.

## Current Product Observations

- Current Product Requirements define Goals as "Goals with contributions/status at /goals."
- Current Business Rules include a Goal entity with statuses active, paused, completed, and cancelled.
- Current application constants define goal statuses: active, paused, completed, cancelled.
- Current Plan types define a goal with id, name, target amount, funded amount, target date, status, and progress percent.
- Current Plan type comments state progress is toward an intention target and is not a bank balance.
- Current goal creation accepts name, positive whole target amount, and optional target date.
- Current goal contribution accepts a goal id, positive whole amount, and optional note.
- Current goal update accepts name, target amount, target date, and status.
- Current persistence includes goals and goal contributions.
- Current contribution behavior increases funded amount and marks a goal completed when funded amount reaches or exceeds target amount.
- Current goal list excludes cancelled goals.
- Current UI text says goals are "what we are saving for" and that progress is intention, not bank balance.
- Current Vietnamese UI uses "Muc tieu" and "Tien do y dinh" language.
- Current Plan is the module boundary where Goals live.

## Factual Gaps Against Real-World Domain

| Real-world concern | Current product evidence | Factual gap |
| --- | --- | --- |
| Households distinguish purpose type: emergency, travel, family support, baby, school, Tet, purchase, home. | Goal has name, target, target date, status, funded amount. | No factual evidence of explicit goal purpose type or real-world goal category. |
| Goal money may live across cash, bank account, wallet, savings product, gold, or family contribution. | Goal funded amount exists as intention progress. | No factual evidence of source-of-progress attribution. |
| Same money may accidentally be counted toward multiple goals. | Goal progress is stored per goal. | No factual evidence of cross-goal coverage checks or shared-money warning semantics. |
| Partner-specific contributions are common in shared households. | Goal contribution has created_by and optional note in persistence. | No observed product surface explaining partner contribution responsibility or visibility semantics. |
| Goal progress may be manual, factual, or mixed. | UI states progress is intention, not bank balance. | No factual evidence of progress evidence type. |
| Goals often pause due to debt, illness, family support, or job loss. | Goal status includes paused. | No factual evidence of pause reason. |
| Goal target amounts change due to inflation, quotes, or changing scope. | Goal target amount can be updated. | No factual evidence of target revision history or reason. |
| Date-driven goals can expire or become overdue. | Goal has optional target date. | No factual evidence of overdue or expired interpretation. |
| Goal completion may mean funded, purchased, paid, or no longer needed. | Contribution can auto-complete when funded amount reaches target. | No factual evidence distinguishing funded completion from outcome completion. |
| Goals may be associated with savings products but product truth belongs to Savings. | Product decisions state goals should remain intention and Savings owns product truth. | No factual evidence of explicit goal-to-savings association in current goal model. |
| Goals compete with debts, cards, and recurring obligations. | Planning, Cards, Loans, and Recurring exist as adjacent domains. | No factual evidence of cross-domain prioritization or pressure comparison in Goals. |
| Households may merge, split, or replace goals. | Goal status can change and target/name can update. | No factual evidence of merge, split, or replacement semantics. |

## Product-Definition Alignment Observations

- The strongest alignment is the explicit language that goal progress is intention, not bank balance.
- The current model covers the minimum observed shape of a household goal: name, target, progress, optional date, status, and contribution.
- Current scope is narrower than the real-world domain, especially around evidence, source attribution, partner dynamics, and lifecycle nuance.

No implementation changes are proposed in this discovery phase.
