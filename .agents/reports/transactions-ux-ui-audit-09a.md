# ViNha Transactions Track — 09A: Transactions UX/UI + Content Audit

Status: Audit and implementation planning only  
Date: 2026-08-20  
Scope: Transactions list, capture, transfer, refund, correction, detail, financial semantics, content, privacy, accessibility, responsive behavior, and cross-module integrity. No production code, locale, schema, calculation, test, or configuration changes were made.

Evidence base:

- Current application source under `app/[locale]/(product)/money/transactions`, `modules/ledger/application`, `modules/home/application`, related Money-product commands, migrations, and English/Vietnamese message catalogs.
- Canonical IA, UX, visual-foundation, motion, form, transaction, and financial-invariant artifacts.
- Current unit tests for financial classification and transaction activity.
- Prior implementation reports 07B, 07D, 08A, 08B, 08C, 08E, 08F, 08F5, and 08F6.
- Local app boot at `http://127.0.0.1:3000`; the protected route redirected to Login because the available browser session was not authenticated. Current checked-in 390px Transactions list, capture, and detail evidence was inspected instead. Runtime VI, dark, populated event variants, and privacy-hidden states remain unverified in this audit.

## A. Executive summary

Transactions should be a calm, chronology-first ledger of user-level money events. It should not become an analytics dashboard, a monthly summary, a spreadsheet, or a collection of elevated cards. The canonical surface model is explicit: a transaction is an **event**, a date header is **grouping metadata**, filters are **controls**, the create route is a **task/form**, and detail is an **event detail**.

The current implementation already has valuable foundations:

- one stable owner route for capture (`/money/transactions/new`);
- append-only ordinary transaction commands;
- atomic two-leg owned-account transfers;
- one user-facing transfer activity projected from two ledger rows;
- centralized financial semantics used by Home and Monthly Review;
- linked refunds that do not count as ordinary income;
- shared `Page`, `TopAppBar`, `TransactionRow`, `AmountField`, `BottomActionBar`, `FinancialValue`, and localized copy.

The current experience is not ready for a visual-only pass. Six source-confirmed P0 themes must precede 09B:

1. Generic correction is offered for every posted/pending ledger type, while the SQL reverses anything other than `expense` as an `expense` and creates only ordinary income/expense corrections. A transfer leg, savings leg, investment event, debt event, card payment, or credit-card purchase can therefore be corrected outside its owning aggregate.
2. Credit-card purchase/cashback recording commits the ledger row first, performs statement assignment later in separate writes, ignores the assignment result, and can partially update a statement before item insertion fails.
3. Generic refund and correction of credit-card purchases bypass card-billing reconciliation, allowing transaction history and card outstanding to diverge.
4. Scheduled loan payment stores principal plus interest in one `liability_payment`; centralized semantics exclude the whole amount from Expense and spending, so loan interest is understated.
5. Transaction Detail signs every non-`expense` row as positive. Transfer out, liability payment, debt lending, investment buy, and investment fee can therefore display the wrong direction.
6. Privacy mode protects list-row and primary-detail values but not audit-chain amounts, form previews, confirmation summaries, refund limits, or transaction receipts.

After the integrity gate, the shortest coherent UX path is: flatten and group the list, fix the event projection and semantic filters, simplify the existing generic capture route, then harden detail/correction/refund. No new UI library, motion system, desktop layout, or generic abstraction is required.

## B. Route/component map

| Surface               | Current route/source                                                        | Current responsibility                                                      | Audit note                                                                                                                |
| --------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Transactions list     | `/money/transactions`; `app/[locale]/(product)/money/transactions/page.tsx` | Loads up to 100 raw rows, projects activities, renders filter card and rows | Owner route is correct; chronology, states, semantic filters, and density are not.                                        |
| Filter/search         | `transactions-filter-bar.tsx`                                               | Query, seven raw-type radios, transaction tags, Add, Manage tags            | Too large and elevated; query/tag filtering occurs after the 100-row cap.                                                 |
| New transaction       | `/money/transactions/new`; `new/page.tsx`                                   | Loads accounts/categories/jars/tags and mounts capture entry                | Correct canonical route; no contextual account/type input.                                                                |
| Capture mode          | `money-capture-entry.tsx`                                                   | Expense/Income/Transfer selector                                            | Correct generic entry strategy, but Expense/Income direction is duplicated inside the child form.                         |
| Expense/Income form   | `capture-transaction-form.tsx`                                              | RHF/Zod capture, preview, save, receipt                                     | Mostly sound state ownership; card-heavy layout, UTC date default, stale conditional values, and privacy leaks.           |
| Transfer form         | `transfer-capture-flow.tsx`                                                 | RHF/Zod form → confirm → receipt                                            | Correct atomic command and confirmation shape; receipt exposes two implementation legs and leaks amounts.                 |
| Transaction detail    | `/money/transactions/[id]`; `[id]/page.tsx`                                 | Shows amount, facts, tags, chain, correction/refund actions                 | Treats every row as ordinary income/expense; wrong signs and product/transfer action eligibility.                         |
| Edit alias            | `/money/transactions/[id]/edit`; `[id]/edit/page.tsx`                       | Redirects to correction                                                     | Good: no in-place money edit. Visible legacy edit copy should not survive.                                                |
| Correction            | `/money/transactions/[id]/correct`; correction page/form                    | Three-way correction through RPC                                            | Append-only intent is right; eligibility and cross-domain ownership are unsafe.                                           |
| Refund                | `/money/transactions/[id]/refund`; refund page/form                         | Linked expense refund through RPC                                           | Correct linkage/cap; missing effective date control and unsafe for credit-card purchases.                                 |
| Transaction tags      | `/money/transactions/tags` and local editor files                           | CRUD labels and assignment                                                  | Meaning-only metadata; keep secondary to transaction work.                                                                |
| Read model            | `modules/ledger/application/queries/get-transaction.ts`                     | Detail/list query with joined account/category/jar/tags                     | Errors collapse to `null`; list filters after limit; no ownership context or cursor.                                      |
| User-level projection | `transaction-activity.ts`                                                   | Groups transfer legs and maps product kinds                                 | Strong base; loses created-time ordering and still links grouped activity to a single leg detail.                         |
| Financial semantics   | `financial-semantics.ts`                                                    | Cash direction, classification, Income/Expense flags, sign                  | Correct central owner for classification; several product commands do not emit enough split events to classify correctly. |
| Home metrics          | `modules/home/application/home-dashboard-metrics.ts`                        | Income, expense, net cash flow, spending categories                         | Uses central semantics; refunds are excluded rather than netted against spending.                                         |
| Shared event row      | `shared/patterns/transaction-row.tsx`                                       | Flat row with leading visual, text, masked amount                           | Reuse; allow content wrapping and last-row divider control instead of creating a new row system.                          |
| Receipt/confirm       | local `transaction-receipt.tsx`; shared `confirm-summary.tsx`               | Reusable label/value summaries                                              | Both support `financial`, but transaction callers omit it. Fix the contract/root call sites.                              |

