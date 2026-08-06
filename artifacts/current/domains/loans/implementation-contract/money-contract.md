# Money Contract

## Universal Money Rules

- Loans do not execute money movement.
- Transactions own ledger writes for repayment.
- Accounts own payment source and money location.
- Planning owns payoff intention; Loans own obligation facts.
- Inbox acknowledgement never changes money.
- Health never writes loan data.
- Payoff estimate never closes a loan.
- Recorded loan values are product truth unless provider-confirmed by a later approved scope.

## Action Money Effects

| Action | Money source | Money destination | Ledger writes | Planning updates | Read-only updates | No-op situations |
|--------|--------------|-------------------|---------------|------------------|-------------------|------------------|
| Create Loan | None from creation alone | None | None | None | Loan readers may include new obligation burden | Invalid loan rejected |
| Edit Loan Details | None | None | None | None | Loan readers show updated facts | Invalid edit rejected |
| Update Rate Awareness | None | None | None | Future repayment projection may read updated rate awareness | Loan readers show updated rate context | Invalid or unclear rate |
| Review Loan | None | None | None | None | Loan may show confirmed or Needs Review state | Review cannot complete |
| Record Scheduled Repayment | Payment source account/cash/wallet | Lender | Owned by Transactions | None | Loan history and recorded remaining principal update | Payment invalid, duplicate, unclear, or source invalid |
| Record Partial Or Irregular Repayment | Payment source account/cash/wallet | Lender | Owned by Transactions | None | Actual-vs-planned awareness may update | Payment cannot be interpreted |
| Estimate Early Payoff | None | None | None | Planning may read estimate as context | Payoff estimate displayed/read | Loan inactive or estimate not meaningful |
| Mark Completed | None | None | None from completion alone | None | Loan status/readers update | Residual obligation uncertain |
| Cancel Loan | None | None | None | None | Loan status/readers update | Cancellation conflicts with evidence |
| Mark Defaulted | None | None | None | None | Loan status/readers update | Default unclear |
| Archive Loan | None | None | None | None | Active readers exclude/demote archived loan | Active obligation unresolved |
| Recover Loan State | None | None | None | None | State/readers update after review | Recovery path invalid |
| Abandon Draft | None | None | None | None | No financial readers affected | Draft already active |
| Reject Invalid Attempt | None | None | None | None | Previous state remains visible | Not applicable |

## Repayment Rules

- Repayment amount must be positive.
- Payment source must be real and household-relevant.
- Loan repayment must produce or reference a Transaction-owned ledger movement.
- Principal, interest, and fee components must not be invented.
- If component split is unknown, repayment may still be recorded only within approved business meaning.
- If repayment interpretation is unclear, loan enters Needs Review and no false progress is recorded.

## BR-01 Protection

- Schedule is not money.
- Payoff estimate is not money.
- Partner intention to pay off is not money.
- Inbox reminder is not money.
- Health warning is not money.
- Loan-owned payoff jar is forbidden.

