# Current Product Gap

## Basis Of Comparison

This comparison uses the current repository artifacts and implementation visible in:

- `artifacts/domain-philosophy/CURRENT/domains/inbox.md`
- `artifacts/domain-reality-validation/CURRENT/domains/inbox.md`
- `artifacts/technical-specification/CURRENT/modules/inbox.md`
- `artifacts/screen-blueprints/CURRENT/inbox/queue.md`
- `artifacts/screen-blueprints/CURRENT/inbox/review-detail.md`
- `modules/inbox/application/*`
- `app/[locale]/(product)/inbox/*`
- `messages/en/inbox.json`
- `messages/vi/inbox.json`

It identifies factual gaps only. It does not propose solutions.

## Current Product Facts

- Inbox is defined as a decision queue and primary product surface.
- Review items can be listed as open or archived.
- Open items are filtered to pending status.
- Archived view includes expired, auto-resolved, archived, resolved, dismissed, and acknowledged statuses.
- Review item kinds include unmapped expense, income suggestion, savings maturity variants, early withdrawal confirmation, penalty warning, rate-change suggestion, package expired, EMI complete, emergency declaration, and payment reminder.
- Review item spec types include unmapped expense, maturity decision, savings maturity decision, early withdrawal confirmation, payment reminder, installment complete, and emergency declaration.
- Items can carry amount, currency, source id, source type, title, context, suggested jar, suggested category, confidence score, expiry, and assigned user.
- Transaction-backed items are enriched with note, category name, and account name.
- Queue UI supports search, kind filtering, open/archive tabs, empty states, and detail navigation.
- Detail UI shows item context and allows pending items to be resolved, dismissed, or acknowledged depending on kind.
- Jar-resolvable items can be resolved to active jars.
- Savings maturity and early-withdrawal items can route through savings actions.
- Payment reminder expiration and staleness worker concepts exist.
- Auto-resolution exists for jar-resolvable items when confidence and suggested jar conditions are met.
- Offline money mutations are blocked in the decision panel.
- Partner-equal messaging and membership checks are present.

## Factual Gaps Against Real-World Domain

| Real-world concept | Current observed product coverage | Factual gap |
| --- | --- | --- |
| Receipts and invoice evidence | Items can carry context and linked transaction details. | No observed first-class receipt, e-invoice, attachment, or evidence object in Inbox types. |
| Provider message source | Source type includes transaction, guided, and plan movement. | No observed bank, wallet, card, biller, invoice, or notification provider source type. |
| Duplicate provider signals | Review item identity and source id exist. | No observed duplicate-detection or matching lifecycle. |
| Deferral | Domain philosophy mentions deferral. | Current observed statuses do not include deferred and UI does not show a deferral state. |
| Partner disagreement | Partner visibility exists; assigned user exists for targeted items. | No observed contest, reopen, or disagreement state. |
| Concurrent household decisions | Membership checks and server actions exist. | No observed explicit conflict-resolution language in discovery-visible product surface. |
| Rich source lifecycle | Pending, resolved, dismissed, acknowledged, auto-resolved, expired, archived exist. | No observed source-state model for pending/posting/provider update/superseded item lifecycle. |
| General reminders vs decisions | Payment reminder exists as an Inbox kind. | Product philosophy says Inbox is not notification center; observed payment reminders create a boundary tension. |
| Manual evidence gathering | Notes/category/account enrichment exists for transactions. | No observed place for household to record missing context or "ask partner" state. |
| Item urgency / staleness explanation | Expiration and staleness worker concepts exist. | No observed visible aging, due-window, or stale-reason model in Inbox type beyond `expiresAt`. |
| International / foreign-currency provider nuance | Amount and currency exist. | No observed exchange-rate, authorization currency, or settlement-currency context. |
| Household business invoice use | No observed invoice-specific kind. | E-invoice and tax evidence review is not represented. |

## Non-Gaps Observed

- The product correctly separates Inbox from real money ownership.
- The product already treats unresolved transaction mapping as household attention.
- The product already supports active and historical Inbox states.
- The product already recognizes savings maturity, early withdrawal, EMI completion, payment reminders, and emergency declarations as reviewable attention.
- The product already preserves source linkage and resolution state at the item level.
- The product already includes suggestions and confidence for repeatable jar resolution.