## C. Current Transactions IA

Current vertical order:

1. Top bar: “Activity” / “Recent account activity”.
2. Offline banner when applicable.
3. One elevated filter card containing search, seven type radios, tag selector, Apply, Add transaction, and Manage tags.
4. One rounded bordered container around all event rows.
5. One generic empty state for no data, no matches, and read failure.
6. Full-width Back to Money action.
7. Persistent product navigation.

Current purpose is mixed. The route functions as transaction history, search, filter management, tag management, and capture launcher at once. The title “Activity” also understates that this is the canonical source of transaction truth, while “Recent account activity” is inaccurate for debt, savings, investments, corrections, and product-generated events.

The list has no date grouping, no displayed date, no result count, no pagination, no load-more control, no owner/scope context, no distinct error state, and no transfer-level detail. The source orders the database by `created_at`, then the activity projection re-sorts only by `effectiveDate`, which makes same-day order underspecified.

## D. Recommended Transactions IA

Use this exact vertical order:

1. **Product header**
   - EN title: **Transactions**
   - VI title: **Giao dịch**
   - EN subtitle: **Income, spending, and money movements**
   - VI subtitle: **Thu, chi và các lần chuyển tiền**
   - One primary action: **Add transaction / Thêm giao dịch**.
2. **Status lane** only when offline, partial, permission-limited, or failed.
3. **Compact find/filter control**: search field or search trigger, four common chips (`All`, `Income`, `Expense`, `Transfer`), and one More filters action.
4. **Active-filter summary** with removable chips and a clear action only when filters are active.
5. **Chronological event stream**, grouped by effective calendar date.
6. **Cursor load-more control** or automatic page continuation with a visible status; do not imply the first 100 rows are complete history.
7. **State-specific empty/error surface** in the stream position.
8. Persistent product navigation.

Do not add KPI cards, month totals, spending charts, “insights”, or a dashboard hero. Home and Monthly Review already own summary interpretation. Transactions owns explainable event history.

The Back to Money button is unnecessary as a full-width terminal action because the product navigation and back behavior already provide exit. Preserve scroll position when opening a detail and returning.

## E. Event archetype

Recommended archetype: **ledger event stream**.

- Ordinary income/expense: one ledger row → one event.
- Owned-account transfer: two linked ledger rows → one neutral user event.
- Savings placement/return: linked product rows → one product-aware movement event where the source provides a stable group.
- Refund: one linked reversal row → one refund event related to its original expense.
- Correction: original + reversal + correction remain separately auditable, but detail explains them as one relationship story.
- Credit-card payment, debt movement, savings event, and investment event: one user-level event linked to its owning product record, never disguised as ordinary income/expense.

The global list should remain open and flat. A bounded card is appropriate for a confirmation, receipt, warning, or product object—not around each date group or the entire activity stream.

## F. List/grouping/density

Group by the stored effective date (`transaction_date`), not creation time:

- **Today / Hôm nay**
- **Yesterday / Hôm qua**
- localized weekday + date for the current year;
- localized date including year for older years.

Date headers are lightweight metadata, not cards. Start non-sticky; sticky headers add no value until observed list length proves otherwise.

Within a date group, order by `created_at DESC`, then a stable ID tie-breaker. The activity projection must retain a representative creation timestamp. Transfer legs collapse before sorting. A backdated transaction belongs under its effective date but remains deterministically ordered within that group.

Recommended density:

- 56–64px ordinary row target, growing when Vietnamese or relationship copy wraps;
- 12–16px vertical group separation;
- one subtle separator between rows;
- no gap-separated mini-cards;
- no outer rounded card around the list;
- no final divider after the final row in a group.

The current `TransactionRow` is the right base. Adjust its content contract and wrapping; do not replace it with a second transaction-row primitive.

## G. Row hierarchy

| Event                   | Primary text                                                   | Secondary text                                           | Amount                      | Supporting status                                        |
| ----------------------- | -------------------------------------------------------------- | -------------------------------------------------------- | --------------------------- | -------------------------------------------------------- |
| Expense                 | Meaningful note; otherwise category; otherwise “Expense”       | Category when not primary · account                      | `−amount`                   | Pending mapping/refunded/reversed text when applicable   |
| Income                  | Meaningful note/source; otherwise category; otherwise “Income” | Category when not primary · account                      | `+amount`                   | Pending mapping/reversed when applicable                 |
| Transfer                | `From account → To account`                                    | Optional note · “Transfer”                               | unsigned/neutral amount     | “Total unchanged” only in detail, not every row          |
| Refund                  | `Refund · original title/category`                             | Destination account · linked original                    | `+amount`, refund tone      | Partial/full relationship on original where relevant     |
| Card purchase           | Note/category; otherwise “Card purchase”                       | Card name · statement/installment state when sourced     | `−amount`                   | Paid/open/installment only when read model can prove it  |
| Card payment            | `Payment to {card}`                                            | Source account                                           | `−amount`, non-expense tone | Not income or spending in detail                         |
| Debt borrowed           | `Borrowed from {counterparty}`                                 | Destination account                                      | `+amount`, non-income tone  | Product status only if sourced                           |
| Debt repayment          | `Payment to {counterparty}`                                    | Source account · principal/interest split when available | `−amount`                   | Non-expense principal; interest/fee disclosed separately |
| Loan repayment received | `Repayment from {counterparty}`                                | Destination account                                      | `+amount`, non-income tone  | Product status when available                            |
| Savings                 | Product/action name                                            | Source → destination or product context                  | directional amount          | Principal/interest/tax meaning in text                   |
| Investment              | Holding + operation                                            | Cash account · fee/income kind                           | directional amount          | “Not ordinary income/expense” only where needed          |
| Correction/reversal     | `Correction to {original}` / `Reversal of {original}`          | Account · relationship                                   | semantic sign               | Reversed/corrected text, never color alone               |

