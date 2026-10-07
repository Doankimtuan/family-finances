# Transactions Phase 0 — Navigation & Critical Path Performance Investigation

**Scope:** investigation only. No transaction, correction, refund, transfer, or delete was submitted. No production code was changed. Browser probes used only existing read-only data; all identifying values and financial values are omitted.

## Executive findings

The user waits for different work on each destination:

- **Transactions List:** the product session gate, the first transaction-event query and any needed grouped-row completion, plus category/jar filter options and transaction-tag options. The page awaits all of these before returning the useful rows.
- **Add Transaction:** the full capture reference model: account rows, household currency, current owner eligibility, account-balance presentation data, expense and income categories, jars, and transaction tags. The first usable controls appear only after the whole server page resolves.
- **Transaction Detail:** a base transaction read, a second read for the same transaction to project its activity, audit-chain reads, and available transaction-tag options. For transfers, the activity loader then reads the paired leg in a second sequential transaction query.
- **Transfer form:** the same Add route and account model. Switching into Transfer after Add has loaded is local and makes no network request. A direct Transfer-mode route still loads category, jar, and tag references that the Transfer form does not use.

**First unnecessary dependency on the forward path:** Transactions List waits for category, jar, and tag filter references before returning useful rows, even though those references are not needed to read the rows. The clearest directly measured navigation regression is later: Transaction Detail’s app Back is a fixed Link to the List. When the List is already in browser history, this starts a new RSC request; browser-history Back restores the existing 25 rows without one.

**Recommended Phase 1 — one direction:** make Transaction Detail return through browser history when it has an in-app predecessor, with the Transactions List as the deep-link fallback. This is supported by the direct app-vs-history measurements below. No implementation was started.

## Flow map and actual architecture

| Surface            | Route / entry                                                               | Main components and data path                                                                                                                                          |
| ------------------ | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Money              | /money                                                                      | Money hub. The Transactions entry is a Next Link to the list.                                                                                                          |
| Transactions List  | /money/transactions                                                         | Page reads event activities, category/jar filter options, and transaction tags; renders TransactionsFilterBar and TransactionsActivityList.                            |
| Add Transaction    | /money/transactions/new                                                     | Page reads account/currency context, expense and income categories, jars, and transaction tags; renders MoneyCaptureEntry.                                             |
| Expense / Income   | Local mode in Add Transaction                                               | MoneyCaptureEntry owns mode state. CaptureTransactionForm is keyed by mode, so switching modes remounts its form state.                                                |
| Transfer           | Local mode in Add Transaction; also selected by the mode query parameter    | TransferCaptureFlow receives the same account list and currency as Expense/Income. It does not make a new read when selected after Add has loaded.                     |
| Transaction Detail | /money/transactions/[id]                                                    | Reads transaction, projected activity, audit chain, and available transaction tags in parallel at the page boundary. TransferDetail renders grouped transfer activity. |
| Edit / correction  | /money/transactions/[id]/edit redirects to /money/transactions/[id]/correct | Posted rows are immutable; correction is the supported edit-like flow.                                                                                                 |
| Refund             | /money/transactions/[id]/refund                                             | Separate refund flow and command.                                                                                                                                      |
| Delete             | No Detail delete control found                                              | A delete action/command exists but returns IMMUTABLE; it does not delete a posted row.                                                                                 |

The List CTA is a Link to Add. The center bottom-navigation Add action uses router.push, so it preserves the exact source entry. Add’s primary TopAppBar has no Back button; browser Back returns to the source. Detail’s TopAppBar instead uses a fixed Link back to the unfiltered Transactions List. The List TopAppBar links back to Money, or to the account page for an account-filtered statement.

The Add form has type, amount, account, category, date, note, optional jar and transaction-tag controls. Personal-scope expenses expose a Plan-jar choice based on the selected account. Currency and scope are not editable controls: currency comes from the household base currency; scope comes from the selected account. No recurring or attachment controls were found.

## Benchmark methodology

- Real authenticated browser and existing household data; same browser session, household, backend, Vietnamese locale, dark theme, and app mode for the sample runs.
- Browser viewport was 2560 × 1359; the centered app shell measured 440 px. System dark mode was active and reduced motion was not requested.
- A cold-ish observation means the first route visit after a full reload or a client-router cache miss. The Next development server and backend were already warm; these are not claims of a cold database or cold service.
- Warm samples were repeated in the same browser run. For high-variance Add visits, five warm page-Link samples were collected; the separate bottom-navigation path has four warm samples. List has three warm samples; Detail has three ordinary and five transfer observations.
- “Useful List” means 25 real transaction rows were present. “Add usable” means type, amount, date, and note controls were present and interactable; account and category references were also present. Detail readiness means the financial-summary page root and data were visible.
- Measurements use click-to-useful-UI plus browser Resource Timing for the RSC/document request. Server-to-Supabase spans were not available, so RSC duration is not labeled SQL time.

