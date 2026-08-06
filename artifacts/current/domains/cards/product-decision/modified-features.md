# Modified Features

## Capabilities Approved With Modifications

| Capability ID | Original idea | Required modification | Reason | Expected result |
|---------------|---------------|-----------------------|--------|-----------------|
| CARD-PD-002 | Distinguish debit, credit, and prepaid behavior. | Foreground credit-card obligation; treat debit primarily as account access unless stronger evidence emerges; keep prepaid lightweight. | Phase 2 validates debit cards are often understood as bank-account access. | Users see what matters without card-type overreach. |
| CARD-PD-004 | Identify card network. | Keep network as secondary card identity, not a household-facing infrastructure concept. | Network matters less than issuer and bill for ordinary users. | Maintains accuracy without clutter. |
| CARD-PD-005 | Represent cardholder role. | Track household responsibility awareness, not complex legal ownership. | Supplementary-card prevalence and privacy expectations need validation. | Supports trust without legal over-modeling. |
| CARD-PD-006 | Represent card status. | Use lightweight status only; avoid full lifecycle state machine. | Loss, block, expiry, replacement, and closure are real but not daily behavior. | Card history stays understandable and maintainable. |
| CARD-PD-008 | Track available credit. | Frame as remaining borrowing capacity, never spendable cash. | Prevents credit limit from being mistaken for real money. | Protects BR-01 and financial safety. |
| CARD-PD-017 | Track issuer charges. | Approve broad fee visibility; defer detailed fee taxonomy. | Specific fee types vary by issuer and can overwhelm users. | Users see charges without over-engineering. |
| CARD-PD-018 | Track interest. | Show interest as a distinct cost when known; avoid provider-grade formula promises. | Detailed calculation needs issuer-specific truth. | Users understand debt cost without false precision. |
| CARD-PD-019 | Track rewards and cashback. | Approve simple cashback or statement-credit awareness; defer points, miles, vouchers, and optimization. | Manual reward tracking is low safety value and high burden. | Keeps useful credits visible without encouraging overspending. |
| CARD-PD-026 | Track card-purchase installments. | Preserve card-origin visibility and future obligation awareness; do not duplicate Loans. | Phase 2 shows installments blur Cards/Loans. | Users understand future pressure while boundaries stay intact. |
| CARD-PD-031 | Track full, partial, minimum, and autopay behavior. | Approve full and partial repayment awareness; defer issuer-specific minimum-payment depth and autopay. | Minimum and autopay depend on issuer terms and posting reliability. | Repayment remains understandable and safe. |
| CARD-PD-038 | Credit-health analysis. | Health may read utilization and repayment behavior only. | BR-24 prohibits Health from mutating operational domains. | Health insights remain read-only. |

## Product Interpretation

Modified approvals keep the Cards domain household-first. They preserve important financial realities while avoiding technical card-industry detail, false provider precision, and automation before trust is validated.