Title strategy is deterministic:

1. Transfers and product/system events use their semantic event name first.
2. Ordinary income/expense uses a non-empty note first.
3. Otherwise use localized category.
4. Otherwise use localized activity kind.

Do not add a separate transaction Title field. The existing Note is enough. Do not repeat the same category in both lines. Date belongs in the date header because the model stores only a date, not a reliable transaction time.

## H. Financial classification matrix

“Home net” below means the current Home `Income − Expense` metric, not total account-position change. “Current” describes source behavior; “Target” identifies a required correction.

| Event                                | Source / destination balance effect                                            |                       Income? |                          Expense? |              Home net |                                          Spending? | Global feed representation                                 | Status                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------ | ----------------------------: | --------------------------------: | --------------------: | -------------------------------------------------: | ---------------------------------------------------------- | ------------------------------------------------------------------------ |
| Opening balance                      | Seeds account balance through `accounts.opening_balance`; no transaction row   |                            No |                                No |                     0 |                                                 No | Not shown                                                  | Current; product decision for synthetic account-history event            |
| Ordinary income                      | Destination account `+amount`                                                  |                           Yes |                                No |             `+amount` |                                                 No | One credit event                                           | Current correct                                                          |
| Ordinary liquid expense              | Source account `−amount`                                                       |                            No |                               Yes |             `−amount` |                                                Yes | One debit event                                            | Current correct                                                          |
| Owned-account transfer               | Source `−amount`; destination `+amount`; household total 0                     |                            No |                                No |                     0 |                                                 No | One neutral grouped event                                  | Current projection correct                                               |
| Linked expense refund                | Destination `+amount`; original expense remains historical                     |                            No |                                No |          0 for refund | No reduction today; original remains gross expense | One refund event linked to original                        | Current classification; reporting policy unresolved                      |
| Credit-card purchase                 | Card outstanding `+amount`; liquid real position unchanged until payment       |                            No |                               Yes |             `−amount` |                                                Yes | One card-purchase debit event                              | Intended, but billing write is non-atomic                                |
| Credit-card payment                  | Liquid source `−amount`; card outstanding `−amount`                            |                            No |                                No |                     0 |                                                 No | One liability-payment debit event                          | Current classification correct; link integrity required                  |
| Borrowed debt proceeds               | Destination account `+principal`; debt liability `+principal`                  |                            No |                                No |                     0 |                                                 No | One non-income credit event                                | Current correct                                                          |
| Borrowed debt principal payment      | Source `−principal`; liability `−principal`                                    |                            No |                                No |                     0 |                                                 No | One liability-payment debit event                          | Current correct for principal-only debt                                  |
| Scheduled loan payment with interest | Source `−(principal + interest)`; liability `−principal`                       | Interest should be No/Expense |                  **Currently No** |       **Currently 0** |                                   **Currently No** | One undifferentiated liability-payment event               | **P0: target split/classification required**                             |
| Money lent                           | Source `−principal`; receivable `+principal`                                   |                            No |                                No |                     0 |                                                 No | One non-expense debit event                                | Current correct                                                          |
| Debt repayment received              | Destination `+principal`; receivable `−principal`                              |                            No |                                No |                     0 |                                                 No | One non-income credit event                                | Current correct                                                          |
| Investment buy                       | Cash source `−cost`; holding position `+asset`                                 |                            No |                                No |                     0 |                                                 No | One investment debit event                                 | Current correct                                                          |
| Investment sell proceeds             | Cash destination `+net proceeds`; holding position decreases                   |                            No |                                No |                     0 |                                                 No | One investment credit event                                | Current correct                                                          |
| Investment income                    | Cash destination `+income`                                                     |                           Yes |                                No |             `+amount` |                                                 No | One investment-income credit event                         | Current correct                                                          |
| Investment fee                       | Cash source `−fee`                                                             |                            No |                               Yes |                `−fee` |                                                Yes | One investment-fee debit event                             | Current correct                                                          |
| Savings principal placement          | Liquid source `−principal`; savings product `+principal`; total 0              |                            No |                                No |                     0 |                                                 No | One savings placement event                                | Current grouped projection correct                                       |
| Savings principal return             | Savings product `−principal`; liquid destination `+principal`; total 0         |                            No |                                No |                     0 |                                                 No | One savings return event                                   | Current grouped projection correct where group is complete               |
| Savings interest                     | Savings product `+gross interest`; optional later transfer to liquid account   |                           Yes |                                No |           `+interest` |                                                 No | Interest event plus separate payout movement when paid out | Current source behavior; relation should be explicit                     |
| Savings tax/penalty                  | Savings product/source decreases                                               |                            No | Expense when emitted as `expense` |             `−amount` |                                                Yes | Savings-related expense event                              | Current type behavior; penalty event coverage depends on product command |
| Ordinary three-way correction        | Original stops counting; reversal offsets balance; corrected row becomes truth |        Follows corrected type |            Follows corrected type | Follows corrected row |                              Follows corrected row | Relationship story across three immutable rows             | Correct only for ordinary income/expense                                 |
| Generic balance adjustment           | UNKNOWN—no approved command/type exists                                        |                       UNKNOWN |                           UNKNOWN |               UNKNOWN |                                            UNKNOWN | Do not invent                                              | Explicitly out of 09A/09B scope                                          |

Two important consequences:

- The current linked refund does **not** reduce Home spending. It is excluded from Income and Expense, while the original partially/fully refunded expense continues counting unless reversed. Home therefore reports gross spending, not net-of-refund spending.
- Credit-card purchase counts once as Expense; card payment is excluded. That avoids purchase/payment double counting. The integrity risk is synchronization, not the intended classification.

## I. Income

Ordinary income is correctly represented as a positive-magnitude `income` row, a destination-account inflow, and one Home Income event. The capture form should continue to accept a positive amount and derive the sign from type.

Required UX corrections:

