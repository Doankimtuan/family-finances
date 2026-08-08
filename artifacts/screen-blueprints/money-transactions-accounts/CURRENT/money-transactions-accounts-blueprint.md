# Phase E2 - Money, Transactions, And Accounts Blueprint

Status: Canonical implementation blueprint.

Scope: Money Hub, Accounts, Transactions, Transfer, transaction correction, transaction refund, and shared batch patterns. This document forecasts implementation work; it does not implement code, change business behavior, change routes, or introduce new financial calculations.

Authorities used: Phase B IA, Phase C UX redesign, Phase D design system evolution, Phase E0/E0.1 calibration artifacts, Phase E1/F1 App Shell and Home blueprint, Accounts/Transactions/Categories canonical domain contracts, current Money source.

## 1. Current Surface Inspection

Reusable calibrated parts:

- `AppViewport`, `ChromeShell`, `Page`, `TopAppBar`, `Section`, `Balance`, `TransactionRow`, `EmptyState`, `StatusAlert`, `Dialog`, `BottomActionBar`, `AmountField`, `Button`, and `TextField` already define most screen structure.
- `Money Hub` already uses the calibrated mobile shell, real-position summary, account grouping, activity preview, offline banner, and Money product links.
- `MoneyHubAccounts` already supports progressive disclosure for account grouping inside the hub.
- `TransactionsFilterBar` exists for list query and type filtering.
- Transaction detail already shows status, account, date, note, jar/category meaning, correction/refund entry points, and audit chain.
- Correction/refund server actions already return related record identifiers: `correctionTransactionId`, `reversalTransactionId`, `refundTransactionId`, and `capacityRestored`.

Implementation-relevant issues:

- Successful transaction capture currently redirects to Money or Inbox. It must show a success receipt or route to transaction detail with a receipt state; it must not silently return to the form or hub.
- Transaction capture currently handles income and expense only. Transfer has a canonical route responsibility under Money but needs explicit UI patterning before implementation.
- Accounts list route currently redirects to Money. The canonical experience is Money Hub account scan plus account detail; do not reintroduce a dense standalone dashboard list unless implementation proves the hub cannot carry it.
- Create account currently closes and refreshes. When opening balance creates a real posting, the user needs preview-confirm and receipt behavior.
- Correction has a two-step warning, but the preview must name source/destination, original transaction, reversal/correction records, amount, date, reversibility, and final destination.
- Refund lacks an explicit preview-confirm step and success receipt.
- Detail pages sometimes use local `div` page frames instead of `Page`; implementation may normalize only where this batch touches the screen.

## 2. IA And Route Contract

Money owns financial reality, account containers, transaction activity, capture, transfer, correction, refund, and money-product entry points.

Canonical primary tabs remain exactly:

- Home
- Money
- Plan
- Inbox
- Together

Money routes in scope:

| Screen | Route | Owner | Entry | Completion |
|---|---|---|---|---|
| Money Hub | `/money` | `ledger` | Bottom tab, Home, completion returns | Child routes or hub scroll position |
| Accounts overview | `/money` account group | `ledger` | Money Hub | Account detail or create account receipt |
| Account detail | `/money/accounts/[id]` | `ledger` | Money Hub, transaction detail context | Money Hub or transaction list |
| New account | Money Hub dialog/sheet or future `/money/accounts/new` if added | `ledger` | Money Hub | Account detail or receipt then detail |
| Transactions list | `/money/transactions` | `ledger` | Money Hub, Home | Transaction detail or capture |
| New transaction | `/money/transactions/new` | `ledger` | Home, Money, Transactions, Account detail | Receipt then transaction detail or originating list |
| Transfer | `/money/transactions/new` mode or future owner route if added | `ledger` | Money Hub, Account detail | Receipt then transfer transaction detail |
| Transaction detail | `/money/transactions/[id]` | `ledger` | Transactions, receipt, deep link | Transactions |
| Correct transaction | `/money/transactions/[id]/correct` | `ledger` | Transaction detail, Inbox context | Receipt then correction transaction detail or Inbox origin |
| Refund transaction | `/money/transactions/[id]/refund` | `ledger` | Transaction detail, Inbox context | Receipt then original transaction detail or Inbox origin |

Rules:

