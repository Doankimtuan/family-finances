# Money Journeys

## Overall Assessment

The money journey is coherent because each domain has a clear job: Transactions record what moved, Accounts show where money is, Categories explain meaning, Plan assigns intention, Savings/Loans/Cards/Investments explain product context, Inbox routes decisions, Month Ritual locks reflection, and Health reads the result.

The UX must consistently answer three user questions:

1. Where did money come from?
2. Where did money go?
3. What should we do next?

## Journey Review

| Journey | UX Status | Main Risk | Required UX Emphasis |
|---------|-----------|-----------|----------------------|
| Receive salary | Strong | Auto-allocation may feel invisible | Show salary as real income first, then planned allocation |
| Record expense | Strong | Category/Jar mapping slows capture | Suggest category, let unresolved items go to Inbox |
| Create savings | Moderate | Saving vs Jar vs Goal confusion | Show funding source, product terms, and linked intention separately |
| Renew savings | Strong with Inbox | Renewal may look automatic | Require explicit maturity decision and outcome confirmation |
| Borrow money | Moderate | Loan setup may be intimidating | Start with lender, amount, next due, expected payment |
| Pay installment | Strong | Repayment can look like ordinary expense | Show real payment plus obligation progress |
| Invest money | Moderate | Users may treat investment as cash | Show contribution, estimated value, freshness, and liquidity |
| Reach goal | Strong if restrained | Completion may imply cash moved | Celebrate intention milestone, ask for source evidence if needed |
| Month Close | Strong but heavy | Ritual fatigue | Keep assisted, predictable, and short |
| Health review | Strong with guardrails | Score may feel like judgment | Explain factors and completeness; no commands |

## Recommendations

### PX-MJ-01: Use journey receipts

Problem: Multi-domain actions can feel like magic.

User Impact: Users may not understand what changed after salary, savings funding, repayment, or renewal.

Affected Screens: Transaction Add, Savings Detail, Debt Detail, Cards, Inbox Review Detail, Month Ritual.

Frequency: Daily/Event-based.

Business Impact: High trust impact.

Recommended UX: After important actions, show a small receipt: "Real money changed", "Plan changed", "Decision recorded", or "Health will update after facts refresh".

Implementation Cost: Medium.

Priority: P0.

### PX-MJ-02: Separate action from interpretation

Problem: The product has many interpreted states: planned, expected, due, mature, estimated, complete.

User Impact: Users may mistake expected or estimated values for settled money.

Affected Screens: Savings, Investments, Loans, Goals, Health.

Frequency: Weekly/Event-based.

Business Impact: High safety impact.

Recommended UX: Use state labels near amounts: "Recorded", "Expected", "Estimated", "Due", "Locked", "Completed intention". Avoid amount-only cards for non-cash values.

Implementation Cost: Low.

Priority: P0.

### PX-MJ-03: Add next-best-action slots

Problem: Users may understand the record but not the next step.

User Impact: They leave unresolved maturity, due payment, uncategorized expense, or month close items.

Affected Screens: Home, Money Hub, Savings Detail, Debts, Cards, Plan Hub, Health.

Frequency: Daily/Weekly.

Business Impact: Medium-high.

Recommended UX: Each major screen gets at most one contextual next action, sourced from Inbox or the owning domain.

Implementation Cost: Medium.

Priority: P1.