- Use **Income / Thu nhập**, not a generic “Direction”, when the type is already selected.
- Put amount, destination account, effective date, then optional meaning fields.
- “Uncategorized” must mean absent category, not invalid money movement.
- Savings interest and investment income may count as Income but should retain product-aware titles so users do not mistake principal return/sale proceeds for earnings.
- Card cashback is currently recorded as ordinary `income`; whether it is true income or a purchase rebate is unresolved and must not be decided in UI copy alone.

## J. Expense

Ordinary liquid-account expense is correctly a source-account outflow and counts toward Home Expense and spending. Credit-card purchase also counts at purchase time; later card payment does not count again.

Required UX corrections:

- Use the selected type once; remove the second Expense/Income selector inside the form.
- Keep category and jar as meaning, never as the mechanism moving money.
- If a category supplies a jar, selecting a category without a jar or changing type must clear any stale jar rather than silently retaining the previous value.
- Use category naming consistently. Current correction copy says “Tag” for the category field while the app also has independent transaction tags.
- Investment fees, savings taxes, and true financing interest need product-aware Expense presentation, not generic household purchase titles.

## K. Transfer

The owned-account transfer command is the strongest current integrity path: one atomic RPC creates one `transfer_out`, one `transfer_in`, a shared `transfer_group_id`, and idempotent result. The activity projection correctly collapses both legs into one neutral event.

Keep these rules:

- source decreases once;
- destination increases once;
- household real position is unchanged;
- transfer is neither Income nor Expense;
- one user event appears in the global feed;
- preview-confirm remains required.

Fix these issues:

- The list links the grouped event to the first raw leg; Detail then shows only that leg and can display an incorrect sign. Add a group-aware transfer detail/read model or an event-aware detail projector.
- Never expose generic correction on one transfer leg. A transfer correction/reversal must atomically preserve and offset both legs.
- “Income” filter must not catch refund income rows; “Transfer” must not unintentionally absorb savings movements. Filter projected semantics, not only raw types.
- Transfer receipt should say `From → To`, amount, date, and total unchanged. Do not make users open “source leg” and “destination leg” as primary actions.
- Account Detail should preselect the contextual account as transfer source when eligible; if launched from a destination-oriented affordance, preselect it as destination.

No sufficient-balance rule exists in the inspected domain contract. Do not invent one in 09B.

## L. Refund

The refund RPC correctly limits cumulative refunds to the original expense, creates an append-only linked inflow through `reverses_transaction_id`, updates original partial/full status, and restores jar capacity. Central semantics correctly classify that linked row as Refund, not ordinary Income.

Current gaps:

- Detail offers refund for every eligible `expense`, including a credit-card purchase. The generic refund RPC updates the transaction/jar but not card billing.
- The form hardwires the original account even though the command accepts a destination account.
- The form omits effective date; the RPC uses the UTC current date.
- The receipt displays the **original expense date**, not the refund date.
- Copy exposes the storage field `reverses_transaction_id`; users need “linked to the original expense”, not schema terminology.
- “Link refund” sounds administrative. Use **Record refund / Ghi hoàn tiền**.
- Refund receipt, maximum amount, original amount, and restored capacity bypass privacy masking.

Target refund preview must name original expense, maximum refundable amount, requested amount, destination account, effective date, linked record, and the fact that it is not ordinary income. Credit-card purchase refund must route through a card-aware atomic owner command or be blocked until one exists.

## M. Credit-card purchase/payment

Intended classification is sound:

- card purchase: Expense once, increases card obligation, does not inflate liquid real position;
- card payment: decreases liquid source and card obligation, counts as neither Income nor Expense.

Implementation integrity is not sound:

- `recordTransaction` commits the ledger RPC, then calls `assignCardBillingForTransaction` and ignores `{ok:false}`.
- Assignment updates/inserts the statement month, then separately inserts the billing item. Item failure can leave a changed statement without its line item.
- Generic linked refund posts an `income` reversal row but never updates the statement month/item.
- Generic three-way correction likewise does not reconcile card billing.
- Card cashback uses an ordinary `income` row and the same post-commit assignment path; Home therefore counts it as Income.

The fix belongs in one card-aware atomic boundary, not in UI conditionals across several pages. Until that exists, block generic refund/correction for credit-card transactions and surface a card-owned action only when the owner command can preserve ledger, statement, billing item, installment link, and outstanding together.

Credit-card installment conversion stores fee/interest schedules but the inspected transaction stream does not project those costs as separately classifiable ledger events. Do not guess their Expense treatment in Transactions; resolve it in the integrity batch with the card owner.

## N. Debt/Savings/Investment movements

### Debt and loans

- Borrowed proceeds are `debt_borrowing`: cash inflow, not Income.
- Lending is `debt_lending`: cash outflow, not Expense.
- Receivable repayment is `debt_receivable_payment`: inflow, not Income.
- Borrowed-principal repayment is `liability_payment`: outflow, not Expense.
- Scheduled loan repayment is also one `liability_payment`, but its source amount includes principal plus interest. The payment table stores the split while Transactions and Home see only the combined neutral row. This is a P0 classification defect.
- Current Debt filter includes borrowing/lending/receivable payment but omits `liability_payment`, so many debt/card/loan repayments disappear from the expected filter.

### Savings

- Principal placement/return remains transfer-neutral and must not become spending or income.
- Interest is recorded as Income; a payout can additionally create a transfer group. Present earning and later movement as related but distinct facts, avoiding duplicate-looking titles.
- Savings tax/penalty rows must retain product meaning while following their actual Expense classification.
- Generic correction of a savings leg is forbidden; the savings owner must preserve cycle/product links.

### Investments

- Buy is non-expense outflow.
- Sell proceeds are non-income inflow.
- Investment income counts as Income.
- Investment fee counts as Expense/spending.
- Generic correction of an investment transaction can desynchronize the holding operation from its cash row. Route all material changes through the investment owner.

## O. Create form

Keep **one generic Add transaction route** and its type-first selector. This already exists and is the simplest route contract. Do not create three separate pages.

Recommended field order:

1. Type: Expense, Income, Transfer.
2. Amount.
3. Account, or From/To accounts.
4. Effective date.
5. Meaning fields for ordinary Income/Expense only.
6. Optional note.
7. Preview.
8. Save for ordinary Income/Expense; Review then Confirm for Transfer.

