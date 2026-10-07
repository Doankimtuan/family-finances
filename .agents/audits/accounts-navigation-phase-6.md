# Accounts Phase 6 - Credit Card Detail Progressive Rendering

Measured 2026-10-05. Scope: Accounts to Credit Card Detail. This report omits account/card/household identifiers, financial values, transaction payloads, credentials, and tokens.

## Dependency classification

| Dependency                             | Hero / summary                                                   | Activity         | Payment actions                          | Installment actions                    | Blocks hero?                           |
| -------------------------------------- | ---------------------------------------------------------------- | ---------------- | ---------------------------------------- | -------------------------------------- | -------------------------------------- |
| requireProductSession / getAccountType | Session and account kind                                         | -                | -                                        | -                                      | Yes                                    |
| getAccount                             | Identity, account state, balance, ownership, canMutate, currency | -                | Capability/currency                      | Capability/currency                    | Yes; Phase 5 behavior retained         |
| Household currency                     | Formats card amounts, sourced from getAccount                    | Formats activity | Formats payment                          | Formats installment action             | Yes                                    |
| Card settings                          | Limit, statement/due days, linked account ID                     | -                | Linked account reference                 | -                                      | Yes                                    |
| Billing months                         | Outstanding, available credit, due context                       | -                | Default payment amount                   | -                                      | Yes                                    |
| Billing items                          | -                                                                | Activity rows    | -                                        | -                                      | No                                     |
| Recent transactions                    | Not consumed by card branch                                      | Not consumed     | -                                        | -                                      | No; card read was already 0 in Phase 5 |
| listAccounts                           | -                                                                | -                | Payment choices and linked-account label | -                                      | No                                     |
| Installments                           | -                                                                | -                | -                                        | Installment section/action state       | No                                     |
| Eligible purchases                     | -                                                                | -                | -                                        | Candidate list and action availability | No                                     |

Card-specific deferred loaders start only after the selected account is authorized and confirmed as an active credit card. The summary query retains the money-action gate and household filters.

## Previous and new architecture

Before Phase 6, the route waited for card detail, billing items, payment accounts, installments, and eligible purchases before rendering the card page. getCreditCardDetail also repeated the selected-account and household-currency reads already performed by getAccount. The card branch already skipped recent transactions in the Phase 5 source.

Now getAccount supplies the trusted identity and currency. Only card settings and billing months are awaited for the summary. After authorization, the route starts billing items, installments, eligible purchases, and listAccounts together with the critical summary. Narrow Suspense boundaries cover payment account display/actions, the combined conversion action, and activity. The linked-account label shares the payment loader promise. The detail root, hero, summary, and main viewport retain the same DOM nodes as sections resolve.

## Removed unused work and files

Card recent transactions remain at zero reads; Phase 5 had already removed that card request. Phase 6 removes the duplicate card-detail account and currency reads and moves the former billing-items query into listCreditCardBillingItems. The new loader preserves household filtering, order, and limit.

Changed: shared account-detail route; credit-card activity, actions, due lead, and installment components; ledger card detail type/query/export/operation constant; en/vi loading and failure messages; and focused progressive-rendering/failure tests. No migration, RPC, view, index, policy, client-fetch layer, or other database object was added.

## Performance

Same local dev environment, authenticated browser, locale, and account, without CPU/network throttling. Frozen pre-Phase-6/Phase-5 control: three warm visits. Final Phase 6: ten warm visits. In the control, A-F became ready together because the whole page waited. p50 is the median (midpoint for even n); p75 uses nearest rank. The small control sample makes p75 directional.

| Milestone                           |                Control p50 / p75 (n=3) |             Phase 6 p50 / p75 (n=10) | p50 delta |
| ----------------------------------- | -------------------------------------: | -----------------------------------: | --------: |
| Session gate                        | 308 / 664 ms (Phase 5 reference, n=10) | Not separately remeasured; unchanged |         - |
| Critical summary / A: readable hero |                       1,695 / 2,626 ms |                     1,634 / 1,914 ms |    -61 ms |
| B: billing activity ready           |                       1,695 / 2,626 ms |                     1,634 / 1,914 ms |    -61 ms |
| C: installments ready               |                       1,695 / 2,626 ms |                    2,062 / 2,189 ms* |   +367 ms |
| D: eligible action ready            |                       1,695 / 2,626 ms |                    2,062 / 2,189 ms* |   +367 ms |
| E: payment accounts ready           |                       1,695 / 2,626 ms |                     1,929 / 2,458 ms |   +234 ms |
| F: full detail ready                |                       1,695 / 2,626 ms |                     2,062 / 2,458 ms |   +367 ms |

*The conversion action consumes both installment and eligibility results, so C and D share one boundary and readiness marker; they were measured together. Activity resolved with the hero in 9/10 visits and 317 ms later once.