## Navigation baseline

| Transition                                    |  Cold-ish useful UI | Same-run warm useful UI                                   | Browser RSC timing / payload                                                                                                                                                      |
| --------------------------------------------- | ------------------: | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Money → Transactions List                     |            2,439 ms | 1,461 / 1,867 / 1,506 ms                                  | One RSC request per navigation. Cold-ish: TTFB 60 ms, request 2,322 ms, useful rows about 89 ms after completion. Warm request durations 1,367 / 1,784 / 1,436 ms; TTFB 52–88 ms. |
| List → Add via page Link                      |            1,420 ms | 2,618 / 1,858 / 1,477 / 3,497 / 2,836 ms; median 2,618 ms | One RSC request per navigation. Warm response durations 1,366–3,374 ms; TTFB 68–607 ms. Controls appeared about 82–124 ms after response completion.                              |
| Money/List → Add via center bottom navigation | 1,530 ms from Money | 2,096 / 2,302 / 1,960 / 2,270 ms                          | Separate router.push path; one RSC request. Warm response durations 1,835–2,171 ms.                                                                                               |
| List → ordinary Expense Detail                |            1,437 ms | 2,212 / 2,354 / 1,883 ms                                  | One RSC request. Cold-ish response 1,366 ms with 182 ms TTFB; warm responses 1,844–2,321 ms with 45–75 ms TTFB. Detail root appeared within 14–49 ms of response completion.      |
| Transfer-filtered List → Transfer Detail      |            1,683 ms | 2,090 / 1,688 / 1,555 / 1,241 ms                          | One RSC request per visit. Response durations 1,208–2,059 ms; TTFB 51–58 ms. A Transfer Detail page with both account sides was visible in all five observations.                 |

The direct full-document navigation to Add with Transfer selected took 2,123 ms to response completion (TTFB 1,307 ms); its decoded document was about 261 KB. Transfer controls were present at the 2.2-second check. This is a document navigation, not directly comparable to the SPA RSC samples above.

### App Back versus browser-history Back

| Return path                            |     Useful List restored |                                     New List RSC request | Samples       |
| -------------------------------------- | -----------------------: | -------------------------------------------------------: | ------------- |
| Detail TopAppBar app Back Link         | 2,295 / 1,785 / 1,427 ms | 1 each time; response durations 2,202 / 1,705 / 1,352 ms | 3 warm        |
| Browser-history Back from Detail       |        112 / 101 / 96 ms |                                                        0 | 3 same-run    |
| Browser-history Back from Add to List  |               105–147 ms |                                                        0 | 7 same-run    |
| Browser-history Back from Add to Money |                    77 ms |                                                        0 | 1 observation |

The Detail app Back was about 13–24 times slower in these samples and reran the List RSC. Browser Back restored the same 25 rows from history. The list component also keeps an in-memory activity/scroll snapshot; scroll position itself was not changed during this audit.

### Type switching and draft state

Expense → Income → Transfer → Expense settled in 225 / 177 / 195 ms. Each mode remounted its form; no RSC, REST, or RPC request was observed. A read-only unsaved amount/note probe was cleared by switching mode. Source defaults show account/category/jar and date return to that mode’s fresh defaults too. No submission was made.

## Session architecture and request counts

The product layout calls requireProductSession. Its cached getSessionMembership starts getSessionUser, verifies the auth subject, then resolves membership alongside the in-flight user read. The List, Add, and Detail pages also contain the older-looking sequential getSessionUser → resolveActiveMembership calls, but the parent layout has already run the canonical gate and both functions use React request caching. Source indicates those page calls should reuse the completed session result; runtime call counts were not available to confirm.

The proxy separately calls Supabase getClaims on each matched request. The render gate calls getClaims and getUser; membership.resolve reads the active household membership. Exact getUser/membership durations, token-refresh/JWKS behavior, and actual server HTTP counts were not captured. The Codex thread had no attached app terminal for the existing VINHA_PERF_TRACE spans. A getClaims invocation may verify locally or need a JWKS fetch; invocation count is not an HTTP count.