Remove the duplicated inner Expense/Income selector. The outer mode is the owner of type. Its current `key={mode}` remount is a useful small mechanism for fresh defaults; retain it.

The create route is a page and does not need `ActionSheetLayout` merely for visual consistency. Continue to use shared page and bottom-action patterns. If a later contextual overlay is added, mount the same form composition inside the shared action-sheet layout—do not fork a second form or invent local safe-area/footer CSS.

Current card-in-card composition should be flattened. Emphasize the amount, use field groups without elevation, and reserve a bounded surface for preview/confirmation only.

## P. Conditional fields

| Type       | Required                                                                              | Optional                                                      | Must be hidden/cleared                        |
| ---------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------- |
| Expense    | Amount, source account, effective date                                                | Category, jar, transaction tags, note                         | Transfer accounts; stale income category/jar  |
| Income     | Amount, destination account, effective date                                           | Category, jar, transaction tags, note                         | Transfer accounts; stale expense category/jar |
| Transfer   | Amount, source, destination, effective date                                           | Note                                                          | Category, jar, transaction tags               |
| Refund     | Original expense context, amount, destination, effective date                         | Note                                                          | Type switch, unrelated category/jar edits     |
| Correction | Original context, corrected money facts, effective date, explicit consequence preview | Meaning fields only when owner command supports their effects | Generic product/transfer eligibility          |

Rules:

- Changing type resets category, jar, validation, preview, mutation error, and confirmation state.
- Choosing Uncategorized clears category and any category-derived jar.
- Choosing a category without a jar clears a previously derived jar.
- Hidden values must never submit.
- Transaction tags stay optional context and do not change financial classification.
- Receipt state is terminal for that form instance; Record another creates a new idempotency key.

## Q. Account/category/date/ownership selectors

### Accounts

- Use existing shared/HeroUI form primitives before local wrappers.
- Show only active, eligible accounts for the selected action.
- Credit card may be selected for purchase capture but not owned-account transfer.
- Savings-product accounts are not ordinary capture/transfer targets.
- Show account name, type, and Shared/Personal scope where needed; mask any displayed balance.
- Preserve contextual preselection from Account Detail.
- For transfer, prevent the same account pair immediately and remove/disable the selected source from destination choices.

### Category and Uncategorized

- Label the financial category **Category / Danh mục** everywhere.
- Label independent search labels **Tags / Nhãn**.
- Uncategorized is a valid meaning state, not a movement failure. If it creates an Inbox review, preview/receipt should say so calmly.
- Category and jar explain meaning; they do not change the account movement.

### Date/time

- The model stores an effective date only. Do not add a time picker or manufacture row times.
- Default “today” in the household/app timezone. The current `toISOString().slice(0, 10)` can produce yesterday during early Vietnamese morning and must be corrected before relying on the default.
- Display dates with the existing localized formatter/date-only helper, never raw `YYYY-MM-DD` in user-facing detail/receipts.
- Label it **Effective date / Ngày hiệu lực** where consequence matters.

### Ownership

Transactions do not store an independent financial scope; scope is inherited from the account/product. Current transaction queries join only account name and cannot display ownership. Extend the read model with the source account/product scope and owner context. Do not add a second transaction-level ownership selector that could disagree with the account.

## R. Create success/reset

The canonical receipt is required, but current receipts are over-complete and expose implementation records.

Recommended ordinary receipt:

- outcome;
- masked signed amount;
- account;
- effective date;
- category/Uncategorized;
- Inbox review only when created;
- primary **View transaction**;
- secondary **Record another** and **Done**.

Recommended transfer receipt:

- `From → To`;
- masked neutral amount;
- effective date;
- source decreases, destination increases, total unchanged;
- primary **View transfer**;
- secondary **Transfer again** and **Done**.

Do not make source/destination ledger legs primary navigation. Internal short IDs add little user value unless support workflows require them.

Current reset behavior is partly sound: capture resets before receipt and Record another produces fresh defaults/idempotency; switching outer mode remounts capture; transfer reset returns to fresh form. Fix stale jar state and duplicated direction ownership. Refund/correction should preserve input on failure and close/reset only after success or explicit navigation.

## S. Transaction Detail

Recommended hierarchy:

1. Top bar with event-aware title and status subtitle.
2. Status lane for offline, permission, reversed/corrected/refunded, or partial source.
3. Event summary: masked semantic amount, type, effective date.
4. Money effect: source/destination or affected account(s).
5. Meaning: category, jar, tags, note.
6. Relationship story: original/refund/correction/reversal or product owner link.
7. Eligible actions.
8. Back to Transactions.

Current issues:

- Sign is `expense ? minus : plus`, not central semantics.
- `Balance` is used for an event amount even though it represents a balance/summary archetype.
- Dates are raw ISO.
- Transfer detail shows one leg rather than one transfer.
- Product context and ownership are absent.
- Audit amounts bypass privacy.
- `null` represents both missing and failed load, so a source failure can look like “Transaction not found”.
- Action eligibility is based on status/link fields, not semantic kind/owner capability.

Detail should consume the same user-level event projector as the list, plus an explicit relationship/product context read model. One canonical semantics source must own sign, tone, classification, and action eligibility.

## T. Edit integrity

Material financial facts are immutable in place:

- amount;
- type/direction;
- account/source/destination;
- effective date;
- any linked product movement.

These require append-only correction or owner-specific reversal, with the original preserved.

Meaning-only edits may be lighter only when a command defines their side effects:

- independent transaction tags can remain editable in place;
- note/category/jar are not automatically safe because categories/jars drive review and plan capacity. No inspected metadata-only command establishes that contract, so keep them read-only or use correction until a dedicated reclassification command exists.

Generic correction must be limited to ordinary standalone income/expense at both UI and command/RPC boundaries. UI hiding is not sufficient. Transfer, savings, investment, debt/loan, card payment, and credit-card purchase changes belong to their aggregate owner.

Correction preview must show original event, reversal, corrected event, source/destination effects, effective date, audit preservation, and which owner is responsible. Current confirmation is only prose and omits the actual before/after facts.

## U. Delete/reversal/void