Hero p50 improved 61 ms (3.6%) and p75 improved 712 ms (27.1%) against the n=3 control. Full-detail p50 is later because actions now arrive after the hero; full-detail p75 was 168 ms earlier than control. One first post-change, cold-ish visit measured 3,103 ms to hero and 3,396 ms to full detail; it is excluded from the warm comparison.

## Request counts

Counts below are remote reads/loader paths per card visit. Selected account and household counts include the duplicate reads formerly inside getCreditCardDetail.

| Operation                  |                       Before |                 After | Critical after?        |
| -------------------------- | ---------------------------: | --------------------: | ---------------------- |
| getUser                    |                            1 |                     1 | Session gate           |
| Active membership          |                            1 |                     1 | Session gate           |
| Selected account row       |                      2 total |                     1 | Yes                    |
| Household/currency context |                      2 total |                     1 | Yes                    |
| Selected balance RPC       |                            1 |                     1 | Yes; Phase 5 semantics |
| Recent transactions        |                            0 |                     0 | No                     |
| Card settings              |                            1 |                     1 | Yes                    |
| Billing months             |                            1 |                     1 | Yes                    |
| Billing items              |                            1 |                     1 | No                     |
| Installments               |                            1 |                     1 | No                     |
| Eligible-purchase path     | 1 path: transactions + plans |             Same path | No                     |
| Related transaction lookup |           0 or 1 conditional | Same conditional read | No                     |
| listAccounts               |                     1 loader |              1 loader | No                     |

The old detail bundle made five card-detail queries critical (duplicate household, duplicate account, settings, months, items). Now two are critical and the same activity query runs deferred. listAccounts retains its existing account/batch-balance behavior. React request-scoped caching shares getUser and membership authorization; no duplicate option loader was introduced.

## Financial and ownership equivalence

buildCreditCardSummary, computeOutstanding, and computeAvailableCredit are unchanged and remain authoritative for limit, outstanding, available credit, utilization, and next due. The due lead keeps the prior non-settled-month selection and remaining-amount fallback. Currency still comes from getAccount.

getCreditCardDetail receives the already-authorized account ID, name, type, and archived state, rejects non-card/archived accounts, and keeps household filters. Scope, owner status, and canMutate still come from getAccount. Deferred actions receive canMutate before an action can render. Payment submission and eligibility remain server-authoritative. Activity keeps the Standard-item filter and prior preview behavior. Read failures do not become zero balances.

## Error isolation

Billing-item failure shows an error rather than a false empty state; the summary remains available. Installment or eligibility failure shows an error and no conversion action. Payment-account failure disables payment and fabricates no choices; linked-account text reports unavailable. Critical settings/month failure uses the unavailable-card path. Four focused tests cover these failures.

## Browser verification

The authenticated local browser showed card identity, financial summary, due context, ownership, actions, activity, and management. Deferred fallbacks filled without replacing the root or hero. The payment sheet opened and was dismissed; no financial mutation was submitted.

Checks passed at 390, 440, 768, and 1280 px with no horizontal overflow. The centered app shell remained 440 px maximum. Dark/light styles rendered, reduced motion was honored, and keyboard navigation showed a visible focus ring. Back to Accounts added no RSC, Accounts-route, auth, or membership requests; browser resource counters remained unchanged. Browser was restored to Money overview.

## Regression controls

Phase 1 session resolution and Phase 2 history-aware Back code are unchanged. Phase 3 create flows and Phase 4/5 liquid detail remain outside this change; liquid detail still omits listAccounts and retains Phase 5 selected-balance overlap. The card route still performs one selected balance RPC. No database security changes were made.

## Validation

- Focused card, failure-isolation, billing, installment, eligibility, ownership, session, Back, and balance-overlap checks: 100 passed across 12 files.
- npm run lint: passed.
- git diff --check: passed.
- Full npm test: 1,734 passed; 5 failures in three unrelated existing test areas. The en/vi key-parity failure is confirmed at HEAD: en lacks savingsPage.summaryCaption. The long-name privacy test expects break-words while the unchanged card hero uses truncate. Three presentation tests render InlineAlert without NextIntlClientProvider.
- npm run typecheck: blocked by existing HomeTranslator/Translator errors in home-streaming-sections.tsx at lines 99 and 340.
- npm run build: optimized production compilation succeeded; build type-check stopped on the same errors.

## Remaining bottleneck

Session authorization and the Phase 5 selected account/balance path remain critical. Full detail still waits for lower payment and conversion data, which now resolves after the hero. No further query/session optimization was started.

**ACCOUNTS PHASE 6 SUCCESS — PROCEED TO ACCOUNTS PHASE 7**