The table below separates browser evidence from source call sites. “Source total” counts code-level operations, not measured HTTP requests; actual remote totals remain unknown.

| Destination                   | Auth operations in source                    | Membership operations in source                          | Data REST call sites                                                                                                     |           RPC |                       Source total |      Browser RSC |
| ----------------------------- | -------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------: | ---------------------------------: | ---------------: |
| Transactions List             | proxy getClaims + render getClaims + getUser | 1 cached session membership                              | 1 transaction query per scan page + 2 filter-option reads + 1 tag read + 0–2 batched group reads                         |             0 | 8 + group reads + extra scan pages | 1 per navigation |
| Add Transaction               | same 3 auth operations                       | 1 cached session membership + 0–1 active-owner-ID lookup | 6 data reads: household currency, accounts, expense categories, income categories, jars, tags                            | 1 balance RPC |         11 + optional owner lookup | 1 per navigation |
| Ordinary Transaction Detail   | same 3 auth operations                       | 1 cached session membership                              | 6: selected transaction, activity’s repeated transaction, audit-chain root and two child reads, available tags           |             0 |                                 10 | 1 per navigation |
| Transfer Detail               | same 3 auth operations                       | 1 cached session membership                              | 7: selected transaction, activity base row plus paired-group query, audit-chain root and two child reads, available tags |             0 |                                 11 | 1 per navigation |
| Transfer form after Add loads | none on mode switch                          | none on mode switch                                      | none on mode switch                                                                                                      |             0 |                       0 additional |     0 additional |

The ordinary Detail count is six source reads: one for the selected transaction, one duplicate transaction read for activity, three audit-chain reads, and one available-tag read. Transfer Detail has seven: selected transaction, activity base row, paired-group query, audit-chain root and two child reads, and available tags. The paired-group query waits for the activity base-row read. Transfer form’s initial route uses the Add read model; mode switching is local.

## Transactions List query, dependencies, and payload

The initial list is a server-rendered activity page. Its transaction query selects:

- transaction identity, account, type, amount, currency, date, note, category, jar, status, transfer-group and loan-payment references, savings kind, reversal/correction references, and creation time;
- embedded account name/type/scope, category name/icon, jar name, and transaction-tag assignments with tag display metadata.

The query filters by household and orders by transaction_date, created_at, then id, all descending. It uses a keyset cursor, not OFFSET. The first activity page is 25 entries; raw-row lookahead is 52 rows, and the scanner may issue up to four sequential scan queries. Transfers and loan payments are completed with at most one batch query per group type using collected IDs; this is not an N+1 lookup. There is no separate per-row account or category lookup. Account ownership is not fetched per row; the route uses the session/household gate and database visibility.

| Dependency                                                     | Required for first useful rows? | Remote?            | Source request shape                                    |
| -------------------------------------------------------------- | ------------------------------- | ------------------ | ------------------------------------------------------- |
| Session / active household                                     | Yes                             | Auth + membership  | Shared parent route gate; request-cached                |
| Transaction rows and account/category/jar/tag embeds           | Yes                             | Yes                | Main PostgREST transaction query, once per scan page    |
| Transfer / loan pair completion                                | Only when selected rows need it | Yes                | One batch query per non-empty group type                |
| Category and jar filter options                                | No                              | Yes                | Two reads run alongside the row query                   |
| Available transaction tags for filters                         | No                              | Yes                | One read run alongside the row query                    |
| Grouping, display labels, date sections, and pagination cursor | Yes for final list shape        | No additional read | Server activity projection plus client display grouping |
| Account balances                                               | No                              | No                 | Not read by this list path                              |

The active page filters are in query parameters. The list query applies household, account, type, tag, note-search (`ilike` on `note`), category, jar, and cursor predicates before mapping. Unlike the separate legacy `listTransactions` query, event-list search does not search embedded account/category/tag labels. Activity type matching, paired-row projection, deduplication, and cursor checks run in server mapping. The first page is in the RSC. Infinite-scroll continuation uses a cursor and a client fetch to the transaction-events endpoint; it is not the initial useful-row path.

The representative first page contained 25 real activities. Its RSC body was 13,606 encoded bytes / 59,680 decompressed bytes, with 13,906 transferred bytes. RSC is a Flight stream, so decoded JSON bytes are not applicable. The response took about 2.3 seconds in the cold-ish sample, while the compressed body was about 13.6 KB; warm body sizes were effectively the same. Useful rows appeared 53–89 ms after response completion. Payload transfer and browser rendering do not explain the measured wait. Server mapping duration was not separately instrumented.

