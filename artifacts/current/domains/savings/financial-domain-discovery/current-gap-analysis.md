# Current Implementation Review

This review identifies business and architecture gaps only. It does not prescribe implementation.

## Evidence of Current Strengths

- The architecture classifies `savings` as a ledger-owned application module rather than a peer bounded context, and states that money truth remains ledger accounts and transactions. The current implementation contract and module boundaries are the surviving references.
- The architecture forbids Savings from importing Inbox, Plan, or Health, and says Inbox/app orchestrate maturity and early-withdrawal decisions after typed acknowledgment. The current implementation contract and module boundaries are the surviving references.
- Current constants include product statuses, cycle statuses, product types, interest methods, settlement rules, renewal policies, recommendation codes, maturity warnings, cascade days, and penalty strategies. Evidence: `modules/savings/application/savings-constants.ts:5`, `modules/savings/application/savings-constants.ts:21`, `modules/savings/application/savings-constants.ts:37`, `modules/savings/application/savings-constants.ts:53`, `modules/savings/application/savings-constants.ts:68`, `modules/savings/application/savings-constants.ts:98`, `modules/savings/application/savings-constants.ts:183`, `modules/savings/application/savings-constants.ts:198`, `modules/savings/application/savings-constants.ts:204`.
- Current creation flow validates funding and settlement account existence, rejects credit cards as funding accounts, resolves a provider package, creates a product snapshot, and delegates atomic transfer to a server-side function. Evidence: `modules/savings/application/commands/create-saving.ts:86`, `modules/savings/application/commands/create-saving.ts:97`, `modules/savings/application/commands/create-saving.ts:155`, `modules/savings/application/commands/create-saving.ts:167`, `modules/savings/application/commands/create-saving.ts:183`.
- Current storage model includes providers, packages, savings aggregate, cycles, and early withdrawal audit records. Evidence: `supabase/migrations/20260805010000_savings_domain_evolution.sql:28`, `supabase/migrations/20260805010000_savings_domain_evolution.sql:50`, `supabase/migrations/20260805010000_savings_domain_evolution.sql:88`, `supabase/migrations/20260805010000_savings_domain_evolution.sql:115`, `supabase/migrations/20260805010000_savings_domain_evolution.sql:148`.
- Current maturity detection creates Inbox context and moves active cycles to matured. Evidence: `supabase/migrations/20260805020000_savings_settle_renew_early_withdraw.sql:73`, `supabase/migrations/20260805020000_savings_settle_renew_early_withdraw.sql:123`, `supabase/migrations/20260805020000_savings_settle_renew_early_withdraw.sql:143`.
- Current Inbox acknowledgment does not itself settle money and cancels sibling cascade reminders. Evidence: `supabase/migrations/20260805020000_savings_settle_renew_early_withdraw.sql:378`, `supabase/migrations/20260805020000_savings_settle_renew_early_withdraw.sql:402`.

## Business Gaps

- Legal depositor is not visible as a first-class product fact in the reviewed types or tables. This is a gap for joint savings, inheritance, eligibility, and household-versus-legal ownership.
- Deposit insurance exposure is not modeled as a product concern. Vietnam's VND 125 million per depositor per insured institution limit means provider concentration is not just analytics; it is a real protection boundary.
- Funding has no explicit FundingPending or Failed lifecycle in the reviewed states. Current states begin at active/matured/early_closed/closed, while real funding can be pending, rejected, reversed, or partially accepted.
- Maturity and settlement rely heavily on internally computed interest. Provider-confirmed final interest and settlement evidence are not clearly separated from computed accrual.
- Currency is partly generalized through household currency in later functions, but initial funding migration hardcodes VND in transaction inserts. Evidence: `supabase/migrations/20260805010000_savings_domain_evolution.sql:388`, `supabase/migrations/20260805010000_savings_domain_evolution.sql:399`.
- Early withdrawal final execution accepts preview amounts as parameters, creating a business risk that a preview becomes settlement truth unless reconciled with provider confirmation. Evidence: `supabase/migrations/20260805020000_savings_settle_renew_early_withdraw.sql:788`.
- Provider formula penalties are represented as executable expressions in application code. This is flexible, but as a business model it blurs contract rules, calculation authority, and security posture. Evidence: `modules/savings/application/savings-penalty.ts:115`, `modules/savings/application/savings-penalty.ts:136`.
- Partial withdrawal is not visible in current canonical statuses or reviewed settlement actions.
- Pledge/collateral, legal freeze, lost savings book/card, death/incapacity, and account dispute are absent from current visible lifecycle concepts.
- Tax treatment is not represented as jurisdiction/effective-date metadata.
- Savings-like fintech products are typed, but the distinction between regulated bank deposit, pass-through deposit, e-wallet pocket, and investment-like cash product is not yet strong enough for 5-to-10-year correctness.

## Lifecycle Gaps

- Missing Draft.
- Missing FundingPending.
- Missing FundingFailed.
- Missing SettlementPending.
- Missing SettlementFailed.
- Missing PartiallyWithdrawn.
- Missing Frozen/Restricted.
- Missing ProviderResolution or BankFailure.
- Missing Archived as a separate historical state.

## Capability Gaps

- Legal ownership.
- Eligibility/residency.
- Deposit insurance exposure.
- Provider statement reconciliation.
- Confirmed versus estimated interest.
- Partial withdrawal.
- Contract evidence.
- Collateral/pledge status.
- Multi-currency and FX valuation.
- Tax rule metadata.
- Exceptional provider events.

## Weak Assumptions

- Simple interest actual/365 is a reasonable default for some Vietnam deposit products, but not universal for all savings-like products. Evidence: `supabase/migrations/20260805020000_savings_settle_renew_early_withdraw.sql:29`.
- Product package data appears manually configured; stale provider catalog data can produce misleading maturity recommendations.
- The recommendation engine scores rates and duration but does not consider deposit insurance, provider risk, tax, liquidity needs, or household emergency status. Evidence: `modules/savings/application/savings-recommendation.ts:59`, `modules/savings/application/savings-recommendation.ts:75`.

## Over-Engineering Candidates

- Provider formula execution may be too powerful for a household finance domain unless tightly constrained by a trusted provider rules registry.
- Renewal policies include auto-renew naming, while business posture says preferences should not silently execute real ledger movement under BR-10.

## Under-Engineering Candidates

- Product legal ownership.
- Reconciliation and provider confirmation.
- Failed and pending money movement states.
- Insurance and concentration.
- Exceptional legal/provider states.