Hard delete is already ruled out by source: `updateTransaction` and `deleteTransaction` always return `immutable`. Keep it that way. Remove dormant “Delete transaction” and “Legacy edit” locale concepts when implementation reaches those catalogs; they describe behavior the product does not support.

Current product has:

- linked refund for eligible ordinary expenses;
- three-way correction intended for ordinary income/expense;
- no approved generic reversal command;
- no void command;
- no physical delete UI.

Target policy:

- **Delete:** never for posted ledger facts.
- **Refund:** linked external money return for an expense.
- **Correct:** append-only replacement of an ordinary standalone fact.
- **Reverse/Void:** expose only after a domain command defines eligible states, linked product handling, plan/jar effect, and audit story.

Transfer reversal must offset both legs atomically. Product-event reversal must go through its owner. Confirmation must name amount, accounts, date, related records, and what remains unchanged. No generic “Are you sure?” dialog.

## V. Filters/search

Current filter behavior is semantically and technically incomplete:

- database rows are capped at 100 before query/tag filtering;
- search can therefore return a false empty result;
- Income raw-type filter includes linked refund rows;
- Transfer raw-type filter can include savings transfer rows;
- Debt filter omits `liability_payment`;
- no account, category, date, owner, or status filters;
- all controls, Add, and tag management occupy one elevated card.

Recommended common controls:

- All;
- Income;
- Expense;
- Transfer;
- Search;
- More filters.

More filters sheet:

- event kind/product kind;
- account;
- category;
- date range;
- tags;
- ownership scope if visibility policy allows it;
- status/relationship only if a real support need exists.

Filters must operate on user-level semantic activities, not raw storage type alone. Use URL state for back/share behavior. Show active chips and Clear all. Keep Manage tags outside the daily filter control.

Search should ship only with complete server-side/cursor-compatible semantics. Search note, category, account, product/counterparty, and independent tags. If complete search cannot fit 09B, omit/defer it rather than present a search box that silently scans only the newest 100 rows.

## W. Empty/loading/error/offline

| State                     | Required behavior/copy direction                                                                                           |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| No transactions ever      | Explain that recorded income, spending, transfers, and product movements will appear here. Primary Add transaction.        |
| Filters return no results | “No transactions match these filters.” Primary Clear filters; Add remains secondary/global. Do not imply no money history. |
| Loading                   | Transaction-specific top bar, compact control skeleton, date-header skeleton, and 3–5 flat row skeletons.                  |
| Read failure              | Local status surface: “Couldn’t load transactions” + Retry. Preserve known filter state. Never render as empty history.    |
| Detail missing            | “Transaction not found” only for a proven not-found result.                                                                |
| Detail/read failure       | Separate unavailable/error result with Retry.                                                                              |
| Offline                   | Keep cached/server-rendered history read-only; clearly block capture, transfer, refund, correction. Nothing is queued.     |
| Permission limited        | Preserve safe read context, hide/disable writes, and route to ownership/access recovery.                                   |

There is no route-specific Transactions loading boundary; the inherited Money skeleton represents a balance hero and account objects, not an event stream. Query functions swallow errors into `null`, preventing the product error boundary from distinguishing failure. Both should be fixed in the list/read-model batch.

## X. Privacy

Current protected values:

- list-row amounts through `TransactionRow` → `FinancialValue`;
- primary detail amount through `Balance` → `FinancialValue`.

Current leaks:

- detail audit-chain amounts;
- capture preview sentence and account-effect receipt sentence;
- transaction receipt amount rows because callers omit `financial`;
- transfer preview, confirm summary, source/destination deltas, and receipt;
- refund maximum, original amount, refund amount, and capacity restored;
- correction original/corrected amount and receipt;
- any raw amount interpolated into explanatory text.

Fix the root contract. Every read-only money value in `TransactionReceipt` and `ConfirmSummary` must be explicitly/structurally financial, and interpolated financial sentences must compose `FinancialValue` rather than hide raw text inside translations. Add a development-time/type-level failure for omitted classification where practical; do not rely on reviewers noticing a missing optional boolean.

Privacy-hidden requirements:

- visual and accessible text both mask;
- list, detail, audit chain, previews, confirmations, receipts, transfer summaries, and product relationship rows remain consistent;
- layout does not shift enough to reveal magnitude;
- active amount input may remain user-legible while the user is entering it, but all read-only summaries around it must mask.

## Y. Accessibility

Keep/reinforce:

- minimum 44px targets;
- semantic lists and links;
- visible labels;
- tabular amount numerals;
- text labels in addition to color/sign;
- shared focus-ring tokens.

Required corrections:

- Date groups need headings associated with their event list.
- A row’s accessible name should communicate title, semantic kind, account route, amount/sign, and status without relying on the icon.
- Transfer must be announced as a transfer/neutral movement even though it has no plus/minus sign.
- Vietnamese primary/secondary text must wrap; current `truncate` on both lines can remove financial meaning.
- Confirmation focus starts at the heading/consequence summary, not the Confirm action.
- RHF forms should focus the first invalid field; manual refund/correction forms need field-linked errors or migration to the established RHF/Zod architecture.
- Async errors/success must be announced through the established status system.
- Native selects/date controls currently conflict with the UI constitution unless a documented exception exists; use canonical shared/HeroUI field primitives while preserving RHF value contracts.
- Amount labels include currency and source/destination meaning.
- Reversed/refunded/corrected state must be text, not color-only.

## Z. Motion

Transactions does not need bespoke choreography.

Current positive behavior:

- no animated money values;
- no list stagger;
- no scroll-triggered row reveals;
- row press/hover uses small CSS transform and respects `motion-reduce`;
- form steps do not stack Motion over HeroUI transitions.

Target:

- keep the shared shell/page transition only;
- use CSS state changes for chips/rows/buttons;
- if confirmation/receipt changes require presence animation, reuse `motion/react` and shared tokens at a client leaf;
- no count-up, parallax, infinite decoration, scroll hijacking, or animated reorder of financial rows;
- reduced motion disables transforms and preserves immediate, stable content.

No new motion dependency or shared motion abstraction is justified.

## AA. Responsive/theme

The centered 440px shell is intentional at 390, 440, 768, and 1280. Desktop must preserve the same single-column event stream; do not add a second column, transaction table, KPI rail, or Bento dashboard.