## Add Transaction dependencies and reference data

The Add page awaits translations and all five reference loaders through one Promise.all before it returns MoneyCaptureEntry. There is no early RSC boundary for independent form controls.

| Field / control     | Expense                                                              | Income               | Transfer                                      | Remote data before usable?                                                                     | Submit authority                                                                    |
| ------------------- | -------------------------------------------------------------------- | -------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Type                | Local mode button                                                    | Local mode button    | Local mode button                             | No domain data; route currently waits for all page loaders                                     | Server action schema fixes the accepted type                                        |
| Amount              | Amount field                                                         | Amount field         | Transfer amount field                         | Currency label needs household base currency; form currently waits for account/currency loader | Positive whole-number validation in schema and database function                    |
| Date                | Local date field, today default                                      | Same                 | Same                                          | No                                                                                             | Server uses submitted date or its canonical default                                 |
| Note / description  | Local text field                                                     | Same                 | Same                                          | No                                                                                             | Server schema trims and bounds note                                                 |
| Source account      | Account picker                                                       | Account picker       | Transfer source picker                        | Yes: eligible account option model                                                             | Fresh same-household, active-account checks and DB ownership guard                  |
| Destination account | —                                                                    | —                    | Transfer destination picker, excluding source | Yes: same account model; no second account read                                                | Transfer RPC rechecks both accounts, same household, active state, and distinct IDs |
| Category            | Expense categories                                                   | Income categories    | None                                          | Yes for Expense/Income; not used by Transfer                                                   | RPC checks active category, matching kind, and global/current-household scope       |
| Scope               | Derived from selected account; affects personal-expense jar behavior | Derived from account | Derived from both accounts                    | Yes, account scope metadata                                                                    | Database transaction trigger checks current canMutate authority                     |
| Currency            | Household base currency; no selector                                 | Same                 | Same for both legs                            | Yes                                                                                            | Server obtains household base currency; client currency is not authoritative        |
| Jar                 | Optional / account-scope dependent                                   | Optional details     | None                                          | Yes when jar control is used                                                                   | RPC checks same household and non-archived jar                                      |
| Transaction tags    | Optional details                                                     | Optional details     | None                                          | Yes when opened                                                                                | Separate tag-assignment RPC after a successful ordinary transaction                 |

Account options are produced by listAccountsForCapture: household base currency and active account rows are read in parallel; then owner-membership status and ledger balances are loaded in parallel. The picker uses ID, name, type, icon, financial scope, ownership-derived canMutate filtering, and formatted balance. There is no per-account currency field in this model. Balance is presentation only in the account-choice label; it is not used to authorize an ordinary transaction or transfer and does not gate form readiness beyond being included in the loader.

The balance RPC is therefore not mutation authority. Ordinary expense/income writes do not compare the loaded balance. Credit-card expense is the exception: the server reloads outstanding and limit data and the card RPC locks/rechecks card billing state. Transfer has no insufficient-cash balance guard; it is a neutral paired movement.

Categories are dynamic global-or-household records. Add reads active records of the selected kind, includes icon/jar mapping, and orders by sort_order; inactive categories are excluded from capture. The List filter read includes the active flag so archived/inactive categories can still describe old transactions. Jars are household records that are neither archived nor paused. Add tags are household-scoped, non-archived transaction tags with icon/color metadata and name ordering. These reference sets are remote, not static constants.

For a direct Transfer-mode route, the Add page still calls both category reads, jars, and transaction tags even though TransferCaptureFlow uses only the shared accounts and currency. The Expense/Income category and optional jar/tag model is therefore an unused critical dependency on that entry path. Selecting Transfer after Add is loaded is fast and local; it is not a reason to client-fetch the references.

## Transfer path and invariants

TransferCaptureFlow filters the shared account model to liquid account types (cash, checking, savings, e-wallet, brokerage, and other), excludes archived accounts, and excludes the source from destination choices. The account option data is loaded once and passed into the flow; no second account model is fetched. Currency is the household base currency for both sides.

The form performs preview → confirmation → receipt. No confirmation or submit was activated during this audit.

The server action validates the transfer schema, requires the current active household session, and calls one record_owned_account_transfer RPC. The database function:

- requires authenticated active household membership;
- requires positive whole-number amount and distinct source/destination IDs;
- locks both account rows, verifies same household and non-archived status, and rejects credit-card and savings-product accounts;
- uses household base currency for both rows;
- inserts the transfer-out and transfer-in transaction legs with one transfer_group_id and corresponding idempotency keys;
- returns both transaction identities and opposite deltas.

