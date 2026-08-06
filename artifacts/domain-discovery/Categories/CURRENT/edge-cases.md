# Edge Cases

## Classification Edge Cases

- Transaction has no category.
- Transaction has the wrong category.
- User selects a broad category because no precise category exists.
- User creates two categories with the same meaning.
- Category name is unclear to the other partner.
- Category meaning changes over time.
- Category is archived but still appears in historical transactions.
- Category is renamed and old reports become harder to interpret.
- Income category is used for an expense or vice versa.

## Mixed-Purpose Spending

- Supermarket receipt includes groceries, home supplies, medicine, and baby products.
- E-commerce order includes multiple household purposes.
- Ride-hailing app includes transport, delivery, food, and subscription services.
- Family trip includes transport, lodging, dining, gifts, and entertainment.
- Cash withdrawal funds multiple future expenses.

## Payment And Provider Edge Cases

- Bank descriptor is cryptic.
- Wallet merchant name is an intermediary instead of the real merchant.
- VietQR transfer note is missing or informal.
- Card MCC does not match actual purchase purpose.
- Merchant changes processor and appears under a new name.
- Same merchant appears differently across bank, wallet, and card records.
- Imported provider category conflicts with household category.

## Household Edge Cases

- One partner categorizes privately meaningful spending differently.
- A transaction is a reimbursement, not income.
- A family transfer is support, gift, loan, shared bill, or repayment.
- Work expense is reimbursable.
- Business and household spending are mixed.
- A child, parent, or relative creates a new category pressure.
- Tet, wedding, funeral, or medical support does not fit standard categories.

## Financial Event Edge Cases

- Refund should relate to original expense rather than normal income.
- Correction changes category after the original transaction was reviewed.
- Chargeback or dispute reverses a classified transaction.
- Subscription changes merchant label or purpose.
- Fee, shipping, discount, cashback, or voucher affects category interpretation.
- Loan repayment is confused with the consumption category of the financed purchase.
- Transfer between owned accounts is categorized as income or expense.
- Savings contribution is confused with spending.

## Data Quality Edge Cases

- Missing merchant.
- Missing date context.
- Missing receipt.
- Duplicate transaction from manual and imported sources.
- Historical transaction references a deleted or inactive category.
- Category list is too long to choose confidently.
- Category list is too short to preserve important meaning.
- External language, abbreviation, or Vietnamese accent variants cause duplicates.