At 390/440:

- header action remains reachable without competing with title wrap;
- four common chips may horizontally scroll or wrap once without becoming a seven-option grid;
- amounts remain right-aligned and never overlap long Vietnamese text;
- titles/metadata wrap before financial meaning truncates;
- bottom navigation/safe area never covers the last row or action;
- sheets use shared safe-area behavior.

At 768/1280:

- preserve the 440px shell;
- do not stretch filters or row reading lines;
- hover/focus states may enrich interaction without changing information architecture.

Use semantic design tokens only. List rows are flat in light and dark. Credit/debit/refund/neutral tones must meet WCAG AA and retain signs/text. The checked-in 390px light screenshots show the current filter and list as card-heavy; runtime dark/VI and privacy states were unavailable and remain mandatory verification for implementation.

## AB. Performance

Positive current properties:

- server-rendered route and data loading;
- bounded query;
- one activity projection pass;
- joined read rather than per-row client requests;
- no observer-heavy motion;
- maximum 100 rendered raw rows prevents an unbounded DOM today.

Correctness/performance issues:

- limit-before-search/tag filtering is incomplete;
- no cursor means older history is unreachable;
- ordering by creation in SQL then effective date in memory is inconsistent;
- available tags are loaded on every list request even when the selector need not be open;
- grouped activities need a stable cursor/order key;
- transfer/detail navigation loads one raw row rather than one event.

Implementation target:

- cursor pagination on effective date + creation timestamp + stable ID;
- server-side semantic filtering/search compatible with the cursor;
- 25–50 user-level events per page;
- defer heavy tag/filter option loading until More filters opens if the server/client boundary permits;
- preserve previous results while applying filters when practical;
- no virtualization until measured continuous-list volume proves pagination insufficient.

## AC. Cross-module integrity

| Boundary                          | Current truth                                                                 | Required action                                                                             |
| --------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Transactions ↔ Home               | Shared central Income/Expense semantics                                       | Preserve; add classification regression matrix for every ledger type and linked state.      |
| Transactions ↔ Monthly Review     | Existing consistency tests align ordinary/reversed/refund/sale/transfer cases | Extend to debt interest, card cashback/refund, savings tax/interest, and all product types. |
| Transactions ↔ Accounts           | Liquid balances use signed ledger rows; opening balance is separate           | Keep one source of sign truth; decide opening-balance history representation.               |
| Transactions ↔ Plan/Jars          | Refund restores jar capacity; categories/jars influence review/budgets        | Do not call category/jar “just metadata” until reclassification side effects are specified. |
| Transactions ↔ Credit cards       | Purchase/payment classification avoids double counting                        | Make ledger + statement + billing item + refund/correction atomic and owner-controlled.     |
| Transactions ↔ Debt/Loans         | Principal movements are neutral                                               | Split/classify scheduled interest/fees so Expense is not understated.                       |
| Transactions ↔ Savings            | Principal movements neutral; interest/tax rows exist                          | Preserve product links and clarify earned-interest vs payout movement.                      |
| Transactions ↔ Investments        | Buy/sell/income/fee semantic types are explicit                               | Block generic correction; owner operation and cash event must remain linked.                |
| Transactions ↔ Together/ownership | Account/product has household/personal scope; transaction read model omits it | Add inherited scope to read model and settle visibility/label policy.                       |
| Transactions ↔ Privacy            | Global provider/pattern exists                                                | Make all summaries and relationship amounts consume it.                                     |
| Transactions ↔ Inbox              | Uncategorized capture may create review                                       | Keep receipt link contextual; never silently redirect.                                      |

Source-confirmed integrity conclusions:

- Transfer is not counted as Income/Expense by central semantics.
- Credit-card purchase and payment are not double-counted by intended classification.
- Linked refund is not counted as ordinary Income.
- Physical delete is blocked.
- Investment buy/sell and savings principal transfers are excluded from consumption spending.
- **However**, generic correction can break linked events; card auxiliary writes can drift; and scheduled loan interest is incorrectly excluded from Expense.

## AD. P0/P1/P2 findings

### P0 — integrity/privacy blockers before UI work

| ID    | Finding                                                              | Evidence / impact                                                                                                   | Required gate                                                                          |
| ----- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| P0-01 | Generic correction accepts product/transfer/card rows                | Detail eligibility checks only status/links; SQL accepts any original type and maps non-expense reversal to expense | Restrict ordinary correction at UI + application + RPC; add owner-specific paths/tests |
| P0-02 | Credit-card transaction billing is non-atomic and failure is ignored | Ledger RPC commits, assignment performs multiple writes, caller discards `{ok:false}`                               | One atomic card command or durable compensating/recovery contract before success       |
| P0-03 | Generic card refund/correction bypasses billing                      | Refund/correction mutate transaction truth without statement/item/outstanding reconciliation                        | Block generic actions and implement card-owner atomic commands                         |
| P0-04 | Scheduled loan interest is classified as neutral principal payment   | Loan RPC puts principal + interest in one `liability_payment`; central semantics exclude full amount from Expense   | Split ledger events or project a canonical payment component classification atomically |
| P0-05 | Detail amount sign is wrong for most non-ordinary outflows           | Every non-`expense` type receives `+`                                                                               | Use central event semantics/event projector everywhere                                 |
| P0-06 | Privacy mode leaks financial amounts                                 | Audit chain, previews, confirms, refund limit, and receipts bypass `FinancialValue`                                 | Harden shared summary contracts and add privacy regression coverage                    |

### P1 — required product-quality fixes