The ownership guard on transaction inserts calls assert_financial_mutation for each account. Household accounts are mutable by active household members; personal accounts require the current active membership to match the owner membership. This applies independently to both transfer legs, preserving current owner and former-owner behavior. The single PostgreSQL RPC executes both inserts atomically; any insert/trigger failure rolls back the function transaction. The UI balance is not used as transfer authority, and the transfer RPC does not enforce an insufficient-balance rule.

Transfer Detail is represented as one neutral activity from paired rows. getTransactionActivity first reads the selected transaction, then sequentially queries the matching transfer_group_id and both transfer types. The pair read is required for the other account side, but the initial transaction is also independently read by getTransactionReadResult and again by getTransactionAuditChain. The List path instead batches all matched transfer groups from the page.

## Transaction Detail dependencies

| Dependency                                                              |     Hero / summary |       Secondary facts / history |      Action-only | Critical to first useful Detail? |
| ----------------------------------------------------------------------- | -----------------: | ------------------------------: | ---------------: | -------------------------------: |
| Selected transaction, currency, date, note, account/category/jar embeds |                Yes |                             Yes |               No |                              Yes |
| Activity projection (direction/sign/status/product kind)                |                Yes |                             Yes | Capability basis |                              Yes |
| Transfer group pair                                                     | Both account sides |                 Route/date/note |               No |          Yes for Transfer Detail |
| Audit chain root + reversal/correction children                         |                 No | Yes when related history exists |               No |                      No for hero |
| Available transaction tags                                              |                 No |                      Tag editor |              Yes |                      No for hero |
| Correct/refund capability                                               |                 No |               Action visibility |              Yes |                      No for hero |
| Attachments / recurring metadata                                        |         None found |                      None found |       None found |                               No |

The page awaits transactionResult, activity, chain, and availableTags together before returning any Detail UI; there is no progressive split between the summary and secondary metadata today. For ordinary rows, the first useful financial summary appears after the transaction and activity reads, while the tag editor and audit history are secondary. For Transfer Detail, the component uses activity and translations; the page still waits for the separate transactionResult, audit chain, and available-tag reads before returning it.

The detail action buttons are presentation decisions based on activity capability and transaction status. Correct/refund commands reload the original transaction and calculate capability again before the database RPC. There is no in-place edit or Delete button.

## Supabase HTTP and SQL attribution

Browser measurements captured the RSC/document request start, response start, response end, payload sizes, and useful DOM readiness. The server-side Supabase requests, SDK parsing, and mapping spans were not observable in this browser trace. No attached app terminal supplied the development perf spans. Therefore:

- RSC TTFB/body duration cannot be split into proxy, auth, membership, Supabase service/network, PostgreSQL execution, SDK parsing, or server mapping.
- No claim is made that SQL is fast or slow. EXPLAIN (ANALYZE, BUFFERS) was not run because a representative authenticated RLS database session was not available.
- The measured small payload and short post-response paint rule out payload transfer and client rendering as the main explanation in these samples, but they do not identify which server-side read dominates.

## Client/render attribution and architecture decision

Useful rows appeared 53–89 ms after the List RSC finished. Add controls appeared about 82–124 ms after the Add response. Ordinary Detail and Transfer Detail roots appeared within roughly 14–66 ms of their RSC completion. React/client rendering is not a material share of the observed route waits.

The correct architecture remains server-driven RSC with server authority and progressive server boundaries. The form’s mode switch is already a local client interaction; list continuation and form controls use client interaction where appropriate. The measurements do not support moving the primary data paths to CSR.

GraphQL is not justified. Current PostgREST embeds already provide account/category/jar/tag joins for rows. The measured issue is the RSC critical path and unconditional or duplicate reads, not query-composition complexity that requires GraphQL.

Potential later boundaries, not implemented:

- Add: expose controls independent of references early; amount still needs household currency, while account/category/scope and optional jar/tag controls need their reference data.
- List: release transaction rows before category/jar/tag filter options, which are not required to understand the first rows.
- Detail: release the financial summary before audit-chain and tag-editor data; avoid duplicate base-row reads.
- Transfer: keep both legs behind the atomic transfer command; the read path may share the base row and grouped pair data without changing mutation semantics.

