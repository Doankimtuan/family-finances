# Product Risks

## Financial Risks

- Category totals may be misunderstood as budgets or available balances.
- Provider categories may be trusted as financial truth.
- Refunds, reimbursements, transfers, savings movements, and loan repayments may be misclassified.
- Mixed purchases may distort category reports.
- Historical category changes may make trend comparisons misleading.

## UX Risks

- Manual categorization can become repetitive.
- Category lists can grow too long.
- Broad categories can hide important meaning.
- Similar labels can fragment reports.
- Category-to-jar mapping may confuse users.
- Partner visibility can create blame or surveillance feelings.

## Maintenance Risks

- Category lifecycle behavior can become complex if rename, archive, restore, merge, split, and provider hints arrive too quickly.
- Provider-based suggestion behavior can create long-term edge cases.
- Local Vietnamese merchant normalization can require ongoing data work.
- Category drift grows with multi-year use.

## Scalability Risks

- Household-specific vocabulary is valuable but harder to standardize across reports, templates, and exports.
- Multi-provider data can introduce incompatible external category labels.
- Future automation can increase support burden if users cannot understand why a category was suggested.

## Education Risks

- Users may need clear distinction between category, jar, account, merchant, and payment method.
- "Other" can hide material spending if users do not understand its effect.
- Suggested category language can create false confidence.

## Risk Controls Implied By Decisions

- Keep Categories label-only.
- Keep category summaries actuals-only.
- Keep provider and merchant labels as evidence, not truth.
- Keep Health read-only.
- Defer automation-heavy and provider-heavy capabilities until research supports them.