| ID    | Finding                                                                                                               |
| ----- | --------------------------------------------------------------------------------------------------------------------- |
| P1-01 | Search/tag filtering happens after the newest-100 limit and can return false empty history.                           |
| P1-02 | Raw-type filters misclassify refund/savings and omit liability payments.                                              |
| P1-03 | Query failure collapses into empty/not-found; Transactions lacks a route-specific loading shape.                      |
| P1-04 | No date is visible; no date grouping; same-day activity ordering is underspecified.                                   |
| P1-05 | Grouped transfer opens one raw leg instead of a transfer detail.                                                      |
| P1-06 | Refund receipt shows original date; refund/correction forms omit effective-date control.                              |
| P1-07 | UTC “today” default can be the previous Vietnamese calendar date.                                                     |
| P1-08 | Duplicate type selectors can contradict each other; category changes can retain stale jar state.                      |
| P1-09 | Refund remains gross-excluded rather than reducing Home spending; product reporting policy is unresolved.             |
| P1-10 | Transaction read model omits inherited personal/household ownership context.                                          |
| P1-11 | Card cashback is ordinary Income despite rebate-like UI wording; classification policy is unresolved.                 |
| P1-12 | Credit-card installment fee/interest schedules lack an explicit Transactions classification projection.               |
| P1-13 | Manual refund/correction forms lack shared RHF/Zod field/error/focus architecture.                                    |
| P1-14 | Native select/date controls conflict with the current HeroUI/shared-form constitution without a documented exception. |
| P1-15 | Long Vietnamese row text is truncated instead of wrapping before meaning is lost.                                     |

### P2 — polish/simplification

| ID    | Finding                                                                                                                       |
| ----- | ----------------------------------------------------------------------------------------------------------------------------- |
| P2-01 | Filter, list, and form use excessive rounded/elevated containers for event/task surfaces.                                     |
| P2-02 | Add transaction and Manage tags are embedded in the filter card rather than separated by hierarchy.                           |
| P2-03 | Full-width Back to Money duplicates established navigation.                                                                   |
| P2-04 | Receipts expose raw legs/short IDs and too many equal-weight next actions.                                                    |
| P2-05 | Content uses implementation/back-office language: “Link refund”, “3-way”, “audit chain”, `reverses_transaction_id`, “Posted”. |
| P2-06 | Current “Activity / Recent account activity” header is too vague for the canonical transaction source.                        |

## AE. Product decisions required

Only these decisions remain unresolved by inspected source/contracts:

1. **Refund reporting:** should Home spending remain gross, or should linked refunds reduce the original period/category’s net spending? Current behavior is gross expense with refund excluded.
2. **Card cashback/rebate semantics:** is it household Income or a reduction of card spending/obligation? Current source records ordinary Income.
3. **Opening balance history:** remain an account-only starting fact, or appear as a synthetic read-only event in Account Detail/global Transactions? Do not create a fake posted transaction solely for display.
4. **Personal-scope visibility:** which household members may see personal-account transaction details, and what Shared/Personal label/filter is required? Current RLS/read model does not expose a UI distinction.
5. **Search scope:** ship complete server-side search in 09B, or intentionally defer search until it can search all history. The current newest-100 search is not acceptable.
6. **Filter persistence:** URL/back-navigation only, or remembered across visits? Source defines URL state but no persistence policy.
7. **Generic reversal eligibility:** which ordinary states, if any, receive a user-facing reversal command beyond refund/correction? Hard delete is not a decision; it is already prohibited.

Generic Add transaction versus separate type pages is **not** unresolved: the existing owner route and canonical fast-capture contract support one generic type-first route. Account-context preselection is also an implementation detail, not a product decision.

## AF. Implementation plan

### 09P0 — Financial Integrity Gate (must precede 09B)

- Restrict generic correction to standalone ordinary Income/Expense in UI, application command, and RPC.
- Block product/transfer/card actions until owner-specific atomic commands exist.
- Make credit-card purchase/cashback/refund/correction statement reconciliation atomic or explicitly recoverable; never return success on assignment failure.
- Correct scheduled loan principal/interest/fee transaction classification.
- Replace detail sign logic with central semantics.
- Harden privacy contracts for receipt/confirm/relationship values.
- Add one exhaustive cross-screen classification/integrity matrix covering every ledger type, reversed/refund states, card actions, debt/loan components, savings, investments, and transfer groups.

Exit: no known path can make ledger, account balance, card statement, debt/loan state, savings/investment owner state, Home Income/Expense, or privacy mode disagree.

### 09B — Transaction List IA + Flat Event Rows

- Add stable event projection fields and semantic filter eligibility.
- Implement date grouping and deterministic ordering.
- Flatten list/date groups and compact header/filter hierarchy.
- Add distinct no-history, no-match, loading, error, offline, and permission states.
- Add cursor/load-more; ship complete server search or defer search.
- Preserve scroll position and context.

Exit: populated/empty/error/filter states verified at 390, 440, 768, and 1280 in EN/VI, light/dark, plus privacy hidden.

### 09C — Create Transaction Form

- Keep the generic type-first route; remove duplicate direction selector.
- Flatten form surfaces and use canonical shared/HeroUI fields.
- Fix local-calendar default, stale hidden values, account eligibility/context preselection, and Uncategorized semantics.
- Simplify privacy-safe receipts and next actions.
- Preserve fast ordinary capture and fresh idempotency/reset behavior.

Exit: Expense and Income initial, validation, pending lock, failure preservation, success receipt, Record another, offline, privacy, and long Vietnamese states verified.

### 09D — Transfer/Refund + Financial Classification UX

- Add transfer-aware detail/read model and one-event receipt.
- Keep atomic transfer preview-confirm.
- Add effective date/destination/refund relationship truth.
- Apply approved refund reporting decision.
- Present debt/savings/investment/card semantic event labels without changing owner business rules.

Exit: transfer and refund previews/receipts/relationships match balances and central classification; no raw-leg user journey is required.

### 09E — Transaction Detail + Edit/Reversal

- Rebuild detail from the user-level event projector.
- Separate money facts, meaning, relationships, and owner context.
- Keep transaction tags meaning-only; add no metadata edit without a defined command contract.
- Implement only approved owner-specific correction/reversal actions; no hard delete.
- Replace implementation-language copy in EN and VI together.

Exit: ordinary, transfer, refund, correction, card, debt/loan, savings, and investment detail variants show correct sign, owner, relationship, action eligibility, and privacy.

### 09F — Accessibility, Motion, Responsive, and Final Regression

- Keyboard/focus/error announcement audit.
- Screen-reader row/detail/confirmation labels.
- Reduced-motion and no-animated-money verification.
- WCAG AA light/dark checks.
- 390, 440, 768, 1280 EN/VI evidence, including long Vietnamese, populated/empty/error/offline/privacy states.
- Full financial classification and cross-module regression suite.

Exit: browser evidence is attached; no P0/P1 remains in the changed flow; then stop. Do not begin any later Transactions batch automatically.
