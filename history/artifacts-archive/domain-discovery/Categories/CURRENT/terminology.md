# Terminology

## Preferred Terms

| Term | Business definition |
| --- | --- |
| Category | A household classification label applied to a transaction. |
| Categorize | Assign a category to a transaction. |
| Transaction category | The category currently attached to a transaction. |
| Income category | A category used to classify money entering the household. |
| Expense category | A category used to classify money leaving the household. |
| Uncategorized | A transaction with no category assigned. |
| Category meaning | The household's shared understanding of what the category represents. |
| Provider category | A category or hint supplied by a bank, card network, wallet, or third party. |
| Merchant category | A provider classification of merchant business type, not necessarily household purpose. |
| Category mapping | A relationship between category meaning and another domain's interpretation, such as planning. |

## Acceptable Synonyms

| Synonym | Use |
| --- | --- |
| Tag | Acceptable technical synonym when referring to lightweight labels. |
| Label | Acceptable plain-language synonym, but Category is preferred. |
| Purpose | Useful when explaining why a transaction happened. |
| Classification | Useful for formal domain language. |

## Forbidden Synonyms

| Forbidden term | Reason |
| --- | --- |
| Category balance | Categories do not hold money. |
| Category budget | Ambiguous; spending limits belong to planning or jars. |
| Category jar | Confuses classification with virtual planning container. |
| Spending account | Confuses category with account. |
| Payment category | Confuses payment rail with transaction purpose. |
| MCC category as household category | MCC is merchant classification, not household meaning. |
| Auto-approved category truth | External or inferred category hints are not final household truth. |

## Business Definitions

- A category is reusable.
- A category belongs to household meaning, not provider truth.
- A category can classify income or expense.
- A category can support analysis and planning interpretation.
- A category does not mutate the underlying transaction fact.
- A category should be stable enough for comparison across time.

## Terminology Notes

- Use "category" for household meaning.
- Use "provider category" when the source is external.
- Use "merchant category" or "MCC" only for payment-network or merchant-type classification.
- Use "jar" only for virtual planning capacity, not category meaning.
