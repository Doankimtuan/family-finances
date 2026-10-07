# Accounts Phase 3 — Progressive Create Rendering

Date: 2026-10-04

## Dependency analysis

Mapped from the current create page, shared form, `listAccounts()`, schema,
and create command before changing the route.

| Field / control        | Create Account initial                    | Create Card initial                          | Needs `listAccounts()`                                    | Submit authority                                                                           |
| ---------------------- | ----------------------------------------- | -------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Account type           | Local type choices; defaults to cash      | Fixed card summary                           | No                                                        | Schema and create command                                                                  |
| Name                   | Local text input                          | Local text input                             | No                                                        | Schema and create command                                                                  |
| Icon                   | Local icon picker                         | Local icon picker                            | No                                                        | Existing icon defaults and create command                                                  |
| Financial scope        | Local scope choice; defaults to household | Local scope choice; defaults to household    | No                                                        | Create command resolves current membership and scope authority                             |
| Opening balance        | Local amount input; defaults to zero      | Not shown; card opening balance remains zero | No                                                        | Schema and ledger create command                                                           |
| Credit limit           | Not shown                                 | Local amount input                           | No                                                        | Card schema and existing settings write                                                    |
| Statement day          | Not shown                                 | Local day control with existing default      | No                                                        | Card schema and existing settings write                                                    |
| Due day                | Not shown                                 | Local day control with existing default      | No                                                        | Card schema and existing settings write                                                    |
| Linked payment account | Not shown                                 | Optional payment selector                    | Yes, for current IDs and localized names                  | Existing create action revalidates a chosen reference; database/RLS checks remain in force |
| Currency               | Not needed by initial controls            | Not needed by initial controls               | No for initial UI; old route coupled it to the read model | Existing household currency is retained for receipt formatting                             |

The defaults are local form defaults: blank name, cash type, the type's default
icon, household scope, zero opening balance, the existing statement/due-day
constants, and no linked account. Deferred data does not populate or replace
those values. In particular, it never chooses a linked account for the user.

## Previous architecture

After `requireProductSession()`, both routes awaited money/catalog translations
and `listAccounts()` before returning any form. `listAccounts()` includes
household currency, liquid accounts, owner membership, and ledger balances, so
all those operations delayed every initial field.

## New architecture

- The ordinary Account route does not call `listAccounts()`. It starts the
  existing household-currency read after the session gate for receipt
  formatting only. No input consumes that promise.
- The Credit Card route starts one server-side `listAccounts()` promise and
  catalog translation promise immediately after the session gate. The route
  awaits only the critical money translations before returning the mounted
  form.
- Only the linked-account field is inside Suspense. Its localized disabled
  selector/loading status appears while the promise is pending. The name,
  icon, scope, limit, and billing-day controls remain mounted and usable.
- The same card read-model promise feeds linked-account options and receipt
  currency. There is no browser fetch and no second `listAccounts()` call.
- The account route's actual currency is consumed only in the post-submit
  receipt. Its initial form does not read the placeholder prop.
- Server command, schema, ledger write, card settings write, `listAccounts()`
  internals, and RLS policies were not changed.

## Files changed

- `app/[locale]/(product)/money/accounts/account-create-page.tsx` — starts the
  route-specific server promises after `requireProductSession()` and removes
  the unnecessary account-list read from ordinary Account creation.
- `app/[locale]/(product)/money/accounts/add-account-form.tsx` — adds the narrow
  linked-field Suspense boundary and deferred receipt currency consumer while
  keeping the existing form instance and mutation path.
- `tests/unit/account-forms.test.tsx` — resolves deferred currency/account data
  after typing; asserts the form and input nodes stay identical and all values
  remain. The card test also verifies the picker changes from local loading to
  usable options.
- `tests/unit/accounts-route-session-gate.test.ts` — verifies the ordinary
  route does not start `listAccounts()`, the card route starts it once, and both
  starts occur after the session/membership gate.
- `.agents/audits/accounts-navigation-phase-3.md` — this dependency, timing,
  network, and validation record.

Phase 1/2 session and Back changes were already present in the working tree;
they were not changed as part of Phase 3.

## Benchmark method