- Do not add primary tabs, move Money screens to Home/Plan/Inbox, or make Home write ledger data.
- Use `APP_PATH` and route builders from `modules/tenancy/application/app-path.ts`; add missing constants there before use.
- `/money/add`, `/money/cards`, and `/money/cards/[id]` are outside the canonical navigation mental model. Do not link new UI to retired mental-model routes.
- Cross-module origin may be preserved through search params or router state, but the destination route remains owner-based and stable.

## 3. Money Hub Blueprint

Money Hub answers progressively:

1. What real money position do we have?
2. Where is that money?
3. What changed recently?
4. What can I do now?
5. What other money products are tracked?

Exact vertical order:

| Region | Purpose | Required content | Pattern | Primary interaction | Visibility |
|---|---|---|---|---|---|
| Top app bar | Establish Money ownership. | Title and real-position hint. | `TopAppBar` in `Page` | None by default. | Always. |
| Status lane | Qualify offline, loading failure, stale, or permission-limited facts. | Source/freshness and recovery action when available. | `MoneyOfflineBanner`, `StatusAlert` | Refresh or owner recovery. | Only when needed. |
| Real position | Dominant owned-money fact. | Total financial position, currency, freshness/source if available. | `Section` emphasized, `Balance` or future `MoneySummary` | Capture transaction for active households. | Always when position can load; empty-safe when no data. |
| Quick actions | Fast daily money work. | Capture income/expense, transfer, add account. | `QuickAction`/buttons or compact rows | One visually primary action per state. | Always, but state-specific. |
| Account grouping | Show real containers without dashboard density. | Liquid accounts, credit obligations, partial/stale labels, add account entry. | `MoneyHubAccounts`, `BalanceRow`/account rows | Open account detail. | Always; empty state when no accounts. |
| Recent activity | Show last real movement. | 3 to 8 transaction rows with direction, amount, account, date/status where available. | `Section`, `TransactionRow` | Open transaction detail. | Hide only when no activity; show empty state instead. |
| Search entry | Route to transaction search. | Search affordance or "See activity" link. | Search row/link to `/money/transactions` | Open Transactions list with focus on search. | Near activity. |
| Money products | Entry points only for included future inventory. | Debts, loans, savings. | Existing `MoneyMoreLink` rows | Open product list. | Below real-position/account/activity content. |

Hub density rules:

- One dominant amount only: real position.
- Account count and activity count may be secondary facts, not KPI cards competing with balance.
- Rows and sections should do most grouping. Cards are reserved for bounded account/product objects.
- No desktop banking dashboard, charts for decoration, product marketing hero, glassmorphism, neon finance palette, or nested card composition.
- Credit limits and outstanding balances must not inflate real position.

Money Hub states:

| State | Behavior |
|---|---|
| No accounts | Explain no real containers are tracked. Primary action: add account. Secondary action: learn/capture disabled until account exists. |
| Accounts but no activity | Show real position and accounts. Activity empty state offers capture. |
| Partial/stale position | Preserve available facts, label source/freshness near affected amount, route to owner recovery. |
| Offline | Read-only hub. Block account creation, capture, transfer, correction, refund; explain online-first money mutation. |
| Permission denied | Hide write actions and route to Together/access recovery. |
| Loading | Skeletons preserve summary, account row, and activity row shapes. |
| Recoverable error | Show local error with retry; do not imply money changed. |

## 4. Accounts Blueprint

Accounts represent real containers, not jars, goals, budgets, plans, reminders, or virtual envelopes.

Account overview:

- Canonical overview is the Money Hub account group.
- Show grouped liquid accounts first, credit obligations separately, then money-product entry points.
- Each account row shows recognizable name, broad type, balance/owed/available meaning, status if not active, and optional freshness label.
- Account rows open account detail. Row-level destructive actions stay out of hub rows.

Account detail:

| Region | Required content | Interaction |
|---|---|---|
| Top app bar | Account name and broad type. | Back to Money Hub. |
| Status lane | Offline, stale, permission, needs review, historical/closed labels. | Recovery route if applicable. |
| Summary | Balance with real-money meaning, currency, status, ownership hint. | None. |
| Quick actions | Capture, transfer from/to this account if active, view activity. | One primary action; disabled/hidden when historical/closed/offline. |
| Account facts | Type, institution if known, created/opening context where available. | Edit metadata. |
| Activity | Recent account-specific transactions. | Open transaction detail. |
| Lifecycle actions | Edit, archive/historical, close, restore if eligible. | Confirmation required for state-changing actions. |

