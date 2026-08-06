# Modified Features

Capabilities below are approved only with scope or language modification before implementation planning.

| ID | Original idea | Required modification | Reason | Expected result |
| --- | --- | --- | --- | --- |
| GOAL-PD-003 | Optional timing pressure. | Treat target date as desired household timing, not obligation truth or provider due truth. | Prevents false urgency and domain ownership confusion. | Users understand timing without assuming external confirmation. |
| GOAL-PD-004 | Perceived progress. | Label and model as intention progress, not real balance. | Protects BR-01 and avoids false confidence. | Progress motivates without misleading. |
| GOAL-PD-005 | Contribution history or updates. | Contributions are progress records unless tied to transaction evidence owned elsewhere. | Prevents "contribution" from being mistaken for a bank transfer. | Users can update progress while money truth remains separate. |
| GOAL-PD-009 | Household-level visibility. | Scope visibility around shared goals and partner trust; avoid blame-oriented interpretation. | Goals can create fairness pressure. | Goals support collaboration, not surveillance. |
| GOAL-PD-010 | Pause, complete, cancel as real-life states. | Clarify completion as goal state, not proof that purchase, payment, or transfer happened. | Real life has multiple meanings of done. | Lifecycle stays useful and honest. |
| GOAL-PD-012 | Savings product association. | Association is context only; Savings owns balance, rate, tenor, maturity, withdrawal, and settlement. | Prevents goal from duplicating Savings truth. | Goal can have purpose context without product ownership. |
| GOAL-PD-013 | Account or transaction evidence. | Use evidence read-only; never mutate source facts from Goals. | Protects Accounts and Transactions ownership. | Goal confidence can be informed by facts without rewriting money history. |
| GOAL-PD-016 | Deadline pressure. | Use calm household language; avoid punitive overdue framing. | Reduces anxiety and preserves trust. | Timing helps prioritization without shame. |
| GOAL-PD-017 | Partial or overfunded progress. | Treat over/partial status as progress interpretation, not spendable money. | Avoids implying extra liquidity. | Edge cases are understandable without balance confusion. |
| GOAL-PD-018 | Compare progress with real money evidence. | Compare only with explicit source ownership and uncertainty; no false certainty. | Evidence may be incomplete across cash, wallet, and accounts. | Safer review of whether progress is believable. |

## Product Value

Modified capabilities are valuable but carry misunderstanding risk. They may proceed only if they preserve:

- Goal as intention.
- Real money truth in source domains.
- Partner trust.
- Plain household language.
