# Capability Review

## Decision Matrix

| ID | Capability | Description | Business value | User value | Complexity | Risk | Decision | Reasoning |
|----|------------|-------------|----------------|------------|------------|------|----------|-----------|
| CARD-PD-001 | Card instrument | Represent a card as a distinct household financial instrument. | High | High | Low | Medium | APPROVED | Validated as useful when cards create payment convenience and credit obligation. |
| CARD-PD-002 | Card type distinction | Distinguish debit, credit, and prepaid behavior. | High | Medium | Medium | Medium | APPROVED WITH MODIFICATIONS | Approve distinction, but foreground credit-card obligation; debit is usually bank-account access and prepaid depth is not core. |
| CARD-PD-003 | Issuer identity | Identify the issuing bank or finance company. | High | High | Low | Low | APPROVED | Users recognize cards by bank/provider; issuer is needed for statement trust. |
| CARD-PD-004 | Network identity | Identify domestic or international network. | Medium | Low | Medium | Medium | APPROVED WITH MODIFICATIONS | Keep as optional/secondary identity; network infrastructure should not dominate household experience. |
| CARD-PD-005 | Cardholder role | Represent primary and supplementary-cardholder responsibility. | Medium | Medium | Medium | High | APPROVED WITH MODIFICATIONS | Approve responsibility awareness, but avoid legal complexity until household usage is validated. |
| CARD-PD-006 | Card status | Represent active, blocked, expired, replaced, closed, or archived card status. | Medium | Medium | Medium | Medium | APPROVED WITH MODIFICATIONS | Approve lightweight status for clarity; full lifecycle state machine is too heavy. |
| CARD-PD-007 | Credit limit | Track credit limit for credit cards. | High | High | Low | High | APPROVED | Users naturally understand limit, but it must never be treated as available money. |
| CARD-PD-008 | Available credit | Track remaining credit capacity. | High | Medium | Medium | High | APPROVED WITH MODIFICATIONS | Useful for avoiding declines; must be framed as borrowing capacity, not cash. |
| CARD-PD-009 | Statement date | Track credit-card statement date. | High | High | Low | Medium | APPROVED | Validated as central to bill timing and household planning. |
| CARD-PD-010 | Due date | Track payment due date. | High | High | Low | Medium | APPROVED | Strongly validated by missed-payment anxiety and cash-flow planning. |
| CARD-PD-011 | Statement balance | Track amount shown for a billing period. | High | High | Medium | High | APPROVED | Needed to know what the household should repay for the statement. |
| CARD-PD-012 | Paid amount | Track amount already paid against a statement. | High | High | Medium | High | APPROVED | Required for repayment clarity and partner trust. |
| CARD-PD-013 | Remaining due amount | Track remaining amount due after payments. | High | High | Medium | High | APPROVED | Directly supports financial safety and due-date awareness. |
| CARD-PD-014 | Billing-period association | Associate card transactions with billing periods. | High | Medium | Medium | Medium | APPROVED | Necessary for statement logic; users need outcome more than mechanics. |
| CARD-PD-015 | Purchase vs repayment separation | Separate card purchase from card repayment. | High | High | Medium | Critical | APPROVED | Protects BR-01 and prevents double-counting expenses. |
| CARD-PD-016 | Refund awareness | Represent card refunds separately from purchases and repayments. | High | High | Medium | High | APPROVED | Validated household confusion; refunds affect trust and due amount. |
| CARD-PD-017 | Fee awareness | Represent card fees as card-specific financial consequences. | High | Medium | Medium | High | APPROVED WITH MODIFICATIONS | Approve broad fee visibility; do not require exhaustive fee taxonomy at first. |
| CARD-PD-018 | Interest awareness | Represent credit-card interest as distinct from purchase principal. | High | Medium | Medium | High | APPROVED WITH MODIFICATIONS | Financially important, but detailed formulas are over-complex without provider truth. |
| CARD-PD-019 | Reward / cashback awareness | Represent cashback or statement credits. | Medium | Medium | Medium | Medium | APPROVED WITH MODIFICATIONS | Approve simple cashback/credit awareness; defer points/miles optimization. |
| CARD-PD-020 | Authorization / pending concepts | Separate authorization, pending, and posted transaction concepts. | Medium later | Medium later | High | High | DEFERRED | Real but too complex for core manual household tracking without provider feeds. |
| CARD-PD-021 | Supplementary-card spending | Track supplementary-card spending separately from primary-card spending. | Medium later | Medium later | High | High | DEFERRED | Needs validation of prevalence and privacy expectations. |
| CARD-PD-022 | Card repayment source | Support card repayment from a real money account to card obligation. | High | High | Medium | Critical | APPROVED | Required to show where money left and to preserve Real Ledger clarity. |
| CARD-PD-023 | Card history preservation | Preserve history after expiry, replacement, closure, or archive. | High | Medium | Medium | Medium | APPROVED | Financial history must remain available after card lifecycle changes. |
| CARD-PD-024 | Annual / late / cash-advance / FX / installment fee detail | Track specific issuer charge types. | Medium later | Medium later | High | High | DEFERRED | Real but provider-specific; broad fee awareness is enough before evidence supports detail. |
| CARD-PD-025 | Points, miles, vouchers | Track non-cash reward programs. | Low now | Low now | High | Medium | DEFERRED | Low safety value and high manual burden for target households. |
| CARD-PD-026 | Card-purchase installments | Track installments created from card purchases. | High | High | High | High | APPROVED WITH MODIFICATIONS | Approve card-origin visibility and future obligation awareness; avoid duplicating Loans. |
| CARD-PD-027 | Disputes / chargebacks | Track disputes, chargebacks, and provisional credits. | Medium later | Medium later | High | High | DEFERRED | Important recovery path, but rare and provider-specific for MVP. |
| CARD-PD-028 | Statement imports / uploads | Track provider statements or user-uploaded statements. | Medium later | Medium later | High | Medium | DEFERRED | Useful for trust later; adds document and reconciliation burden now. |
| CARD-PD-029 | Tokenized card / card-on-file identity | Track wallet tokens or online stored cards. | Medium later | Medium later | High | Medium | DEFERRED | Future-relevant for subscriptions, but not core card obligation clarity. |
| CARD-PD-030 | Replacement and masked identity | Track replacement cards and masked credential changes. | Medium later | Medium later | High | Medium | DEFERRED | Real lifecycle need, but low frequency for initial scope. |
| CARD-PD-031 | Full / partial / minimum payment behavior | Track repayment pattern type. | High | High | Medium | High | APPROVED WITH MODIFICATIONS | Approve full and partial repayment awareness; minimum-payment depth needs issuer validation. |
| CARD-PD-032 | Autopay behavior | Track or rely on automatic card payment. | Medium convenience | Medium | High | Critical | DEFERRED | Automation and posting reliability need validation; financial safety comes first. |
| CARD-PD-033 | Provider-verified card feeds | Import card data from issuer/provider. | High later | High later | High | High | DEFERRED | Valuable but premature due to availability, consent, trust, and reliability. |
| CARD-PD-034 | Statement parsing and reconciliation | Parse statements and reconcile household records. | High later | High later | High | High | DEFERRED | Useful after core model stabilizes; too much automation now. |
| CARD-PD-035 | Fraud / unusual-spend detection | Detect suspicious card activity. | Medium later | High in crisis | High | High | DEFERRED | Important but risk-sensitive and provider-dependent. |
| CARD-PD-036 | Subscription visibility | Identify card-on-file subscriptions. | Medium later | High later | High | Medium | DEFERRED | Strong future need, but requires reliable transaction patterns or provider data. |
| CARD-PD-037 | Multi-currency card cost analysis | Analyze original currency, settlement currency, FX, and markup. | Medium later | Medium later | High | High | DEFERRED | Real for travel/e-commerce; not Vietnam-first household core. |
| CARD-PD-038 | Credit-health analysis | Let Health read card utilization and repayment behavior. | High | Medium | Medium | High | APPROVED WITH MODIFICATIONS | Approve read-only Health interpretation only; Health must not mutate card state. |
| CARD-PD-039 | Reward optimization analysis | Recommend best card or reward strategy. | Low now | Low now | High | High | DEFERRED | Optimization can encourage overspending and is outside safety-first scope. |
| CARD-PD-040 | Household card-use policies | Track partner/dependent card-use controls or rules. | Medium later | Medium later | High | High | DEFERRED | Future family need, but risks surveillance and complexity before trust research. |
| CARD-PD-041 | Country-specific card rule packs | Support country-specific card regulations and terminology. | Medium later | Medium later | High | Medium | DEFERRED | Vietnam-first is enough now; international depth comes later. |
| CARD-PD-042 | Treat credit-card outstanding as cash balance | Include available credit in real money totals. | Low | Low | Medium | Critical | REJECTED | Violates BR-01 and creates dangerous affordability misunderstanding. |
| CARD-PD-043 | Treat revolving card debt as Loan | Move card balances into Loans by default. | Low | Low | Medium | Critical | REJECTED | Confuses revolving credit-card behavior with scheduled loan obligations. |
| CARD-PD-044 | Let Health change card state | Allow Health to create repayments, close cards, or alter balances. | Low | Low | High | Critical | REJECTED | Violates BR-24; Health is read-only. |
| CARD-PD-045 | Automatic repayment execution | Let Cards initiate real card payments automatically. | Medium convenience | Medium | High | Critical | REJECTED | Conflicts with financial safety over convenience and no unnecessary automation. |

## Summary

- APPROVED: 13.
- APPROVED WITH MODIFICATIONS: 11.
- DEFERRED: 17.
- REJECTED: 4.
