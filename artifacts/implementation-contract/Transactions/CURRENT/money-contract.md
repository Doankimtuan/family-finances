# Money Contract

## Money Behavior By Action

| Action | Money source | Money destination | Ledger writes | Planning updates | Read-only updates | No-op situations |
|--------|--------------|-------------------|---------------|------------------|-------------------|------------------|
| Record Income | External person, employer, provider, or other source | Household account | Create income real-ledger fact | None automatically; optional virtual reference only | Health/Goals/Together may read later | Invalid account, invalid amount, no permission, not real money |
| Record Expense | Household account | Merchant, person, provider, or outside party | Create expense real-ledger fact | None automatically; optional virtual reference only | Health/Goals/Together may read later | Invalid account, invalid amount, no permission, virtual-only movement |
| Record Owned-Account Transfer | Household source account | Household destination account | Create neutral transfer real-ledger fact | None | Health/Goals/Together may read later | Source/destination not both owned and active, same account, invalid amount |
| Add/Change Meaning | None | None | No financial ledger write | Category/jar reference may change virtual interpretation only | Consumers read updated meaning | Meaning violates BR-01 or invalid category/reference |
| Send To Review | None | None | No money write | None | Inbox may receive review work | Duplicate active review or no transaction fact |
| Resolve Review | None | None | No money write unless routed to correction/refund/reversal action | Meaning/reference may be clarified | Consumers read resolved meaning | Resolution violates boundaries |
| Search/Filter | None | None | None | None | Read-only retrieval | No permission or no matches |
| Record Refund | Merchant/provider/person or source of returned money | Household account | Create returned-money real-ledger fact and link when possible | None automatically | Consumers read refund-linked history | Invalid refund, invalid original relation, invalid account |
| Correct Transaction | Depends on correction facts | Depends on correction facts | Audit-safe correction relationship; no silent overwrite | None automatically | Consumers read corrected story | Correction not explainable or invalid |
| Reverse Transaction | Depends on original transaction direction | Depends on reversal context | Audit-safe reversal relationship; no deletion | None automatically | Consumers read reversed story | Invalid reversal or already terminal active meaning |
| Lightweight Reconciliation | None | None | None directly | None | Confidence/read-only comparison only | No discrepancy, no reference, no permission |
| Archive As Historical | None | None | No money write | None | Remains read-visible | Active unresolved work remains |

## BR-01 Contract

- Planning updates never move real money.
- Jar references never create ledger money movement.
- Category changes never alter amount, account, date, currency, or direction.
- Inbox acknowledgment never moves money.
- Health reads transaction facts only.

## Ambiguity Rules

- If money source is unknown but money movement is real, the transaction can be Recorded only with Needs Review.
- If destination account is unknown, the transaction cannot become ordinary Recorded/Resolved.
- If transfer ownership is unclear, it must not be counted as income or expense by default.
- If refund original is unknown, returned money remains Needs Review.
