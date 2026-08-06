# Real-World Analysis

## Vietnam Context

In Vietnam, household categories are shaped by mixed payment behavior. Young families may pay by bank transfer, VietQR, cash, e-wallet, debit card, credit card, installment offer, or family reimbursement. The payment rail often gives incomplete category evidence.

Vietnam household spending commonly clusters around:

- Food and groceries.
- Eating out, coffee, delivery, and convenience stores.
- Rent, mortgage-related housing costs, utilities, and maintenance.
- Transport, fuel, ride-hailing, parking, and vehicle maintenance.
- Health care, pharmacy, insurance, and baby care.
- Education, childcare, books, courses, and tutoring.
- Family support, gifts, weddings, funerals, and Tet.
- Shopping, clothing, electronics, home goods, and online marketplaces.
- Communications, subscriptions, entertainment, and travel.
- Savings, investments, loan repayment, and transfers, which require careful separation from consumption categories.

The National Statistics Office of Vietnam's 2024 living standards material treats expenditure, income, education, health, housing, utilities, and durable goods as important household living-standard areas. International statistical practice also uses purpose-based household consumption groupings such as food, housing, health, transport, communication, recreation, education, restaurants, and miscellaneous goods and services.

## Common Practices

- People describe spending in everyday language rather than formal accounting labels.
- Bank and wallet notifications are often used as memory aids.
- Many purchases are categorized after the fact during review, not at payment time.
- Cash spending is often reconstructed from memory.
- Marketplace and supermarket purchases often contain multiple purposes in one receipt.
- Partner transfers, reimbursements, and shared payments can blur whether an event is income, expense, or transfer.
- Family obligations are often treated as their own mental category even when formal taxonomies group them elsewhere.

## Real-World Variations

- Some households use broad categories, such as Food, Home, Transport, and Health.
- Some use life-stage categories, such as Baby, School, Parents, Wedding, or Tet.
- Some track by merchant, such as Grab, Shopee, Bach Hoa Xanh, or pharmacy.
- Some track by payment source, such as cash, card, MoMo, or bank app, although payment source is not the same as category.
- Some split food into groceries, dining, coffee, and delivery.
- Some combine all discretionary spending into a flexible category.
- Some track business-like or side-income expenses separately from household expenses.

## Terminology In Reality

- Category: a label describing the purpose of a money event.
- Tag: a lightweight label; often used in apps.
- Merchant category: a provider or card-network classification of the merchant.
- MCC: merchant category code used by card networks to classify merchant business type.
- Budget category: common in budgeting apps, but ambiguous because it may combine classification and spending limits.
- Expense type: informal language for category.
- Purpose: the household reason behind a transaction.

## Industry Standards And External Classifications

- COICOP is an international reference classification for household consumption expenditure by purpose.
- MCC / ISO 18245 classifies merchants for payment-card contexts. It is merchant-based, not receipt-line-based.
- Banks and fintech providers may infer categories from merchant names, transfer descriptions, MCC, billers, or user rules.
- Provider categories can be wrong when a merchant sells multiple goods, uses a generic payment processor, or has an unclear bank descriptor.

## Important Concepts

- Household category and provider category are different concepts.
- Merchant category and purchase purpose can differ.
- One transaction can contain multiple real-world purposes.
- Category confidence matters when classification is inferred.
- Classification should preserve the transaction fact rather than rewrite it.
- Stable category vocabulary becomes more valuable over time because it makes trend comparisons possible.

## International Differences That Affect Product Design

- International card markets often expose richer merchant-category data than local cash, transfer, and wallet contexts.
- Countries with mature open-banking feeds may have more reliable imported categorization.
- Vietnam-first usage must account for cash, bank transfer descriptions, VietQR, e-wallets, family obligations, and informal reimbursements.

## Reference Signals

- National Statistics Office of Vietnam, "Results of the Viet Nam Household Living Standards Survey 2024."
- United Nations COICOP 2018 household expenditure classification.
- ISO 18245 merchant category code standard.
- NAPAS / VietQR public material on Vietnam QR payment infrastructure.
