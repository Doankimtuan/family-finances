---
name: vinhna-financial-integrity
description: Audit ViNha financial correctness for balances, assets, investments, savings, loans, or household net worth. Use for independent calculations and reconciliation, not general UI review or feature implementation.
---

# ViNha financial integrity

Apply [audit operating rules](../../audits/OPERATING.md). Use browser-observed
inputs and persisted outputs; inspect only the relevant accounting policy and
calculation code to explain discrepancies. Code is not the expected-value oracle.

1. Record opening balances, transaction dates/timezone, ownership, currencies,
   valuation timestamp, and the declared policy for the scenario. Isolate effects
   from earlier synthetic journeys using the manifest.
2. Independently calculate expected values using integer VND (`BigInt` or Python
   integers) and exact decimal/rational arithmetic for prices, quantities, rates,
   and interest. Parse decimal strings without a floating-point intermediate.
   Apply rounding only at documented boundaries; show the rounding rule.
3. Reconcile closing cash = opening cash + income − expenses + inbound transfers
   − outbound transfers. Internal household transfers cancel at household level;
   account for fees separately. Verify loan principal, interest, and repayments
   according to their distinct effects on cash, liabilities, and expense.
4. For investments, reconcile quantity, unit price, fees, cost basis, realized
   results, and valuation under the documented basis/FX policy. For savings,
   verify principal, maturity, interest, renewal, and early withdrawal rules when
   applicable. Net worth = included assets − liabilities; check cash and holdings
   are not counted again through account or portfolio aggregates.
5. Include relevant zero/boundary, fractional quantity, rounding, reversal, and
   stale-aggregate checks. Reload affected screens; compare valuation timestamps
   before calling a mismatch a defect. Use `vinhna-user-journey` for account flows.
6. Save a reconciliation table: input and policy | expected | actual | difference
   (actual − expected) | browser evidence. Separate raw values from localized
   display rounding. Do not silently accept a tolerance; justify it from policy.

Complete when each tested value reconciles or has a reproducible discrepancy,
the independent calculation and evidence are saved, and double counting/stale
data checks have results. Missing or conflicting policy is POLICY AMBIGUITY;
missing observations are BLOCKED. Neither is a confirmed financial defect or PASS.
