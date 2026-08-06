# Executive Summary

Savings exists to preserve household surplus, earn low-risk yield, and create time separation between daily spending money and protected future money. In ViNha, Savings must be modeled as a real financial product, not as a goal, jar, category, or wish. The household may intend savings for an emergency fund, education, travel, housing, or retirement, but the savings product itself is a real-world contract with a provider.

The core discovery finding is that Savings has two truths that must never be collapsed:

1. Real money truth: cash leaves or enters real accounts and must be reflected by the Real Ledger.
2. Product contract truth: provider, principal, rate, term, maturity, settlement rule, early withdrawal rule, tax treatment, ownership, and insurance coverage describe how the savings product behaves.

The domain is valid for a 5-to-10-year model if it treats savings as a contract lifecycle. The lifecycle must include funding, active holding, accrual or estimate, maturity decision, settlement, renewal, early withdrawal, cancellation/failure handling, closure, and archival. Maturity must remain a household decision routed through Inbox under BR-10; no saved preference should silently move real money unless the governing SoT explicitly evolves.

Vietnam-specific findings matter. Savings deposits under Circular 48 are a regulated deposit form; term deposits under Circular 49 have adjacent behavior and can include eligible foreign individuals. Deposit insurance is limited per depositor per insured institution, currently VND 125 million including principal and interest under Decision 32/2021/QD-TTg, based on Deposit Insurance of Vietnam public guidance. Interest from deposits with banks and credit institutions is currently non-taxable income for individuals per PwC Vietnam tax summary, last reviewed March 9, 2026.

The current implementation has a strong direction: Savings is ledger-owned, separated from Plan and Health, and has providers, packages, cycles, maturity Inbox events, settlement, renewal, and early withdrawal records. The main business gaps are around legal ownership, provider-confirmed settlement truth, deposit insurance exposure, currency/residency eligibility, pledge/collateral behavior, tax adaptability, and contract event evidence. The biggest accounting risk is allowing estimated interest or previewed penalties to become posted truth before provider confirmation.

Verdict: proceed to later design/implementation only after accepting this domain model as a real financial product lifecycle. Do not implement new Savings evolution directly from the current code shape; use this discovery pack to drive a separate business design phase.