Create account:

- Use a single screen, sheet, or short dialog only while content stays readable in the 440px shell. If opening balance/credit-card setup grows beyond comfortable sheet height, use a page.
- Required-first order: account name, broad account type, opening balance/date when applicable, credit-card settings only for credit card.
- Opening balance preview must state whether a real ledger posting will be created, amount, account, effective date, and resulting account balance.
- Creating a credit-card account must state credit limit is not owned money and does not increase real position.
- Prevent duplicate submit while pending.
- On failure, preserve input and state that no account state or money posting changed.
- On success, show receipt or account detail with receipt state.

Edit/archive/close:

- Metadata-only edits use lightweight confirmation or inline save feedback when no money facts change.
- Archive/mark historical/close requires confirmation naming active-use impact, history preservation, and whether money moves. Accounts-only lifecycle changes do not move money.
- Historical/closed accounts are viewable and searchable but not ordinary transaction targets.

## 5. Transactions List Blueprint

Transactions are real ledger events only. Categories and jar references explain meaning; they do not move money.

List hierarchy:

| Region | Required content | Pattern |
|---|---|---|
| Top app bar | Transactions title and plain subtitle. | `TopAppBar` |
| Status lane | Offline/read-only, stale, partial, permission, recoverable error. | `MoneyOfflineBanner`, `StatusAlert` |
| Search/filter | Search query, type filter, clear action, result count if available. | `TransactionsFilterBar`, future `SearchField` |
| Grouped rows | Date grouping when volume warrants it; otherwise simple rows are acceptable. | `TransactionRow` |
| Empty/search-empty | Owner-specific empty state. | `EmptyState` |
| Primary action | Capture/transfer entry. | Top bar action or thumb-reachable row/action |

Row content:

- Title: note, category, or direction fallback.
- Subtitle: account, date, status, or linked relation when relevant.
- Amount: signed and formatted using locale/currency utilities.
- Tone: income, expense, transfer, refund, correction, reversed/corrected status with text meaning beyond color.
- Linked events: refund/correction/reversal rows should disclose relation in subtitle or status label.

Long-list behavior:

- Preserve scroll position when opening detail and returning.
- Search/filter updates must not imply missing money when no results match.
- Loading search may preserve previous rows with a subtle status.
- Rows remain at least 44px high and keyboard focusable.

## 6. Transaction Capture And Transfer Blueprint

Fast capture must remain possible in about 15 seconds for familiar daily use.

Capture modes:

| Mode | Required fields | Optional/contextual fields | Preview | Confirmation |
|---|---|---|---|---|
| Expense | Amount, account, effective date defaulting today | Category, jar, note | Account decreases by amount; category/jar explain meaning only | No extra confirmation for ordinary same-day expense unless domain validation requires. |
| Income | Amount, account, effective date defaulting today | Category, jar, note | Account increases by amount; category/jar explain meaning only | No extra confirmation for ordinary same-day income unless domain validation requires. |
| Transfer | Amount, from account, to account, effective date defaulting today | Note | Source decreases, destination increases, household position unchanged | Preview-confirm required. |

Required field order:

1. Mode: income, expense, transfer.
2. Amount.
3. Account for income/expense, or from/to accounts for transfer.
4. Effective date.
5. Meaning: category/jar for income/expense only.
6. Note.
7. Preview.
8. Save or preview-confirm.

Preview rules:

- Amount fields show currency and meaning.
- Transfer preview must say household real position is unchanged.
- Category and jar labels must never imply they move money.
- Invalid account pairs are blocked before submit. Same-account transfer is invalid unless a future domain contract explicitly supports internal correction.
- Offline money mutations are blocked.

Success receipt is required after successful creation.

Receipt content:

| Receipt field | Income/expense | Transfer |
|---|---|---|
| Outcome | "Recorded" style success state. | "Transfer recorded" style success state. |
| Transaction summary | Direction, note/category fallback, transaction id or short reference if exposed. | From account to account, neutral transfer label. |
| Amount | Signed amount and currency. | Amount and currency; no income/expense sign. |
| Source/destination account | Account affected. | From account and to account. |
| Category | Selected category or unmapped/review needed. | Not applicable. |
| Effective date | Shown in localized format. | Shown in localized format. |
| Related records | Inbox review item if created; jar meaning if linked; account balance effect if available. | Transfer legs/linked records if represented separately. |
| Real money | Changed for income/expense. | Location changed; household total unchanged. |
| Plan | Changed only if existing domain result says capacity/meaning changed; otherwise unchanged or not applicable. |
| Decision | Review recorded when Inbox item created; otherwise not applicable. |
| Next actions | View transaction detail, record another, go to Money, go to Inbox if review created. | View transfer detail, record another, go to Money. |

Close/redirect behavior:

- Default primary receipt action: view transaction detail.
- If the create action produced an Inbox item that requires user attention, show "Open Inbox review" as a secondary or contextual action, not as a silent redirect unless the action cannot safely continue without review.
- "Record another" resets the form with a new idempotency key.
- "Done" returns to origin if known, otherwise `/money`.

Duplicate-submit protection:

- Generate one idempotency key per attempted form instance.
- Disable submit while pending.
- After success, lock the completed form state behind the receipt; do not allow the same form submit again.
- When "Record another" is selected, create a fresh form instance and fresh idempotency key.

Failed-save recovery:

- Preserve all entered fields.
- Show the error near the form top and field-specific focus for validation failures.
- State that no transaction was recorded and no account balance changed.
- For unknown/permission/month-locked failures, give a safe route and retry only when meaningful.

## 7. Transaction Detail Blueprint

Detail hierarchy:

| Region | Required content |
|---|---|
| Top app bar | Transaction detail title, direction/status subtitle, back to Transactions. |
| Status lane | Offline, permission, stale, corrected/reversed/refunded relationship. |
| Summary | Signed amount, direction, currency, effective date. |
| Facts | Account, status, note, category, jar meaning, created/updated source if available. |
| Relationship story | Original/refund/correction/reversal links and audit chain. |
| Actions | Edit allowed metadata, correct, refund, reverse/archive if supported, back. |

Rules:

- Detail must separate real money facts from meaning metadata.
- Metadata-only edit must not imply account balance changed.
- Corrected/reversed/refunded transactions remain explainable; no silent edits.
- Refund linked transactions must not look like ordinary income.
- Correction and reversal stories should be visible before actions when they exist.

## 8. Correction Blueprint

Correction changes financial truth by preserving original story and appending related records. It requires preview-confirm.

Before confirm, show:

- Original transaction: amount, direction, account, effective date, category/jar/note if available.
- New corrected transaction: amount, direction, account, effective date, category/jar/note.
- Source/destination account effect.
- Related records to be created: reversal transaction and correction transaction.
- Reversibility/audit statement: original is preserved and correction story is visible.
- Plan/meaning impact only if the existing action result/domain contract provides it.

Confirm behavior:

- Confirm label must be specific, not generic.
- Destructive/financial confirm should not be the first focusable control.
- Pending state locks controls and prevents duplicate submit.
- Cancel returns to transaction detail with input preserved if still on page.

Success receipt:

- Show correction completed.
- Show original transaction, reversal record id/path if exposed, correction transaction id/path, corrected amount/account/date/category.
- Next actions: view corrected transaction detail, view original audit chain, return to Transactions, record another only if current product intentionally supports it.
- If launched from Inbox, include return to Inbox review context.

Failure:

- Preserve edits.
- State that no correction was recorded and original transaction remains unchanged.

## 9. Refund Blueprint

Refund is a linked real-money event related to an original expense. It is not ordinary income when linked.

Before confirm, show:

- Original expense amount, account, date, category/jar meaning.
- Maximum refundable amount and requested refund amount.
- Destination account.
- Effective date.
- Related refund record to be created.
- Capacity restoration only when existing server result/domain contract provides the amount.
- Warning that duplicate refund is blocked when not eligible.

Confirm behavior:

- Preview-confirm required.
- Pending locks controls and prevents duplicate submit.
- Invalid amount, ineligible original, offline, and permission failures are blocked before or during submit with no state change.

Success receipt:

- Show refund recorded.
- Show amount, destination account, effective date, original transaction link, refund transaction link if exposed, and capacity restored if returned.
- Next actions: view original transaction with refund relation, view refund transaction if route is exposed, return to Transactions, return to Inbox origin if applicable.

Failure:

- Preserve amount/note.
- State that no refund was recorded, no duplicate refund occurred, and no account balance changed.

## 10. Shared Batch Patterns

Promote or reuse shared patterns only when the local use repeats enough to justify it. Prefer module-local composition first.

| Pattern | Use | Existing primitive | Missing implementation detail |
|---|---|---|---|
| Financial summary | Money Hub and account detail dominant amount. | `Balance`, future `MoneySummary` | Source/freshness and exact accessible label. |
| Balance rows | Account/product lists and previews. | `AccountCard`, account rows, future `BalanceRow` | Stale/selected/disabled variants. |
| Account rows | Hub grouping and account pickers. | `MoneyHubAccounts`, local radio rows | Status labels for historical/closed/needs review. |
| Transaction rows | Activity, list, detail relations. | `TransactionRow` | Transfer/refund/correction status variants. |
| Filter/search | Transactions list. | `TransactionsFilterBar`, future `SearchField` | Result count, clear, loading/empty copy. |
| Amount input | Capture/correction/refund/account opening. | `AmountField` | Accessible labels with amount meaning. |
| Money movement preview | Transfer, refund, correction, opening balance. | `StatusAlert`, future `MoneyMovementPreview` | Source/destination/related-record layout. |
| Success receipt | Capture, transfer, refund, correction, opening balance. | `SuccessState` contract, local composition | Canonical receipt component or flow-local receipt state. |
| Destructive confirmation | Archive/close/correct/refund/opening balance. | `Dialog`, `BottomActionBar` | Preview-confirm content and focus order. |
| Long-list behavior | Transactions, account activity. | List rows | Scroll restoration and grouped dates if needed. |

## 11. Content And Localization Contract

- All visible strings go through i18n. Add English and Vietnamese messages together.
- Copy should be calm, young, and financially clear without slang, shame, or bank-back-office language.
- Avoid idioms that localize poorly.
- Amount labels include exact currency and meaning in accessible labels.
- Dates use locale formatting and must name effective meaning.
- Statuses must have text labels, not color-only meaning.
- Vietnamese strings may be longer; rows must wrap before truncating financial meaning.

## 12. Accessibility Contract

- WCAG AA is required in light and dark mode.
- Focus order follows task order: title, status, amount/facts, preview, actions.
- All touch targets are at least 44px.
- Dialogs/sheets trap focus and restore focus on close.
- Preview-confirm focus starts at heading/consequence summary; confirm action is specific and not the first focus target.
- Errors are announced, field-linked where possible, and preserve input.
- Loading states announce only when user action is blocked.
- Reduced motion removes nonessential transitions; money values do not animate.
- Screen-reader labels include real/plan/decision impact in receipts.

## 13. Visual Blueprint

Visual read: mobile product workflow for young Vietnamese households, with Calm Household Finance language. Dials: low variance, low motion, medium daily-app density.

Required visual qualities:

- Light, fast, calm, financially clear.
- 440px mobile-first shell; same constrained app on desktop.
- Vertical sections, rows, bottom action bars, short sheets/dialogs.
- Deep teal primary action through semantic tokens.
- Tabular amount typography and direct labels.
- Cards only for bounded objects or meaningful summaries.

Prohibited visual drift:

- Dense banking dashboards.
- Spreadsheet-like tables.
- Crypto/trading visual language.
- Product marketing hero sections.
- Random gradients, glass surfaces, neon accents, decorative charts, module-specific color themes.
- Card-heavy composition where rows or sections would be clearer.

## 14. Verification Requirements

Implementation is not complete until verified in a real browser:

- 390px light English.
- 390px light Vietnamese.
- 440px dark English.
- At least one long Vietnamese string state.
- Empty account/activity state.
- Offline/read-only state.
- Transaction capture success receipt.
- Transfer preview-confirm and receipt if transfer is implemented in the batch.
- Correction preview-confirm and receipt.
- Refund preview-confirm and receipt.
- Failed save recovery for capture/refund/correction.

Browser evidence should be saved under this package or the implementation phase evidence folder, with filenames that identify screen, viewport, theme, locale, and state.