Compared a frozen pre-Phase-3 control worktree with the final Phase 3 worktree,
using the same authenticated Brave session, local Next development mode, host,
and Supabase environment. Each route has one first (cold-ish) sample after
server restart and three warm repetitions. “Cold-ish” does not mean a cleared
browser session or production cache. No CPU/network throttling was applied.
The user did not submit either form; only synthetic draft values were entered.

Milestone A is the click-to-interactive time for the independent form controls
listed in the dependency table. For the card route, milestone B is when the
linked-account selector becomes enabled with its options. On the control, B was
available with the rest of the form. Ordinary Account has no pre-submit
`listAccounts()`-dependent control after Phase 3, so its B is N/A; household
currency is for the receipt only.

### Create Account performance

| Milestone                       |   Control cold-ish | Control warm samples (median) |                                             Phase 3 cold-ish | Phase 3 warm samples (median) |            Warm median delta |
| ------------------------------- | -----------------: | ----------------------------- | -----------------------------------------------------------: | ----------------------------- | ---------------------------: |
| A — initial form usable         |            2312 ms | 2144, 1263, 1934 ms (1934 ms) |                                                      1979 ms | 1039, 1158, 842 ms (1039 ms)  |             −895 ms (−46.3%) |
| B — account-model control ready | 2312 ms, same as A | 2144, 1263, 1934 ms (1934 ms) | N/A — no account-model control; receipt currency is deferred | N/A                           | Removed from pre-submit form |

Cold-ish A improved by 333 ms (14.4%). The browser showed name, type, scope,
and opening balance usable together. The household-currency request remains a
server-side receipt dependency, but it no longer gates those controls.

### Create Credit Card performance

| Milestone                 |   Control cold-ish | Control warm samples (median) | Phase 3 cold-ish | Phase 3 warm samples (median) | Warm median delta |
| ------------------------- | -----------------: | ----------------------------- | ---------------: | ----------------------------- | ----------------: |
| A — initial form usable   |            2939 ms | 2462, 1150, 1520 ms (1520 ms) |          2007 ms | 1339, 1401, 508 ms (1339 ms)  |  −181 ms (−11.9%) |
| B — linked selector ready | 2939 ms, same as A | 2470, 1158, 1527 ms (1527 ms) |          3481 ms | 2134, 2087, 1069 ms (2087 ms) |  +560 ms (+36.7%) |

Cold-ish A improved by 932 ms (31.7%). Warm A improved modestly and was noisy.
The Phase 3 linked selector became ready later in this sample set: warm median
B was 560 ms slower than control. That is reported rather than hidden. The
server read-model operations were intentionally left unchanged; their response
time is now outside the initial usable milestone.

### Representative loader timeline

```text
Control, Create Card (cold-ish)
click 0 ms
  → session and membership
  → money/catalog translations plus listAccounts() on the page critical path
      → household/accounts
      → owner membership and balance RPC
  → A initial controls usable at 2939 ms; B picker ready at 2939 ms

Phase 3, Create Card (cold-ish)
click 0 ms
  → session and membership
  ├ start listAccounts() + catalog translations on the server
  └ await money translations and render the mounted form
      → A initial controls usable at 2007 ms; linked field still loading
      → B picker ready at 3481 ms
```

The browser timing is click-to-interactive and includes route response and
hydration. The available browser instrumentation did not expose a reliable
RSC-segment-arrival timestamp, so the hydration/client tail is not split out or
estimated as a separate number.

## Network

Counts below are per route execution, based on server traces and the route
promise graph. The account/currency, owner, and balance operations are remote
Supabase reads. Translation loading is local message lookup.

| Remote operation   | Before, either route |        After, Create Account |                             After, Create Card | Blocks initial usable after?          |
| ------------------ | -------------------: | ---------------------------: | ---------------------------------------------: | ------------------------------------- |
| `getUser`          |                    1 |                            1 |                                              1 | Yes; part of the Phase 1 session gate |
| Active membership  |                    1 |                            1 |                                              1 | Yes; part of the Phase 1 session gate |
| Household/currency |                    1 | 1, asynchronous receipt read | 1, through the shared `listAccounts()` promise | No                                    |
| Accounts           |                    1 |                            0 |                                1, asynchronous | No; card picker only                  |
| Owner membership   |                    1 |                            0 |                                1, asynchronous | No; card picker only                  |
| Balance RPC        |                    1 |                            0 |                                1, asynchronous | No; card picker only                  |

