# Transactions Phase 2 — Progressive Add Transaction Rendering

**Date:** 2026-10-06  
**Scope:** `/money/transactions/new` only. No transaction was submitted.

## Dependency map

| Control             | Expense                                                                           | Income              | Transfer                    | Required before first interaction?    | Remote dependency                               |
| ------------------- | --------------------------------------------------------------------------------- | ------------------- | --------------------------- | ------------------------------------- | ----------------------------------------------- |
| Mode/type           | Local mode state                                                                  | Local mode state    | Local mode state            | Yes, local                            | None                                            |
| Amount              | Uses household currency for the amount label and formatting                       | Same                | Same                        | Yes; currency must be known           | Household base currency                         |
| Date                | Local date field                                                                  | Local date field    | Local date field            | No remote data                        | None                                            |
| Note                | Local text field                                                                  | Local text field    | Local description field     | No remote data                        | None                                            |
| Source account      | Capture account options; ownership capability and balance are picker presentation | Same                | Source account options      | No; required before save/continue     | Accounts, active-owner eligibility, balance RPC |
| Destination account | —                                                                                 | —                   | Destination account options | No; required before transfer continue | Accounts, active-owner eligibility, balance RPC |
| Category            | Expense category set                                                              | Income category set | Not used                    | No; required before save              | Direction-specific category query               |
| Jar                 | Optional; shown according to account scope and existing Plan behavior             | Not used            | Not used                    | No                                    | Household jars                                  |
| Transaction tags    | Optional metadata                                                                 | Optional metadata   | Not used                    | No                                    | Transaction tag query                           |
| Household currency  | Preserves the real amount currency                                                | Same                | Same                        | Yes                                   | Household base currency                         |

The source confirms that balances decorate account choices; they do not authorize or reject a transaction. The page continues to obtain the authenticated user and active membership before starting the Add references. Household currency remains on the initial-render path because the amount control must display the actual household currency. Server translations are awaited with currency; they are local message lookup, not another money-data query.

## Previous architecture

After the route's session and membership gates, it awaited one `Promise.all` containing the combined currency/account model, both category sets, jars, transaction tags, and translations. `listAccountsForCapture` also joined the household currency result with account rows, active owner eligibility, and ledger balances. The client form therefore mounted only after every reference settled.

## New architecture

After the same auth and membership gates, the page starts one currency/account reference read, both category reads, jars, and transaction tags in parallel. The account helper now exposes currency and account-option promises separately while retaining one household currency query and one account query. Owner eligibility and balances remain part of the account-option promise.

The server page awaits only household currency and translations before rendering `MoneyCaptureEntry`. Independent Suspense boundaries resolve the remaining server promises into stable client state. The active Expense/Income form renders its local type, amount, date, and note controls immediately; account and category controls enable when their own references resolve. Jar and tag controls remain optional and load locally. Transfer amount/date/note stay available while source/destination controls wait for the account model. No browser fetch was added.

The category, jar, and transaction-tag query APIs already return `null` on read failure, and the old route normalized those results to empty arrays. That existing behavior is preserved; this change does not convert a previously distinct failure state into an empty success.

Save and transfer continue are blocked while their required account/category references are unresolved. The submit handlers also guard the confirmation transition, so keyboard or form-submit paths cannot bypass readiness. Existing server actions, membership checks, domain validation, transfer RPC, and tag-assignment semantics are unchanged.

## Files changed

- `modules/ledger/application/queries/list-accounts.ts` and `modules/ledger/application/index.ts` — expose independent currency/account promises for the Add route while preserving existing account-list callers.
- `app/[locale]/(product)/money/transactions/new/page.tsx` — starts all references server-side and awaits only currency and translations.
- `app/[locale]/(product)/money/transactions/money-capture-entry.tsx` — resolves each server promise independently without replacing the active Add experience.
- `app/[locale]/(product)/money/transactions/capture-transaction-form.tsx` and `transaction-category-field.tsx` — add local loading/disabled states, required-reference guards, and account defaulting that only fills an empty account field.
- `app/[locale]/(product)/money/transactions/transfer-capture-flow.tsx` — keeps independent transfer fields usable and gates only account-dependent continuation.
- `messages/en/money.json` and `messages/vi/money.json` — add the localized reference-loading label.
- `tests/unit/capture-transaction-form-error.test.tsx` and `tests/unit/transfer-capture-flow.test.tsx` — cover early entry and reference-resolution persistence.