If later read work is justified, the evidence-led order is: remove unused reads (especially non-Transfer references on a direct Transfer-mode entry), request-scoped reuse of the Detail base row, use existing PostgREST embeds where they fit, restructure query ordering, reuse existing RPCs, and only then consider a narrow read-model RPC. No RPC is proposed in Phase 0.

## Financial mutation authority map

| Operation         | Current authoritative checks                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Expense           | Server action schema; active membership via assertMoneyActionAllowed; fresh account lookup for same household and non-archived status; transaction-insert trigger checks household/personal canMutate using the current active owner membership; positive whole amount; household currency; active category of expense kind and global/current-household scope; valid non-archived household jar; ledger write through record_transaction or record_card_transaction. |
| Income            | Same active membership/account/ownership checks; positive whole amount; household currency; active income category and valid jar; server RPC writes the transaction and may create its corresponding allocation Inbox item.                                                                                                                                                                                                                                           |
| Transfer          | Active membership; source and destination both fresh-checked and locked in the same household, non-archived, distinct, supported account types; trigger validates canMutate for both accounts; positive whole amount; household currency; one atomic RPC creates both ledger legs with one transfer group.                                                                                                                                                            |
| Edit / correction | In-place update returns IMMUTABLE. Correction action re-reads original state/capability and uses a database correction RPC for the reversal + corrected leg; transaction triggers enforce account ownership.                                                                                                                                                                                                                                                          |
| Delete            | Delete command returns IMMUTABLE; no delete UI/write path found.                                                                                                                                                                                                                                                                                                                                                                                                      |

Account picker balance, selected category, owner/canMutate option state, and browser form values are not mutation authority. The server/database checks remain the authority. Transaction tags are assigned in a separate metadata RPC after an ordinary transaction succeeds; a tag assignment failure is surfaced on the receipt and does not undo the financial transaction.

After successful create/transfer/refund/correction, server actions revalidate the configured Home, Money, Accounts, Transactions, Detail, Plan, and Inbox page paths. Add and Transfer then show local receipt state; no router.refresh or optimistic transaction-row insertion was found. No post-submit path was exercised.

## Ranked measured bottlenecks

1. **P1 — Detail app Back refetches the List.** Three app Back samples took 1.43–2.30 seconds and each issued a new list RSC request; browser history restored the same rows in 96–112 ms with no request. This is the clearest unnecessary critical dependency.
2. **P2 — Add waits for its entire reference model before independent controls appear.** Five warm page-Link samples took 1.48–3.50 seconds to expose type/amount/date/note and references; client readiness followed the RSC by at most about 124 ms. Source shows account/balance, categories, jars, and tags all gate the page.
3. **P3 — List filter references gate first useful rows.** List rows took 1.46–1.87 seconds warm. Categories, jars, and tags are awaited with the event query although they are only needed to operate filters. Per-loader server timing is unavailable, so the share attributable to each read is unknown.
4. **P4 — Detail has duplicate base reads and waits for secondary data.** Ordinary Detail took 1.88–2.35 seconds warm; source shows three base transaction reads across the page loaders plus unconditional audit-chain and available-tag reads. Transfer adds a sequential paired-group read. These are source-confirmed extra reads, but individual service time was not captured.

Payload reduction is not ranked: measured list payload was about 13.6 KB encoded, and useful rows appeared shortly after the body completed. Client rendering is not ranked for the same reason: its measured portion was tens of milliseconds.

## Validation

- Focused unit checks: 15 files, 90 tests passed, including transaction events, pagination/query shape, activity projection, capture/transfer commands, transaction immutability, ownership policy contracts, category/tag filters, account-balance RPC, session membership, and product-session gate. Existing PressResponder warnings appeared in form-render tests.
- ESLint: passed.
- Typecheck: failed outside the audited files at app/[locale]/(product)/home/home-streaming-sections.tsx lines 99 and 340 due to a use-intl Translator/HomeTranslator type mismatch. No transaction-file type errors were reported.
- Build: not run because the authenticated development server is using the default .next directory; next build would write to the same output and risk interrupting that session.
- Supabase EXPLAIN and browser mutation/E2E flows: not run. No write operation was invoked.
- No production code was changed.

## Recommended Phase 1

Implement only Detail return-navigation restoration: use the in-app history entry when the user arrived from the transaction flow, preserving the exact list/filter/history state; use the existing Transactions List route as fallback for a direct/deep link. Re-measure app Back and browser-history Back before considering another direction.

## Decision

TRANSACTIONS INVESTIGATION COMPLETE — PROCEED TO TRANSACTIONS PHASE 1