The card route still performs the existing single `listAccounts()` read. The
ordinary route drops that read-model request entirely and retains only the
currency read needed for its eventual receipt. There is no client-side duplicate
read. Server traces also showed no new backend spans between either create
form's ready state and its Back restoration.

## Form-state correctness

- In the real browser, the card's name, limit, statement day, due day, and
  financial scope were entered while the linked selector was still disabled.
  They remained after its options became ready. No form was submitted.
- The deferred-promise unit test checks the same fields and asserts that both
  the form root and name input are the same DOM nodes after resolution.
- A corresponding ordinary Account test resolves receipt currency after name,
  scope, and opening-balance entry and verifies the form/input nodes and values
  remain.
- A blank optional linked account remains valid. A user cannot select while
  the local fallback is disabled; selected references still go through the
  existing fresh server-side create validation.

## Financial correctness

Only read timing and presentation boundaries changed. The create schema/action,
financial-scope and ownership resolution, opening-ledger behavior, card settings
write, fresh linked-reference validation, authorization, and RLS were not
changed. `listAccounts()` balance output remains display-only and is not used to
authorize a create. No new eligibility or insufficient-balance policy was
introduced. No browser mutation was submitted.

## Phase 1/2 regression

- Session guard remains first; the route test verifies no deferred read starts
  before the guard resolves.
- The existing history-aware Accounts return helper was not modified. Browser
  smoke restored Accounts after Create Account and Create Card; server request
  logs remained unchanged during both Back actions.
- Browser smoke also traversed Money → Accounts → both create routes → Account
  Detail → Credit Card Detail and returned to Accounts from each visible route.
  No form was submitted.

## Browser and responsive verification

- Direct entry succeeded for `/en/money/accounts/new`,
  `/en/money/accounts/new-credit`, `/vi/money/accounts/new`, and
  `/vi/money/accounts/new-credit`.
- Both create screens rendered their expected controls at 390, 440, 768, and
  1280 px. Document/body widths matched the viewport at every size, with no
  horizontal overflow.
- Keyboard tab reached a focusable control with the existing focus-ring class.
  The deferred fallback reuses shared `SelectField`/`Text` primitives and
  semantic tokens; this change adds no animation or custom theme styling.

## Validation

- Focused create/session/navigation/ledger/eligibility/ownership/card suite:
  104 tests passed.
- Full `npm test`: 251 files passed; 1712 tests passed and 5 failed. The same
  five failures reproduce in the frozen pre-Phase-3 control: one EN/VI
  translation-key parity failure (`money.savingsPage.summaryCaption`), three
  missing `NextIntlClientProvider` failures in
  `phase-6-accounts-presentation.test.tsx`, and one existing Money IA privacy
  class assertion. None is in the changed Phase 3 test files.
- `npm run lint`: passed.
- `prettier --check` on changed Phase 3 files: passed.
- `npm run typecheck`: still reports the two existing
  `HomeTranslator`/`Translator` incompatibilities in
  `home-streaming-sections.tsx` at lines 99 and 340. No Phase 3 diagnostics.
- `npm run build` in the isolated Phase 3 worktree: production compilation
  succeeded, then the build stopped on the same two `HomeTranslator` errors in
  `home-streaming-sections.tsx` at lines 99 and 340. Both errors also reproduce
  in the frozen pre-Phase-3 control worktree.
- `git diff --check`: passed.

## Remaining bottleneck

For Credit Card, the optional linked-account list still waits for the unchanged
`listAccounts()` read model (warm B median 2087 ms in this run). Initial card
controls are already usable before it arrives. Ordinary Account no longer
depends on that model before submission. The remaining click-to-A time includes
the Phase 1 session/membership gate, critical money translations, and client
hydration; this run did not separate those costs.

**ACCOUNTS PHASE 3 SUCCESS — PROCEED TO ACCOUNTS PHASE 4**