## Input persistence

The unit test holds server promises unresolved, selects Income, enters an amount, changes the date, and enters a note before resolving accounts and the active category set. It verifies that the same form node, mode, amount, date, and note survive; Save remains disabled until required references resolve; submitting early does not open confirmation or call the mutation; Save then enables while optional jars/tags remain pending. The transfer test does the equivalent for amount/date/note while accounts are pending.

A real-browser run through the Transactions List CTA reached Milestone A while account/category controls were still disabled. I entered an amount, selected Yesterday, and typed a note before those references resolved. After both references enabled, the same form node remained mounted and all four draft assertions (amount, date, note, Expense mode) remained true. The browser run did not submit.

The existing Expense → Income/Transfer form remount and cross-mode draft reset remain unchanged and out of scope.

## Performance

Same authenticated local dev server/browser, same run, five warm samples for each entry path, at 1920×943 in Dark mode. The control samples were captured before the Phase 2 source change; Phase 2 samples were captured after it. “Usable” means the active mode, amount, date, and note controls were visible and interactive. p75 is nearest-rank for n=5.

| Entry path                                | Control p50 / p75 | Phase 2 p50 / p75 |        p50 delta |
| ----------------------------------------- | ----------------: | ----------------: | ---------------: |
| Transactions List → Add, initial controls |  1,664 / 2,191 ms |  1,353 / 1,748 ms | −311 ms (−18.7%) |
| Bottom Nav → Add, initial controls        |  1,577 / 1,609 ms |  1,063 / 1,230 ms | −514 ms (−32.6%) |

The dedicated readiness batch below was collected later in the same authenticated browser/dev environment, with five list-CTA samples per mode. Income timings include selecting Income as soon as its mode control appeared. Control readiness markers all coincide with initial rendering because the old route awaited the full reference `Promise.all`; the control p50/p75 for each later marker therefore equal the List-CTA initial-control values above. The dedicated readiness batch is separate from the same-run path comparison.

| Mode/sample                        | A: fields usable | B: accounts ready | C: active category ready | D: optional jar/tag refs ready | E: required current-mode form ready |
| ---------------------------------- | ---------------: | ----------------: | -----------------------: | -----------------------------: | ----------------------------------: |
| Expense p50 / p75                  | 1,106 / 1,109 ms |  1,403 / 1,425 ms |         1,115 / 1,249 ms |               1,434 / 1,675 ms |                    1,403 / 1,425 ms |
| Income after mode choice p50 / p75 | 1,416 / 1,426 ms |  1,424 / 1,546 ms |         1,425 / 1,441 ms |               1,437 / 1,557 ms |                    1,425 / 1,546 ms |

E is account plus active-mode category readiness; optional metadata is measured separately as D. Because the category/account controls are disabled locally until their references arrive, these timings represent actual control usability rather than promise settlement alone. One cache-disabled hard direct-route sample reached the initial fields in 1,147 ms; it is a warm server/session sample and is not mixed into the warm click-path comparison.

One Resource Timing probe for the List-CTA RSC request recorded its first byte 94 ms after the click marker and its response end 1,133 ms after the marker; controls were interactive at 1,046 ms, about 87 ms before response end. First byte to controls was about 952 ms. Browser Resource Timing does not identify the first useful Flight segment, and router prefetch/cache can affect this probe, so this is a one-sample proxy rather than an exact first-useful-RSC measure. It shows no additional client tail after response completion in that sample.

## Reference readiness

- Expense account options (including owners and balance presentation): p50 1,403 ms, p75 1,425 ms.
- Income account options: p50 1,424 ms, p75 1,546 ms.
- Expense categories: p50 1,115 ms, p75 1,249 ms.
- Income categories: p50 1,425 ms, p75 1,441 ms.
- Optional jar and transaction-tag controls: p50 1,434 ms Expense / 1,437 ms Income; p75 1,675 ms / 1,557 ms.

These are separate medians across five samples, not one request trace. List CTA, Bottom Nav, direct English Add, direct Vietnamese Add, direct `?mode=income`, and direct Vietnamese `?mode=transfer` were exercised. Direct Transfer showed amount/date/note before either account selector enabled, then both selectors became usable. Expense and Income category reads, jars, and transaction tags are still requested on direct Transfer because the route starts them unconditionally; optimizing those unused reads is a Phase 3 candidate, not part of this change.

