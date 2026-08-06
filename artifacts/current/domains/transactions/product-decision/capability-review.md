# Capability Review

## Decision Matrix

| ID | Capability | Description | Business value | User value | Complexity | Risk | Decision | Reasoning |
|----|------------|-------------|----------------|------------|------------|------|----------|-----------|
| TX-PD-001 | Record real money movement | Capture factual money events. | High | High | Low | Low | APPROVED | Core validated need: households ask what happened to money. |
| TX-PD-002 | Income and expense distinction | Distinguish money entering versus leaving. | High | High | Low | Low | APPROVED | Natural household language and essential financial clarity. |
| TX-PD-003 | Preserve amount, currency, date, account, direction | Keep factual transaction anchors. | High | High | Low | Medium | APPROVED | Required for trust and reconciliation; errors must be visible, not hidden. |
| TX-PD-004 | Chronological activity | Show transaction history over time. | High | High | Low | Low | APPROVED | Matches bank, wallet, and household memory patterns. |
| TX-PD-005 | Link to real account/container | Every transaction belongs to where money moved. | High | High | Low | Low | APPROVED | Protects "where money is" and keeps ledger factual. |
| TX-PD-006 | Household note or description | Capture plain-language memory cue. | Medium | High | Low | Low | APPROVED | Validated by users remembering context more than formal labels. |
| TX-PD-007 | Categorize by household meaning | Assign purpose/meaning to a transaction. | High | High | Medium | Medium | APPROVED WITH MODIFICATIONS | Keep category as meaning, not real-money mutation or planning allocation. |
| TX-PD-008 | Review unresolved activity | Surface unclear transactions for later household review. | High | High | Medium | Medium | APPROVED | Matches real behavior: households defer unclear items and discuss later. |
| TX-PD-009 | Search and filtering | Find transactions by remembered clues. | High | High | Medium | Low | APPROVED | Necessary for "where did it go?" and already validated as common expectation. |
| TX-PD-010 | Refund, reversal, correction audit concepts | Represent after-the-fact clarification without erasing truth. | High | High | Medium | High | APPROVED WITH MODIFICATIONS | Approve audit principle; language must stay household-understandable and avoid silent rewriting. |
| TX-PD-011 | Evidence for account balance changes | Let transactions explain balance movement. | High | High | Low | Low | APPROVED | Accounts need transaction evidence to be trusted. |
| TX-PD-012 | Feed Plan, Inbox, Health as factual input | Allow other domains to consume transaction facts. | High | High | Medium | High | APPROVED WITH MODIFICATIONS | Other domains may read/use facts, but Health remains read-only and Plan remains virtual. |
| TX-PD-013 | Transfer representation between owned accounts | Distinguish neutral owned-account movement from income/expense. | High | High | Medium | High | APPROVED WITH MODIFICATIONS | Financially important; must remain real-ledger only and not imply spending or planning movement. |
| TX-PD-014 | Pending versus posted distinction | Reflect provider lifecycle uncertainty. | Medium | Medium | High | Medium | DEFERRED | Real but provider-dependent and terminology-heavy; not required before core history trust. |
| TX-PD-015 | Merchant normalization | Make cryptic merchant descriptions recognizable. | Medium | High | High | Medium | DEFERRED | Valuable later; needs Vietnam provider/merchant research and enrichment reliability. |
| TX-PD-016 | Receipt attachment | Link receipt/photo/document evidence to transaction. | Low now | Medium | Medium | Medium | DEFERRED | Useful for disputes and memory, but document burden is not core simple-first scope. |
| TX-PD-017 | Split categorization | Assign one purchase across multiple meanings. | Medium | Medium | High | Medium | DEFERRED | Real pain for mixed shopping, but early complexity may exceed household tolerance. |
| TX-PD-018 | Duplicate detection | Identify repeated manual/import records. | Medium later | Medium later | High | Medium | DEFERRED | Depends on imports and higher transaction volume; current idempotent capture covers narrower risk. |
| TX-PD-019 | Recurring pattern detection | Notice repeated transactions. | Medium later | Medium later | High | Medium | DEFERRED | Useful observation, but recurring rules and reminders belong outside core transaction truth. |
| TX-PD-020 | Statement reconciliation | Compare product records with bank/wallet/card/cash reality. | High later | High later | High | Medium | APPROVED WITH MODIFICATIONS | Approve lightweight responsibility for confidence; defer heavy reconciliation workflows. |
| TX-PD-021 | Provider import | Bring transactions from bank, wallet, or card sources. | High later | High later | High | High | DEFERRED | Vietnam connectivity, consent, reliability, and duplicate risks need research. |
| TX-PD-022 | Cash reconciliation | Clarify cash withdrawal and cash spending gaps. | Medium | Medium | High | Medium | DEFERRED | Cash leakage is real, but formal reconciliation may be too heavy before behavior evidence. |
| TX-PD-023 | Foreign currency metadata | Represent non-VND transaction context. | Low now | Low now | High | High | DEFERRED | Vietnam-first scope remains VND-centered; exchange complexity waits for proven need. |
| TX-PD-024 | Fees and discounts as explicit context | Explain fees, promotions, shipping, wallet discounts. | Medium | Medium | Medium | Medium | DEFERRED | Useful context, but risks detail overload before core transaction clarity. |
| TX-PD-025 | Partner comments/explanations | Allow household explanation around transactions. | Medium | Medium | Medium | High | DEFERRED | Real partner behavior, but privacy and blame dynamics need more research. |
| TX-PD-026 | Open Banking/provider-sync enrichment | Use external feeds or enrichment as source evidence. | High later | High later | High | High | DEFERRED | Same provider-risk class as imports; not simple-first or Vietnam-validated enough. |
| TX-PD-027 | Reliable merchant identity | Treat merchants as structured recognizable entities. | Medium later | High later | High | Medium | DEFERRED | Strong future value, but depends on merchant normalization research. |
| TX-PD-028 | Confidence scoring for imported/classified transactions | Show uncertainty in system-provided meaning. | Medium later | Medium later | Medium | Medium | DEFERRED | Valuable only after import/classification maturity exists. |
| TX-PD-029 | Dispute/chargeback/provider correction audit | Track formal dispute and provider correction contexts. | Medium later | Medium later | High | High | DEFERRED | Real edge case but too specialized before refunds/corrections are validated in user language. |
| TX-PD-030 | Household-level review history | Preserve who reviewed or clarified transaction meaning. | Medium later | Medium later | Medium | High | DEFERRED | Useful for trust, but personal/shared sensitivity needs research. |
| TX-PD-031 | International remittance/currency conversion context | Explain cross-border transfers and conversion. | Low now | Low now | High | High | DEFERRED | Future pressure only; outside current Vietnam-first household core. |
| TX-PD-032 | AI-assisted classification | Suggest meaning without changing facts. | Medium later | Medium later | High | High | APPROVED WITH MODIFICATIONS | Approved only as assistive and subordinate to user-understood facts; no autonomous ledger mutation. |

## Summary

- APPROVED: 8.
- APPROVED WITH MODIFICATIONS: 6.
- DEFERRED: 18.
- REJECTED: 0.
- Total reviewed: 32.
