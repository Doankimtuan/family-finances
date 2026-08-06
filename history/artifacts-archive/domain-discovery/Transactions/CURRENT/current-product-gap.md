# Current Product Gap

## Basis Of Comparison

This comparison uses the current repository artifacts and implementation visible in:

- `artifacts/domain-philosophy/CURRENT/domains/transactions.md`
- `artifacts/domain-reality-validation/CURRENT/domains/transactions.md`
- `artifacts/screen-blueprints/CURRENT/money/transactions.md`
- `modules/ledger/application/*transaction*`
- `supabase/migrations/20260802130000_ledger_transactions_inbox.sql`
- `supabase/migrations/20260802140000_ledger_transaction_update_delete.sql`
- `app/[locale]/(product)/money/transactions/*`

It identifies factual gaps only. It does not propose solutions.

## Current Product Facts

- Transactions are in the Real Ledger context.
- Manual capture exists for income and expense.
- Amounts use positive whole-number VND-style magnitude with explicit direction.
- Transactions link to account, category, jar, note, currency, date, creator, and household.
- Transaction list supports search and direction filter.
- Recent transaction queries exist.
- Transaction detail and audit-chain queries exist.
- Unmapped expenses can create Inbox review items.
- Unmapped income can create Inbox review items depending on household income allocation mode.
- Refund command exists and links refund records to original transactions.
- Correction command exists and uses original, reversal, and correction records.
- Credit-card expenses are checked against credit limit and can be assigned to billing context.
- Offline money mutations are blocked in the capture UI.

## Factual Gaps Against Real-World Domain

| Real-world concept | Current observed product coverage | Factual gap |
| --- | --- | --- |
| Transfers between owned accounts | Domain philosophy names transfers; current transaction direction constants expose income and expense only. | Transfer is not represented as a first-class current direction in observed application constants. |
| Pending vs posted provider lifecycle | Earlier migration has `cleared` / `pending`; application constants now include mapping/refund/reversal statuses. | Real provider pending/authorization/posting lifecycle is not clearly represented as a separate financial-provider state. |
| Merchant / counterparty identity | Transaction has note and category; UI title uses note/category/direction. | No observed structured merchant or counterparty field in current transaction type. |
| Provider statement import | Current capture is manual and provider integration is not observed in transaction code. | No observed bank/wallet/card import pipeline for transactions. |
| Receipt / attachment evidence | No attachment field observed in transaction type or capture surface. | Receipts are not represented. |
| Split categorization | One category and one jar reference observed. | Multi-purpose purchase splitting is not represented. |
| Duplicate detection | Idempotency key exists for one capture path. | Cross-source duplicate matching between manual and provider records is not observed. |
| Cash reconciliation | Cash accounts exist elsewhere, and cash transactions can be manual expenses. | No observed cash-on-hand reconciliation concept at transaction level. |
| Transfer neutrality | Income/expense model can record money entering or leaving one account. | Neutral two-sided movement between household accounts is not observed as a single transaction concept. |
| Provider corrections and chargebacks | Refund and correction audit concepts exist. | Chargeback/dispute lifecycle is not observed as a distinct concept. |
| Foreign currency settlement | Currency exists and defaults to VND. | Exchange rate, authorization currency, and settlement currency are not observed. |
| Rich transaction status language | Application has statuses for mapping, posted, refund, reversed. | Terminology differs from real-world bank/card lifecycle and from older migration status names. |

## Non-Gaps Observed

- The product correctly separates real ledger activity from virtual jars as a core principle.
- The product already treats unmapped transaction facts as reviewable household work through Inbox.
- The product already recognizes refunds and corrections as distinct audit concepts rather than simple silent edits.
- The product already makes account association mandatory for transaction recording.
- The product already supports basic search, filtering, and recent activity review.