## Request topology

| Remote operation   | Blocks initial form? | Reason                                   |
| ------------------ | -------------------- | ---------------------------------------- |
| `getUser`          | Yes                  | Authenticated route gate                 |
| Active membership  | Yes                  | Household route gate                     |
| Household currency | Yes                  | Correct amount currency presentation     |
| Accounts           | No                   | Account picker only                      |
| Owner eligibility  | No                   | Account picker capability presentation   |
| Balance RPC        | No                   | Account picker balance presentation only |
| Expense categories | No                   | Expense category control only            |
| Income categories  | No                   | Income category control only             |
| Jars               | No                   | Optional, conditional metadata           |
| Transaction tags   | No                   | Optional metadata                        |

Each reference is started once by the server page and consumed by one promise resolver; there is no second browser request. The currency/account helper starts one household-currency read and one account read, then starts owner eligibility and balance reads in parallel after account rows arrive. Session/membership and server authorization remain in place.

Representative sequence from source plus browser milestones:

```text
getUser + active membership
  ├─ start household currency ───────────────┐
  ├─ start accounts → owners + balances      │
  ├─ start expense/income categories         ├─ await currency + translations → Milestone A
  ├─ start jars                              │
  └─ start transaction tags                 │
       accounts → Milestone B                │
       active category → Milestone C/E       │
       optional jar/tag refs → Milestone D ──┘
```

The server route still waits for session, membership, currency, and translations. The deferred account/category/jar/tag reads begin before the page awaits currency and remain server-started.

## Financial correctness

No mutation action, command handler, transfer RPC, or server validation was changed. Accounts and categories remain required before confirmation/continuation. Loaded balances remain picker presentation; no client-side amount-versus-balance rejection was added. The browser benchmark made no transaction writes.

## Phase 1 regression

Read-only browser check: Transactions List → detail → app Back returned to the 25-row list. The transaction RSC resource count remained 1 before and after Back, so the return issued zero additional List RSC requests. The list page/query and detail loader were not changed by this phase.

The Bottom Nav Add button opened the Add route as a top-level destination; browser Back restored the Transactions List with 25 rows. No child-route Back control was added.

## Browser and validation

- Real browser, Add screen: 390, 440, 768, and 1280 px in both Light and Dark. No horizontal overflow; the centered app frame measured 390, 440, 440, and 440 px respectively.
- Reduced-motion emulation matched `prefers-reduced-motion: reduce`; keyboard tab focus showed a visible 2 px outline. Account and category pickers opened and were dismissed without changing the selected account/category. No transaction confirmation or write was triggered.
- English Expense, Vietnamese Expense, Income query, and Vietnamese Transfer direct routes rendered. Transfer source/destination controls resolved after the initial fields. No new browser console errors occurred during the final browser pass.
- Focused capture/transfer tests: 23 passed. The full relevant financial unit suites also passed, including transaction capture, transfer command, ownership/RLS, account-balance RPC, categories, jars, tags, session, immutability/contracts, and credit-card capture.
- `npm run lint`: passed.
- Scoped Prettier check and `git diff --check`: passed.
- Full `npm run test`: 1,757 passed, 5 failed across 3 unrelated working-tree test files. Failures were: English/Vietnamese key parity (`savingsPage.summaryCaption` absent from Vietnamese), one account identity wrapping assertion expecting `break-words`, and three account presentation tests missing `NextIntlClientProvider` context. The Add/transfer-focused tests and relevant financial suites passed.
- `npm run typecheck`: still reports `Translator<AppMessages, "home">` versus `HomeTranslator` errors in `app/[locale]/(product)/home/home-streaming-sections.tsx` at lines 99 and 340; no diagnostics point to this phase's files.
- Production build was not run because the shared local Next dev server was serving browser verification and both use `.next`.

## Remaining bottleneck

Auth and active membership remain route gates, and household currency intentionally remains on the critical path so the amount is never rendered with a guessed currency. Server translations are also awaited. Accounts, owner checks, balances, categories, jars, and tags no longer gate Milestone A. Direct Transfer still starts the unused Expense/Income category, jar, and tag reads; leave that for Phase 3.

**TRANSACTIONS PHASE 2 SUCCESS — PROCEED TO TRANSACTIONS PHASE 3**
