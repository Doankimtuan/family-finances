# Real-World Analysis

## Vietnam Context

Vietnamese households receive financial signals across many channels:

- Bank-account activity from mobile banking apps, SMS, and push notifications.
- VietQR and NAPAS 247 transfers, which make instant interbank transfers common.
- E-wallet activity from providers such as MoMo, ZaloPay, ShopeePay, and similar services.
- Card activity, statement reminders, credit due dates, and installment messages.
- Utility, telecom, school, insurance, rent, and subscription payment reminders.
- Merchant receipts, paper receipts, screenshots, chat messages, and e-invoices.
- Savings maturity notices, interest-credit notices, and renewal offers.

NAPAS describes VietQR as a standardized QR transfer/payment experience across member banks and notes transfer limits for the FastFund 247 VietQR service. NAPAS also describes merchant QR standards as aligned with State Bank of Vietnam / EMVCo basic standards. These facts matter because many household transactions begin as app notifications or screenshots, not formal statement imports.

Vietnam also has broad e-invoice adoption for businesses, and the General Department of Taxation has invested in e-invoice data and risk-management systems. For households, invoices are often read-only evidence rather than an active budgeting object.

Sources consulted:

- NAPAS FastFund 247 with VietQR Code Service: https://en.napas.com.vn/napas-fastfund-247-with-vietqr-code-service
- NAPAS QR Code Payment Service: https://en.napas.com.vn/qr-code-payment-service
- General Department of Taxation e-invoice database article: https://www.gdt.gov.vn/wps/portal/english

## Common Practices

- People check bank and wallet notifications casually throughout the day.
- Receipts are often kept as photos, screenshots, or chat messages.
- Family spending decisions may be discussed in Zalo, Messenger, or face to face.
- Categorization often happens later, especially after salary, large shopping trips, travel, or month end.
- One partner may handle most tracking while the other provides context only when asked.
- Many households rely on bank app history as the "source of truth" and do not maintain a full personal ledger.

## Real-World Variations

| Variation | Description |
| --- | --- |
| Manual household | Uses cash, bank app history, notebooks, spreadsheets, or memory. |
| App-assisted household | Uses budgeting or expense apps but still reviews many items manually. |
| Provider-heavy household | Uses bank, card, wallet, biller, and subscription notifications. |
| Single financial operator | One partner tracks; the other creates context and approvals indirectly. |
| Shared financial operators | Both partners review and decide together or alternately. |
| Informal family support | Parents, siblings, or relatives send/receive money with loose documentation. |

## Terminology

Common real-world language includes:

- Notification.
- Reminder.
- Alert.
- Receipt.
- Bill.
- Due date.
- Statement.
- Confirmation.
- Transfer message.
- Unclear transaction.
- Categorize.
- Review.
- Approve.
- Ignore for now.

Product language should distinguish these from Inbox-specific decisions.

## Industry Patterns

- Personal finance tools often use transaction review or approval flows.
- Productivity systems use inbox processing to collect open loops before deciding.
- Banking apps use alerts and inboxes mostly for information, security, and service messages.
- Accounting tools separate source documents, transaction matching, reconciliation, and approval.

## Important Concepts

- Source event: the external or internal event that caused attention.
- Review item: the unit of household attention.
- Decision state: pending, resolved, dismissed, expired, archived, or similar.
- Evidence: transaction details, receipt, invoice, reminder, or provider message.
- Attribution: who resolved or acknowledged the item.
- Staleness: the item becomes less useful or less accurate as time passes.
- Expiration: some reminders cease to be actionable after a date.

## International Differences That May Affect Product Design

- In markets with mature bank aggregation, Inbox may receive richer transaction feeds automatically.
- In card-heavy markets, pending authorization versus posted transaction states matter more.
- In cash-heavy or QR-heavy markets, screenshots and manual context remain important.
- In jurisdictions with consumer open banking, read-only provider information may be more structured than in Vietnam.
