# Capability Review

## Decision Matrix

| ID | Capability | Description | Business value | User value | Complexity | Risk | Decision | Reasoning |
|----|------------|-------------|----------------|------------|------------|------|----------|-----------|
| CAT-PD-001 | Define household category | Create a reusable household classification label. | High | High | Low | Medium | APPROVED | Validated as natural household vocabulary; scope must stay label-only. |
| CAT-PD-002 | Distinguish income and expense categories | Keep income labels separate from expense labels. | High | High | Low | Medium | APPROVED | Prevents salary, refund, transfer, and spending confusion. |
| CAT-PD-003 | Categorize transaction | Assign category meaning to a transaction. | High | High | Low | Medium | APPROVED | Core validated need: users ask what money was for. |
| CAT-PD-004 | Leave uncategorized | Allow unknown meaning to remain explicit. | Medium | High | Low | Low | APPROVED | Preserves uncertainty and avoids false precision. |
| CAT-PD-005 | Correct category assignment | Change wrong category meaning on a transaction. | High | High | Low | Medium | APPROVED | Corrections are common and protect trust in reports. |
| CAT-PD-006 | Filter transaction history by category | View transaction facts through category labels. | High | High | Low | Low | APPROVED | Directly supports "what did we spend on X?" without changing money truth. |
| CAT-PD-007 | Summarize by category purpose | Show spending or income grouped by category. | High | High | Medium | Medium | APPROVED WITH MODIFICATIONS | Approve only as actuals summary; must not imply budget, balance, or available money. |
| CAT-PD-008 | Maintain household-specific vocabulary | Let category meaning belong to the household. | High | High | Medium | Medium | APPROVED | Vietnam household language varies by family, life stage, and obligations. |
| CAT-PD-009 | Preserve historical category meaning | Keep past category interpretation understandable. | High | Medium | Medium | Medium | APPROVED WITH MODIFICATIONS | Needed for long-term trust; scope must be meaning preservation, not heavy audit tooling. |
| CAT-PD-010 | Separate category from account, merchant, payment method, and plan | Keep category as purpose label only. | High | High | Low | Low | APPROVED | Protects BR-01 and user understanding of where money is. |
| CAT-PD-011 | Provide classification evidence to other domains | Let other domains read category meaning as context. | High | Medium | Medium | High | APPROVED WITH MODIFICATIONS | Other domains may consume read-only meaning; Categories must not own their outcomes. |
| CAT-PD-012 | Rename category | Change category wording. | Medium | Medium | Medium | Medium | APPROVED WITH MODIFICATIONS | Valid household need, but must preserve historical comprehension and avoid casual drift. |
| CAT-PD-013 | Archive category | Stop a category from future use. | Medium | Medium | Medium | Medium | APPROVED WITH MODIFICATIONS | Valid cleanup need; archived meaning must remain interpretable for old transactions. |
| CAT-PD-014 | Restore category | Re-enable an archived category. | Low | Medium | Medium | Low | APPROVED WITH MODIFICATIONS | Valid recovery path; scope should remain simple and subordinate to archive semantics. |
| CAT-PD-015 | Merge category meaning | Combine duplicate or overlapping categories. | Medium | Medium | High | High | DEFERRED | Real issue, but historical-report effects and user comprehension need research. |
| CAT-PD-016 | Split mixed transaction across categories | Classify one transaction into multiple purposes. | Medium | Medium | High | High | DEFERRED | Real supermarket/e-commerce pain, but high complexity and unclear household tolerance. |
| CAT-PD-017 | Category visual identity | Add icon or color identity to categories. | Low | Medium | Medium | Low | DEFERRED | Helpful scan aid but not necessary before vocabulary correctness. |
| CAT-PD-018 | Use merchant or provider hints for suggested categorization | Surface external or inferred category hints. | Medium | High | High | High | APPROVED WITH MODIFICATIONS | Valid only as explicit suggestion with user understanding; no auto-commit or provider-truth assumption. |
| CAT-PD-019 | Detect duplicate or near-duplicate categories | Identify overlapping labels. | Medium | Medium | High | Medium | DEFERRED | Useful after real category growth; premature before observed household vocabularies. |
| CAT-PD-020 | Track confidence for inferred labels | Represent uncertainty in suggested category. | Medium later | Medium later | Medium | Medium | DEFERRED | Depends on suggestion/import maturity; not needed for manual-first core. |
| CAT-PD-021 | Category-specific notes or explanations | Attach notes directly to category definitions. | Low | Low | Medium | Medium | REJECTED | Duplicates transaction notes and risks turning Categories into a discussion or policy surface. |
| CAT-PD-022 | Merchant-to-category learning | Remember merchant classification patterns. | Medium later | High later | High | High | DEFERRED | Valuable but automation-sensitive; needs provider, merchant, and override research. |
| CAT-PD-023 | Vietnamese merchant normalization | Clean local merchant descriptors for classification. | Medium later | High later | High | Medium | DEFERRED | Real Vietnam issue, but belongs after provider descriptor research. |
| CAT-PD-024 | Receipt-line or item-level classification | Classify individual items inside a purchase. | Low now | Medium later | High | High | DEFERRED | Useful for mixed purchases but too heavy for simple-first household use. |
| CAT-PD-025 | Household category templates by life stage | Provide preset vocabularies for marriage, children, home, or vehicle. | Medium later | Medium later | Medium | Medium | DEFERRED | Needs Vietnamese card-sorting and life-stage research before product commitment. |
| CAT-PD-026 | Cross-provider category reconciliation | Compare and resolve provider category differences. | Medium later | Medium later | High | High | DEFERRED | Provider-dependent and premature without import ecosystem maturity. |
| CAT-PD-027 | Longitudinal category drift detection | Identify category meaning changes over years. | Low now | Medium later | High | Medium | DEFERRED | Real long-term concern but not required before category usage matures. |
| CAT-PD-028 | Category portability for export or adviser review | Preserve category meaning outside ViNha. | Low now | Low now | Medium | Low | DEFERRED | Useful future context, not validated for young-household core. |
| CAT-PD-029 | International or multi-currency category context | Support category interpretation across travel or foreign-currency activity. | Low now | Low now | High | Medium | DEFERRED | Vietnam-first VND household scope; future only. |
| CAT-PD-030 | Shared partner category meaning review | Ensure partners can understand and question category meaning. | High | High | Medium | High | APPROVED WITH MODIFICATIONS | Shared language is validated; avoid turning categories into blame, approval, or surveillance workflow. |
| CAT-PD-031 | Category holds money | Treat categories as money containers. | Low | Low | High | High | REJECTED | Violates BR-01 and directly confuses categories with accounts or jars. |
| CAT-PD-032 | Category available balance | Show spendable money per category. | Low | Low | High | High | REJECTED | Violates real-versus-virtual clarity; balances belong to Accounts and planning capacity belongs to Jars. |
| CAT-PD-033 | Category executes payments | Let categories initiate or settle payment. | Low | Low | High | High | REJECTED | Payment execution belongs outside Categories and creates financial-safety risk. |
| CAT-PD-034 | Category enforces spending cap | Use category as the spending limit owner. | Low | Medium | High | High | REJECTED | Limits belong to Planning/Jars; category caps recreate budget-category confusion. |
| CAT-PD-035 | Category replaces jar or budget | Make categories the primary planning container. | Low | Low | High | High | REJECTED | Conflicts with ViNha's Household Money OS model and BR-01. |
| CAT-PD-036 | Category certifies provider truth | Treat provider category as authoritative financial truth. | Low | Low | Medium | High | REJECTED | Provider classifications are evidence, not household meaning or certified truth. |
| CAT-PD-037 | Category decides household intent autonomously | Let system/category infer final household intent without user context. | Low | Low | High | High | REJECTED | Violates financial safety and "no unnecessary automation"; household meaning needs user-understood control. |

## Summary

- APPROVED: 8.
- APPROVED WITH MODIFICATIONS: 8.
- DEFERRED: 13.
- REJECTED: 8.
- Total reviewed: 37.
