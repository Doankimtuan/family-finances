# Phase 12 — Inbox content audit

## Canonical routes

Discovered from `modules/shared-kernel/app-path.ts` (re-exported by `modules/tenancy/application/app-path.ts`). Not assumed from the prompt.

| Surface | Path | Builder / query |
| --- | --- | --- |
| Queue | `/inbox` | `APP_PATH.INBOX` |
| Archived queue | `/inbox?tab=archived` | `inboxQueuePath(InboxQueueTab.ARCHIVED)`, query key `INBOX_TAB_QUERY` (`tab`) |
| Detail | `/inbox/[id]` | `inboxItemPath(id)` |
| Post-decision receipt | `/inbox?receipt=jar\|savings\|attention` | `INBOX_RECEIPT_QUERY` + `InboxReceiptKind` |

Five-tab navigation is unchanged. Inbox remains the attention destination.

## Product role

Inbox is the household **attention center**: what needs a look, and what can be finished now.

It is not a notification dump, a second ledger, a dashboard of financial metrics, or a financial-advice engine.

## Existing event / task types (canonical kinds)

From `InboxItemKind` — presentation only; no new kinds were added.

| Kind | Why it appears | Existing finish path |
| --- | --- | --- |
| `unmapped_expense` | Expense has no jar | `resolveInboxAction` → assign Active jar |
| `income_suggest` | Income waiting for Suggest placement | Same jar resolve |
| `savings_maturity` | Savings product at / near maturity | `acknowledgeSavingsMaturityAction` (Savings owns money) |
| `early_withdrawal_confirmation` | Confirm early withdrawal | `acknowledgeEarlyWithdrawalAction` |
| `emi_complete` | Installment fully paid | `acknowledgeInboxAction` celebrate / later |
| `emergency_declaration` | Partner declared an emergency jar reallocation | Review note, then dismiss when allowed |
| `loan_payment_attention` | Loan due / overdue | Open canonical loan in Money |
| `debt_payment_attention` | Debt due / overdue | Open canonical debt in Money |

Legacy storage kinds (`INBOX_LEGACY_KIND_VALUES`) are mapped or excluded at the existing read boundary. They were not added to the UI.

## Open / Archived semantics

Internal statuses are unchanged (`InboxItemStatus`).

- **Open tab** (`InboxQueueTab.OPEN`): active queue, `PENDING` (`INBOX_ACTIVE_STATUS_VALUES`).
- **Archived tab** (`InboxQueueTab.ARCHIVED`): `INBOX_ARCHIVED_STATUS_VALUES` — expired, auto-resolved, archived, resolved, dismissed, acknowledged.

Archived is a history/presentation classification. It is **not** renamed to “completed” in copy. Resolved / dismissed / acknowledged remain distinct statuses on detail.

## Existing filters

Client-side only, on the already-fetched list. No new read-model contract.

- Kind chips: `InboxKindFilter.ALL` + every `INBOX_ITEM_KIND_VALUES` value
- Title/note/category/account search (`inbox-search`)
- Load-more on the open page (`loadMoreInboxAction` + existing cursor)

Filtered empty is distinct from a globally empty queue. Clear filter resets kind + search locally.

## Existing grouping

There is no stored grouping algorithm. Query order is preserved **within** each kind.

Presentation grouping (`groupInboxItemsByKind`) buckets by existing `InboxItemKind` in **first-seen** order from the current list. No urgency score, no invented rank.

Tab-level grouping remains Open vs Archived.

## Existing actions (unchanged payloads)

| Action | Function | Payload |
| --- | --- | --- |
| Resolve to jar | `resolveInboxAction` | `{ inboxItemId, jarId }` |
| Dismiss | `dismissInboxAction` | `{ inboxItemId }` |
| Acknowledge (EMI / generic) | `acknowledgeInboxAction` | `{ inboxItemId, action }` |
| Savings maturity | `acknowledgeSavingsMaturityAction` | existing savings fields |
| Early withdrawal | `acknowledgeEarlyWithdrawalAction` | existing savings fields |
| Mark read / unread | `markInboxReadAction` / `markInboxUnreadAction` | `{ inboxItemId }` |
| Load more | `loadMoreInboxAction` | existing cursor |

Background (unchanged): `runInboxStalenessWorker`, `syncLoanDebtAttentionInboxItems` via `after()`.

## Source / context relationships

`resolveInboxSourceTarget` — omit rather than invent:

| Kind / source | Destination |
| --- | --- |
| Transaction / jar-resolvable | `moneyTransactionPath(sourceId)` |
| Savings maturity / early withdrawal | `moneySavingsPath(savingId)` |
| Loan attention / EMI with loan | `moneyLoanPath(loanId)` |
| Debt attention / EMI with debt | `moneyDebtPath(debtId)` |
| Emergency / plan movement | `planJarPath(jarId)` or `APP_PATH.PLAN` |

## Financial-number kinds (presentation)

| Kind | `FinancialNumberKind` | Why |
| --- | --- | --- |
| Unmapped expense / income suggest | `MOVEMENT` | Existing transaction amount |
| Savings maturity, EMI complete, loan/debt attention | `CURRENT_STATE` | Existing Money/Savings obligation or product value |
| Emergency declaration | `INTENTION` | Plan reallocation intent |
| Early-withdrawal net / penalty in the decision panel | `ESTIMATE` | Already labeled estimated return / penalty |

Missing / non-finite amounts are omitted. They are not formatted as zero at the UI boundary.

The persisted mapper still does `Number(row.amount)` (unchanged). A database null would already have become `0` before the UI. That contract was not modified.

## Terminology

- Inbox = attention
- Money = reality / source of amounts
- Plan = intention (emergency / jar placement)
- Open / Archived = existing tab names (not renamed internally)
- Dismiss / resolve / acknowledge keep their existing meanings

Vietnamese: “Hộp thư” stays; open-empty is “Hiện không có việc nào cần chú ý”; archived is “đã lưu trữ”, not “đã xong”.

## Hard rejects

Not added and not requested as contract changes:

- New notification types, fake alerts, recommendations, or AI advice
- Attention / urgency / health scores
- Invented deadlines or financial events
- Net Worth, Reports, Free to Spend, Ready to Assign, Age of Money
- Extra navigation tabs
- Schema, RPC, mutation, or event-generation changes
- Equating Archived with Completed
